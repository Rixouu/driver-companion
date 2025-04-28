'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, User, Car } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { getDriverBookings } from '@/app/actions/bookings'
import { Booking } from '@/types/bookings'

interface DriverUpcomingBookingsProps {
  driverId: string
  limit?: number
}

export function DriverUpcomingBookings({ driverId, limit = 5 }: DriverUpcomingBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useI18n()

  useEffect(() => {
    async function loadUpcomingBookings() {
      try {
        setIsLoading(true)
        const { bookings: upcomingBookings, error: bookingsError } = await getDriverBookings(driverId, {
          limit,
          upcoming: true,
          status: 'confirmed' // Only show confirmed bookings
        })
        
        if (bookingsError) {
          setError(bookingsError)
        } else {
          setBookings(upcomingBookings || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings')
      } finally {
        setIsLoading(false)
      }
    }

    if (driverId) {
      loadUpcomingBookings()
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('drivers.upcomingBookings.title', { defaultValue: 'Upcoming Bookings' })}
        </CardTitle>
        <CardDescription>
          {t('drivers.upcomingBookings.description', { defaultValue: 'Scheduled bookings for this driver' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-semibold">
                    {t('drivers.upcomingBookings.booking', { defaultValue: 'Booking' })} #{booking.id}
                  </div>
                  {renderBookingStatus(booking.status)}
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div>
                        {booking.date && booking.time && 
                          format(new Date(`${booking.date}T${booking.time}`), 'PPP • p')}
                      </div>
                      {booking.duration && (
                        <div className="text-sm text-muted-foreground">
                          {booking.duration} {t('common.minutes')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {booking.service_name && (
                    <div className="flex items-start gap-2">
                      <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {booking.service_name}
                        {booking.service_type && (
                          <div className="text-sm text-muted-foreground">
                            {booking.service_type}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {booking.customer_name && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {booking.customer_name}
                        {booking.customer_email && (
                          <div className="text-sm text-muted-foreground">
                            {booking.customer_email}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {(booking.pickup_location || booking.dropoff_location) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {booking.pickup_location && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                              {t('bookings.labels.from')}
                            </span>
                            <span className="text-sm">{booking.pickup_location}</span>
                          </div>
                        )}
                        
                        {booking.dropoff_location && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                              {t('bookings.labels.to')}
                            </span>
                            <span className="text-sm">{booking.dropoff_location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/bookings/${booking.id}`} legacyBehavior>
                      {t('common.viewDetails')}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {t('drivers.upcomingBookings.empty', { defaultValue: 'No upcoming bookings' })}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 