'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, User, Car, CalendarOff, XCircle, Trash2, Eye } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { getDriverBookings } from '@/app/actions/bookings'
import { Booking } from '@/types/bookings'
import { useToast } from '@/components/ui/use-toast'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface DriverUpcomingBookingsProps {
  driverId: string
  limit?: number
}

export function DriverUpcomingBookings({ driverId, limit = 5 }: DriverUpcomingBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unassigningBooking, setUnassigningBooking] = useState<string | null>(null)
  const { t } = useI18n()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

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
      
      // No automatic refresh to avoid annoying users
      
      // Clean up function (empty, but kept for consistency)
      return () => {}
    }
  }, [driverId, limit])

  const handleUnassignBooking = async (bookingId: string) => {
    if (!bookingId) return
    
    try {
      setUnassigningBooking(bookingId)
      
      console.log(`[Booking Unassign] Starting unassignment for booking ${bookingId}`)
      
      // First, get the booking details to check for vehicle assignment
      const { data: bookingData, error: bookingFetchError } = await supabase
        .from('bookings')
        .select('driver_id, vehicle_id')
        .eq('id', bookingId)
        .single()
      
      if (bookingFetchError) {
        console.error('[Booking Unassign] Error fetching booking details:', bookingFetchError)
      } else {
        console.log(`[Booking Unassign] Found booking details:`, bookingData)
        
        // If the booking has a vehicle assignment, we need to clean that up
        if (bookingData?.vehicle_id && bookingData?.driver_id) {
          console.log(`[Booking Unassign] Booking has vehicle ${bookingData.vehicle_id} assigned to driver ${bookingData.driver_id}`)
          
          // Find and end any active vehicle assignments
          const { data: vehicleAssignments, error: assignmentsError } = await supabase
            .from('vehicle_assignments')
            .select('id')
            .eq('vehicle_id', bookingData.vehicle_id)
            .eq('driver_id', bookingData.driver_id)
            .eq('status', 'active')
          
          if (assignmentsError) {
            console.error('[Booking Unassign] Error finding vehicle assignments:', assignmentsError)
          } else if (vehicleAssignments?.length) {
            console.log(`[Booking Unassign] Found ${vehicleAssignments.length} active vehicle assignments to end`)
            
            for (const assignment of vehicleAssignments) {
              const { error: updateError } = await supabase
                .from('vehicle_assignments')
                .update({
                  status: 'inactive',
                  end_date: new Date().toISOString(),
                  notes: `Ended due to booking ${bookingId} unassignment`
                })
                .eq('id', assignment.id)
                
              if (updateError) {
                console.error(`[Booking Unassign] Error ending vehicle assignment ${assignment.id}:`, updateError)
              } else {
                console.log(`[Booking Unassign] Successfully ended vehicle assignment ${assignment.id}`)
              }
            }
          } else {
            console.log('[Booking Unassign] No active vehicle assignments found')
          }
        }
      }
      
      // Check if there are any driver availability records for this booking
      const { data: availabilityRecords, error: availabilityError } = await supabase
        .from('driver_availability')
        .select('id')
        .like('notes', `%Assigned to booking ${bookingId}%`)
      
      if (availabilityError) {
        console.error('[Booking Unassign] Error finding availability records:', availabilityError)
      } else if (availabilityRecords?.length) {
        // Delete associated driver availability records
        console.log(`[Booking Unassign] Deleting ${availabilityRecords.length} availability records for booking ${bookingId}`)
        
        for (const record of availabilityRecords) {
          const { error: deleteError } = await supabase
            .from('driver_availability')
            .delete()
            .eq('id', record.id)
            
          if (deleteError) {
            console.error(`[Booking Unassign] Error deleting availability record ${record.id}:`, deleteError)
          } else {
            console.log(`[Booking Unassign] Successfully deleted availability record ${record.id}`)
          }
        }
      } else {
        console.log('[Booking Unassign] No driver availability records found')
      }
      
      // Check for any dispatch entries for this booking
      const { data: dispatchEntries, error: dispatchError } = await supabase
        .from('dispatch_entries')
        .select('id, vehicle_id, driver_id')
        .eq('booking_id', bookingId)
      
      if (dispatchError) {
        console.error('[Booking Unassign] Error finding dispatch entries:', dispatchError)
      } else if (dispatchEntries?.length) {
        console.log(`[Booking Unassign] Found ${dispatchEntries.length} dispatch entries to update`)
        
        for (const entry of dispatchEntries) {
          const { error: updateError } = await supabase
            .from('dispatch_entries')
            .update({
              driver_id: null,
              vehicle_id: null,
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', entry.id)
            
          if (updateError) {
            console.error(`[Booking Unassign] Error updating dispatch entry ${entry.id}:`, updateError)
          } else {
            console.log(`[Booking Unassign] Successfully updated dispatch entry ${entry.id}`)
          }
        }
      } else {
        console.log('[Booking Unassign] No dispatch entries found')
      }
      
      // Update the booking to remove driver assignment
      const { error } = await supabase
        .from('bookings')
        .update({
          driver_id: null,
          vehicle_id: null, // Also clear the vehicle_id
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
      
      if (error) {
        console.error('[Booking Unassign] Error updating booking:', error)
        throw error
      }
      
      console.log('[Booking Unassign] Successfully updated booking')
      
      // Refresh bookings
      const { bookings: updatedBookings } = await getDriverBookings(driverId, {
        limit,
        upcoming: true
      })
      
      setBookings(updatedBookings || [])
      
      // Trigger refresh of availability list
      document.dispatchEvent(new Event('refresh-driver-availability'))
      document.dispatchEvent(new Event('booking-unassigned'))
      
      toast({
        title: t('drivers.upcomingBookings.unassignSuccess', { defaultValue: 'Booking unassigned' }),
        description: t('drivers.upcomingBookings.unassignSuccessDescription', { defaultValue: 'The booking has been removed from this driver.' })
      })
    } catch (err) {
      console.error('[Booking Unassign] Error unassigning booking:', err)
      toast({
        title: t('common.error'),
        description: t('drivers.upcomingBookings.unassignError', { defaultValue: 'Failed to unassign booking' }),
        variant: 'destructive'
      })
    } finally {
      setUnassigningBooking(null)
    }
  }

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

                <div className="flex justify-end mt-3 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-1 text-destructive hover:text-destructive/90 border-destructive/50 hover:border-destructive/80 dark:text-red-500 dark:border-red-500/50 dark:hover:border-red-500/80 dark:hover:bg-red-900/20"
                    onClick={() => handleUnassignBooking(booking.supabase_id || booking.id || '')}
                    disabled={unassigningBooking === (booking.supabase_id || booking.id)}
                  >
                    {unassigningBooking === (booking.supabase_id || booking.id) ? (
                      <>
                        <span className="animate-spin mr-1">
                          <Clock className="h-3 w-3" />
                        </span>
                        {t('common.deleting', { defaultValue: 'Unassigning...' })}
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3 w-3 mr-1" />
                        {t('drivers.upcomingBookings.unassign', { defaultValue: 'Unassign' })}
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/bookings/${booking.supabase_id || booking.id}`} className="flex items-center gap-1">
                      <Eye className="h-3 w-3"/> {t('common.view')}
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