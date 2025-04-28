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
    return { booking: data }
  } catch (error) {
    console.error('Error fetching booking:', error)
    return { 
      booking: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
} 