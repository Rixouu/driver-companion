import { Database } from "./supabase";

export type QuotationStatus = 
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "expired"
  | "converted";

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
  service_type: string;
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
  expires_at: string;
  user_id: string;
  user_name?: string;
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
}

export interface PricingCategory {
  id: string;
  name: string;
  description?: string | null;
  service_types: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingItem {
  id: string;
  category_id: string | null;
  vehicle_type: string;
  service_type: string;
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
  billing_company_name?: string;
  billing_tax_number?: string;
  billing_street_name?: string;
  billing_street_number?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  service_type: string;
  vehicle_category?: string;
  vehicle_type: string;
  pickup_location?: string;
  dropoff_location?: string;
  pickup_date?: string;
  pickup_time?: string;
  duration_hours?: number;
  service_days?: number;
  hours_per_day?: number | null;
  passenger_count?: number | null;
  discount_percentage?: number;
  tax_percentage?: number;
  status?: QuotationStatus;
  merchant_notes?: string;
  customer_notes?: string;
  currency?: string;
  display_currency?: string;
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
  service_type?: string;
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
}

export interface QuotationResponse {
  id: string;
  status: QuotationStatus;
  customer_name?: string;
  customer_email: string;
  service_type: string;
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
}

export interface QuotationRejectionInput {
  quotation_id: string;
  rejected_reason: string;
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
  applicable_services: string[];
  applicable_vehicle_types: string[];
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
  is_optional?: boolean;
  sort_order: number;
  pricing_item_id?: string;
  service_type?: string;
  vehicle_type?: string;
  created_at: string;
  updated_at: string;
} 