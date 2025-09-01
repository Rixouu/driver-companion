import type { Vehicle } from '@/types/vehicles';
import type { Customer } from '@/types/customers';

export interface Booking {
  id: string
  supabase_id: string
  booking_id?: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | string
  service_name: string
  service_type?: string
  service_id?: string
  customer_id?: string
  driver_id?: string
  vehicle_id?: string;
  created_by?: string; // UUID of the admin user who created this booking
  
  // Direct customer fields for consistency with DB and forms
  customer_name?: string; 
  customer_email?: string;
  customer_phone?: string;
  
  // Billing address fields
  billing_company_name?: string
  billing_tax_number?: string
  billing_street_name?: string
  billing_street_number?: string
  billing_city?: string
  billing_state?: string
  billing_postal_code?: string
  billing_country?: string
  
  // Coupon fields
  coupon_code?: string
  coupon_discount_percentage?: string
  
  // WordPress specific fields
  title?: string  // For WordPress format: "Booking XXXX"
  meta?: Record<string, any> // Raw WordPress meta data
  wp_id?: string // WordPress ID
  
  // Additional fields from WordPress
  customer?: Customer
  // email?: string // Redundant if customer_email is used consistently
  // phone?: string // Redundant if customer_phone is used consistently
  
  // Vehicle details
  vehicle?: Vehicle
  vehicle_make?: string   // Direct vehicle make information
  vehicle_model?: string  // Direct vehicle model information
  
  // Service details
  service?: {
    name: string
    price?: string | number
  }
  
  // Pricing details
  price?: {
    amount: number
    currency: string
    formatted: string
  }
  
  // Route information
  pickup_location?: string
  dropoff_location?: string
  distance?: string | number
  duration?: string | number
  
  // Payment information
  payment_status?: string
  payment_method?: string
  payment_link?: string
  ipps_payment_link?: string
  
  // Additional metadata
  notes?: string
  created_at?: string
  updated_at?: string
  booking_status?: string
} 