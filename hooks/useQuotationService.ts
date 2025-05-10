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

// Add a cache for pricing items to prevent repeated fetching
const pricingCache = {
  categories: null as PricingCategory[] | null,
  items: new Map<string, PricingItem[]>(),
  promotions: null as PricingPromotion[] | null,
  packages: null as PricingPackage[] | null,
  packageItems: new Map<string, PricingPackageItem[]>(),
  lastFetch: 0
};

export const useQuotationService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  const supabase = createClientComponentClient<Database>();

  const calculateQuotationAmount = async (
    serviceType: string,
    vehicleType: string,
    durationHours: number,
    discountPercentageInput: number | null | undefined = 0,
    taxPercentageInput: number | null | undefined = 0,
    serviceDays = 1
  ) => {
    const discountPercentage = discountPercentageInput ?? 0;
    const taxPercentage = taxPercentageInput ?? 0;
    
    try {
      // Find the price for the given service, vehicle, and duration
      const { data: pricingItems, error: pricingError } = await supabase
        .from('pricing_items')
        .select('price, currency')
        .eq('service_type', serviceType)
        .eq('vehicle_type', vehicleType)
        .eq('duration_hours', durationHours)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (pricingError) {
        console.error('Error fetching pricing:', pricingError);
        // Provide fallback pricing instead of throwing
        return provideFallbackPricing(durationHours, discountPercentage, taxPercentage, serviceDays);
      }

      if (!pricingItems || pricingItems.length === 0) {
        console.warn('No pricing found for the selected criteria');
        // Provide fallback pricing
        return provideFallbackPricing(durationHours, discountPercentage, taxPercentage, serviceDays);
      }

      const { price, currency } = pricingItems[0];
      
      // Apply days multiplier for charter services
      const basePrice = serviceType === 'charter' ? price * serviceDays : price;
      
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
      // Input is assumed to be sanitized by Zod resolver in the form
      console.log('SAVE & SEND DEBUG - Raw input from form (Zod sanitized):', JSON.stringify(input));

      // Ensure status is valid ('draft' or 'sent')
      const status = input.status === 'sent' ? 'sent' : 'draft';

      // --- Calculate Amount ---
      // Use optional chaining and nullish coalescing for safer defaults
      const serviceDays = input.service_days ?? 1;
      const discountPercentage = input.discount_percentage ?? 0;
      const taxPercentage = input.tax_percentage ?? 0;
      const isCharter = input.service_type === 'charter';
      const effectiveDuration = isCharter
        ? (input.hours_per_day ?? input.duration_hours ?? 1) // Prefer hours_per_day for charter
        : (input.duration_hours ?? 1);

      const { baseAmount, currency, totalAmount } = await calculateQuotationAmount(
        input.service_type,
        input.vehicle_type,
        effectiveDuration,
        discountPercentage,
        taxPercentage,
        serviceDays
      );
      console.log('SAVE & SEND DEBUG - Calculated Pricing:', { baseAmount, currency, totalAmount });

      // --- Prepare record for DB Insert ---
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Directly build the record for insertion
      // Ensure numeric fields from input are numbers or null (Zod should handle this)
      const recordToInsert: Database['public']['Tables']['quotations']['Insert'] = {
        title: input.title || '', // Ensure title is not undefined
        status: status,
        customer_name: input.customer_name || null,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone || null,
        merchant_id: userId,
        merchant_notes: input.merchant_notes || null,
        customer_notes: input.customer_notes || null, // Add customer notes if provided
        service_type: input.service_type,
        vehicle_category: input.vehicle_category || null,
        vehicle_type: input.vehicle_type,
        pickup_location: null, // Assuming these aren't in the form yet
        dropoff_location: null, // Assuming these aren't in the form yet
        pickup_date: input.pickup_date || undefined, // Keep as string 'YYYY-MM-DD' or undefined
        pickup_time: input.pickup_time || null,
        // Use calculated/validated numeric values
        duration_hours: effectiveDuration, // Zod ensures this is number or default
        service_days: serviceDays,         // Zod ensures this is number or default
        hours_per_day: isCharter ? effectiveDuration : null, // Only set for charter
        passenger_count: input.passenger_count ?? null,      // Zod ensures this is number or null
        amount: baseAmount,
        currency: currency,
        discount_percentage: discountPercentage, // Zod ensures this is number or default
        tax_percentage: taxPercentage,       // Zod ensures this is number or default
        total_amount: totalAmount,
        expiry_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours expiry
        quote_number: Math.floor(Math.random() * 1000000), // Generate quote number
        // Ensure billing fields are null if empty/undefined
        billing_company_name: input.billing_company_name || null,
        billing_tax_number: input.billing_tax_number || null,
        billing_street_name: input.billing_street_name || null,
        billing_street_number: input.billing_street_number || null,
        billing_city: input.billing_city || null,
        billing_state: input.billing_state || null,
        billing_postal_code: input.billing_postal_code || null,
        billing_country: input.billing_country || null,
      };
      
      // Add display_currency if provided
      if (input.display_currency) {
        (recordToInsert as any).display_currency = input.display_currency;
      }

      // Log the final record before attempting insert
      console.log('SAVE & SEND DEBUG - Record for DB Insert:', JSON.stringify(recordToInsert));

      // --- Perform DB Insert ---
      const { data, error: insertError } = await supabase
        .from('quotations')
        .insert(recordToInsert)
        .select()
        .single();

      if (insertError) {
         console.error('SAVE & SEND DEBUG - DB Insert error details:', {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            fullError: insertError
          });
        throw insertError; // Rethrow the actual Supabase error
      }

      // --- Create Quotation Item and Activity Log ---
      if (data) {
        // Create quotation item (service line)
        const { error: itemError } = await supabase
          .from('quotation_items')
          .insert({
            quotation_id: data.id,
            description: `${input.service_type} - ${input.vehicle_type}`,
            quantity: 1, // Assuming always 1 for the main service line
            unit_price: baseAmount, // Use calculated baseAmount
            total_price: baseAmount, // Use calculated baseAmount
            sort_order: 1
          });

        if (itemError) {
          // Log error but don't fail the whole process for item creation error
          console.error('SAVE & SEND DEBUG - Error creating quotation item:', itemError);
        }

        // Create activity log
        await supabase
          .from('quotation_activities')
          .insert({
            quotation_id: data.id,
            user_id: userId,
            action: 'created',
            details: { status } // Log the initial status
          });
      }

      toast({
        title: t('quotations.notifications.createSuccess'),
      });

      return data as unknown as Quotation;

    } catch (err: any) {
      // Log the specific error caught
      console.error('SAVE & SEND DEBUG - Error in createQuotation function:', err);
       const errorMessage = err.message || 'Failed to create quotation';
       setError(errorMessage);

      toast({
        title: t('quotations.notifications.error'),
        description: errorMessage,
        variant: 'destructive',
      });

      return null; // Return null on failure
    } finally {
      setLoading(false);
    }
  };

  const updateQuotation = async (id: string, input: UpdateQuotationInput): Promise<Quotation | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch current quotation to compare changes
      const { data: currentQuotation, error: fetchError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Cast to Quotation type to avoid TypeScript errors
      const quotation = currentQuotation as unknown as Quotation;
      
      // Initialize update data object
      const updateData: Record<string, any> = { ...input };
      
      // Set expiry date (original code had this, don't remove)
      const validDays = 30;
      updateData.expiry_date = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
      
      // Check if we need to recalculate pricing
      const needsRecalculation = 
        input.service_type !== undefined || 
        input.vehicle_type !== undefined || 
        input.duration_hours !== undefined || 
        input.service_days !== undefined ||
        input.hours_per_day !== undefined ||
        input.discount_percentage !== undefined || 
        input.tax_percentage !== undefined;

      // Recalculate amount if needed
      if (needsRecalculation) {
        const serviceType = input.service_type || quotation.service_type;
        const vehicleType = input.vehicle_type || quotation.vehicle_type;
        const isCharter = serviceType === 'charter';
        
        // For charter services, prefer hours_per_day over duration_hours
        let effectiveDuration: number;
        if (isCharter) {
          effectiveDuration = input.hours_per_day || input.duration_hours || 
            quotation.hours_per_day || quotation.duration_hours || 1;
          // Ensure hours_per_day is synchronized with effectiveDuration
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
          serviceType,
          vehicleType,
          effectiveDuration,
          discountPercentage,
          taxPercentage,
          serviceDays
        );

        updateData.amount = baseAmount;
        updateData.currency = currency;
        updateData.total_amount = totalAmount;
        
        // If display_currency is not specified but we're recalculating,
        // keep the existing display_currency or default to the actual currency
        if (input.display_currency === undefined) {
          updateData.display_currency = quotation.display_currency || currency;
        }
      } else if (input.display_currency) {
        // Handle case where only display_currency is updated
        updateData.display_currency = input.display_currency;
      }

      // Also update the quotation item if service changed
      if (input.service_type || input.vehicle_type) {
        const serviceType = input.service_type || quotation.service_type;
        const vehicleType = input.vehicle_type || quotation.vehicle_type;
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
              description: `${serviceType} - ${vehicleType}`,
              unit_price: baseAmount,
              total_price: baseAmount
            })
            .eq('id', items[0].id);
        }
      }

      // Update the quotation
      const { data, error } = await supabase
        .from('quotations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create activity log
      if (data) {
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

      // Explicitly cast the data to unknown first, then Quotation type
      return data as unknown as Quotation;
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
      toast({
        title: t('quotations.notifications.sendSuccess') || 'Quotation sent successfully',
      });
      
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
      // Use cached categories if available and recent (within 30 seconds)
      const now = Date.now();
      if (pricingCache.categories && (now - pricingCache.lastFetch < 30000)) {
        return pricingCache.categories;
      }
      
      const { data, error } = await supabase
        .from('pricing_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching pricing categories:', error);
        return getFallbackCategories();
      }
      
      // Cache the results
      pricingCache.categories = data || [];
      pricingCache.lastFetch = now;
      
      return data || [];
    } catch (err: any) {
      console.error('Error fetching pricing categories:', err);
      return getFallbackCategories();
    }
  }, []);
  
  // Helper function for fallback categories
  const getFallbackCategories = (): PricingCategory[] => {
    return [
      {
        id: 'mock-platinum',
        name: 'Platinum',
        description: 'Premium luxury service',
        service_types: ['charter', 'airportTransferHaneda', 'airportTransferNarita'],
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-luxury',
        name: 'Luxury',
        description: 'High-end luxury service',
        service_types: ['charter', 'airportTransferHaneda', 'airportTransferNarita'],
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-premium',
        name: 'Premium',
        description: 'Standard premium service',
        service_types: ['charter', 'airportTransferHaneda', 'airportTransferNarita'],
        is_active: true,
        sort_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  // Updated getPricingItems with caching
  const getPricingItems = async (
    categoryId?: string,
    serviceType?: string,
    vehicleType?: string
  ): Promise<PricingItem[]> => {
    try {
      // Create a cache key based on the parameters
      const cacheKey = `${categoryId || ''}-${serviceType || ''}-${vehicleType || ''}`;
      
      // Use cached items if available and recent (within 30 seconds)
      const now = Date.now();
      if (pricingCache.items.has(cacheKey) && (now - pricingCache.lastFetch < 30000)) {
        return pricingCache.items.get(cacheKey) || [];
      }
      
      let query = supabase
        .from('pricing_items')
        .select('*')
        .eq('is_active', true);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      if (serviceType) {
        // Handle common variations in service type naming 
        // (e.g., airportTransfer vs airport_transfer vs Airport Transfer)
        const normalizedServiceType = serviceType.toLowerCase()
          .replace(/\s+/g, '')
          .replace(/_/g, '');
          
        if (normalizedServiceType.includes('airport')) {
          // For airport transfers, match any service_type containing 'airport'
          query = query.ilike('service_type', `%airport%`);
        } else if (normalizedServiceType.includes('charter')) {
          // For charter services
          query = query.ilike('service_type', `%charter%`);
        } else {
          // For exact matches
          query = query.eq('service_type', serviceType);
        }
      }
      
      if (vehicleType) {
        query = query.eq('vehicle_type', vehicleType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pricing items:', error);
        return getFallbackItems(categoryId);
      }
      
      // Cache the results
      pricingCache.items.set(cacheKey, data || []);
      pricingCache.lastFetch = now;
      
      return data || [];
    } catch (err: any) {
      console.error('Error fetching pricing items:', err);
      return getFallbackItems(categoryId);
    }
  };
  
  // Helper function for fallback items
  const getFallbackItems = (categoryId?: string): PricingItem[] => {
    // Different fallback items based on category
    if (categoryId === 'mock-platinum' || !categoryId) {
      return [
        {
          id: 'mock-platinum-1',
          category_id: 'mock-platinum',
          service_type: 'charter',
          vehicle_type: 'Mercedes Benz V Class - Black Suite',
          duration_hours: 1,
          price: 23000,
          currency: 'THB',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock-platinum-2',
          category_id: 'mock-platinum',
          service_type: 'airportTransferHaneda',
          vehicle_type: 'Mercedes Benz V Class - Black Suite',
          duration_hours: 1,
          price: 46000,
          currency: 'THB',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }
    
    // Default fallback
    return [
      {
        id: 'mock-item-1',
        category_id: categoryId || 'mock-category-1',
        service_type: 'charter',
        vehicle_type: 'Standard Vehicle',
        duration_hours: 1,
        price: 5000,
        currency: 'THB',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

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
        .select('*');
        
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
      
      console.log('Creating promotion with data:', promotion);
      
      // Call a server API endpoint that has admin privileges instead of direct table access
      const response = await fetch('/api/admin/pricing/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...promotion,
          times_used: 0
        })
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
      setLoading(true);
      
      // Call a server API endpoint that has admin privileges instead of direct table access
      const response = await fetch(`/api/admin/pricing/promotions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
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
    // New methods for promotions and packages
    getPricingPromotions,
    getPricingPromotion,
    createPricingPromotion,
    updatePricingPromotion,
    deletePricingPromotion,
    getPricingPackages,
    getPricingPackage,
    createPricingPackage,
    updatePricingPackage,
    deletePricingPackage
  };
}; 