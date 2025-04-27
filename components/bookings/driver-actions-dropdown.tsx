"use client"

import { Button } from "@/components/ui/button"
import { MoreVertical, Navigation, CalendarPlus, Bell, ClipboardCheck, Mail, Copy } from "lucide-react"
import Link from "next/link"

interface DriverActionsDropdownProps {
  booking: {
    id: string;
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
  const startDate = new Date(`${date}T${time}`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, "");
  };
  
  return `${formatDate(startDate)}/${formatDate(endDate)}`;
}

export function DriverActionsDropdown({ booking }: DriverActionsDropdownProps) {
  const handleCopyToClipboard = () => {
    const bookingDetails = `Booking details #${booking.id}:\nService: ${booking.service_name}\nDate: ${booking.date} at ${booking.time}\nPickup: ${booking.pickup_location || ''}\nDropoff: ${booking.dropoff_location || ''}`;
    navigator.clipboard.writeText(bookingDetails);
    alert('Booking details copied to clipboard');
  };

  const handleSendArrivalNotification = () => {
    alert('Arrival notification sent to customer');
  };

  const handleLineShare = () => {
    alert('LINE sharing implemented');
  };

  return (
    <div className="relative group">
      <Button variant="outline" className="gap-2">
        <MoreVertical className="h-4 w-4" />
        Driver Actions
      </Button>
      
      <div className="absolute right-0 mt-2 w-72 z-50 rounded-md shadow-lg bg-black text-white border border-gray-700 hidden group-hover:block">
        <div className="p-2 border-b border-gray-700">
          <h3 className="text-lg font-medium py-1">Trip Management</h3>
        </div>
        
        <div className="p-3 border-b border-gray-700">
          <div className="space-y-4">
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.pickup_location || '')}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-md"
            >
              <Navigation className="h-5 w-5" />
              Navigate to Pickup
            </a>
            
            <a 
              href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Booking #${booking.id} - ${booking.service_name}`)}&dates=${encodeURIComponent(formatGoogleCalendarDate(booking.date, booking.time))}&details=${encodeURIComponent(`Pickup: ${booking.pickup_location || ''}\nDropoff: ${booking.dropoff_location || ''}\nCustomer: ${booking.customer_name || ''}`)}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-md"
            >
              <CalendarPlus className="h-5 w-5" />
              Add to Calendar
            </a>
            
            <button 
              className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-md w-full text-left"
              onClick={handleSendArrivalNotification}
            >
              <Bell className="h-5 w-5" />
              Send Arrival Notification
            </button>
            
            <Link 
              href={`/bookings/${booking.id}/checklist`} 
              className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-md"
            >
              <ClipboardCheck className="h-5 w-5" />
              Trip Checklist
            </Link>
          </div>
        </div>
        
        <div className="p-2 border-b border-gray-700">
          <h3 className="text-lg font-medium py-1">Share Booking</h3>
        </div>
        
        <div className="p-3">
          <div className="space-y-4">
            <a 
              href={`https://wa.me/?text=${encodeURIComponent(`Booking details #${booking.id}:\nService: ${booking.service_name}\nDate: ${booking.date} at ${booking.time}\nPickup: ${booking.pickup_location || ''}\nDropoff: ${booking.dropoff_location || ''}`)}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-md"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.6 6.32C16.87 5.58 16 5 15.03 4.6C14.07 4.2 13.04 4 12 4C10.61 4 9.24 4.37 8.04 5.07C6.84 5.76 5.84 6.76 5.14 7.96C4.44 9.17 4.07 10.53 4.07 11.92C4.07 13.31 4.43 14.67 5.12 15.88L4 20L8.2 18.9C9.36 19.55 10.66 19.89 11.99 19.9C14.1 19.9 16.12 19.07 17.62 17.56C19.12 16.06 19.96 14.04 19.96 11.93C19.96 9.82 19.12 7.8 17.62 6.3L17.6 6.32ZM12 18.53C10.82 18.53 9.66 18.21 8.64 17.61L8.4 17.46L5.91 18.12L6.57 15.69L6.41 15.44C5.56 14.07 5.24 12.43 5.52 10.84C5.8 9.24 6.65 7.82 7.94 6.85C9.22 5.88 10.86 5.43 12.48 5.58C14.09 5.74 15.59 6.48 16.69 7.67C16.96 7.94 17.18 8.24 17.34 8.57C17.5 8.9 17.61 9.25 17.65 9.61C17.69 9.98 17.67 10.34 17.58 10.69C17.49 11.04 17.34 11.37 17.13 11.66C16.92 11.96 16.67 12.21 16.37 12.4C16.07 12.6 15.74 12.73 15.39 12.81C15.05 12.88 14.69 12.88 14.34 12.82C13.99 12.76 13.65 12.63 13.35 12.44C12.87 12.15 12.34 11.95 11.79 11.87C11.07 11.73 10.33 11.83 9.67 12.15C9 12.47 8.45 13 8.1 13.66C7.83 14.18 7.69 14.77 7.7 15.36C7.71 15.95 7.87 16.53 8.16 17.05L8.28 17.26C8.94 18.16 9.89 18.83 10.98 19.15C12.06 19.46 13.21 19.41 14.27 19L14.5 18.87C15.15 18.53 15.74 18.08 16.24 17.55C16.51 17.26 16.71 16.92 16.84 16.55C16.97 16.18 17.02 15.79 16.99 15.4C16.98 15.17 16.89 14.96 16.74 14.78C16.6 14.6 16.4 14.48 16.18 14.42C15.74 14.27 15.3 14.15 14.86 14.09C14.71 14.07 14.57 14.02 14.45 13.94C14.32 13.86 14.21 13.76 14.14 13.64C14.06 13.51 14.01 13.38 13.99 13.23C13.98 13.08 14 12.93 14.04 12.8C14.09 12.66 14.18 12.54 14.28 12.44C14.39 12.34 14.52 12.27 14.66 12.23C14.8 12.19 14.94 12.18 15.09 12.21C15.23 12.24 15.36 12.3 15.48 12.39C15.76 12.58 16.09 12.72 16.44 12.79C16.79 12.86 17.15 12.86 17.5 12.79C17.85 12.73 18.18 12.59 18.47 12.4C18.76 12.2 19.01 11.95 19.19 11.67C19.38 11.38 19.5 11.05 19.55 10.72C19.6 10.38 19.58 10.04 19.49 9.71C19.4 9.38 19.24 9.07 19.02 8.81C18.81 8.54 18.53 8.33 18.23 8.17C17.28 7.68 16.24 7.42 15.18 7.43C14.16 7.43 13.16 7.66 12.24 8.1C11.32 8.54 10.5 9.17 9.85 9.96C9.21 10.74 8.74 11.67 8.49 12.66C8.24 13.65 8.22 14.68 8.42 15.68C8.53 16.24 8.73 16.77 9.02 17.26C9.01 17.23 8.99 17.19 8.99 17.14C8.83 16.15 9.1 15.14 9.73 14.35C10.09 13.86 10.6 13.52 11.19 13.36C11.77 13.2 12.39 13.24 12.95 13.47C13.33 13.63 13.76 13.68 14.17 13.61C14.59 13.54 14.97 13.36 15.27 13.08C15.61 12.76 15.85 12.36 15.97 11.92C16.09 11.47 16.09 11.01 15.96 10.57C15.84 10.13 15.59 9.73 15.25 9.41C14.91 9.1 14.49 8.88 14.04 8.8C13.58 8.72 13.12 8.77 12.7 8.94C12.27 9.12 11.91 9.41 11.65 9.79L11.66 9.78C11.01 9.02 10.65 8.06 10.65 7H10.75C11.54 7 12.28 7 12.92 7.21C13.79 7.48 14.56 7.98 15.13 8.66C15.71 9.34 16.06 10.17 16.15 11.05C16.17 11.3 16.13 11.56 16.03 11.79C15.94 12.02 15.79 12.23 15.6 12.39C15.42 12.55 15.2 12.66 14.97 12.71C14.73 12.76 14.49 12.75 14.26 12.69C14.03 12.62 13.81 12.49 13.65 12.32C13.48 12.15 13.35 11.93 13.28 11.7C13.21 11.47 13.2 11.22 13.24 10.98C13.29 10.74 13.4 10.52 13.55 10.33C13.79 10.04 13.95 9.69 14 9.31C14.06 8.93 14 8.55 13.84 8.2C13.69 7.86 13.44 7.56 13.12 7.35C12.8 7.14 12.42 7.03 12.04 7.02C10.94 6.98 9.85 7.29 8.91 7.91C7.97 8.53 7.23 9.42 6.79 10.47C6.35 11.52 6.22 12.68 6.42 13.8C6.62 14.92 7.15 15.94 7.93 16.73L8.12 16.93C7.12 15.93 6.59 14.52 6.59 13.09C6.59 11.66 7.12 10.25 8.12 9.26C9.12 8.27 10.48 7.76 12 7.76C13.41 7.76 14.77 8.31 15.8 9.3C16.82 10.3 17.41 11.62 17.41 13.01C17.41 14.4 16.82 15.73 15.8 16.72C14.77 17.71 13.41 18.27 12 18.26V18.53Z"/>
              </svg>
              Share via WhatsApp
            </a>
            
            <button 
              onClick={handleLineShare}
              className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-md w-full text-left"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C6.5 3 2 6.8 2 11.5C2 15.1 4.4 18.1 8 19.5C8.2 19.6 8.5 19.8 8.5 20.1C8.5 20.3 8.5 20.7 8.4 20.9C8.2 21.4 7.8 22.5 7.8 22.5C7.8 22.7 8 22.9 8.2 22.8C8.2 22.8 11.1 21 11.9 20.4C11.9 20.4 12.3 20.2 12.5 20.2C13 20.1 13.5 20 14 20C19.5 20 24 16.2 24 11.5C24 6.8 19.5 3 12 3Z"/>
              </svg>
              Share via LINE
            </button>
            
            <a 
              href={`mailto:?subject=Booking%20Details%20%23${booking.id}&body=${encodeURIComponent(`Booking details #${booking.id}:\nService: ${booking.service_name}\nDate: ${booking.date} at ${booking.time}\nPickup: ${booking.pickup_location || ''}\nDropoff: ${booking.dropoff_location || ''}`)}`} 
              className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-md"
            >
              <Mail className="h-5 w-5" />
              Share via Email
            </a>
            
            <button 
              onClick={handleCopyToClipboard}
              className="flex items-center gap-3 hover:bg-gray-800 p-2 rounded-md w-full text-left"
            >
              <Copy className="h-5 w-5" />
              Copy to Clipboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 