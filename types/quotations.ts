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
  discount_percentage?: number;
  tax_percentage?: number;
  total_amount: number;
  converted_to_booking_id?: string;
  reference_code?: string;
  created_at: string;
  updated_at: string;
  rejected_reason?: string;
  quote_number: number;
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
  user_id?: string;
  action: string;
  details?: any;
  created_at: string;
}

export interface QuotationWithItems extends Quotation {
  items: QuotationItem[];
}

export interface QuotationWithRelations extends Quotation {
  items: QuotationItem[];
  activities?: QuotationActivity[];
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