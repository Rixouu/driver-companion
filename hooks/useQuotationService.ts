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
  PackageItemType,
  ServiceItemInput
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

  /**
   * Get a service type by ID
   */
  const getServiceTypeById = async (serviceTypeId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('id', serviceTypeId)
        .single();
      
      if (error) {
        console.error('Error fetching service type:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Unexpected error fetching service type:', error);
      return null;
    }
  };

  /**
   * Calculate quotation amount based on service type and options
   */
  const calculateQuotationAmount = async (
    serviceTypeId: string,
    vehicleType: string,
    durationHours: number = 1,
    discountPercentage: number = 0,
    taxPercentage: number = 0,
    serviceDays: number = 1,
    hoursPerDay?: number
  ): Promise<{
    baseAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
  }> => {
    let baseAmount = 0; // Default to 0 instead of hard-coded value
    const currency = 'JPY'; // Default currency
    let priceSource = 'default'; // Log the source of the price
    
    try {
      console.log('PRICE CALCULATION - Inputs:', {
        serviceTypeId,
        vehicleType,
        durationHours,
        discountPercentage,
        taxPercentage,
        serviceDays,
        hoursPerDay
      });
      
      // Get service type information
      const serviceTypeResult = await getServiceTypeById(serviceTypeId);
      const serviceType = serviceTypeResult?.name || '';
      
      console.log('PRICE CALCULATION - Service type:', {
        id: serviceTypeId,
        name: serviceType
      });
      
      // Try to fetch price from database first
      const { data: pricingItems, error: pricingError } = await supabase
        .from('pricing_items')
        .select('*')
        .eq('service_type_id', serviceTypeId)
        .eq('vehicle_type', vehicleType)
        .eq('duration_hours', durationHours)
        .eq('is_active', true);
      
      console.log('PRICE CALCULATION - Database query results:', {
        items: pricingItems?.length || 0,
        error: pricingError?.message
      });
      
      if (pricingItems && pricingItems.length > 0) {
        // Found an exact pricing match in the database
        baseAmount = Number(pricingItems[0].price);
        priceSource = 'database_exact_match';
        
        console.log('PRICE CALCULATION - Exact database match found:', {
          id: pricingItems[0].id,
          price: baseAmount,
          vehicle_type: pricingItems[0].vehicle_type,
          service_type_id: pricingItems[0].service_type_id,
          duration_hours: pricingItems[0].duration_hours
        });
      } else {
        // No exact match, try to get hourly rate from database
        const { data: hourlyRates, error: hourlyError } = await supabase
          .from('pricing_items')
          .select('*')
          .eq('service_type_id', serviceTypeId)
          .eq('vehicle_type', vehicleType)
          .eq('duration_hours', 1) // Get the hourly rate
          .eq('is_active', true);
          
        console.log('PRICE CALCULATION - Hourly rate query results:', {
          items: hourlyRates?.length || 0,
          error: hourlyError?.message
        });
        
        if (hourlyRates && hourlyRates.length > 0) {
          // Use hourly rate from database
          const hourlyRate = Number(hourlyRates[0].price);
          priceSource = 'database_hourly_rate';
          
          console.log('PRICE CALCULATION - Found hourly rate in database:', {
            id: hourlyRates[0].id,
            hourlyRate,
            vehicle_type: hourlyRates[0].vehicle_type,
            service_type_id: hourlyRates[0].service_type_id
          });
          
          // Different calculation logic based on service type
          if (serviceType.toLowerCase().includes('charter')) {
            // For charter, calculate based on days and hours per day
            const effectiveHoursPerDay = hoursPerDay || durationHours;
            const dailyRate = hourlyRate * effectiveHoursPerDay;
            baseAmount = dailyRate * serviceDays;
            
            console.log('PRICE CALCULATION - Charter calculation:', {
              hourlyRate,
              effectiveHoursPerDay,
              dailyRate,
              serviceDays,
              baseAmount
            });
          } else {
            // For other services, simple hourly rate * duration
            baseAmount = hourlyRate * durationHours;
            
            console.log('PRICE CALCULATION - Standard calculation:', {
              hourlyRate,
              durationHours,
              baseAmount
            });
          }
        } else {
          // Fallback to querying any pricing for this vehicle type
          const { data: vehiclePricing, error: vehicleError } = await supabase
            .from('pricing_items')
            .select('*')
            .eq('vehicle_type', vehicleType)
            .eq('is_active', true)
            .limit(1);
            
          console.log('PRICE CALCULATION - Vehicle fallback query results:', {
            items: vehiclePricing?.length || 0,
            error: vehicleError?.message
          });
          
          if (vehiclePricing && vehiclePricing.length > 0) {
            // Use a price from the same vehicle type as a base
            baseAmount = Number(vehiclePricing[0].price);
            priceSource = 'database_vehicle_match';
            
            console.log('PRICE CALCULATION - Found vehicle type match:', {
              id: vehiclePricing[0].id,
              price: baseAmount,
              vehicle_type: vehiclePricing[0].vehicle_type,
              service_type_id: vehiclePricing[0].service_type_id
            });
          } else {
            // Last resort - use hardcoded fallbacks but log extensively
            priceSource = 'hardcoded_fallback';
            
            // Different base pricing for different services
            if (serviceType.toLowerCase().includes('airporttransfer')) {
              if (serviceType.toLowerCase().includes('haneda')) {
                // Haneda pricing by vehicle type
                if (vehicleType.toLowerCase().includes('mercedes') && vehicleType.toLowerCase().includes('black suite')) {
                  baseAmount = 46000;
                } else if (vehicleType.toLowerCase().includes('toyota') && vehicleType.toLowerCase().includes('alphard')) {
                  baseAmount = 42000;
                } else if (vehicleType.toLowerCase().includes('toyota') && vehicleType.toLowerCase().includes('hi-ace')) {
                  baseAmount = 55000;
                } else {
                  baseAmount = 46000; // Default
                }
                
                console.log('PRICE CALCULATION - Using hardcoded Haneda airport transfer fallback:', {
                  vehicleType,
                  baseAmount
                });
              } else if (serviceType.toLowerCase().includes('narita')) {
                // Narita pricing by vehicle type
                if (vehicleType.toLowerCase().includes('mercedes') && vehicleType.toLowerCase().includes('black suite')) {
                  baseAmount = 69000;
                } else if (vehicleType.toLowerCase().includes('toyota') && vehicleType.toLowerCase().includes('alphard')) {
                  baseAmount = 65000;
                } else if (vehicleType.toLowerCase().includes('toyota') && vehicleType.toLowerCase().includes('hi-ace')) {
                  baseAmount = 75000;
                } else {
                  baseAmount = 69000; // Default
                }
                
                console.log('PRICE CALCULATION - Using hardcoded Narita airport transfer fallback:', {
                  vehicleType,
                  baseAmount
                });
              }
              
              // Multiply by duration for airport transfers (usually 1 hour)
              baseAmount = baseAmount * durationHours;
            } else if (serviceType.toLowerCase().includes('charter')) {
              // Charter services pricing - hardcoded fallbacks
              let hourlyRate = 0;
              
              if (vehicleType.toLowerCase().includes('mercedes') && vehicleType.toLowerCase().includes('black suite')) {
                hourlyRate = 23000;
              } else if (vehicleType.toLowerCase().includes('toyota') && vehicleType.toLowerCase().includes('alphard')) {
                hourlyRate = 23000;
              } else if (vehicleType.toLowerCase().includes('toyota') && vehicleType.toLowerCase().includes('hi-ace')) {
                hourlyRate = 27000;
              } else {
                hourlyRate = 23000; // Default to match Mercedes pricing
              }
              
              console.log('PRICE CALCULATION - Using hardcoded charter hourly rate fallback:', {
                vehicleType,
                hourlyRate
              });
              
              // For charter, calculate based on days and hours per day
              // If hoursPerDay is provided, use it; otherwise use durationHours
              const effectiveHoursPerDay = hoursPerDay || durationHours;
              const dailyRate = hourlyRate * effectiveHoursPerDay;
              baseAmount = dailyRate * serviceDays;
              
              console.log('PRICE CALCULATION - Charter calculation from fallback hourly rate:', {
                hourlyRate,
                effectiveHoursPerDay,
                dailyRate,
                serviceDays,
                baseAmount
              });
            } else {
              // Default fallback for unknown service types
              baseAmount = 46000; // General default
              console.log('PRICE CALCULATION - Using general default fallback price:', baseAmount);
            }
          }
        }
      }
      
      // Apply discount and tax
      const discountAmount = baseAmount * (discountPercentage / 100);
      const amountAfterDiscount = baseAmount - discountAmount;
      const taxAmount = amountAfterDiscount * (taxPercentage / 100);
      const totalAmount = amountAfterDiscount + taxAmount;
      
      console.log('PRICE CALCULATION - Final price calculation:', {
        priceSource,
        baseAmount,
        discountPercentage,
        discountAmount,
        amountAfterDiscount,
        taxPercentage,
        taxAmount,
        totalAmount,
        currency
      });
      
      return {
        baseAmount,
        discountAmount,
        taxAmount,
        totalAmount,
        currency
      };
    } catch (error) {
      console.error('Error calculating quotation amount:', error);
      
      // Return default values on error with explanation
      console.log('PRICE CALCULATION - Error occurred, using emergency fallback price of 46000');
      
      const baseAmount = 46000; // Emergency fallback
      const discountAmount = baseAmount * (discountPercentage / 100);
      const amountAfterDiscount = baseAmount - discountAmount;
      const taxAmount = amountAfterDiscount * (taxPercentage / 100);
      const totalAmount = amountAfterDiscount + taxAmount;
      
      console.log('PRICE CALCULATION - Emergency fallback calculation:', {
        baseAmount,
        discountPercentage,
        discountAmount,
        amountAfterDiscount,
        taxPercentage,
        taxAmount,
        totalAmount,
        currency
      });
      
      return {
        baseAmount,
        discountAmount,
        taxAmount,
        totalAmount,
        currency
      };
    }
  };

  // Add helper function to calculate total for multiple services
  const calculateTotalWithMultipleServices = (
    serviceItems: ServiceItemInput[],
    discountPercentage: number = 0,
    taxPercentage: number = 0,
    currency: string = 'JPY'
  ): {
    baseAmount: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
  } => {
    console.log('MULTI_SERVICE_CALCULATION - Starting calculation for multiple services', {
      serviceCount: serviceItems.length,
      discountPercentage,
      taxPercentage
    });
    
    // Calculate base amount as sum of all service items
    const baseAmount = serviceItems.reduce((total, item, index) => {
      const itemTotal = item.total_price || (item.unit_price * (item.quantity || 1));
      
      console.log(`MULTI_SERVICE_CALCULATION - Service item ${index}:`, {
        description: item.description,
        serviceType: item.service_type_name,
        vehicleType: item.vehicle_type,
        unitPrice: item.unit_price,
        quantity: item.quantity || 1,
        totalPrice: itemTotal
      });
      
      return total + itemTotal;
    }, 0);
    
    // Apply discount and tax
    const discountAmount = baseAmount * (discountPercentage / 100);
    const amountAfterDiscount = baseAmount - discountAmount;
    const taxAmount = amountAfterDiscount * (taxPercentage / 100);
    const totalAmount = amountAfterDiscount + taxAmount;
    
    console.log('MULTI_SERVICE_CALCULATION - Final calculation:', {
      baseAmount,
      discountAmount,
      amountAfterDiscount,
      taxAmount,
      totalAmount,
      currency
    });
    
    return {
      baseAmount,
      discountAmount,
      taxAmount,
      totalAmount,
      currency
    };
  };

  // Modify the createQuotation function to handle multiple services
  const createQuotation = async (input: CreateQuotationInput, serviceItems?: ServiceItemInput[]): Promise<Quotation | null> => {
    try {
      // Debug raw input
      console.log('SAVE & SEND DEBUG - Raw input from form (Zod sanitized):', JSON.stringify(input));
      
      // Debug service items if provided
      if (serviceItems && serviceItems.length > 0) {
        console.log('SAVE & SEND DEBUG - Service items from form:', JSON.stringify(serviceItems));
        
        // Log each service item with its pricing details
        serviceItems.forEach((item, index) => {
          console.log(`SAVE & SEND DEBUG - Service item ${index}:`, {
            description: item.description,
            service_type_id: item.service_type_id,
            service_type_name: item.service_type_name,
            vehicle_type: item.vehicle_type,
            unit_price: item.unit_price,
            total_price: item.total_price,
            service_days: item.service_days,
            hours_per_day: item.hours_per_day
          });
          
          // For each service item, query the database to see what the price should be
          setTimeout(async () => {
            try {
              // Look up the current price for this service in the database
              const { data: dbPrices, error: dbError } = await supabase
                .from('pricing_items')
                .select('*')
                .eq('service_type_id', item.service_type_id)
                .eq('vehicle_type', item.vehicle_type)
                .eq('is_active', true);
                
              if (dbError) {
                console.log(`PRICE VALIDATION - Error fetching prices for item ${index}:`, dbError.message);
              } else if (dbPrices && dbPrices.length > 0) {
                const exactMatch = dbPrices.find(p => p.duration_hours === (item.hours_per_day || 1));
                if (exactMatch) {
                  console.log(`PRICE VALIDATION - Item ${index} exact match from DB:`, {
                    item_price: item.unit_price,
                    db_price: Number(exactMatch.price),
                    match: item.unit_price === Number(exactMatch.price) ? 'MATCH ✓' : 'MISMATCH ✗',
                    db_id: exactMatch.id,
                    vehicle_type: exactMatch.vehicle_type,
                    duration_hours: exactMatch.duration_hours
                  });
                } else {
                  // Try to find the hourly rate
                  const hourlyRate = dbPrices.find(p => p.duration_hours === 1);
                  if (hourlyRate) {
                    console.log(`PRICE VALIDATION - Item ${index} hourly rate from DB:`, {
                      item_price: item.unit_price,
                      db_hourly_price: Number(hourlyRate.price),
                      hours: item.hours_per_day || 1,
                      expected_price: Number(hourlyRate.price) * (item.hours_per_day || 1),
                      match: item.unit_price === Number(hourlyRate.price) * (item.hours_per_day || 1) ? 'MATCH ✓' : 'MISMATCH ✗'
                    });
                  } else {
                    console.log(`PRICE VALIDATION - Item ${index} no hourly rate found:`, {
                      item_price: item.unit_price,
                      db_prices: dbPrices.map(p => ({
                        id: p.id,
                        price: p.price,
                        duration_hours: p.duration_hours
                      }))
                    });
                  }
                }
              } else {
                console.log(`PRICE VALIDATION - Item ${index} no pricing found in DB:`, {
                  service_type_id: item.service_type_id,
                  vehicle_type: item.vehicle_type,
                  used_price: item.unit_price 
                });
              }
            } catch (validationError) {
              console.error(`PRICE VALIDATION - Error validating price for item ${index}:`, validationError);
            }
          }, 0);
        });
        
        // Calculate the total with multiple services
        const totalsObj = calculateTotalWithMultipleServices(
          serviceItems,
          input.discount_percentage || 0,
          input.tax_percentage || 0,
          input.currency || 'JPY'
        );
        
        console.log('SAVE & SEND DEBUG - Multi-service totals calculated:', totalsObj);
      }
      
      // Calculate pricing if not provided
      let calculatedAmount = input.amount;
      let calculatedTotalAmount = input.total_amount;
      
      if (!calculatedAmount || !calculatedTotalAmount) {
        const pricing = await calculateQuotationAmount(
          input.service_type_id,
          input.vehicle_type,
          input.duration_hours || 1,
          input.discount_percentage || 0,
          input.tax_percentage || 0,
          input.service_days || 1,
          input.hours_per_day || undefined
        );
        
        calculatedAmount = pricing.baseAmount;
        calculatedTotalAmount = pricing.totalAmount;
        
        console.log('SAVE & SEND DEBUG - Calculated Pricing:', pricing);
      } else {
        console.log('SAVE & SEND DEBUG - Using explicit amounts from input:', {
          amount: calculatedAmount,
          total_amount: calculatedTotalAmount
        });
      }
      
      // Override the service_type field based on the service_type_id
      const service = await getServiceTypeById(input.service_type_id);
      
      // Prepare record for DB insert
      const record = {
        ...input,
        // Format dates
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        // Set service name from ID
        service_type: service?.name || 'Unknown Service',
        // Add days count field for clarity in DB
        days_count: input.service_days || 1,
        // If we have multiple services, ensure we use the input amounts (which include all services)
        amount: serviceItems && serviceItems.length > 0 ? input.amount : calculatedAmount,
        total_amount: serviceItems && serviceItems.length > 0 ? input.total_amount : calculatedTotalAmount
      };
      
      console.log('SAVE & SEND DEBUG - Record for DB Insert:', JSON.stringify(record));
      
      // Insert the record
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create quotation: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('SAVE & SEND DEBUG - Data returned from DB after insert:', JSON.stringify(result));
      
      // If we have service items, create them
      if (serviceItems && serviceItems.length > 0 && result.id) {
        try {
          // Use the bulk create endpoint
          const itemsResponse = await fetch('/api/quotations/items/bulk-create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quotation_id: result.id,
              items: serviceItems.map(item => ({
                ...item,
                quotation_id: result.id
              }))
            }),
          });
          
          if (!itemsResponse.ok) {
            console.error('Failed to create service items:', await itemsResponse.text());
          } else {
            console.log('SAVE & SEND DEBUG - Successfully added service items to quotation');
            
            // After creating items, update the quotation with the correct total amount
            try {
              console.log('Updating quotation amounts in the database:', {
                id: result.id,
                amount: input.amount,
                total_amount: input.total_amount
              });
              
              const updateResponse = await fetch(`/api/quotations/${result.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  amount: input.amount,
                  total_amount: input.total_amount
                }),
              });
              
              if (!updateResponse.ok) {
                const updateErrorText = await updateResponse.text();
                console.error('Failed to update quotation with correct amounts:', updateErrorText);
                
                // Try with a direct update to the database
                console.log('Attempting direct update as fallback...');
                const directUpdateResponse = await fetch(`/api/quotations/direct-update/${result.id}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    amount: input.amount,
                    total_amount: input.total_amount
                  }),
                });
                
                if (directUpdateResponse.ok) {
                  const updatedResult = await directUpdateResponse.json();
                  console.log('SAVE & SEND DEBUG - Direct update quotation with amounts succeeded:', updatedResult);
                  return updatedResult;
                } else {
                  const directErrorText = await directUpdateResponse.text();
                  console.error('Direct update also failed:', directErrorText);
                  console.error('Direct update request details:', {
                    url: `/api/quotations/direct-update/${result.id}`,
                    body: {
                      amount: input.amount,
                      total_amount: input.total_amount
                    }
                  });
                }
              } else {
                const updatedResult = await updateResponse.json();
                console.log('SAVE & SEND DEBUG - Updated quotation with correct amounts:', JSON.stringify(updatedResult));
                return updatedResult;
              }
            } catch (updateError) {
              console.error('Exception during amount update:', updateError);
              console.error('Update request details:', {
                id: result.id,
                amount: input.amount,
                total_amount: input.total_amount
              });
            }
          }
        } catch (error) {
          console.error('Error creating service items:', error);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error creating quotation:', error);
      return null;
    }
  };

  const updateQuotation = async (id: string, data: any) => {
    console.log('Updating quotation with ID:', id);
    console.log('Update data:', data);

    try {
      // Sanitize the data - remove any empty strings for UUID fields
      const sanitizedData = { ...data };
      
      // Explicitly set customer_id to null if it's an empty string
      if (sanitizedData.customer_id === '') {
        sanitizedData.customer_id = null;
      }
      
      // Remove other empty values that might cause UUID conversion errors
      // Make sure to do this for any field that might be a UUID
      if (sanitizedData.service_type_id === '') {
        sanitizedData.service_type_id = null; 
      }
      
      // Log the sanitized data
      console.log('Sanitized update data:', sanitizedData);
      
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error updating quotation (${response.status}):`, errorText);
        throw new Error(`Failed to update quotation: ${errorText}`);
      }

      const result = await response.json();
      console.log('Quotation updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Error updating quotation:', error);
      throw error;
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
      console.log('Updating pricing category:', { id, updates });
      
      const response = await fetch(`/api/admin/pricing/categories/direct-update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Admin-Request': 'true' // Add custom header for potential server-side handling
        },
        body: JSON.stringify({ id, updates }),
      });
      
      // Log detailed error info for troubleshooting
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to update pricing category';
        
        try {
          // Try to parse the error as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Not JSON, use text as is
          errorMessage = errorText || errorMessage;
        }
        
        console.error('API Error updating pricing category:', { 
          status: response.status, 
          message: errorMessage 
        });
        
        throw new Error(errorMessage);
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