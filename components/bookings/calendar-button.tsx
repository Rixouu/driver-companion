"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarPlus } from "lucide-react"

interface CalendarButtonProps {
  booking: {
    id: string;
    service_name: string;
    date: string;
    time: string;
    pickup_location?: string;
    dropoff_location?: string;
    customer_name?: string;
    meta?: {
      chbs_form_element_field?: any[];
      chbs_flight_number?: string;
      chbs_terminal?: string;
    };
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

export function CalendarButton({ booking }: CalendarButtonProps) {
  // Get flight number from meta data if available
  const getFlightNumber = () => {
    if (booking.meta?.chbs_form_element_field && Array.isArray(booking.meta.chbs_form_element_field)) {
      const flightField = booking.meta.chbs_form_element_field.find(
        (field: any) => field.label?.toLowerCase().includes('flight') || field.name?.toLowerCase().includes('flight')
      );
      if (flightField?.value) return flightField.value;
    }
    return booking.meta?.chbs_flight_number || '';
  };
  
  // Get terminal from meta data if available
  const getTerminal = () => {
    if (booking.meta?.chbs_form_element_field && Array.isArray(booking.meta.chbs_form_element_field)) {
      const terminalField = booking.meta.chbs_form_element_field.find(
        (field: any) => field.label?.toLowerCase().includes('terminal') || field.name?.toLowerCase().includes('terminal')
      );
      if (terminalField?.value) return terminalField.value;
    }
    return booking.meta?.chbs_terminal || '';
  };
  
  const flightNumber = getFlightNumber();
  const terminal = getTerminal();
  
  // Build details string with additional information
  const details = `Pickup: ${booking.pickup_location || ''}
Dropoff: ${booking.dropoff_location || ''}
Customer: ${booking.customer_name || ''}${flightNumber ? `\nFlight Number: ${flightNumber}` : ''}${terminal ? `\nTerminal: ${terminal}` : ''}`;

  return (
    <Button className="w-full" variant="outline" asChild>
      <a 
        href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Booking #${booking.id} - ${booking.service_name}`)}&dates=${encodeURIComponent(formatGoogleCalendarDate(booking.date, booking.time))}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(booking.pickup_location || '')}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <CalendarPlus className="mr-2 h-4 w-4" />
        Add to Google Calendar
      </a>
    </Button>
  );
} 