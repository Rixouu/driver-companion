"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertCircle, CalendarIcon, Edit, Loader2, Trash2, UserIcon, CarIcon, Zap, CheckIcon, CalendarPlus } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/styles'
import { cancelBookingAction } from '@/app/actions/bookings'
import { useToast } from '@/components/ui/use-toast'

interface BookingActionsProps {
  bookingId: string;
  status: string;
  date: string;
  time: string;
  booking: any;
}

export default function BookingActions({ booking, bookingId, status }: BookingActionsProps) {
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<string>("")
  const [selectedVehicle, setSelectedVehicle] = useState<string>("")
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false)

  // Load available drivers and vehicles
  const loadAvailableResources = async () => {
    setIsLoadingDrivers(true)
    try {
      const supabase = createClient()
      
      // Load drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .is('deleted_at', null);

      if (driversError) throw driversError;

      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active');

      if (vehiclesError) throw vehiclesError;

      setDrivers(driversData || [])
      setVehicles(vehiclesData || [])
    } catch (error) {
      console.error('Error loading resources:', error)
      toast({
        title: "Error",
        description: "Failed to load available drivers and vehicles",
        variant: "destructive",
      })
    } finally {
      setIsLoadingDrivers(false)
    }
  }

  // Smart vehicle matching logic based on service name
  const getVehicleMatches = () => {
    if (!booking?.service_name) return vehicles.map(v => ({ vehicle: v, matchPercentage: 50 }));
    
    const serviceName = booking.service_name.toLowerCase();
    
    return vehicles.map(vehicle => {
      let matchPercentage = 30; // base score
      
      // Perfect matches based on real data
      if (serviceName.includes('alphard executive lounge') && vehicle.model?.toLowerCase().includes('alphard executive lounge')) {
        matchPercentage = 100;
      } else if (serviceName.includes('alphard z') && vehicle.model?.toLowerCase().includes('alphard z')) {
        matchPercentage = 100;
      } else if (serviceName.includes('v class') && vehicle.model?.toLowerCase().includes('v class')) {
        matchPercentage = 95;
      } else if (serviceName.includes('alphard') && vehicle.model?.toLowerCase().includes('alphard')) {
        matchPercentage = 90;
      } else if (serviceName.includes('mercedes') && vehicle.brand?.toLowerCase().includes('mercedes')) {
        matchPercentage = 85;
      } else if (serviceName.includes('toyota') && vehicle.brand?.toLowerCase().includes('toyota')) {
        matchPercentage = 85;
      }
      
      // Luxury service matching
      if (serviceName.includes('luxury') || serviceName.includes('premium') || serviceName.includes('executive')) {
        if (vehicle.model?.toLowerCase().includes('executive') || 
            vehicle.model?.toLowerCase().includes('v class')) {
          matchPercentage = Math.max(matchPercentage, 90);
        }
      }
      
      return { vehicle, matchPercentage };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  };

  const handleAssign = async () => {
    if (!selectedDriver || !selectedVehicle) return;

    try {
      const supabase = createClient();
      
      // Update the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          driver_id: selectedDriver,
          vehicle_id: selectedVehicle,
          status: 'assigned'
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Create or update dispatch entry
      const { data: dispatchData, error: dispatchError } = await supabase
        .from('dispatch_entries')
        .upsert({
          booking_id: bookingId,
          driver_id: selectedDriver,
          vehicle_id: selectedVehicle,
          status: 'assigned',
          start_time: `${booking.date}T${booking.time}:00`,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'booking_id'
        })
        .select()
        .single();

      if (dispatchError) throw dispatchError;

      toast({
        title: "Success",
        description: "Driver and vehicle assigned successfully",
      });

      setIsAssignModalOpen(false);
      setSelectedDriver("");
      setSelectedVehicle("");
      
      // Refresh the page to show updated status
      router.refresh();

    } catch (error) {
      console.error('Error assigning resources:', error);
      toast({
        title: "Error",
        description: "Failed to assign driver and vehicle",
        variant: "destructive",
      });
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true)
    try {
      await cancelBookingAction(bookingId)
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      })
      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('bookings.details.bookingActions.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-medium mb-3">{t('bookings.details.bookingActions.quickActions')}</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <Link href={`/bookings/${bookingId}/edit`}>
                <Button 
                  variant="outline" 
                  className="w-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-500 dark:hover:bg-yellow-500/20 dark:border-yellow-500/30"
                >
                  <Edit className="mr-2 h-5 w-5" />
                  {t('bookings.details.bookingActions.editBooking')}
                </Button>
              </Link>
              
              <Link href={`/bookings/${bookingId}/reschedule`}>
                <Button 
                  variant="outline" 
                  className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:hover:bg-blue-500/20 dark:border-blue-500/30"
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {t('bookings.details.bookingActions.rescheduleBooking')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Driver Assignment */}
          <div>
            <h3 className="text-sm font-medium mb-3">Driver Assignment</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                className="w-full bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:hover:bg-green-500/20 dark:border-green-500/30"
                onClick={() => {
                  loadAvailableResources();
                  setIsAssignModalOpen(true);
                }}
                disabled={status === 'cancelled' || status === 'completed'}
              >
                <UserIcon className="mr-2 h-5 w-5" />
                {booking.driver_id ? 'Reassign Driver' : 'Assign Driver'}
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <div className="relative flex items-center py-2 mb-3">
              <div className="flex-grow border-t"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-sm">{t('bookings.details.bookingActions.dangerZone')}</span>
              <div className="flex-grow border-t"></div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="w-full bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 dark:border-red-500/30"
                  disabled={status === 'cancelled'}
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  {t('bookings.details.bookingActions.cancelBooking')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    {t('bookings.details.actions.confirmCancellation')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('bookings.details.actions.cancellationWarning')}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex space-x-2 py-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.processing')}
                      </>
                    ) : (
                      t('bookings.details.actions.confirmCancel')
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Smart Assignment Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Smart Assignment for #{booking.wp_id || booking.id.substring(0, 8)}
            </DialogTitle>
            <DialogDescription>
              Select a driver and vehicle for this booking. The system will suggest the best matches based on the service type.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Drivers */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg flex items-center gap-2 text-foreground">
                <UserIcon className="h-5 w-5" />
                Available Drivers ({drivers.length})
              </h3>
              
              {drivers.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No drivers available</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {drivers.map((driver) => (
                    <div 
                      key={driver.id}
                      className={cn(
                        "cursor-pointer transition-all border border-border bg-card p-4 rounded-md",
                        selectedDriver === driver.id ? "ring-2 ring-primary bg-accent" : "hover:bg-accent/50"
                      )}
                      onClick={() => setSelectedDriver(driver.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={driver.profile_image_url || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {driver.first_name?.[0]}{driver.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">
                            {driver.first_name} {driver.last_name}
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">Available</p>
                        </div>
                        
                        {selectedDriver === driver.id && (
                          <CheckIcon className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Vehicles with Smart Matching */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg flex items-center gap-2 text-foreground">
                <CarIcon className="h-5 w-5" />
                Vehicle Recommendations ({vehicles.length})
              </h3>
              
              {vehicles.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <CarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No vehicles available</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getVehicleMatches().map(({ vehicle, matchPercentage }) => (
                    <div 
                      key={vehicle.id}
                      className={cn(
                        "cursor-pointer transition-all border border-border bg-card p-4 rounded-md",
                        selectedVehicle === vehicle.id ? "ring-2 ring-primary bg-accent" : "hover:bg-accent/50"
                      )}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                          {vehicle.image_url ? (
                            <img src={vehicle.image_url} alt="" className="h-8 w-8 object-cover rounded" />
                          ) : (
                            <CarIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-foreground">
                              {vehicle.plate_number}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                matchPercentage >= 90 ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" :
                                matchPercentage >= 70 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" :
                                matchPercentage >= 50 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300" :
                                "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                              )}>
                                {matchPercentage}% match
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.brand} {vehicle.model}
                          </p>
                        </div>
                        
                        {selectedVehicle === vehicle.id && (
                          <CheckIcon className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedDriver || !selectedVehicle}
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 