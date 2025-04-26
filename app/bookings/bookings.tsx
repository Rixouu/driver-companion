import { BookingsList } from '@/components/bookings/bookings-list'

interface BookingsProps {
  limit?: number
  status?: string
}

export function Bookings({ limit, status }: BookingsProps) {
  return <BookingsList limit={limit} />
} 