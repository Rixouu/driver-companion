"use client"

import { MoreVertical, Navigation, CalendarPlus, Bell, ClipboardCheck, Mail, Copy } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { BookingButton } from "./booking-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface DriverActionsDropdownProps {
  booking: {
    id: string;
    wp_id?: string;
    service_name: string;
    date: string;
    time: string;
    pickup_location?: string;
    dropoff_location?: string;
    customer_name?: string;
  }
}

// Helper function to format date for Google Calendar
function formatGoogleCalendarDate(date: string, time: string) {
  if (!date || !time) return '';
  
  try {
    const startDate = new Date(`${date}T${time}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, "");
    };
    
    return `${formatDate(startDate)}/${formatDate(endDate)}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export function DriverActionsDropdown({ booking }: DriverActionsDropdownProps) {
  const { t } = useI18n()
  
  const handleCopyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown from closing
    const bookingDetails = `Booking details #${booking.wp_id || booking.id}:\nService: ${booking.service_name}\nDate: ${booking.date} at ${booking.time}\nPickup: ${booking.pickup_location || ''}\nDropoff: ${booking.dropoff_location || ''}`;
    navigator.clipboard.writeText(bookingDetails);
    alert('Booking details copied to clipboard');
  };

  const handleSendArrivalNotification = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown from closing
    alert('Arrival notification sent to customer');
  };

  const handleLineShare = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown from closing
    // Placeholder for actual LINE sharing logic
    alert('LINE sharing logic goes here'); 
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <BookingButton
          variant="default"
          icon={<MoreVertical className="h-5 w-5" />}
        >
          {t('bookings.details.driverActions.title')}
        </BookingButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-72 bg-white dark:bg-black text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800"
        align="end" // Align to the right edge of the trigger
      >
        <DropdownMenuLabel className="text-base font-medium px-2 py-1.5"> 
          {t('bookings.details.driverActions.tripManagement')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild className="cursor-pointer text-sm">
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.pickup_location || '')}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-3 w-full"
          >
            <Navigation className="h-4 w-4" />
            {t('bookings.details.actions.navigateToPickup')}
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="cursor-pointer text-sm">
          <a 
            href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Booking #${booking.wp_id || booking.id} - ${booking.service_name}`)}&dates=${encodeURIComponent(formatGoogleCalendarDate(booking.date, booking.time))}&details=${encodeURIComponent(`Pickup: ${booking.pickup_location || ''}\nDropoff: ${booking.dropoff_location || ''}\nCustomer: ${booking.customer_name || ''}`)}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-3 w-full"
          >
            <CalendarPlus className="h-4 w-4" />
            {t('bookings.details.actions.addToCalendar')}
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-sm">
          <button 
            className="flex items-center gap-3 w-full text-left"
            onClick={handleSendArrivalNotification}
          >
            <Bell className="h-4 w-4" />
            {t('bookings.details.actions.sendArrivalNotification')}
          </button>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="cursor-pointer text-sm">
          <Link
            href={`/bookings/${booking.id}/checklist`}
            className="flex items-center gap-3 w-full"
          >
            <ClipboardCheck className="h-4 w-4" />
            {t('bookings.details.actions.tripChecklist')}
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-base font-medium px-2 py-1.5">
          {t('bookings.details.driverActions.shareBooking')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild className="cursor-pointer text-sm">
          <a 
            href={`https://wa.me/?text=${encodeURIComponent(`Booking details #${booking.wp_id || booking.id}:\nService: ${booking.service_name}\nDate: ${booking.date} at ${booking.time}\nPickup: ${booking.pickup_location || ''}\nDropoff: ${booking.dropoff_location || ''}`)}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-3 w-full"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.6 6.32A8.39 8.39 0 0 0 12.02 4c-4.61 0-8.37 3.73-8.37 8.33c0 1.47.39 2.9 1.13 4.17L3.75 20l3.62-1.13c1.23.67 2.61 1.03 4.03 1.03h.01c4.61 0 8.36-3.73 8.36-8.33c0-2.22-.88-4.3-2.48-5.87zM12.03 18.11h-.01c-1.24 0-2.47-.33-3.53-.97l-.25-.15l-2.62.82l.83-2.55l-.17-.27a6.93 6.93 0 0 1-1.07-3.71c0-3.83 3.13-6.95 6.97-6.95a6.92 6.92 0 0 1 4.93 2.04a6.88 6.88 0 0 1 2.04 4.92c0 3.83-3.14 6.95-6.98 6.95zm3.8-5.21c-.21-.1-1.23-.61-1.42-.67c-.19-.07-.32-.1-.46.1c-.14.2-.53.67-.65.81c-.12.14-.24.16-.44.05c-1.22-.61-2.02-.91-2.82-2.07c-.21-.36.21-.34.61-1.12C10.9 9.6 10.84 9.47 10.77 9.35c-.07-.12-.46-.03-.63.07c-.18.11-.66.65-.9.89c-.24.24-.5.28-.72.18C7.42 9.58 6.59 8.5 6.16 7.62c-.16-.31.05-.47.2-.65c.15-.15.32-.4.48-.59c.16-.2.21-.34.32-.57c.1-.23.05-.43-.03-.59c-.07-.17-.63-1.53-.87-2.1c-.23-.55-.46-.47-.63-.48l-.54-.01c-.19 0-.49.07-.75.34c-.25.27-.98.96-.98 2.33c0 1.37 1 2.7 1.14 2.89c.14.18 2 3.17 4.93 4.32c2.94 1.15 2.94.77 3.47.72c.53-.05 1.7-.7 1.95-1.36c.24-.67.24-1.25.17-1.37z"/>
            </svg>
            {t('bookings.details.actions.shareWhatsApp')}
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-sm">
          <button 
            onClick={handleLineShare}
            className="flex items-center gap-3 w-full text-left"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3C6.5 3 2 6.8 2 11.5C2 15.1 4.4 18.1 8 19.5C8.2 19.6 8.5 19.8 8.5 20.1C8.5 20.3 8.5 20.7 8.4 20.9C8.2 21.4 7.8 22.5 7.8 22.5C7.8 22.7 8 22.9 8.2 22.8C8.2 22.8 11.1 21 11.9 20.4C11.9 20.4 12.3 20.2 12.5 20.2C13 20.1 13.5 20 14 20C19.5 20 24 16.2 24 11.5C24 6.8 19.5 3 12 3Z"/>
            </svg>
            {t('bookings.details.actions.shareLine')}
          </button>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="cursor-pointer text-sm">
          <a 
            href={`mailto:?subject=Booking%20Details%20%23${booking.wp_id || booking.id}&body=${encodeURIComponent(`Booking details #${booking.wp_id || booking.id}:\nService: ${booking.service_name}\nDate: ${booking.date} at ${booking.time}\nPickup: ${booking.pickup_location || ''}\nDropoff: ${booking.dropoff_location || ''}`)}`} 
            className="flex items-center gap-3 w-full"
          >
            <Mail className="h-4 w-4" />
            {t('bookings.details.actions.shareEmail')}
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-sm">
          <button 
            onClick={handleCopyToClipboard}
            className="flex items-center gap-3 w-full text-left"
          >
            <Copy className="h-4 w-4" />
            {t('bookings.details.actions.copyClipboard')}
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 