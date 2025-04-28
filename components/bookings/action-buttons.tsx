"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, Calendar, X } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface ActionButtonsProps {
  bookingId: string;
}

export function ActionButtons({ bookingId }: ActionButtonsProps) {
  const { t } = useI18n()
  
  const handleCancel = () => {
    // This would typically open a confirmation modal
    alert('This would cancel the booking. Add confirmation dialog here.');
  }

  return (
    <>
      <Link href={`/bookings/${bookingId}/edit`}>
        <Button className="w-full mt-4" variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          {t('bookings.details.bookingActions.editBooking')}
        </Button>
      </Link>
      <Link href={`/bookings/${bookingId}/reschedule`}>
        <Button className="w-full mt-3" variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          {t('bookings.details.actions.reschedule')}
        </Button>
      </Link>
      <Button 
        className="w-full mt-3" 
        variant="destructive"
        onClick={handleCancel}
      >
        <X className="mr-2 h-4 w-4" />
        {t('bookings.details.bookingActions.cancelBooking')}
      </Button>
    </>
  );
} 