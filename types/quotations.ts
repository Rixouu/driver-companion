import { Database } from "./supabase";

export type QuotationStatus = 
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "expired"
  | "converted"
  | "paid";

// Added ServiceTypeInfo here
export interface ServiceTypeInfo {
  id: string;
  name: string;
}

// Define InvoiceData and BookingData interfaces first
export interface InvoiceData {
  id: string;
  status: "pending" | "sent" | "paid" | "created";
  created_at?: Date;
  sent_at?: Date;
  paid_at?: Date;
  payment_url?: string;
  quotation_id?: string; 
}

export interface BookingData {
  id: string;
  status: "pending" | "confirmed" | "created";
  service_date?: string;
  pickup_time?: string;
  vehicle?: string;
  duration?: string;
  quotation_id?: string;
}

export interface Quotation {
  id: string;
  title: string;
  status: QuotationStatus;
  customer_id?: string;
  customer_name?: string;
  customer_email: string;
  customer_phone?: string;
  billing_company_name?: string;
  billing_tax_number?: string;
  billing_street_name?: string;
  billing_street_number?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  merchant_id?: string;
  merchant_notes?: string;
  customer_notes?: string;
  general_notes?: string;
  service_type_id: string;
  service_type?: string;
  vehicle_category?: string;
  vehicle_type: string;
  pickup_location?: string;
  dropoff_location?: string;
  pickup_date?: string;
  pickup_time?: string;
  duration_hours?: number;
  service_days?: number;
  hours_per_day?: number;
  passenger_count?: number | null;
  flight_number?: string;
  terminal?: string;
  number_of_passengers?: number;
  number_of_bags?: number;
  expiry_date: string;
  amount: number;
  currency: string;
  display_currency?: string;
  discount_percentage?: number;
  tax_percentage?: number;
  total_amount: number;
  converted_to_booking_id?: string;
  reference_code?: string;
  created_at: string;
  updated_at: string;
  rejected_reason?: string;
  quote_number: number;
  booking_created_at?: string | null;

  // Package and Promotion fields
  selected_package_id?: string | null;
  selected_package_name?: string | null;
  selected_package_description?: string | null;
  package_discount?: number;
  selected_promotion_id?: string | null;
  selected_promotion_name?: string | null;
  selected_promotion_description?: string | null;
  selected_promotion_code?: string | null;
  promotion_discount?: number;
  time_based_adjustment?: number;

  // Payment fields
  payment_amount?: number | null;
  payment_method?: string | null;
  payment_date?: string | null;
  receipt_url?: string | null;

  // Joined customer data (default Supabase behavior)
  customers?: {
    name: string | null;
    email: string | null;
  } | null; // Can be null if it's a left join or no related customer

  // Add the new optional fields
  invoice?: InvoiceData;
  booking?: BookingData;
  
  // Team tracking fields
  team_location?: 'japan' | 'thailand';
  created_by?: string;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  service_type_id?: string | null;
  service_type_name?: string | null;
  vehicle_type?: string | null;
  vehicle_category?: string | null;
  duration_hours?: number | null;
  service_days?: number | null;
  hours_per_day?: number | null;
  is_service_item?: boolean;
  pickup_date?: string | null;
  pickup_time?: string | null;
}

export interface PricingCategory {
  id: string;
  name: string;
  description?: string | null;
  service_type_ids: string[] | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingItem {
  id: string;
  category_id: string | null;
  service_type_id: string | null;
  service_type_name?: string;
  vehicle_id: string | null; // Changed from vehicle_type to vehicle_id
  duration_hours: number;
  price: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuotationActivity {
  id: string;
  quotation_id: string;
  user_id: string;
  user_name?: string;
  customer_id?: string;
  action: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface QuotationMessage {
  id: string;
  quotation_id: string;
  user_id: string;
  user_name?: string;
  customer_id?: string;
  message: string;
  is_from_customer: boolean;
  is_read: boolean;
  created_at: string;
}

export interface QuotationWithItems extends Quotation {
  items: QuotationItem[];
}

export interface QuotationWithRelations extends Quotation {
  items: QuotationItem[];
  activities?: QuotationActivity[];
  messages?: QuotationMessage[];
}

export interface CreateQuotationInput {
  title: string;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  customer_id?: string | null;
  merchant_notes?: string;
  customer_notes?: string;
  general_notes?: string;
  service_type_id: string;
  vehicle_category?: string;
  vehicle_type: string;
  pickup_date?: string;
  pickup_time?: string;
  duration_hours: number;
  service_days?: number;
  hours_per_day?: number | null;
  passenger_count?: number | null;
  discount_percentage?: number;
  tax_percentage?: number;
  status?: QuotationStatus;
  billing_company_name?: string;
  billing_tax_number?: string;
  billing_street_name?: string;
  billing_street_number?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  currency?: string;
  display_currency?: string;
  amount?: number;
  total_amount?: number;
  
  // Package and Promotion fields
  selected_package_id?: string | null;
  selected_package_name?: string | null;
  selected_package_description?: string | null;
  package_discount?: number;
  selected_promotion_id?: string | null;
  selected_promotion_name?: string | null;
  selected_promotion_description?: string | null;
  selected_promotion_code?: string | null;
  promotion_discount?: number;
  time_based_adjustment?: number;
  
  // Team tracking fields
  team_location?: 'japan' | 'thailand';
  
  // Internal computed totals (not stored in DB)
  __computedTotals?: {
    baseAmount: number;
    totalAmount: number;
  };
}

export interface UpdateQuotationInput {
  title?: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  billing_company_name?: string;
  billing_tax_number?: string;
  billing_street_name?: string;
  billing_street_number?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  service_type_id?: string;
  vehicle_category?: string;
  vehicle_type?: string;
  pickup_location?: string;
  dropoff_location?: string;
  pickup_date?: string;
  pickup_time?: string;
  duration_hours?: number;
  service_days?: number;
  hours_per_day?: number | null;
  passenger_count?: number | null;
  merchant_notes?: string;
  customer_notes?: string;
  discount_percentage?: number;
  tax_percentage?: number;
  status?: QuotationStatus;
  currency?: string;
  display_currency?: string;
  amount?: number;
  total_amount?: number;
  expiry_date?: string;
  
  // Package and Promotion fields
  selected_package_id?: string | null;
  selected_package_name?: string | null;
  selected_package_description?: string | null;
  package_discount?: number;
  selected_promotion_id?: string | null;
  selected_promotion_name?: string | null;
  selected_promotion_description?: string | null;
  selected_promotion_code?: string | null;
  promotion_discount?: number;
  time_based_adjustment?: number;
  
  // Team tracking fields
  team_location?: 'japan' | 'thailand';
}

export interface QuotationResponse {
  id: string;
  status: QuotationStatus;
  customer_name?: string;
  customer_email: string;
  service_type_id: string;
  vehicle_type: string;
  amount: number;
  total_amount: number;
  created_at: string;
  quote_number: number;
  expiry_date: string;
}

export interface QuotationApprovalInput {
  quotation_id: string;
  notes?: string;
  signature?: string;
  bcc_emails?: string;
}

export interface QuotationRejectionInput {
  quotation_id: string;
  rejected_reason: string;
  signature?: string;
  bcc_emails?: string;
}

// New interfaces for pricing promotions and packages
export type DiscountType = 'percentage' | 'fixed_amount';

export interface PricingPromotion {
  id: string;
  name: string;
  description?: string | null;
  code: string;
  start_date?: string | null;
  end_date?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  minimum_amount?: number | null;
  maximum_discount?: number | null;
  is_active: boolean;
  usage_limit?: number | null;
  times_used: number;
  max_uses?: number | null;
  min_order_value?: number | null;
  is_featured: boolean;
  applicable_service_type_ids: string[] | null;
  applicable_vehicle_types: string[];
  applicable_vehicle_categories?: string[];
  created_at: string;
  updated_at: string;
}

export type PackageType = 'bundle' | 'tour' | 'special_event' | 'seasonal';

export interface PricingPackage {
  id: string;
  name: string;
  description?: string | null;
  thumbnail_url?: string | null;
  banner_url?: string | null;
  package_type: PackageType;
  base_price: number;
  currency: string;
  service_days?: number;
  hours_per_day?: number | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  valid_from?: string | null;
  valid_to?: string | null;
  exclude_from_promotions?: boolean;
  items?: PricingPackageItem[];
}

export type PackageItemType = 'service' | 'accommodation' | 'meal' | 'attraction' | 'extra';

export interface PricingPackageItem {
  id: string;
  package_id: string;
  item_type: PackageItemType;
  name: string;
  description?: string | null;
  quantity: number;
  price: number;
  price_override?: number | null;
  is_included_in_base: boolean;
  is_optional: boolean;
  sort_order: number;
  pricing_item_id?: string | null;
  service_type_id?: string | null;
  vehicle_type?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceItemInput {
  description: string;
  service_type_id: string;
  service_type_name?: string;
  vehicle_category?: string;
  vehicle_type: string;
  duration_hours?: number;
  service_days?: number;
  hours_per_day?: number | null;
  unit_price: number;
  total_price: number;
  quantity: number;
  sort_order?: number;
  is_service_item: boolean;
  pickup_date?: string | null;
  pickup_time?: string | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
  flight_number?: string | null;
  terminal?: string | null;
  number_of_passengers?: number | null;
  number_of_bags?: number | null;
  time_based_adjustment?: number;
  time_based_rule_name?: string;
} 