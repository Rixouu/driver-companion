'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, User, Car, CalendarOff, XCircle, Eye, CalendarX, Info } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { getDriverBookings } from '@/app/actions/bookings'
import { Booking } from '@/types/bookings'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'; // Ensure Database type is imported
import { EmptyState } from "@/components/empty-state"
import { getStatusBadgeClasses, cn } from '@/lib/utils/styles'


interface DriverUpcomingBookingsProps {
  driverId: string
  limit?: number
}

export function DriverUpcomingBookings({ driverId, limit = 5 }: DriverUpcomingBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  const { t } = useI18n()
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadUpcomingBookings() {
      try {
        setIsLoading(true)
        const { bookings: allBookings, error: bookingsError } = await getDriverBookings(driverId, {
          limit,
          upcoming: undefined
        })
        
        if (bookingsError) {
          setError(bookingsError as string)
        } else {
            const upcoming = (allBookings || []).filter(
            (b: Booking) => b.status !== 'completed' && b.status !== 'cancelled'
          ).sort((a: Booking, b: Booking) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          setBookings(upcoming)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings')
      } finally {
        setIsLoading(false)
      }
    }

    if (driverId) {
      loadUpcomingBookings()
      
      const handleDataRefresh = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail.driverId === driverId) {
          loadUpcomingBookings();
        }
      };
      document.addEventListener("refresh-driver-data", handleDataRefresh);
      
      return () => {
        document.removeEventListener("refresh-driver-data", handleDataRefresh);
      }
    }
  }, [driverId, limit])



  const renderBookingStatus = (status: string) => {
    const statusMap: Record<string, { label: string, variant: "default" | "outline" | "secondary" | "destructive" | "success" }> = {
      confirmed: { label: t('bookings.status.confirmed'), variant: 'success' },
      pending: { label: t('bookings.status.pending'), variant: 'secondary' },
      cancelled: { label: t('bookings.status.cancelled'), variant: 'destructive' },
      completed: { label: t('bookings.status.completed'), variant: 'default' }
    }
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' }
    
    return (
      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('drivers.upcomingBookings.title', { defaultValue: 'Upcoming Bookings' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <EmptyState
          icon={<CalendarX className="h-10 w-10 text-muted-foreground" />}
          title={t('drivers.upcomingBookings.empty.title')}
          description={t('drivers.upcomingBookings.empty.description')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map(booking => (
        <BookingCard 
          key={booking.id} 
          booking={booking} 
        />
      ))}
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const { t } = useI18n()
  const pickupDateTime = `${booking.date}T${booking.time}`
  
  return (
    <div className="border rounded-lg p-4 relative hover:bg-muted/30 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t("bookings.details.bookingNumber", {id: booking.id})}</p>
          <div className="flex items-center gap-2 mt-1 mb-3">
            <p className="font-semibold text-base sm:text-lg">
              {format(new Date(pickupDateTime), "PP")} • {format(new Date(pickupDateTime), "p")} 
              {booking.duration && (
                <span className="text-sm font-normal text-muted-foreground ml-2">({booking.duration} {t("common.minutes")})</span>
              )}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn(getStatusBadgeClasses(booking.status), "capitalize")}>
          {booking.status}
        </Badge>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4 mt-2">
        {/* Left side: Client and Route */}
        <div className="space-y-3">
          {booking.customer_name && (
            <div>
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Client Details</p>
              <p className="text-sm">{booking.customer_name}</p>
            </div>
          )}
          {booking.pickup_location && (
            <div>
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> From</p>
              <p className="text-sm">{booking.pickup_location}</p>
            </div>
          )}
          {booking.dropoff_location && (
            <div>
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> To</p>
              <p className="text-sm">{booking.dropoff_location}</p>
            </div>
          )}
        </div>
        
        {/* Right side: Vehicle Info and Actions */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Car className="h-3 w-3" /> Vehicle Information</p>
            <p className="text-sm">
              {[booking.vehicle_make, booking.vehicle_model].filter(Boolean).join(' ') || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" /> Service Type</p>
            <p className="text-sm">{booking.service_name || 'Not specified'}</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end items-center gap-2 mt-4 pt-4 border-t">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/bookings/${booking.id}`} className="flex items-center gap-1">
            <Eye className="h-3 w-3"/> {t('common.view')}
          </Link>
        </Button>
      </div>
    </div>
  )
} 