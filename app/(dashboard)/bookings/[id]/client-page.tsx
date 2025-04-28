'use client'

import { useEffect, useState } from 'react'
import { Booking } from '@/types/bookings'
import { getBookingByIdFromDatabase } from '@/lib/api/bookings-service'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import BookingDetailsContent from './booking-details-content'

export default function BookingDetailsClientPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBooking() {
      try {
        setIsLoading(true)
        const data = await getBookingByIdFromDatabase(params.id)
        
        if (!data) {
          setError('Booking not found')
          return
        }
        
        setBooking(data)
      } catch (err) {
        console.error('Error fetching booking:', err)
        setError('Failed to load booking details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooking()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="space-y-10 p-6">
        <Skeleton className="h-12 w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-6 mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!booking) {
    return (
      <Alert variant="destructive" className="mx-6 mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>The requested booking could not be found.</AlertDescription>
      </Alert>
    )
  }

  return <BookingDetailsContent booking={booking} bookingId={params.id} />
} 