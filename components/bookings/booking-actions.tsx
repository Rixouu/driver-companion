"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Edit, 
  Calendar as CalendarIcon, 
  Trash2, 
  CalendarPlus,
  FileText,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { InvoiceButton } from "./invoice-button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cancelBookingAction } from "@/app/actions/bookings"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface BookingActionsProps {
  bookingId: string;
  status: string;
  date: string;
  time: string;
  booking: any;
}

export function BookingActions({ bookingId, status, date, time, booking }: BookingActionsProps) {
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const handleCancelBooking = async () => {
    try {
      setIsCancelling(true)
      
      // Call the cancel booking action
      const result = await cancelBookingAction(bookingId)
      
      if (result.success) {
        toast({
          title: t('bookings.details.actions.cancelSuccess'),
          description: result.message,
          variant: "default",
        })
        
        // Close the dialog
        setIsDialogOpen(false)
        
        // Refresh the page to show updated status
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        toast({
          title: t('bookings.details.actions.cancelError'),
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t('bookings.details.actions.cancelError'),
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  // Helper function to format date for Google Calendar
  function formatGoogleCalendarDate(date: string, time: string) {
    const startDate = new Date(`${date}T${time}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, "");
    };
    
    return `${formatDate(startDate)}/${formatDate(endDate)}`;
  }

  return (
    <Card className="border">
      <div className="border-b py-4 px-6">
        <h2 className="text-lg font-semibold flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5" />
          {t('bookings.details.bookingActions.title')}
        </h2>
      </div>
      <CardContent className="p-6 space-y-4">
        {/* Add to Google Calendar button */}
        <div>
          <a 
            href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Booking #${bookingId}`)}&dates=${encodeURIComponent(formatGoogleCalendarDate(date, time))}&details=${encodeURIComponent(`Pickup: ${booking.pickup_location || ''}\nDropoff: ${booking.dropoff_location || ''}`)}&location=${encodeURIComponent(booking.pickup_location || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button 
              className="w-full bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 dark:bg-green-500/10 dark:text-green-500 dark:hover:bg-green-500/20 dark:border-green-500/30"
            >
              <CalendarPlus className="mr-2 h-5 w-5" />
              {t('bookings.details.bookingActions.addToGoogleCalendar')}
            </Button>
          </a>
        </div>

        {/* Document Actions */}
        <div>
          <h3 className="text-sm font-medium mb-3">Documents</h3>
          
          <div className="grid grid-cols-1 gap-3">
            <InvoiceButton booking={booking} />
          </div>
        </div>

        {/* Management Actions */}
        <div>
          <h3 className="text-sm font-medium mb-3">{t('bookings.details.bookingActions.managementActions')}</h3>
          
          <Link
            href={`/bookings/${bookingId}/edit`}
            className="block mb-3" ><span className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="w-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-500 dark:hover:bg-yellow-500/20 dark:border-yellow-500/30"
            >
              <Edit className="mr-2 h-5 w-5" />
              {t('bookings.details.bookingActions.editBooking')}
            </Button>
          </span></Link>
          
          <Link
            href={`/bookings/${bookingId}/reschedule`}
            className="block" ><span className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:hover:bg-blue-500/20 dark:border-blue-500/30"
            >
              <CalendarIcon className="mr-2 h-5 w-5" />
              {t('bookings.details.bookingActions.rescheduleBooking')}
            </Button>
          </span></Link>
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
  );
} 