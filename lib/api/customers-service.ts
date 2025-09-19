import { getSupabaseServerClient } from '@/lib/supabase/server'
import { 
  CustomerWithAnalytics, 
  CustomerDetails, 
  CustomerSpending, 
  CustomerListFilters, 
  CustomerListResponse,
  CustomerSegment 
} from '@/types/customers'

export interface CustomerServiceParams {
  filters?: CustomerListFilters
}

/**
 * Get paginated list of customers with analytics data
 */
export async function getCustomers(params: CustomerServiceParams = {}): Promise<CustomerListResponse> {
  const supabase = await getSupabaseServerClient()
  const { filters = {} } = params
  
  const {
    segment_id,
    search,
    sort_by = 'created_at',
    sort_order = 'desc',
    page = 1,
    limit = 20
  } = filters

  let query = supabase
    .from('customer_analytics')
    .select('*', { count: 'exact' })

  // Apply filters
  if (segment_id) {
    query = query.eq('segment_id', segment_id)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' })

  // Apply pagination
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching customers:', error)
    throw new Error(`Failed to fetch customers: ${error.message}`)
  }

  const total_count = count || 0
  const total_pages = Math.ceil(total_count / limit)

  // Map the customer_analytics view columns to the expected frontend format
  const mappedCustomers = (data || []).map(customer => ({
    ...customer,
    total_spent: customer.total_revenue || 0,
    booking_count: customer.total_bookings || 0,
    quotation_count: customer.total_quotations || 0,
    total_quotation_amount: customer.total_quotation_value || 0,
    last_activity_date: customer.last_booking_date || customer.last_quotation_date || customer.created_at
  }))

  return {
    customers: mappedCustomers as CustomerWithAnalytics[],
    total_count,
    page,
    limit,
    total_pages
  }
}

/**
 * Get customer by ID with full details and analytics
 */
export async function getCustomerById(id: string): Promise<CustomerDetails | null> {
  const supabase = await getSupabaseServerClient()

  // Get customer with analytics data
  const { data: customer, error: customerError } = await supabase
    .from('customer_analytics')
    .select('*')
    .eq('id', id)
    .single()

  if (customerError || !customer) {
    console.error('Error fetching customer:', customerError)
    return null
  }

  // Get recent quotations
  const { data: recentQuotations } = await supabase
    .from('quotations')
    .select('id, quote_number, status, amount, currency, created_at, service_type')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get recent bookings
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('id, service_name, status, date, created_at')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate detailed spending
  const spending = await getCustomerSpending(id)

  // Map the customer_analytics view columns to the expected frontend format
  const mappedCustomer = {
    ...customer,
    total_spent: customer.total_revenue || 0,
    booking_count: customer.total_bookings || 0,
    quotation_count: customer.total_quotations || 0,
    total_quotation_amount: customer.total_quotation_value || 0,
    last_activity_date: customer.last_booking_date || customer.last_quotation_date || customer.created_at,
    recent_quotations: recentQuotations || [],
    recent_bookings: recentBookings || [],
    spending
  }

  return mappedCustomer as CustomerDetails
}

/**
 * Get detailed spending analysis for a customer
 */
export async function getCustomerSpending(customerId: string): Promise<CustomerSpending> {
  const supabase = await getSupabaseServerClient()

  // Get quotation spending breakdown
  const { data: quotations } = await supabase
    .from('quotations')
    .select('status, amount, payment_amount, created_at')
    .eq('customer_id', customerId)

  // Get booking counts by status
  const { data: bookings } = await supabase
    .from('bookings')
    .select('status, created_at')
    .eq('customer_id', customerId)

  // Process quotations data
  const quotationsByStatus = {
    draft: 0,
    sent: 0,
    approved: 0,
    paid: 0,
    converted: 0,
    rejected: 0,
    expired: 0
  }

  let totalQuotationAmount = 0
  let quotationCount = 0
  let lastTransactionDate: string | null = null

  if (quotations) {
    quotations.forEach(q => {
      const amount = q.payment_amount || q.amount
      if (q.status in quotationsByStatus) {
        quotationsByStatus[q.status as keyof typeof quotationsByStatus] += amount
      }
      
      if (['approved', 'paid', 'converted'].includes(q.status)) {
        totalQuotationAmount += amount
      }
      
      quotationCount++
      
      if (!lastTransactionDate || q.created_at > lastTransactionDate) {
        lastTransactionDate = q.created_at
      }
    })
  }

  // Process bookings data
  const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
  const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0
  const cancelledBookings = bookings?.filter(b => b.status === 'cancelled').length || 0

  // Update last transaction date with bookings if more recent
  if (bookings) {
    bookings.forEach(b => {
      if (!lastTransactionDate || b.created_at > lastTransactionDate) {
        lastTransactionDate = b.created_at
      }
    })
  }

  const totalLifetimeValue = totalQuotationAmount
  const averageOrderValue = quotationCount > 0 ? totalQuotationAmount / quotationCount : 0

  return {
    customer_id: customerId,
    quotations: {
      total_amount: totalQuotationAmount,
      count: quotationCount,
      by_status: quotationsByStatus
    },
    bookings: {
      count: bookings?.length || 0,
      completed_count: completedBookings,
      pending_count: pendingBookings,
      cancelled_count: cancelledBookings
    },
    total_lifetime_value: totalLifetimeValue,
    average_order_value: averageOrderValue,
    last_transaction_date: lastTransactionDate
  }
}

/**
 * Get all customer segments
 */
export async function getCustomerSegments(): Promise<CustomerSegment[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('customer_segments')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching customer segments:', error)
    throw new Error(`Failed to fetch customer segments: ${error.message}`)
  }

  return data || []
}

/**
 * Update customer segment
 */
export async function updateCustomerSegment(customerId: string, segmentId: string | null) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('customers')
    .update({ segment_id: segmentId })
    .eq('id', customerId)
    .select()
    .single()

  if (error) {
    console.error('Error updating customer segment:', error)
    throw new Error(`Failed to update customer segment: ${error.message}`)
  }

  return data
}

/**
 * Create new customer
 */
export async function createCustomer(customerData: {
  name?: string
  email: string
  phone?: string
  address?: string
  notes?: string
  segment_id?: string
  // Billing address fields
  billing_company_name?: string
  billing_street_number?: string
  billing_street_name?: string
  billing_city?: string
  billing_state?: string
  billing_postal_code?: string
  billing_country?: string
  billing_tax_number?: string
}) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single()

  if (error) {
    console.error('Error creating customer:', error)
    throw new Error(`Failed to create customer: ${error.message}`)
  }

  return data
}

/**
 * Update customer
 */
export async function updateCustomer(customerId: string, customerData: Partial<{
  name?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  segment_id?: string
  // Billing address fields
  billing_company_name?: string
  billing_street_number?: string
  billing_street_name?: string
  billing_city?: string
  billing_state?: string
  billing_postal_code?: string
  billing_country?: string
  billing_tax_number?: string
}>) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('customers')
    .update(customerData)
    .eq('id', customerId)
    .select()
    .single()

  if (error) {
    console.error('Error updating customer:', error)
    throw new Error(`Failed to update customer: ${error.message}`)
  }

  return data
}

/**
 * Delete customer
 */
export async function deleteCustomer(customerId: string) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)

  if (error) {
    console.error('Error deleting customer:', error)
    throw new Error(`Failed to delete customer: ${error.message}`)
  }

  return { success: true }
}
