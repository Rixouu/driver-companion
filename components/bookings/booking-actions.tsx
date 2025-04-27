"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Edit, 
  Calendar as CalendarIcon, 
  Trash2, 
  CalendarPlus
} from "lucide-react"

interface BookingActionsProps {
  bookingId: string;
  status: string;
  date: string;
  time: string;
  booking: any;
}

export function BookingActions({ bookingId, status, date, time, booking }: BookingActionsProps) {
  const handleCancel = () => {
    // This would typically open a confirmation modal
    alert('This would cancel the booking. Add confirmation dialog here.');
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
          Booking Actions
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
              Add to Google Calendar
            </Button>
          </a>
        </div>

        {/* Management Actions */}
        <div>
          <h3 className="text-sm font-medium mb-3">Management Actions</h3>
          
          <Link href={`/bookings/${bookingId}/edit`} className="block mb-3">
            <Button 
              variant="outline" 
              className="w-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-500 dark:hover:bg-yellow-500/20 dark:border-yellow-500/30"
            >
              <Edit className="mr-2 h-5 w-5" />
              Edit Booking
            </Button>
          </Link>
          
          <Link href={`/bookings/${bookingId}/reschedule`} className="block">
            <Button 
              variant="outline" 
              className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:hover:bg-blue-500/20 dark:border-blue-500/30"
            >
              <CalendarIcon className="mr-2 h-5 w-5" />
              Reschedule Booking
            </Button>
          </Link>
        </div>

        {/* Danger Zone */}
        <div>
          <div className="relative flex items-center py-2 mb-3">
            <div className="flex-grow border-t"></div>
            <span className="flex-shrink mx-4 text-muted-foreground text-sm">DANGER ZONE</span>
            <div className="flex-grow border-t"></div>
          </div>

          <Button 
            variant="outline"
            className="w-full bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 dark:border-red-500/30"
            onClick={handleCancel}
          >
            <Trash2 className="mr-2 h-5 w-5" />
            Cancel Booking
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 