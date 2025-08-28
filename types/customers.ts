import type { Database } from './supabase';

// Centralized Customer type based on Supabase customers table
export type Customer = Database['public']['Tables']['customers']['Row'] & {
  segment_id?: string | null;
  // Billing address fields
  billing_company_name?: string | null;
  billing_street_number?: string | null;
  billing_street_name?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  billing_tax_number?: string | null;
};

// Types for Insert/Update if forms handle customers directly:
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'] & {
  segment_id?: string | null;
  // Billing address fields
  billing_company_name?: string | null;
  billing_street_number?: string | null;
  billing_street_name?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  billing_tax_number?: string | null;
};
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'] & {
  segment_id?: string | null;
  // Billing address fields
  billing_company_name?: string | null;
  billing_street_number?: string | null;
  billing_street_name?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  billing_tax_number?: string | null;
};

// Customer Segment types
export interface CustomerSegment {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Enhanced customer with analytics and segment data
export interface CustomerWithAnalytics extends Customer {
  segment_name?: string | null;
  segment_description?: string | null;
  segment_color?: string | null;
  segment_icon?: string | null;
  total_quotation_amount: number;
  quotation_count: number;
  booking_count: number;
  last_activity_date: string;
  total_spent: number;
  // Billing address fields are inherited from Customer interface
}

// Customer spending breakdown
export interface CustomerSpending {
  customer_id: string;
  quotations: {
    total_amount: number;
    count: number;
    by_status: {
      draft: number;
      sent: number;
      approved: number;
      paid: number;
      converted: number;
      rejected: number;
      expired: number;
    };
  };
  bookings: {
    count: number;
    completed_count: number;
    pending_count: number;
    cancelled_count: number;
  };
  total_lifetime_value: number;
  average_order_value: number;
  last_transaction_date: string | null;
}

// Customer details with full relations
export interface CustomerDetails extends CustomerWithAnalytics {
  // Ensure all basic customer fields are available
  email: string;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
  id: string;
  recent_quotations?: Array<{
    id: string;
    quote_number: number;
    status: string;
    amount: number;
    currency: string;
    created_at: string;
    service_type?: string;
  }>;
  recent_bookings?: Array<{
    id: string;
    service_name: string;
    status: string;
    date: string;
    created_at: string;
  }>;
  spending: CustomerSpending;
}

// Types for customer list filtering and pagination
export interface CustomerListFilters {
  segment_id?: string;
  search?: string;
  sort_by?: 'name' | 'email' | 'total_spent' | 'last_activity_date' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CustomerListResponse {
  customers: CustomerWithAnalytics[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
} 