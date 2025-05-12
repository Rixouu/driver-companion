import { useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from '@/components/ui/use-toast';
import { 
  Quotation, 
  CreateQuotationInput, 
  QuotationItem, 
  PricingCategory,
  PricingItem,
  UpdateQuotationInput,
  QuotationApprovalInput,
  QuotationRejectionInput,
  QuotationStatus,
  PricingPromotion,
  PricingPackage,
  PricingPackageItem,
  PackageType,
  PackageItemType
} from '@/types/quotations';
import { useI18n } from '@/lib/i18n/context';
import { Database } from '@/types/supabase';

// Define ServiceTypeInfo here as it might be used by multiple components
export interface ServiceTypeInfo {
  id: string;
  name: string;
}

// Add a cache for pricing items to prevent repeated fetching
const pricingCache = {
  categories: null as PricingCategory[] | null,
  items: new Map<string, PricingItem[]>(),
  promotions: null as PricingPromotion[] | null,
  packages: null as PricingPackage[] | null,
  packageItems: new Map<string, PricingPackageItem[]>(),
  serviceTypes: null as ServiceTypeInfo[] | null, // Cache for service types
  lastFetch: 0,
  lastServiceTypesFetch: 0,
};

export const useQuotationService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  const supabase = createClientComponentClient<Database>();

  const calculateQuotationAmount = async (
    serviceTypeId: string, // Changed from serviceType (text) to serviceTypeId (UUID)
    vehicleType: string,
    durationHours: number,
    discountPercentageInput: number | null | undefined = 0,
    taxPercentageInput: number | null | undefined = 0,
    serviceDays = 1
  ) => {
    const discountPercentage = discountPercentageInput ?? 0;
    const taxPercentage = taxPercentageInput ?? 0;
    
    try {
      // Find the price for the given service_type_id, vehicle, and duration
      const { data: pricingItems, error: pricingError } = await supabase
        .from('pricing_items')
        .select('price, currency, service_types ( name )' ) // Fetch service type name for context
        .eq('service_type_id', serviceTypeId) // Use service_type_id
        .eq('vehicle_type', vehicleType)
        .eq('duration_hours', durationHours)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (pricingError) {
        console.error('Error fetching pricing for calculation:', pricingError);
        // Provide fallback pricing instead of throwing
        return provideFallbackPricing(durationHours, discountPercentage, taxPercentage, serviceDays);
      }

      if (!pricingItems || pricingItems.length === 0) {
        console.warn('No pricing found for calculation criteria');
        // Provide fallback pricing
        return provideFallbackPricing(durationHours, discountPercentage, taxPercentage, serviceDays);
      }

      const item = pricingItems[0] as any; // Cast to any to access nested service_types.name
      const { price, currency } = item;
      const serviceTypeName = item.service_types?.name || 'unknown_service'; // Get service name
      
      // Apply days multiplier for charter services (check by name)
      const basePrice = serviceTypeName.toLowerCase().includes('charter') ? price * serviceDays : price;
      
      // Calculate the amount with discount and tax
      const discountAmount = basePrice * (discountPercentage / 100);
      const amountAfterDiscount = basePrice - discountAmount;
      const taxAmount = amountAfterDiscount * (taxPercentage / 100);
      const totalAmount = amountAfterDiscount + taxAmount;

      return {
        baseAmount: basePrice,
        currency,
        discountAmount,
        taxAmount,
        totalAmount
      };
    } catch (error) {
      console.error('Error calculating quotation amount:', error);
      // Provide fallback pricing
      return provideFallbackPricing(durationHours, discountPercentage, taxPercentage, serviceDays);
    }
  };

  // Helper function to provide fallback pricing when database fails
  const provideFallbackPricing = (
    durationHours: number, 
    discountPercentage = 0, 
    taxPercentage = 0,
    serviceDays = 1
  ) => {
    // Base price calculation: longer durations get a slight discount
    let basePrice = durationHours * 5000; // 5000 per hour
    
    // Apply days multiplier
    basePrice = basePrice * serviceDays;
    
    // Calculate discount and tax
    const discountAmount = basePrice * (discountPercentage / 100);
    const amountAfterDiscount = basePrice - discountAmount;
    const taxAmount = amountAfterDiscount * (taxPercentage / 100);
    const totalAmount = amountAfterDiscount + taxAmount;
    
    return {
      baseAmount: basePrice,
      currency: 'JPY',
      discountAmount,
      taxAmount,
      totalAmount
    };
  };

  const createQuotation = async (input: CreateQuotationInput): Promise<Quotation | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('SAVE & SEND DEBUG - Raw input from form (Zod sanitized):', JSON.stringify(input));
      const status = input.status === 'sent' ? 'sent' : 'draft';

      const serviceDays = input.service_days ?? 1;
      const discountPercentage = input.discount_percentage ?? 0;
      const taxPercentage = input.tax_percentage ?? 0;
      
      // Assuming input.service_type is now input.service_type_id (UUID)
      // We need the service type name for charter check, fetch it if not passed
      if (!input.service_type_id) {
        throw new Error("service_type_id is required to create a quotation.");
      }

      let serviceTypeName = 'unknown_service';
      const { data: stData, error: stError } = await supabase
        .from('service_types')
        .select('name')
        .eq('id', input.service_type_id)
        .single();
      if (stError) console.warn('Could not fetch service type name for charter check', stError);
      if (stData) serviceTypeName = stData.name;
      
      const isCharter = serviceTypeName.toLowerCase().includes('charter');
      const effectiveDuration = isCharter
        ? (input.hours_per_day ?? input.duration_hours ?? 1)
        : (input.duration_hours ?? 1);

      const { baseAmount, currency, totalAmount } = await calculateQuotationAmount(
        input.service_type_id,
        input.vehicle_type,
        effectiveDuration,
        discountPercentage,
        taxPercentage,
        serviceDays
      );
      console.log('SAVE & SEND DEBUG - Calculated Pricing:', { baseAmount, currency, totalAmount });

      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const recordToInsert: Omit<Database['public']['Tables']['quotations']['Row'], 'id' | 'created_at' | 'updated_at' | 'quote_number'> & { service_type_id: string } = {
        title: input.title || '',
        status: status,
        customer_name: input.customer_name || null,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone || null,
        customer_id: input.customer_id || null,
        merchant_id: userId,
        merchant_notes: input.merchant_notes || null,
        customer_notes: input.customer_notes || null,
        service_type_id: input.service_type_id,
        service_type: serviceTypeName,
        vehicle_category: input.vehicle_category || null,
        vehicle_type: input.vehicle_type,
        pickup_location: null, 
        dropoff_location: null, 
        pickup_date: input.pickup_date || null,
        pickup_time: input.pickup_time || null,
        duration_hours: effectiveDuration, 
        service_days: serviceDays,
        days_count: serviceDays,
        hours_per_day: isCharter ? effectiveDuration : null, 
        passenger_count: input.passenger_count ?? null,      
        amount: Number(baseAmount),
        currency: currency,
        discount_percentage: discountPercentage, 
        tax_percentage: taxPercentage,       
        total_amount: Number(totalAmount),
        expiry_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        billing_company_name: input.billing_company_name || null,
        billing_tax_number: input.billing_tax_number || null,
        billing_street_name: input.billing_street_name || null,
        billing_street_number: input.billing_street_number || null,
        billing_city: input.billing_city || null,
        billing_state: input.billing_state || null,
        billing_postal_code: input.billing_postal_code || null,
        billing_country: input.billing_country || null,
        display_currency: input.display_currency || null,
        converted_to_booking_id: null, // Explicitly null for new quotations
        reference_code: null, // Explicitly null
        rejected_reason: null, // Explicitly null
      };
      
      console.log('SAVE & SEND DEBUG - Record for DB Insert:', JSON.stringify(recordToInsert));

      const { data, error: insertError } = await supabase
        .from('quotations')
        .insert(recordToInsert as Database['public']['Tables']['quotations']['Insert'])
        .select()
        .single();

      console.log('SAVE & SEND DEBUG - Data returned from DB after insert:', JSON.stringify(data));

      if (insertError) {
         console.error('SAVE & SEND DEBUG - DB Insert error details:', {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            fullError: insertError
          });
        throw insertError; 
      }

      if (data) {
        const serviceDescription = `${serviceTypeName} - ${input.vehicle_type}`;
        const { error: itemError } = await supabase
          .from('quotation_items')
          .insert({
            quotation_id: data.id,
            description: serviceDescription,
            quantity: 1, 
            unit_price: baseAmount, 
            total_price: baseAmount, 
            sort_order: 1
          });

        if (itemError) {
          console.error('SAVE & SEND DEBUG - Error creating quotation item:', itemError);
        }

        await supabase
          .from('quotation_activities')
          .insert({
            quotation_id: data.id,
            user_id: userId,
            action: 'created',
            details: { status } 
          });
      }

      toast({
        title: t('quotations.notifications.createSuccess'),
      });

      return data as unknown as Quotation;

    } catch (err: any) {
      console.error('SAVE & SEND DEBUG - Error in createQuotation function:', err);
       const errorMessage = err.message || 'Failed to create quotation';
       setError(errorMessage);

      toast({
        title: t('quotations.notifications.error'),
        description: errorMessage,
        variant: 'destructive',
      });

      return null; 
    } finally {
      setLoading(false);
    }
  };

  const updateQuotation = async (id: string, input: UpdateQuotationInput): Promise<Quotation | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: currentQuotationData, error: fetchError } = await supabase
        .from('quotations')
        .select('*, service_type:service_type_id(id, name)')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      const quotation = currentQuotationData as any;
      const updateData: Partial<Database['public']['Tables']['quotations']['Row']> & {service_type_id?: string} = { ...input };
      
      const validDays = 30;
      updateData.expiry_date = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
      
      const needsRecalculation = 
        input.service_type_id !== undefined || 
        input.vehicle_type !== undefined || 
        input.duration_hours !== undefined || 
        input.service_days !== undefined ||
        input.hours_per_day !== undefined ||
        input.discount_percentage !== undefined || 
        input.tax_percentage !== undefined;

      if (needsRecalculation) {
        const serviceTypeId = input.service_type_id || quotation.service_type_id;
        const vehicleType = input.vehicle_type || quotation.vehicle_type;
        
        let serviceTypeName = quotation.service_type?.name || 'unknown_service';
        if (input.service_type_id && input.service_type_id !== quotation.service_type_id) {
            const { data: stData } = await supabase.from('service_types').select('name').eq('id', input.service_type_id).single();
            if (stData) serviceTypeName = stData.name;
        }

        const isCharter = serviceTypeName.toLowerCase().includes('charter');
        
        let effectiveDuration: number;
        if (isCharter) {
          effectiveDuration = input.hours_per_day || input.duration_hours || 
            quotation.hours_per_day || quotation.duration_hours || 1;
          updateData.hours_per_day = effectiveDuration;
        } else {
          effectiveDuration = input.duration_hours || quotation.duration_hours || 1;
        }
        updateData.duration_hours = effectiveDuration;
        
        const discountPercentage = input.discount_percentage !== undefined 
          ? input.discount_percentage 
          : quotation.discount_percentage;
        const taxPercentage = input.tax_percentage !== undefined 
          ? input.tax_percentage 
          : quotation.tax_percentage;
        const serviceDays = input.service_days !== undefined 
          ? input.service_days 
          : quotation.service_days || 1;

        const { baseAmount, currency, totalAmount } = await calculateQuotationAmount(
          serviceTypeId!,
          vehicleType,
          effectiveDuration,
          discountPercentage,
          taxPercentage,
          serviceDays
        );

        updateData.amount = baseAmount;
        updateData.currency = currency;
        updateData.total_amount = totalAmount;
        
        if (input.display_currency === undefined) {
          updateData.display_currency = quotation.display_currency || currency;
        }
      } else if (input.display_currency) {
        updateData.display_currency = input.display_currency;
      }
      updateData.display_currency = updateData.display_currency || null;

      if (input.service_type_id || input.vehicle_type) {
        const finalServiceTypeId = input.service_type_id || quotation.service_type_id;
        let finalServiceTypeName = 'Service';
        if (finalServiceTypeId) {
            const {data: stNameData} = await supabase.from('service_types').select('name').eq('id', finalServiceTypeId).single();
            if(stNameData) finalServiceTypeName = stNameData.name;
        } else if (quotation.service_type) {
             finalServiceTypeName = quotation.service_type.name;
        }

        const finalVehicleType = input.vehicle_type || quotation.vehicle_type;
        const baseAmount = updateData.amount || quotation.amount;
        
        const { data: items } = await supabase
          .from('quotation_items')
          .select('id')
          .eq('quotation_id', id)
          .order('sort_order', { ascending: true })
          .limit(1);

        if (items && items.length > 0) {
          await supabase
            .from('quotation_items')
            .update({
              description: `${finalServiceTypeName} - ${finalVehicleType}`,
              unit_price: baseAmount,
              total_price: baseAmount
            })
            .eq('id', items[0].id);
        }
      }

      const { data: updatedDbData, error } = await supabase
        .from('quotations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (updatedDbData) {
        await supabase
          .from('quotation_activities')
          .insert({
            quotation_id: id,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            action: 'updated',
            details: JSON.stringify({ changes: input })
          });
      }

      toast({
        title: t('quotations.notifications.updateSuccess'),
        description: '',
      });

      return updatedDbData as unknown as Quotation;
    } catch (err: any) {
      console.error('Error updating quotation:', err);
      setError(err.message || 'Failed to update quotation');
      
      toast({
        title: t('quotations.notifications.error'),
        description: err.message || 'Failed to update quotation',
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getQuotation = async (id: string): Promise<Quotation | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }
      
      return data as unknown as Quotation;
    } catch (err: any) {
      console.error('Error fetching quotation:', err);
      setError(err.message || 'Failed to fetch quotation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getQuotationWithItems = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch quotation
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single();

      if (quotationError) {
        throw quotationError;
      }

      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', id)
        .order('sort_order', { ascending: true });

      if (itemsError) {
        throw itemsError;
      }

      // Fetch activities
      const { data: activities, error: activitiesError } = await supabase
        .from('quotation_activities')
        .select('*')
        .eq('quotation_id', id)
        .order('created_at', { ascending: false });

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        // Not throwing error here as activities are not critical
      }

      return {
        ...quotation,
        items: items || [],
        activities: activities || []
      };
    } catch (err: any) {
      console.error('Error fetching quotation with items:', err);
      setError(err.message || 'Failed to fetch quotation details');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const listQuotations = async (status?: string, limit = 50, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('quotations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }
      
      return { data, count };
    } catch (err: any) {
      console.error('Error listing quotations:', err);
      setError(err.message || 'Failed to fetch quotations');
      return { data: [], count: 0 };
    } finally {
      setLoading(false);
    }
  };

  const deleteQuotation = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: t('quotations.notifications.deleteSuccess'),
        description: '',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting quotation:', err);
      setError(err.message || 'Failed to delete quotation');
      
      toast({
        title: t('quotations.notifications.error'),
        description: err.message || 'Failed to delete quotation',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendQuotation = async (id: string, email?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the quotation data first to ensure we have the latest information
      const { data: quotation, error: fetchError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching quotation before sending:', fetchError);
        throw new Error('Failed to fetch quotation data');
      }
      
      // Determine which email to use - provided email or from quotation
      const emailTo = email || quotation?.customer_email;
      
      if (!emailTo) {
        throw new Error('No email address provided for sending quotation');
      }
      
      // Prepare FormData for the /api/quotations/send-email endpoint
      const formData = new FormData();
      formData.append('email', emailTo);
      formData.append('quotation_id', id);
      // Default language to English, can be customized later if needed
      formData.append('language', 'en'); 
      // Include details by default, matches quotation-pdf-button logic
      formData.append('include_details', 'true'); 

      // Make the API call to send the quotation email
      // Updated endpoint to /api/quotations/send-email
      const response = await fetch('/api/quotations/send-email', {
        method: 'POST',
        body: formData, // Send FormData instead of JSON
      });
      
      if (!response.ok) {
        // Parse error message from response
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send quotation email');
      }
      
      // Parse the successful response
      const result = await response.json();
      
      // Update quotation status to 'sent'
      const { error: updateError } = await supabase
        .from('quotations')
        .update({ status: 'sent' })
        .eq('id', id);
      
      if (updateError) {
        console.error('Error updating quotation status after sending:', updateError);
        // Continue execution - email was still sent successfully
        toast({
          title: t('quotations.notifications.partialSuccess') || 'Partial success',
          description: t('quotations.notifications.emailFailed') || 'Email sent but status update failed',
          variant: 'default',
        });
      }
      
      // Add activity log for the sent email
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'sent',
          details: { status: 'sent' }
        });
        
      // Show success toast
      // toast({
      //   title: t('quotations.notifications.sendSuccess') || 'Quotation sent successfully',
      // });
      
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error sending quotation:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Show error toast
      toast({
        title: t('quotations.notifications.error') || 'Error',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
      
      setLoading(false);
      return false;
    }
  };

  const approveQuotation = async (input: QuotationApprovalInput): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Update quotation status to approved
      const { data, error } = await supabase
        .from('quotations')
        .update({ 
          status: 'approved',
          customer_notes: input.notes ? `${input.notes}` : undefined
        })
        .eq('id', input.quotation_id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create activity log
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: input.quotation_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'approved',
          details: { notes: input.notes }
        });

      // Call server API to handle conversion to booking
      const response = await fetch('/api/quotations/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: input.quotation_id, 
          notes: input.notes,
          skipStatusCheck: true 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process quotation approval');
      }

      toast({
        title: t('quotations.notifications.approveSuccess'),
        description: '',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error approving quotation:', err);
      setError(err.message || 'Failed to approve quotation');
      
      toast({
        title: t('quotations.notifications.error'),
        description: err.message || 'Failed to approve quotation',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectQuotation = async (input: QuotationRejectionInput): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Update quotation status to rejected
      const { data, error } = await supabase
        .from('quotations')
        .update({ 
          status: 'rejected',
          rejected_reason: input.rejected_reason
        })
        .eq('id', input.quotation_id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create activity log
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: input.quotation_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'rejected',
          details: { reason: input.rejected_reason }
        });

      // Call server API to notify about rejection
      const response = await fetch('/api/quotations/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: input.quotation_id, 
          reason: input.rejected_reason,
          skipStatusCheck: true 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process quotation rejection');
      }

      toast({
        title: t('quotations.notifications.rejectSuccess'),
        description: '',
      });
      
      return true;
    } catch (err: any) {
      console.error('Error rejecting quotation:', err);
      setError(err.message || 'Failed to reject quotation');
      
      toast({
        title: t('quotations.notifications.error'),
        description: err.message || 'Failed to reject quotation',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const convertToBooking = async (id: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the server API to convert to booking
      const response = await fetch('/api/quotations/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert to booking');
      }

      const result = await response.json();
      
      // Update quotation status to converted
      await supabase
        .from('quotations')
        .update({ 
          status: 'converted',
          converted_to_booking_id: result.bookingId
        })
        .eq('id', id);

      // Create activity log
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'converted',
          details: { booking_id: result.bookingId }
        });

      toast({
        title: t('quotations.notifications.convertSuccess'),
        description: '',
      });
      
      return result.bookingId;
    } catch (err: any) {
      console.error('Error converting quotation to booking:', err);
      setError(err.message || 'Failed to convert quotation to booking');
      
      toast({
        title: t('quotations.notifications.error'),
        description: err.message || 'Failed to convert quotation to booking',
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Updated getPricingCategories with caching
  const getPricingCategories = useCallback(async (): Promise<PricingCategory[]> => {
    try {
      const now = Date.now();
      if (pricingCache.categories && (now - pricingCache.lastFetch < 30000)) {
        return pricingCache.categories;
      }
      
      const { data, error } = await supabase
        .from('pricing_categories')
        .select('id, name, description, service_type_ids, is_active, sort_order, created_at, updated_at') // Ensure service_type_ids is selected
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching pricing categories:', error);
        // return getFallbackCategories(); // Fallback might be outdated, consider removing or updating
        return []; // Return empty on error
      }
      
      const categoriesData = (data || []).map(category => ({
        ...category,
        service_type_ids: category.service_type_ids || [], // Ensure service_type_ids is an array
      })) as PricingCategory[];

      pricingCache.categories = categoriesData;
      pricingCache.lastFetch = now;
      
      return categoriesData;
    } catch (err: any) {
      console.error('Error fetching pricing categories:', err);
      // return getFallbackCategories();
      return [];
    }
  }, []);
  
  // Fallback categories might need updating or removal if not maintained
  // const getFallbackCategories = (): PricingCategory[] => { ... };

  const getPricingItems = useCallback(async (
    categoryId?: string,
    serviceTypeId?: string, // Changed from serviceType (text) to serviceTypeId (UUID)
    vehicleType?: string
  ): Promise<PricingItem[]> => {
    try {
      const cacheKey = `${categoryId || 'all'}-${serviceTypeId || 'all'}-${vehicleType || 'all'}`;
      const now = Date.now();
      if (pricingCache.items.has(cacheKey) && (now - pricingCache.lastFetch < 30000)) {
        return pricingCache.items.get(cacheKey) || [];
      }
      
      let query = supabase
        .from('pricing_items')
        .select(`
          id,
          category_id,
          service_type_id,
          vehicle_type,
          duration_hours,
          price,
          currency,
          is_active,
          created_at,
          updated_at,
          service_type:service_type_id ( id, name ) 
        `)
        .eq('is_active', true);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      if (serviceTypeId) {
        query = query.eq('service_type_id', serviceTypeId); // Filter by service_type_id
      }
      
      if (vehicleType) {
        query = query.eq('vehicle_type', vehicleType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pricing items:', error);
        // return getFallbackItems(categoryId); // Fallback might be outdated
        return [];
      }
      
      const enrichedData = (data || []).map(item => ({
        ...(item as PricingItem),
        service_type_name: (item as any).service_type?.name || 'N/A',
      }));

      pricingCache.items.set(cacheKey, enrichedData as PricingItem[]);
      pricingCache.lastFetch = now;
      
      return enrichedData as PricingItem[];
    } catch (err: any) {
      console.error('Error fetching pricing items:', err);
      // return getFallbackItems(categoryId);
      return [];
    }
  }, [supabase]); // supabase is stable, so [] would also work but [supabase] is more explicit
  
  // Fallback items might need updating or removal
  // const getFallbackItems = (categoryId?: string): PricingItem[] => { ... };

  const getServiceTypes = useCallback(async (): Promise<ServiceTypeInfo[]> => {
    try {
      const now = Date.now();
      if (pricingCache.serviceTypes && (now - pricingCache.lastServiceTypesFetch < 60000)) { // Cache for 1 minute
        return pricingCache.serviceTypes;
      }

      const { data, error } = await supabase
        .from('service_types')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching service types:', error);
        return [];
      }
      pricingCache.serviceTypes = data || [];
      pricingCache.lastServiceTypesFetch = now;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching service types:', err);
      return [];
    }
  }, [supabase]); // supabase is stable, so [] would also work but [supabase] is more explicit

  // New methods for pricing promotions and packages
  const getPricingPromotions = async (
    isActive: boolean = true
  ): Promise<PricingPromotion[]> => {
    try {
      // Use cached promotions if available and recent (within 30 seconds)
      const now = Date.now();
      if (pricingCache.promotions && (now - pricingCache.lastFetch < 30000)) {
        return pricingCache.promotions.filter(p => !isActive || p.is_active);
      }
      
      let query = supabase
        .from('pricing_promotions')
        .select('*, applicable_service_type_ids'); // Ensure new field is selected
        
      if (isActive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pricing promotions:', error);
        return [];
      }
      
      // Cast database results to match TypeScript interface
      const typedPromotions = (data || []).map(promo => ({
        ...promo,
        discount_type: promo.discount_type as 'percentage' | 'fixed_amount'
      }));
      
      // Cache the results
      pricingCache.promotions = typedPromotions;
      pricingCache.lastFetch = now;
      
      return typedPromotions;
    } catch (err: any) {
      console.error('Error fetching pricing promotions:', err);
      return [];
    }
  };
  
  const getPricingPromotion = async (id: string): Promise<PricingPromotion | null> => {
    try {
      const { data, error } = await supabase
        .from('pricing_promotions')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error fetching pricing promotion:', error);
        return null;
      }
      
      return data as unknown as PricingPromotion;
    } catch (err: any) {
      console.error('Error fetching pricing promotion:', err);
      return null;
    }
  };
  
  const createPricingPromotion = async (promotion: Omit<PricingPromotion, 'id' | 'created_at' | 'updated_at' | 'times_used'>): Promise<PricingPromotion | null> => {
    try {
      setLoading(true);
      
      // Ensure applicable_services (old field) is not sent if it exists on the input
      const { applicable_services, ...restOfPromotion } = promotion as any;
      const promotionDataForApi = {
        ...restOfPromotion,
        applicable_service_type_ids: promotion.applicable_service_type_ids || null, // Ensure new field is used
        times_used: 0
      };

      console.log('Creating promotion with data:', promotionDataForApi);
      
      const response = await fetch('/api/admin/pricing/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(promotionDataForApi)
      });
      
      // Get the full response for debugging
      const responseText = await response.text();
      let errorData;
      let responseData;
      
      try {
        // Try to parse as JSON
        responseData = JSON.parse(responseText);
      } catch (e) {
        // Not valid JSON, use the text as is
        console.error('Error parsing response:', e);
        console.log('Raw response:', responseText);
      }
      
      if (!response.ok) {
        console.error('API error status:', response.status, response.statusText);
        console.error('API error response:', responseData || responseText);
        
        const errorMessage = responseData?.error || 
                             `API error (${response.status}): ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      console.log('Successfully created promotion:', responseData);
      
      // Invalidate cache
      pricingCache.promotions = null;
      
      toast({
        title: t('pricing.promotions.createSuccess'),
        description: t('pricing.promotions.createSuccessDescription')
      });
      
      return responseData as PricingPromotion;
    } catch (err: any) {
      console.error('Error creating pricing promotion:', err);
      toast({
        title: t('pricing.promotions.createError'),
        description: err.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updatePricingPromotion = async (id: string, updates: Partial<Omit<PricingPromotion, 'id' | 'created_at' | 'updated_at' | 'times_used'>>): Promise<PricingPromotion | null> => {
    try {
      setLoading(true)

      // Ensure applicable_services (old field) is not sent if it exists on the input
      // And ensure applicable_service_type_ids is correctly formatted if present
      const { applicable_services, ...restOfUpdates } = updates as any;
      const updateDataForApi: Partial<Omit<PricingPromotion, 'id' | 'created_at' | 'updated_at' | 'times_used'>> & { applicable_service_type_ids?: string[] | null } = {
        ...restOfUpdates,
      };

      if (updates.hasOwnProperty('applicable_service_type_ids')) {
        updateDataForApi.applicable_service_type_ids = updates.applicable_service_type_ids || null;
      }
      
      const response = await fetch(`/api/admin/pricing/promotions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateDataForApi)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to update promotion');
      }
      
      const data = await response.json();
      
      // Invalidate cache
      pricingCache.promotions = null;
      
      toast({
        title: t('pricing.promotions.updateSuccess'),
        description: t('pricing.promotions.updateSuccessDescription')
      });
      
      return data as PricingPromotion;
    } catch (err: any) {
      console.error('Error updating pricing promotion:', err);
      toast({
        title: t('pricing.promotions.updateError'),
        description: err.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const deletePricingPromotion = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Call a server API endpoint that has admin privileges
      const response = await fetch(`/api/admin/pricing/promotions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to delete promotion');
      }
      
      // Invalidate cache
      pricingCache.promotions = null;
      
      toast({
        title: t('pricing.promotions.deleteSuccess'),
        description: t('pricing.promotions.deleteSuccessDescription')
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting pricing promotion:', err);
      toast({
        title: t('pricing.promotions.deleteError'),
        description: err.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // CRUD for Pricing Categories
  const createPricingCategory = async (categoryData: Omit<PricingCategory, 'id' | 'created_at' | 'updated_at'>): Promise<PricingCategory | null> => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pricing/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create pricing category');
      }
      const data = await response.json();
      pricingCache.categories = null; // Invalidate cache
      toast({ title: t('pricing.categories.createSuccess') });
      return data as PricingCategory;
    } catch (err: any) {
      console.error('Error creating pricing category:', err);
      toast({ title: t('pricing.categories.createError'), description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePricingCategory = async (id: string, updates: Partial<Omit<PricingCategory, 'id' | 'created_at' | 'updated_at'>>): Promise<PricingCategory | null> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/pricing/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update pricing category');
      }
      const data = await response.json();
      pricingCache.categories = null; // Invalidate cache
      toast({ title: t('pricing.categories.updateSuccess') });
      return data as PricingCategory;
    } catch (err: any) {
      console.error('Error updating pricing category:', err);
      toast({ title: t('pricing.categories.updateError'), description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deletePricingCategory = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/pricing/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete pricing category');
      }
      pricingCache.categories = null; // Invalidate cache
      toast({ title: t('pricing.categories.deleteSuccess') });
      return true;
    } catch (err: any) {
      console.error('Error deleting pricing category:', err);
      toast({ title: t('pricing.categories.deleteError'), description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // CRUD for Pricing Items
  const createPricingItem = async (itemData: Omit<PricingItem, 'id' | 'created_at' | 'updated_at' | 'service_type_name'>): Promise<PricingItem | null> => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pricing/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create pricing item');
      }
      const data = await response.json();
      pricingCache.items.clear(); // Invalidate cache
      toast({ title: t('pricing.items.createSuccess') });
      return data as PricingItem;
    } catch (err: any) {
      console.error('Error creating pricing item:', err);
      toast({ title: t('pricing.items.createError'), description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePricingItem = async (id: string, updates: Partial<Omit<PricingItem, 'id' | 'created_at' | 'updated_at' | 'service_type_name'>>): Promise<PricingItem | null> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/pricing/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update pricing item');
      }
      const data = await response.json();
      pricingCache.items.clear(); // Invalidate cache
      toast({ title: t('pricing.items.updateSuccess') });
      return data as PricingItem;
    } catch (err: any) {
      console.error('Error updating pricing item:', err);
      toast({ title: t('pricing.items.updateError'), description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deletePricingItem = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/pricing/items/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete pricing item');
      }
      pricingCache.items.clear(); // Invalidate cache
      toast({ title: t('pricing.items.deleteSuccess') });
      return true;
    } catch (err: any) {
      console.error('Error deleting pricing item:', err);
      toast({ title: t('pricing.items.deleteError'), description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Package methods
  const getPricingPackages = async (
    isActive: boolean = true,
    withItems: boolean = false
  ): Promise<PricingPackage[]> => {
    try {
      // Use cached packages if available and recent (within 30 seconds)
      const now = Date.now();
      if (pricingCache.packages && (now - pricingCache.lastFetch < 30000) && !withItems) {
        return pricingCache.packages.filter(p => !isActive || p.is_active);
      }
      
      let query = supabase
        .from('pricing_packages')
        .select('*')
        .order('sort_order');
        
      if (isActive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pricing packages:', error);
        return [];
      }
      
      // Cast database results to match TypeScript interface
      const typedPackages = (data || []).map(pkg => ({
        ...pkg,
        package_type: pkg.package_type as PackageType
      }));
      
      // Cache the results
      pricingCache.packages = typedPackages;
      pricingCache.lastFetch = now;
      
      let packages = typedPackages;
      
      // Load package items if requested
      if (withItems && packages.length > 0) {
        const packageIds = packages.map(p => p.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('pricing_package_items')
          .select('*')
          .in('package_id', packageIds)
          .order('sort_order');
          
        if (!itemsError && itemsData) {
          // Group items by package_id
          const itemsByPackage = itemsData.reduce((acc, item) => {
            if (!acc[item.package_id]) {
              acc[item.package_id] = [];
            }
            acc[item.package_id].push({
              ...item,
              item_type: item.item_type as PackageItemType
            });
            return acc;
          }, {} as Record<string, PricingPackageItem[]>);
          
          // Add items to packages
          packages = packages.map(pkg => ({
            ...pkg,
            items: itemsByPackage[pkg.id] || []
          }));
        }
      }
      
      return packages;
    } catch (err: any) {
      console.error('Error fetching pricing packages:', err);
      return [];
    }
  };
  
  const getPricingPackage = async (id: string, withItems: boolean = true): Promise<PricingPackage | null> => {
    try {
      const { data, error } = await supabase
        .from('pricing_packages')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error fetching pricing package:', error);
        return null;
      }
      
      let packageData = data;
      
      // Load items if requested
      if (withItems) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('pricing_package_items')
          .select('*')
          .eq('package_id', id)
          .order('sort_order');
          
        if (!itemsError) {
          // Create a proper PricingPackage object with items
          const typedPackageData = {
            ...packageData,
            // Force package_type to be a valid PackageType
            package_type: (packageData.package_type as PackageType),
            // Add items array
            items: (itemsData || []).map(item => ({
              ...item,
              // Force item_type to be a valid PackageItemType
              item_type: (item.item_type as PackageItemType)
            }))
          } as PricingPackage;
          
          return typedPackageData;
        }
      }
      
      // If no items or there was an error, just return the package data with type cast
      return {
        ...packageData,
        // Force package_type to be a valid PackageType
        package_type: (packageData.package_type as PackageType)
      } as PricingPackage;
    } catch (err: any) {
      console.error('Error fetching pricing package:', err);
      return null;
    }
  };
  
  const createPricingPackage = async (
    packageData: Omit<PricingPackage, 'id' | 'created_at' | 'updated_at'>, 
    items?: Omit<PricingPackageItem, 'id' | 'package_id' | 'created_at' | 'updated_at'>[]
  ): Promise<PricingPackage | null> => {
    try {
      setLoading(true);
      
      // Start a transaction
      const { data, error } = await supabase
        .from('pricing_packages')
        .insert({
          name: packageData.name,
          description: packageData.description,
          thumbnail_url: packageData.thumbnail_url,
          banner_url: packageData.banner_url,
          package_type: packageData.package_type,
          base_price: packageData.base_price,
          currency: packageData.currency,
          is_featured: packageData.is_featured,
          is_active: packageData.is_active,
          sort_order: packageData.sort_order,
          valid_from: packageData.valid_from,
          valid_to: packageData.valid_to
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating pricing package:', error);
        toast({
          title: t('pricing.packages.createError'),
          description: error.message,
          variant: 'destructive'
        });
        return null;
      }
      
      const newPackage = data;
      
      // Add package items if provided
      if (items && items.length > 0 && newPackage) {
        const packageItems = items.map(item => ({
          ...item,
          package_id: newPackage.id
        }));
        
        const { error: itemsError } = await supabase
          .from('pricing_package_items')
          .insert(packageItems);
          
        if (itemsError) {
          console.error('Error creating package items:', itemsError);
          // We won't fail the entire operation, but log the error
        }
      }
      
      // Invalidate cache
      pricingCache.packages = null;
      
      toast({
        title: t('pricing.packages.createSuccess'),
        description: t('pricing.packages.createSuccessDescription')
      });
      
      return newPackage as unknown as PricingPackage;
    } catch (err: any) {
      console.error('Error creating pricing package:', err);
      toast({
        title: t('pricing.packages.createError'),
        description: err.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updatePricingPackage = async (
    id: string, 
    updates: Partial<Omit<PricingPackage, 'id' | 'created_at' | 'updated_at'>>,
    itemUpdates?: {
      create?: Omit<PricingPackageItem, 'id' | 'package_id' | 'created_at' | 'updated_at'>[],
      update?: (Partial<Omit<PricingPackageItem, 'package_id' | 'created_at' | 'updated_at'>> & { id: string })[],
      delete?: string[]
    }
  ): Promise<PricingPackage | null> => {
    try {
      setLoading(true);
      
      // Remove service_days and hours_per_day fields if they exist in updates
      const sanitizedUpdates = { ...updates };
      delete sanitizedUpdates.service_days;
      delete sanitizedUpdates.hours_per_day;
      
      // Update package data
      const { data, error } = await supabase
        .from('pricing_packages')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating pricing package:', error);
        toast({
          title: t('pricing.packages.updateError'),
          description: error.message,
          variant: 'destructive'
        });
        return null;
      }
      
      // Handle item updates if provided
      if (itemUpdates) {
        // Handle creates
        if (itemUpdates.create && itemUpdates.create.length > 0) {
          const newItems = itemUpdates.create.map(item => ({
            ...item,
            package_id: id
          }));
          
          const { error: createError } = await supabase
            .from('pricing_package_items')
            .insert(newItems);
            
          if (createError) {
            console.error('Error creating package items:', createError);
          }
        }
        
        // Handle updates
        if (itemUpdates.update && itemUpdates.update.length > 0) {
          for (const item of itemUpdates.update) {
            const { id: itemId, ...updates } = item;
            
            const { error: updateError } = await supabase
              .from('pricing_package_items')
              .update(updates)
              .eq('id', itemId);
              
            if (updateError) {
              console.error(`Error updating package item ${itemId}:`, updateError);
            }
          }
        }
        
        // Handle deletes
        if (itemUpdates.delete && itemUpdates.delete.length > 0) {
          const { error: deleteError } = await supabase
            .from('pricing_package_items')
            .delete()
            .in('id', itemUpdates.delete);
            
          if (deleteError) {
            console.error('Error deleting package items:', deleteError);
          }
        }
      }
      
      // Invalidate cache
      pricingCache.packages = null;
      pricingCache.packageItems.clear();
      
      toast({
        title: t('pricing.packages.updateSuccess'),
        description: t('pricing.packages.updateSuccessDescription')
      });
      
      return data as unknown as PricingPackage;
    } catch (err: any) {
      console.error('Error updating pricing package:', err);
      toast({
        title: t('pricing.packages.updateError'),
        description: err.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const deletePricingPackage = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('pricing_packages')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting pricing package:', error);
        toast({
          title: t('pricing.packages.deleteError'),
          description: error.message,
          variant: 'destructive'
        });
        return false;
      }
      
      // Invalidate cache
      pricingCache.packages = null;
      pricingCache.packageItems.delete(id);
      
      toast({
        title: t('pricing.packages.deleteSuccess'),
        description: t('pricing.packages.deleteSuccessDescription')
      });
      
      return true;
    } catch (err: any) {
      console.error('Error deleting pricing package:', err);
      toast({
        title: t('pricing.packages.deleteError'),
        description: err.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createQuotation,
    updateQuotation,
    getQuotation,
    getQuotationWithItems,
    listQuotations,
    deleteQuotation,
    sendQuotation,
    approveQuotation,
    rejectQuotation,
    convertToBooking,
    getPricingCategories,
    getPricingItems,
    calculateQuotationAmount,
    getServiceTypes, // Export the new method
    // New methods for promotions and packages
    getPricingPromotions,
    getPricingPromotion,
    createPricingPromotion,
    updatePricingPromotion,
    deletePricingPromotion,
    // Pricing Category CRUD
    createPricingCategory,
    updatePricingCategory,
    deletePricingCategory,
    // Pricing Item CRUD
    createPricingItem,
    updatePricingItem,
    deletePricingItem,
    getPricingPackages,
    getPricingPackage,
    createPricingPackage,
    updatePricingPackage,
    deletePricingPackage
  };
}; 