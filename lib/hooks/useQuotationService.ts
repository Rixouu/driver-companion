import { useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
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
  ServiceItemInput,
  ServiceTypeInfo
} from '@/types/quotations';
import { useI18n } from '@/lib/i18n/context';
import { Database } from '@/types/supabase';
import { addMinutes } from 'date-fns';

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
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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

  // Add a function to apply time-based pricing rules
  const calculateTimeBasedPrice = async (
    basePrice: number,
    categoryId: string | null,
    serviceTypeId: string | null,
    dateTime: Date | string
  ): Promise<number> => {
    try {
      // Convert string date to Date object if needed
      const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
      
      // Make sure we have a valid date
      if (isNaN(date.getTime())) {
        console.error('Invalid date provided for time-based pricing calculation');
        return basePrice;
      }
      
      // Get the day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = date.getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const day = dayNames[dayOfWeek];
      
      // Format time as HH:MM for comparison with rule times
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const time = `${hours}:${minutes}`;
      
      // Fetch active time-based pricing rules
      let url = '/api/admin/pricing/time-based-rules?active_only=true';
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to fetch time-based pricing rules');
        return basePrice;
      }
      
      const rules = await response.json();
      
      // If no rules, return the base price
      if (!rules || rules.length === 0) {
        return basePrice;
      }
      
      // Sort rules by priority (higher priority first)
      const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
      
      // Find the first matching rule
      const matchingRule = sortedRules.find(rule => {
        // Check if rule applies to this category
        if (rule.category_id && rule.category_id !== categoryId) {
          return false;
        }
        
        // Check if rule applies to this service type
        if (rule.service_type_id && rule.service_type_id !== serviceTypeId) {
          return false;
        }
        
        // Check if rule applies to this day of week
        if (rule.days_of_week && rule.days_of_week.length > 0 && !rule.days_of_week.includes(day)) {
          return false;
        }
        
        // Check if rule applies to this time
        // For time comparison, we need to handle overnight periods (e.g., 22:00 to 06:00)
        if (rule.start_time && rule.end_time) {
          if (rule.start_time < rule.end_time) {
            // Simple case: start time is earlier than end time
            return time >= rule.start_time && time <= rule.end_time;
          } else {
            // Overnight case: start time is later than end time
            return time >= rule.start_time || time <= rule.end_time;
          }
        }
        
        return true;
      });
      
      // If no matching rule, return the base price
      if (!matchingRule) {
        return basePrice;
      }
      
      // Apply the adjustment percentage
      const adjustmentFactor = 1 + (matchingRule.adjustment_percentage / 100);
      return basePrice * adjustmentFactor;
    } catch (error) {
      console.error('Error calculating time-based price:', error);
      return basePrice;
    }
  };

  /**
   * Calculate quotation amount based on service type and options
   */
  const calculateQuotationAmount = async (
    serviceTypeId: string,
    selectedVehicle: { id: string; brand: string; model: string; name: string } | null,
    durationHours: number = 1,
    discountPercentage: number = 0,
    taxPercentage: number = 0,
    serviceDays: number = 1,
    hoursPerDay?: number,
    dateTime?: Date | string,
    vehicleCategory?: string // Add vehicle category parameter
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
      // Get service type information
      const serviceTypeResult = await getServiceTypeById(serviceTypeId);
      const serviceType = serviceTypeResult?.name || '';
      
      // NEW CLEAN APPROACH: Use vehicle_id directly instead of vehicle_type mapping
      console.log(`🔍 [PRICING] Service Type ID: "${serviceTypeId}"`);
      console.log(`🔍 [PRICING] Vehicle Category: "${vehicleCategory}"`);
      console.log(`🔍 [PRICING] Duration Hours: ${durationHours}`);
      console.log(`🔍 [PRICING] Selected Vehicle:`, selectedVehicle);
      
      // Try to fetch price from database first using vehicle_id
      let query = supabase
        .from('pricing_items')
        .select('*')
        .eq('service_type_id', serviceTypeId)
        .eq('vehicle_id', selectedVehicle?.id || '') // Use vehicle_id instead of vehicle_type
        .eq('duration_hours', durationHours)
        .eq('is_active', true);
      
      // If vehicle category is provided, filter by it
      if (vehicleCategory) {
        query = query.eq('category_id', vehicleCategory);
        console.log(`🔍 [PRICING] Filtering by category ID: "${vehicleCategory}"`);
      } else {
        console.log(`⚠️ [PRICING] No vehicle category provided, will search all categories`);
      }
      
      const { data: pricingItems, error: pricingError } = await query;
      
      if (pricingError) {
        console.error(`❌ [PRICING] Database error:`, pricingError);
      }
      
      console.log(`🔍 [PRICING] Query results: ${pricingItems?.length || 0} items found`);
      if (pricingItems && pricingItems.length > 0) {
        console.log(`🔍 [PRICING] Found items:`, pricingItems.map(item => ({
          id: item.id,
          vehicle_id: item.vehicle_id,
          price: item.price,
          duration_hours: item.duration_hours,
          category_id: item.category_id
        })));
      }
      
      if (pricingItems && pricingItems.length > 0) {
        // Found an exact pricing match in the database
        baseAmount = Number(pricingItems[0].price);
        priceSource = 'database_exact_match';
        console.log(`✅ [PRICING] Found exact match: vehicle_id ${pricingItems[0].vehicle_id} - ¥${pricingItems[0].price} for ${durationHours}h`);
      } else {
        console.log(`⚠️ [PRICING] No exact match found for vehicle_id ${selectedVehicle?.id} - ${durationHours}h, trying hourly rate...`);
        // No exact match, try to get hourly rate from database
        let hourlyQuery = supabase
          .from('pricing_items')
          .select('*')
          .eq('service_type_id', serviceTypeId)
          .eq('vehicle_id', selectedVehicle?.id || '') // Use vehicle_id instead of vehicle_type
          .eq('duration_hours', 1) // Get the hourly rate
          .eq('is_active', true);
        
        // If vehicle category is provided, filter by it
        if (vehicleCategory) {
          hourlyQuery = hourlyQuery.eq('category_id', vehicleCategory);
        }
        
        const { data: hourlyRates, error: hourlyError } = await hourlyQuery;
          
        if (hourlyRates && hourlyRates.length > 0) {
          // Use hourly rate from database
          const hourlyRate = Number(hourlyRates[0].price);
          priceSource = 'database_hourly_rate';
          console.log(`✅ [PRICING] Found hourly rate: ${hourlyRates[0].vehicle_id || 'N/A'} - ¥${hourlyRates[0].price}/h`);
          
          // Different calculation logic based on service type
          if (serviceType.toLowerCase().includes('charter')) {
            // For charter, calculate based on days and hours per day
            const effectiveHoursPerDay = hoursPerDay || durationHours;
            const dailyRate = hourlyRate * effectiveHoursPerDay;
            baseAmount = dailyRate * serviceDays;
          } else {
            // For other services, simple hourly rate * duration
            baseAmount = hourlyRate * durationHours;
          }
        } else {
          // Fallback to querying any pricing for this vehicle
          let fallbackQuery = supabase
            .from('pricing_items')
            .select('*')
            .eq('vehicle_id', selectedVehicle?.id || '') // Use vehicle_id instead of vehicle_type
            .eq('is_active', true)
            .limit(1);
          
          // If vehicle category is provided, filter by it
          if (vehicleCategory) {
            fallbackQuery = fallbackQuery.eq('category_id', vehicleCategory);
          }
          
          const { data: vehiclePricing, error: vehicleError } = await fallbackQuery;
          
          if (vehiclePricing && vehiclePricing.length > 0) {
            // Use a price from the same vehicle as a base
            baseAmount = Number(vehiclePricing[0].price);
            priceSource = 'database_vehicle_match';
          } else {
            // No vehicle-specific pricing found, try category-based pricing as fallback
            console.log(`⚠️ [PRICING] No vehicle-specific pricing found, trying category-based fallback...`);
            
            let categoryFallbackQuery = supabase
              .from('pricing_items')
              .select('*')
              .eq('service_type_id', serviceTypeId)
              .eq('category_id', vehicleCategory)
              .eq('duration_hours', durationHours)
              .eq('is_active', true)
              .limit(1);
            
            const { data: categoryPricing, error: categoryError } = await categoryFallbackQuery;
            
            if (categoryPricing && categoryPricing.length > 0) {
              // Use category-based pricing as fallback
              baseAmount = Number(categoryPricing[0].price);
              priceSource = 'database_category_fallback';
              console.log(`✅ [PRICING] Using category-based pricing: ¥${baseAmount} for ${serviceType} in ${vehicleCategory} category`);
            } else {
              // Try hourly rate from category
              let categoryHourlyQuery = supabase
                .from('pricing_items')
                .select('*')
                .eq('service_type_id', serviceTypeId)
                .eq('category_id', vehicleCategory)
                .eq('duration_hours', 1)
                .eq('is_active', true)
                .limit(1);
              
              const { data: categoryHourly, error: categoryHourlyError } = await categoryHourlyQuery;
              
              if (categoryHourly && categoryHourly.length > 0) {
                const hourlyRate = Number(categoryHourly[0].price);
                priceSource = 'database_category_hourly_fallback';
                console.log(`✅ [PRICING] Using category hourly rate: ¥${hourlyRate}/h for ${serviceType} in ${vehicleCategory} category`);
                
                // Different calculation logic based on service type
                if (serviceType.toLowerCase().includes('charter')) {
                  const effectiveHoursPerDay = hoursPerDay || durationHours;
                  const dailyRate = hourlyRate * effectiveHoursPerDay;
                  baseAmount = dailyRate * serviceDays;
                } else {
                  baseAmount = hourlyRate * durationHours;
                }
              } else {
                // No pricing found in database - this should not happen with proper data
                priceSource = 'no_pricing_found';
                console.error(`❌ [PRICING] No pricing found in database for: vehicle_id ${selectedVehicle?.id} - ${durationHours}h in category ${vehicleCategory}`);
                console.error(`❌ [PRICING] Service Type: ${serviceType} (ID: ${serviceTypeId})`);
                console.error(`❌ [PRICING] Vehicle: ${selectedVehicle?.brand} ${selectedVehicle?.model}`);
                
                // Return error instead of hardcoded values
                throw new Error(`No pricing found for vehicle ${selectedVehicle?.brand} ${selectedVehicle?.model} with ${durationHours}h duration in category ${vehicleCategory}`);
              }
            }
          }
        }
      }
      
      // Apply time-based pricing adjustment if a dateTime is provided
      if (dateTime) {
        // Find the pricing category for this service type
        const { data: categoryData } = await supabase
          .from('pricing_items')
          .select('category_id')
          .eq('service_type_id', serviceTypeId)
          .limit(1);
        
        const categoryId = categoryData && categoryData.length > 0 ? categoryData[0].category_id : null;
        
        // Apply time-based pricing
        baseAmount = await calculateTimeBasedPrice(
          baseAmount,
          categoryId,
          serviceTypeId,
          dateTime
        );
      }
      
      // Apply discount and tax
      const discountAmount = baseAmount * (discountPercentage / 100);
      const amountAfterDiscount = baseAmount - discountAmount;
      const taxAmount = amountAfterDiscount * (taxPercentage / 100);
      const totalAmount = amountAfterDiscount + taxAmount;
      
      console.log(`💰 [PRICING] Final result: ¥${baseAmount} (source: ${priceSource})`);
      
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
    currency: string = 'JPY',
    promotionDiscount: number = 0,
    packageDiscount: number = 0
  ): {
    baseAmount: number;
    discountAmount: number; // percentage-based discount amount
    promotionDiscountAmount: number;
    packageDiscountAmount: number;
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
    
    // Apply discounts (percentage first, then absolute promotion/package discounts)
    const discountAmount = baseAmount * (discountPercentage / 100);
    const promotionDiscountAmount = promotionDiscount || 0;
    const packageDiscountAmount = packageDiscount || 0;
    const discountedSubtotal = Math.max(
      baseAmount - discountAmount - promotionDiscountAmount - packageDiscountAmount,
      0
    );
    // Apply tax after all discounts
    const taxAmount = discountedSubtotal * (taxPercentage / 100);
    const totalAmount = discountedSubtotal + taxAmount;
    
    console.log('MULTI_SERVICE_CALCULATION - Final calculation:', {
      baseAmount,
      discountAmount,
      discountedSubtotal,
      taxAmount,
      totalAmount,
      currency
    });
    
    return {
      baseAmount,
      discountAmount,
      promotionDiscountAmount,
      packageDiscountAmount,
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
        
        // Log each service item with its pricing details (only for debugging)
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
        });
        
        // NOTE: Price validation queries removed for performance
        // These expensive database queries were causing slow draft saving
        // Price validation should only happen when sending to customers, not for drafts
        
        // Calculate the total with multiple services (including promotion/package discounts)
        const totalsObj = calculateTotalWithMultipleServices(
          serviceItems,
          input.discount_percentage || 0,
          input.tax_percentage || 0,
          input.currency || 'JPY',
          input.promotion_discount || 0,
          input.package_discount || 0
        );
        
        console.log('SAVE & SEND DEBUG - Multi-service totals calculated:', totalsObj);
        // Persist the computed totals for later use in the update step
        (input as any).__computedTotals = totalsObj;
      }
      
      // Calculate pricing if not provided
      let calculatedPricing;
      if (input.pickup_date && input.pickup_time) {
        try {
          // Combine date and time
          const dateStr = input.pickup_date;
          const timeStr = input.pickup_time;
          
          // Create date object from date and time strings
          const [year, month, day] = dateStr.split('-').map(Number);
          const [hours, minutes] = timeStr.split(':').map(Number);
          
          const dateTime = new Date(year, month - 1, day, hours, minutes);
          
          console.log('QUOTATION - Using time-based pricing with date/time:', {
            pickup_date: input.pickup_date,
            pickup_time: input.pickup_time,
            dateTime: dateTime.toISOString()
          });
          
          // Calculate with time-based pricing
          calculatedPricing = await calculateQuotationAmount(
            input.service_type_id,
            { id: input.vehicle_type, brand: '', model: '', name: input.vehicle_type }, // Create vehicle object from string
            input.duration_hours || 1,
            input.discount_percentage || 0,
            input.tax_percentage || 0,
            input.service_days || 1,
            input.hours_per_day === null ? undefined : input.hours_per_day,
            dateTime,
            input.vehicle_category
          );
        } catch (error) {
          console.error('Error parsing date for time-based pricing:', error);
          // Fallback to regular pricing if date parsing fails
          calculatedPricing = await calculateQuotationAmount(
            input.service_type_id,
            { id: input.vehicle_type, brand: '', model: '', name: input.vehicle_type }, // Create vehicle object from string
            input.duration_hours || 1,
            input.discount_percentage || 0,
            input.tax_percentage || 0,
            input.service_days || 1,
            input.hours_per_day === null ? undefined : input.hours_per_day,
            undefined, // dateTime
            input.vehicle_category
          );
        }
      } else {
        // Calculate without time-based pricing
        calculatedPricing = await calculateQuotationAmount(
          input.service_type_id,
          { id: input.vehicle_type, brand: '', model: '', name: input.vehicle_type }, // Create vehicle object from string
          input.duration_hours || 1,
          input.discount_percentage || 0,
          input.tax_percentage || 0,
          input.service_days || 1,
          input.hours_per_day === null ? undefined : input.hours_per_day,
          undefined, // dateTime
          input.vehicle_category
        );
      }
      
      // Override the service_type field based on the service_type_id
      const service = await getServiceTypeById(input.service_type_id);
      
      // Extract computed totals (do not send internal helper to API)
      const computedTotals = (input as any).__computedTotals as
        | {
            baseAmount: number;
            totalAmount: number;
          }
        | undefined;

      console.log('SAVE & SEND DEBUG - Computed totals for DB insert:', computedTotals);

      // Omit internal fields from payload
      const { __computedTotals, ...inputForDb } = input as any;

      // Prepare record for DB insert
      const record = {
        ...inputForDb,
        // Format dates
        expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        // Set service name from ID
        service_type: service?.name || 'Unknown Service',
        // Add days count field for clarity in DB
        days_count: input.service_days || 1,
        // Calculate amounts properly based on service items or single service
        amount: serviceItems && serviceItems.length > 0 ?
          (computedTotals?.baseAmount ?? serviceItems.reduce((total, item) => total + (item.total_price || item.unit_price), 0)) :
          calculatedPricing.baseAmount,
        total_amount: serviceItems && serviceItems.length > 0 ?
          computedTotals?.totalAmount :
          calculatedPricing.totalAmount
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
                  // ALWAYS use direct update since we disabled the trigger entirely
        const needsDirectUpdate = computedTotals !== undefined;
        
        if (needsDirectUpdate) {
            console.log('SAVE & SEND DEBUG - Quotation has promotion/package discount, using direct update approach');
            
            // First, use direct update to set the correct amounts BEFORE creating items
            const directUpdateResponse = await fetch(`/api/quotations/direct-update/${result.id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: computedTotals.baseAmount,
                total_amount: computedTotals.totalAmount
              }),
            });
            
            if (!directUpdateResponse.ok) {
              const directErrorText = await directUpdateResponse.text();
              console.error('Direct update failed:', directErrorText);
            } else {
              console.log('SAVE & SEND DEBUG - Pre-emptive direct update succeeded');
            }
          }
          
          // Use the bulk create endpoint
          const itemsResponse = await fetch('/api/quotations/items/bulk-create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quotation_id: result.id,
              items: serviceItems
            }),
          });
          
          if (!itemsResponse.ok) {
            const errorText = await itemsResponse.text();
            console.error('SAVE & SEND DEBUG - Failed to create service items:', errorText);
            throw new Error(`Failed to create service items: ${errorText}`);
          } else {
            const itemsResult = await itemsResponse.json();
            console.log('SAVE & SEND DEBUG - Successfully added service items to quotation:', itemsResult);
            
            // After creating items, ensure the correct amounts are still set
            if (computedTotals) {
              try {
                console.log('Updating quotation amounts in the database (post-items):', {
                  id: result.id,
                  amount: computedTotals.baseAmount,
                  total_amount: computedTotals.totalAmount
                });
                
                // Always use direct update since trigger is disabled
                const updateResponse = await fetch(`/api/quotations/direct-update/${result.id}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    amount: computedTotals.baseAmount,
                    total_amount: computedTotals.totalAmount
                  }),
                });
              
                if (!updateResponse.ok) {
                  const updateErrorText = await updateResponse.text();
                  console.error('Failed to update quotation with correct amounts:', updateErrorText);
                  
                  // No fallback needed since we're already using direct update
                } else {
                  const updatedResult = await updateResponse.json();
                  console.log('SAVE & SEND DEBUG - Updated quotation with correct amounts:', JSON.stringify(updatedResult));
                  return updatedResult;
                }
              } catch (updateError) {
                console.error('Exception during amount update:', updateError);
              }
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
      
      // Check if this update includes promotion/package discounts or pricing-related fields
      const hasPricingChanges = [
        'promotion_discount', 'package_discount', 'discount_percentage', 'tax_percentage',
        'amount', 'total_amount', 'service_type_id', 'vehicle_type', 'duration_hours',
        'service_days', 'hours_per_day'
      ].some(field => sanitizedData.hasOwnProperty(field));
      
      if (hasPricingChanges) {
        console.log('UPDATE DEBUG - Pricing-related changes detected, will recalculate totals after update');
        
        // First, do the regular update
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
        
        // If we have promotion or package discounts, recalculate totals
        if (result.promotion_discount > 0 || result.package_discount > 0) {
          console.log('UPDATE DEBUG - Recalculating totals due to promotion/package discounts');
          
          // Get current quotation items to recalculate totals
          const { data: items } = await supabase
            .from('quotation_items')
            .select('*')
            .eq('quotation_id', id);
          
          if (items && items.length > 0) {
            // Calculate correct totals using the same logic as creation
            const serviceItems = items.map(item => ({
              description: item.description || '',
              service_type_id: item.service_type_id || '',
              service_type_name: item.service_type_name || '',
              vehicle_type: item.vehicle_type || '',
              vehicle_category: item.vehicle_category || '',
              unit_price: Number(item.unit_price),
              total_price: Number(item.total_price),
              quantity: item.quantity || 1,
              duration_hours: item.duration_hours || 1,
              service_days: item.service_days || 1,
              hours_per_day: item.hours_per_day || 1,
              sort_order: item.sort_order || 0,
              is_service_item: true
            }));
            
            const totalsObj = calculateTotalWithMultipleServices(
              serviceItems,
              result.discount_percentage || 0,
              result.tax_percentage || 0,
              result.currency || 'JPY',
              result.promotion_discount || 0,
              result.package_discount || 0
            );
            
            console.log('UPDATE DEBUG - Recalculated totals:', totalsObj);
            
            // Update with correct totals using direct-update API
            const directUpdateResponse = await fetch(`/api/quotations/direct-update/${id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: totalsObj.baseAmount,
                total_amount: totalsObj.totalAmount
              }),
            });
            
            if (directUpdateResponse.ok) {
              const finalResult = await directUpdateResponse.json();
              console.log('UPDATE DEBUG - Totals recalculated successfully:', finalResult);
              return finalResult;
            } else {
              console.error('UPDATE DEBUG - Failed to recalculate totals, returning original result');
              return result;
            }
          }
        }
        
        console.log('Quotation updated successfully:', result);
        return result;
      } else {
        // No pricing changes, use regular update
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
      }
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

      // Toast removed - let the component handle its own toast
      
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
      // Updated endpoint to /api/quotations/send-email-optimized
      const response = await fetch('/api/quotations/send-email-optimized', {
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
        
      // No toast here - let the calling component handle it
      
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Error sending quotation:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Error toast removed - let the component handle its own error toast
      
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
      const response = await fetch('/api/quotations/approve-optimized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: input.quotation_id, 
          notes: input.notes,
          signature: input.signature,
          bcc_emails: input.bcc_emails,
          skipStatusCheck: true 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process quotation approval');
      }

      // Toast removed - let the component handle its own success toast
      
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
      const response = await fetch('/api/quotations/reject-optimized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: input.quotation_id, 
          reason: input.rejected_reason,
          signature: input.signature,
          bcc_emails: input.bcc_emails,
          skipStatusCheck: true 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process quotation rejection');
      }

      // Toast removed - let the component handle its own success toast
      
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
        .select(`
          *,
          service_types:pricing_category_service_types ( service_type_id ),
          vehicles:pricing_category_vehicles ( vehicle_id )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching pricing categories:', error);
        // return getFallbackCategories(); // Fallback might be outdated, consider removing or updating
        return []; // Return empty on error
      }
      
      const categoriesData = (data || []).map((category: any) => ({
        ...category,
        service_type_ids: (category.service_types || []).map((st: any) => st.service_type_id),
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
          vehicle_id,
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
        query = query.eq('vehicle_id', vehicleType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pricing items:', error);
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
      return [];
    }
  }, [supabase]);
  
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
      
      // Map the fields to match the database schema
      const promotionDataForApi = {
        ...promotion,
        applicable_service_type_ids: promotion.applicable_service_type_ids || null,
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
        
        const errorMessage = responseData?.error || `API error (${response.status}): ${response.statusText}`;
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
      const { service_type_ids = [], ...rest } = categoryData as any;

      // Ensure we always insert non-null arrays for the NOT NULL columns in the DB
      const insertPayload = {
        ...rest,
        service_type_ids: service_type_ids, // uuid[] column – empty array is fine
        service_types: [],                  // we no longer rely on the denormalised names column but it is NOT NULL
        is_active: categoryData.is_active ?? true,
      };

      const { data, error } = await supabase
        .from('pricing_categories')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;

      // If there were service types selected, create junction rows
      if (service_type_ids && service_type_ids.length) {
        try {
          await addServiceTypesToCategory(data.id, service_type_ids);
        } catch (junctionErr) {
          console.error('Failed to add service types to new category', junctionErr);
        }
      }

      pricingCache.categories = null;
      toast({ title: t('pricing.categories.createSuccess') });
      return data as unknown as PricingCategory;
    } catch (err: any) {
      console.error('Error creating pricing category:', err);
      toast({
        title: t('pricing.categories.createError'),
        description: err.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePricingCategory = async (id: string, updates: Partial<Omit<PricingCategory, 'id' | 'created_at' | 'updated_at'>>): Promise<PricingCategory | null> => {
    try {
      setLoading(true);
      console.log('Updating pricing category:', { id, updates });
      
      const response = await fetch('/api/admin/pricing/categories/direct-update', {
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
              item_type: item.item_type as PackageItemType,
              is_optional: item.is_optional ?? false
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
              item_type: (item.item_type as PackageItemType),
              is_optional: item.is_optional ?? false
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

  /* -------------------------------------------------------------
   * Junction-table helpers (pricing_category_service_types / _vehicles)
   * ------------------------------------------------------------- */

  const addServiceTypesToCategory = async (categoryId: string, typeIds: string[]) => {
    if (typeIds.length === 0) return;
    await supabase
      .from('pricing_category_service_types')
      .insert(typeIds.map(id => ({ category_id: categoryId, service_type_id: id })))
      .throwOnError();
  };

  const removeServiceTypesFromCategory = async (categoryId: string, typeIds: string[]) => {
    if (typeIds.length === 0) return;
    await supabase
      .from('pricing_category_service_types')
      .delete()
      .eq('category_id', categoryId)
      .in('service_type_id', typeIds)
      .throwOnError();
  };

  const replaceServiceTypesOfCategory = async (categoryId: string, newTypeIds: string[]) => {
    // Fetch current
    const { data: currentRows, error } = await supabase
      .from('pricing_category_service_types')
      .select('service_type_id')
      .eq('category_id', categoryId);
    if (error) throw error;
    const currentIds = (currentRows ?? []).map(r => r.service_type_id);
    const toAdd = newTypeIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !newTypeIds.includes(id));
    await addServiceTypesToCategory(categoryId, toAdd);
    await removeServiceTypesFromCategory(categoryId, toRemove);
  };

  const addVehiclesToCategory = async (categoryId: string, vehicleIds: string[]) => {
    if (vehicleIds.length === 0) return;
    await supabase
      .from('pricing_category_vehicles')
      .insert(vehicleIds.map(id => ({ category_id: categoryId, vehicle_id: id })))
      .throwOnError();
  };

  const removeVehiclesFromCategory = async (categoryId: string, vehicleIds: string[]) => {
    if (vehicleIds.length === 0) return;
    await supabase
      .from('pricing_category_vehicles')
      .delete()
      .eq('category_id', categoryId)
      .in('vehicle_id', vehicleIds)
      .throwOnError();
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
    deletePricingPackage,
    addVehiclesToCategory,
    removeVehiclesFromCategory,
    replaceServiceTypesOfCategory,
    addServiceTypesToCategory,
    removeServiceTypesFromCategory,
  };
}; 