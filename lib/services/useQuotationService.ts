import { createClient } from "@/lib/supabase/index";
import { 
  CreateQuotationInput, 
  QuotationResponse, 
  QuotationStatus,
  PricingItem
} from "@/types/quotations";
import { TablesInsert } from "@/types/supabase";

export const useQuotationService = () => {
  // We need to get pricingItems data from somewhere - either as a prop or fetched
  // For simplicity we'll define a placeholder array here
  const pricingItems: PricingItem[] = [];

  const createQuotation = async (input: CreateQuotationInput): Promise<QuotationResponse> => {
    try {
      // Log the raw input to diagnose issues
      console.log("SAVE & SEND DEBUG - Raw input JSON:", JSON.stringify(input));
      
      // Sanitize input values for calculation
      const sanitizedValues = {
        serviceType: input.service_type,
        vehicleType: input.vehicle_type,
        effectiveDuration: input.duration_hours || 1,
        serviceDays: input.service_days || 1,
        discountPercentage: input.discount_percentage || 0,
        taxPercentage: input.tax_percentage || 0,
      };

      console.log("SAVE & SEND DEBUG - Sanitized values used for calculation:", sanitizedValues);
      
      // Calculate the amounts
      const baseAmount = pricingItems.find(
        (item) =>
          item.service_type === input.service_type &&
          item.vehicle_type === input.vehicle_type && 
          item.duration_hours === (input.duration_hours || 1)
      )?.price || 0;
      
      // Calculate discount amount
      const discountPercentage = input.discount_percentage || 0;
      const discountAmount = (baseAmount * discountPercentage) / 100;
      
      // Calculate tax amount
      const taxPercentage = input.tax_percentage || 0;
      const subtotalAfterDiscount = baseAmount - discountAmount;
      const taxAmount = (subtotalAfterDiscount * taxPercentage) / 100;
      
      // Calculate total amount
      const totalAmount = subtotalAfterDiscount + taxAmount;
      
      // Build the base database record without integer fields that need special handling
      const baseQuotationData: Partial<TablesInsert<"quotations">> = {
        title: input.title,
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone,
        service_type: input.service_type,
        vehicle_type: input.vehicle_type,
        vehicle_category: input.vehicle_category,
        pickup_location: input.pickup_location,
        dropoff_location: input.dropoff_location,
        pickup_date: input.pickup_date,
        pickup_time: input.pickup_time,
        status: input.status || "draft",
        amount: baseAmount,
        total_amount: totalAmount,
        currency: "THB",
        merchant_notes: input.merchant_notes,
        discount_percentage: input.discount_percentage,
        tax_percentage: input.tax_percentage,
        expiry_date: new Date(
          new Date().setDate(new Date().getDate() + 14)
        ).toISOString(),
        quote_number: Math.floor(Math.random() * 1000000),
        billing_company_name: input.billing_company_name,
        billing_tax_number: input.billing_tax_number,
        billing_street_name: input.billing_street_name,
        billing_street_number: input.billing_street_number,
        billing_city: input.billing_city,
        billing_state: input.billing_state,
        billing_postal_code: input.billing_postal_code,
        billing_country: input.billing_country,
      };
      
      // Handle integer fields separately with proper validation
      const integerFields = {
        // Only add integer fields if they're valid integers
        ...(parseIntSafely(input.duration_hours) !== undefined ? 
            { duration_hours: parseIntSafely(input.duration_hours) } : {}),
        
        ...(parseIntSafely(input.service_days) !== undefined ? 
            { service_days: parseIntSafely(input.service_days) } : {}),
            
        ...(parseIntSafely(input.hours_per_day) !== undefined ? 
            { hours_per_day: parseIntSafely(input.hours_per_day) } : {}),
            
        ...(parseIntSafely(input.passenger_count) !== undefined ? 
            { passenger_count: parseIntSafely(input.passenger_count) } : {})
      };
      
      // Combine the base data with the validated integer fields
      const quotationData: TablesInsert<"quotations"> = {
        ...baseQuotationData,
        ...integerFields
      } as TablesInsert<"quotations">;
      
      console.log("SAVE & SEND DEBUG - Final record to insert:", JSON.stringify(quotationData));
      
      // Insert the record
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("quotations")
          .insert(quotationData)
          .select()
          .single();
        
        if (error) {
          console.error("SAVE & SEND DEBUG - DB Insert error details:", error);
          throw error;
        }
        
        if (!data) {
          throw new Error("No data returned from insert");
        }
        
        return {
          id: data.id,
          status: data.status as QuotationStatus,
          customer_name: data.customer_name || "",
          customer_email: data.customer_email,
          service_type: data.service_type,
          vehicle_type: data.vehicle_type,
          amount: data.amount,
          total_amount: data.total_amount,
          created_at: data.created_at,
          quote_number: data.quote_number,
          expiry_date: data.expiry_date,
        };
      } catch (insertError) {
        console.error("SAVE & SEND DEBUG - DB insert error:", insertError);
        throw insertError;
      }
    } catch (error) {
      console.error("SAVE & SEND DEBUG - Error creating quotation:", error);
      throw error;
    }
  };
  
  // Helper function to safely parse integers
  function parseIntSafely(value: any): number | undefined {
    // If value is already a number, return it
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    // Handle strings
    if (typeof value === 'string') {
      // Skip empty strings, 'none', etc.
      if (value === '' || value === 'none' || value === 'null') {
        return undefined;
      }
      
      // Try to parse as integer
      const parsed = parseInt(value, 10);
      return !isNaN(parsed) ? parsed : undefined;
    }
    
    // Handle nulls and everything else
    return undefined;
  }
  
  return {
    createQuotation
  };
}; 