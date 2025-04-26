"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Booking } from '@/types/bookings'
import { getBookingById } from '@/app/actions/bookings'

interface BookingContextType {
  booking: Booking | null
  isLoading: boolean
  error: string | null
  refreshBooking: (id: string) => Promise<void>
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export function useBooking() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
}

interface BookingProviderProps {
  children: ReactNode
  bookingId?: string
  initialBooking?: Booking | null
}

export function BookingProvider({ 
  children, 
  bookingId,
  initialBooking = null
}: BookingProviderProps) {
  const [booking, setBooking] = useState<Booking | null>(initialBooking)
  const [isLoading, setIsLoading] = useState<boolean>(!initialBooking && !!bookingId)
  const [error, setError] = useState<string | null>(null)

  const refreshBooking = async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await getBookingById(id)
      
      if (result.booking) {
        setBooking(result.booking)
      } else {
        setError('Booking not found')
        setBooking(null)
      }
    } catch (err) {
      console.error('Error fetching booking:', err)
      setError('Failed to load booking details')
      setBooking(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (bookingId && !initialBooking) {
      refreshBooking(bookingId)
    }
  }, [bookingId, initialBooking])

  const value = {
    booking,
    isLoading,
    error,
    refreshBooking
  }

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  )
} 