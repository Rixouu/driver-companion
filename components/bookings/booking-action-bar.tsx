'use client'

import { PrintButton } from './print-button'
import { DriverActionsDropdown } from './driver-actions-dropdown'
import { PublishButton } from './publish-button'

interface BookingActionBarProps {
  booking: {
    id: string;
    service_name: string;
    date: string;
    time: string;
    pickup_location?: string;
    dropoff_location?: string;
    customer_name?: string;
  }
  onPublish?: () => void;
}

export function BookingActionBar({ booking, onPublish }: BookingActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <PublishButton bookingId={booking.id} onPublish={onPublish} />
      <PrintButton booking={booking} />
      <DriverActionsDropdown booking={booking} />
    </div>
  )
} 