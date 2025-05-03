'use client'

import { Booking } from '@/types/bookings'

/**
 * Client-side function to get a booking by ID
 */
export async function getBookingById(id: string): Promise<{ 
  booking: Booking | null,
  error?: string 
}> {
  try {
    const response = await fetch(`/api/bookings/${id}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return { 
        booking: null,
        error: errorData?.message || `Failed to fetch booking: ${response.status}` 
      }
    }
    
    const data = await response.json()
    
    // Add debugging to see what's in the API response
    console.log('API response for booking:', id)
    console.log('Billing fields:', {
      billing_company_name: data.billing_company_name,
      billing_tax_number: data.billing_tax_number,
      billing_street_name: data.billing_street_name,
      billing_street_number: data.billing_street_number,
      billing_city: data.billing_city,
      billing_state: data.billing_state,
      billing_postal_code: data.billing_postal_code,
      billing_country: data.billing_country
    })
    console.log('Coupon fields:', {
      coupon_code: data.coupon_code,
      coupon_discount_percentage: data.coupon_discount_percentage
    })
    
    return { booking: data }
  } catch (error) {
    console.error('Error fetching booking:', error)
    return { 
      booking: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 