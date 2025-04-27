"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, Calendar, X } from "lucide-react"

interface ActionButtonsProps {
  bookingId: string;
}

export function ActionButtons({ bookingId }: ActionButtonsProps) {
  const handleCancel = () => {
    // This would typically open a confirmation modal
    alert('This would cancel the booking. Add confirmation dialog here.');
  }

  return (
    <>
      <Link href={`/bookings/${bookingId}/edit`}>
        <Button className="w-full mt-4" variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit Booking
        </Button>
      </Link>
      
      <Link href={`/bookings/${bookingId}/reschedule`}>
        <Button className="w-full mt-3" variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Reschedule
        </Button>
      </Link>
      
      <Button 
        className="w-full mt-3" 
        variant="destructive"
        onClick={handleCancel}
      >
        <X className="mr-2 h-4 w-4" />
        Cancel Booking
      </Button>
    </>
  )
} 