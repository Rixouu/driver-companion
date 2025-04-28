import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BookingsClient } from '@/components/bookings/bookings-client'
import { BookingsPageSkeleton } from '@/components/bookings/bookings-page-skeleton'

export const metadata = {
  title: 'Bookings',
  description: 'View and manage your bookings',
}

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">
            View and manage your vehicle bookings
          </p>
        </div>
        <Button asChild className="sm:flex-shrink-0">
          <div className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </div>
        </Button>
      </div>
      
      <Suspense fallback={<BookingsPageSkeleton />}>
        <BookingsClient hideTabNavigation />
      </Suspense>
    </div>
  )
} 