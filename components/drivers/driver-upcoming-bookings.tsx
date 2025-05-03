'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, User, Car, CalendarOff } from 'lucide-react'
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
          upcoming: true
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
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
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
              <div key={booking.supabase_id || booking.id} className="border rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                  <div className="font-semibold text-sm sm:text-base">
                    {t('drivers.upcomingBookings.booking', { defaultValue: 'Booking' })} #{booking.id}
                  </div>
                  {renderBookingStatus(booking.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('bookings.details.fields.pickupDate')} & {t('bookings.details.fields.pickupTime')}</p>
                      <p className="text-foreground text-xs sm:text-sm">
                        {booking.date && booking.time && 
                          format(new Date(`${booking.date}T${booking.time}`), 'PP • p')}
                        {booking.duration && <span className="text-muted-foreground text-xs ml-1">({booking.duration} {t('common.minutes')})</span>}
                      </p>
                    </div>
                    {booking.customer_name && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t('bookings.details.sections.client')}</p>
                        <p className="text-foreground text-xs sm:text-sm flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" /> 
                          <span className="truncate">{booking.customer_name}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                     {booking.vehicle && (
                       <div>
                        <p className="text-xs text-muted-foreground">{t('bookings.details.sections.vehicle')}</p>
                        <p className="text-foreground text-xs sm:text-sm flex items-center gap-1">
                           <Car className="h-3 w-3 text-muted-foreground flex-shrink-0" /> 
                           <span className="truncate">{booking.vehicle.make} {booking.vehicle.model}</span>
                         </p>
                       </div>
                    )}
                    {booking.service_name && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t('bookings.details.fields.serviceType')}</p>
                        <p className="text-foreground text-xs sm:text-sm truncate">{booking.service_type || booking.service_name}</p>
                      </div>
                    )}
                  </div>
                </div>
                 
                {(booking.pickup_location || booking.dropoff_location) && (
                  <div className="text-sm border-t pt-3 mt-3">
                     <div className="flex items-start gap-2">
                       <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                       <div className="space-y-1.5 flex-1 min-w-0">
                         {booking.pickup_location && (
                           <div className="flex items-center gap-1">
                             <span className="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground whitespace-nowrap">
                               {t('bookings.labels.from')}
                             </span>
                             <span className="text-xs truncate">{booking.pickup_location}</span>
                           </div>
                         )}
                         {booking.dropoff_location && (
                           <div className="flex items-center gap-1">
                             <span className="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground whitespace-nowrap">
                               {t('bookings.labels.to')}
                             </span>
                             <span className="text-xs truncate">{booking.dropoff_location}</span>
                           </div>
                         )}
                       </div>
                     </div>
                  </div>
                 )}

                <div className="flex justify-end mt-3">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/bookings/${booking.supabase_id || booking.id}`} >
                      {t('common.viewDetails')}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-muted/30 rounded-lg min-h-[150px]">
             <CalendarOff className="h-10 w-10 text-muted-foreground mb-3" />
             <h3 className="text-lg font-medium mb-1">{t('drivers.upcomingBookings.empty.title', { defaultValue: 'No Upcoming Bookings' })}</h3>
             <p className="text-muted-foreground text-sm mb-4">
               {t('drivers.upcomingBookings.empty.description', { defaultValue: 'This driver has no upcoming bookings scheduled.' })}
             </p>
             <Button variant="outline" size="sm" asChild>
                <Link href="/bookings" >
                   {t('navigation.bookings')}
                 </Link>
             </Button>
           </div>
        )}
      </CardContent>
    </Card>
  );
} 