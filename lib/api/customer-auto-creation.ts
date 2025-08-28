/**
 * Customer Auto-Creation Service
 * 
 * This service provides utility functions for automatic customer creation
 * when quotations and bookings are created. The main logic is handled by
 * database triggers, but these functions provide additional API-level
 * customer management capabilities.
 */

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { Customer, CustomerSegment } from '@/types/customers'

/**
 * Manually create or find customer (for API usage)
 * This function calls the database function that handles deduplication
 */
export async function ensureCustomerExists(customerData: {
  email: string
  name?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  segment_id?: string | null
  // Billing address fields
  billing_company_name?: string | null
  billing_street_number?: string | null
  billing_street_name?: string | null
  billing_city?: string | null
  billing_state?: string | null
  billing_postal_code?: string | null
  billing_country?: string | null
  billing_tax_number?: string | null
}): Promise<{ customer_id: string; created: boolean }> {
  const supabase = await getSupabaseServerClient()
  
  try {
    // First check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customerData.email.toLowerCase().trim())
      .single()
    
    if (existingCustomer) {
      return { customer_id: existingCustomer.id, created: false }
    }
    
    // Call database function to create customer with deduplication
    const { data, error } = await supabase.rpc('create_customer_from_api', {
      p_email: customerData.email,
      p_name: customerData.name,
      p_phone: customerData.phone,
      p_address: customerData.address,
      p_notes: customerData.notes,
      p_segment_id: customerData.segment_id
    })
    
    if (error) {
      console.error('Error creating customer via API:', error)
      throw new Error(`Failed to create customer: ${error.message}`)
    }
    
    return { customer_id: data, created: true }
  } catch (error) {
    console.error('Error in ensureCustomerExists:', error)
    throw error
  }
}

/**
 * Get customer by email (for linking purposes)
 */
export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const supabase = await getSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single()
    
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching customer by email:', error)
    throw error
  }
  
  return data
}

/**
 * Update quotation with customer ID after customer creation
 * (This is handled by triggers, but provided for manual operations)
 */
export async function linkQuotationToCustomer(quotationId: string, customerId: string) {
  const supabase = await getSupabaseServerClient()
  
  const { error } = await supabase
    .from('quotations')
    .update({ customer_id: customerId })
    .eq('id', quotationId)
    
  if (error) {
    console.error('Error linking quotation to customer:', error)
    throw error
  }
}

/**
 * Update booking with customer ID after customer creation
 * (This is handled by triggers, but provided for manual operations)
 */
export async function linkBookingToCustomer(bookingId: string, customerId: string) {
  const supabase = await getSupabaseServerClient()
  
  const { error } = await supabase
    .from('bookings')
    .update({ customer_id: customerId })
    .eq('id', bookingId)
    
  if (error) {
    console.error('Error linking booking to customer:', error)
    throw error
  }
}

/**
 * Assign customer to a segment
 */
export async function assignCustomerSegment(customerId: string, segmentId: string | null) {
  const supabase = await getSupabaseServerClient()
  
  const { error } = await supabase
    .from('customers')
    .update({ segment_id: segmentId })
    .eq('id', customerId)
    
  if (error) {
    console.error('Error assigning customer segment:', error)
    throw error
  }
}

/**
 * Create or update customer from quotation data including billing information
 * This function should be called when creating quotations to ensure customer
 * billing details are properly saved
 */
export async function ensureCustomerFromQuotation(quotationData: {
  customer_email: string
  customer_name?: string | null
  customer_phone?: string | null
  customer_address?: string | null
  billing_company_name?: string | null
  billing_street_number?: string | null
  billing_street_name?: string | null
  billing_city?: string | null
  billing_state?: string | null
  billing_postal_code?: string | null
  billing_country?: string | null
  billing_tax_number?: string | null
}): Promise<{ customer_id: string; created: boolean; updated: boolean }> {
  const supabase = await getSupabaseServerClient()
  
  try {
    // First check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', quotationData.customer_email.toLowerCase().trim())
      .single()
    
    if (existingCustomer) {
      // Update existing customer with any new billing information
      const updateData: any = {}
      let hasUpdates = false
      
      // Check if we have new billing info to update
      if (quotationData.billing_company_name && !existingCustomer.billing_company_name) {
        updateData.billing_company_name = quotationData.billing_company_name
        hasUpdates = true
      }
      if (quotationData.billing_street_name && !existingCustomer.billing_street_name) {
        updateData.billing_street_name = quotationData.billing_street_name
        hasUpdates = true
      }
      if (quotationData.billing_city && !existingCustomer.billing_city) {
        updateData.billing_city = quotationData.billing_city
        hasUpdates = true
      }
      if (quotationData.billing_state && !existingCustomer.billing_state) {
        updateData.billing_state = quotationData.billing_state
        hasUpdates = true
      }
      if (quotationData.billing_postal_code && !existingCustomer.billing_postal_code) {
        updateData.billing_postal_code = quotationData.billing_postal_code
        hasUpdates = true
      }
      if (quotationData.billing_country && !existingCustomer.billing_country) {
        updateData.billing_country = quotationData.billing_country
        hasUpdates = true
      }
      if (quotationData.billing_tax_number && !existingCustomer.billing_tax_number) {
        updateData.billing_tax_number = quotationData.billing_tax_number
        hasUpdates = true
      }
      
      if (hasUpdates) {
        updateData.updated_at = new Date().toISOString()
        const { error: updateError } = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', existingCustomer.id)
        
        if (updateError) {
          console.error('Error updating customer billing info:', updateError)
        }
      }
      
      return { customer_id: existingCustomer.id, created: false, updated: hasUpdates }
    }
    
    // Create new customer with all available information
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert([{
        email: quotationData.customer_email.toLowerCase().trim(),
        name: quotationData.customer_name,
        phone: quotationData.customer_phone,
        address: quotationData.customer_address,
        billing_company_name: quotationData.billing_company_name,
        billing_street_number: quotationData.billing_street_number,
        billing_street_name: quotationData.billing_street_name,
        billing_city: quotationData.billing_city,
        billing_state: quotationData.billing_state,
        billing_postal_code: quotationData.billing_postal_code,
        billing_country: quotationData.billing_country,
        billing_tax_number: quotationData.billing_tax_number,
      }])
      .select('id')
      .single()
    
    if (createError) {
      console.error('Error creating customer from quotation:', createError)
      throw new Error(`Failed to create customer: ${createError.message}`)
    }
    
    return { customer_id: newCustomer.id, created: true, updated: false }
  } catch (error) {
    console.error('Error in ensureCustomerFromQuotation:', error)
    throw error
  }
}

/**
 * Get customers that need segment assignment (for bulk operations)
 */
export async function getCustomersWithoutSegments(limit: number = 50) {
  const supabase = await getSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .is('segment_id', null)
    .limit(limit)
    
  if (error) {
    console.error('Error fetching customers without segments:', error)
    throw error
  }
  
  return data
}

/**
 * Bulk assign segment to customers based on criteria
 */
export async function bulkAssignSegments(
  segmentId: string,
  criteria: {
    email_domains?: string[]  // e.g., ['company.com'] for corporate
    min_spending?: number     // minimum spending for VIP
    transaction_count?: number // minimum transaction count
  }
) {
  const supabase = await getSupabaseServerClient()
  
  let query = supabase
    .from('customer_analytics')
    .select('id')
  
  // Apply criteria filters
  if (criteria.email_domains?.length) {
    const emailConditions = criteria.email_domains
      .map(domain => `email.like.%@${domain}`)
      .join(',')
    query = query.or(emailConditions)
  }
  
  if (criteria.min_spending) {
    query = query.gte('total_spent', criteria.min_spending)
  }
  
  if (criteria.transaction_count) {
    query = query.gte('quotation_count', criteria.transaction_count)
  }
  
  const { data: customers, error: selectError } = await query
  
  if (selectError) {
    console.error('Error finding customers for bulk segment assignment:', selectError)
    throw selectError
  }
  
  if (!customers?.length) {
    return { updated: 0 }
  }
  
  // Update segments
  const customerIds = customers.map(c => c.id)
  const { error: updateError } = await supabase
    .from('customers')
    .update({ segment_id: segmentId })
    .in('id', customerIds)
    
  if (updateError) {
    console.error('Error bulk updating customer segments:', updateError)
    throw updateError
  }
  
  return { updated: customers.length }
}
