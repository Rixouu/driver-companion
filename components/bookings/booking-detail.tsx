import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatting'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingDetailSkeleton } from './booking-detail-skeleton'
import { Booking } from '@/types/bookings'

interface BookingDetailProps {
  booking: Booking
}

export function BookingDetail({ booking }: BookingDetailProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Booking: ${booking.service_name}`}
          description={`View details for booking #${booking.id}`}
        />
        <Button asChild variant="ghost">
          <Link href="/bookings" >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>
      </div>
      <Suspense fallback={<BookingDetailSkeleton />}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
              <CardDescription>Details about this booking</CardDescription>
              <div className="absolute top-6 right-6">
                <Badge 
                  className={
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                  }
                >
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Service</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.service_name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Booking ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.id}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatDate(booking.date)}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Time</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.time}</dd>
                </div>
                {booking.created_at && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatDate(booking.created_at)}</dd>
                  </div>
                )}
                {booking.updated_at && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatDate(booking.updated_at)}</dd>
                  </div>
                )}
                {booking.price && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {booking.price.formatted || `${booking.price.currency} ${booking.price.amount}`}
                    </dd>
                  </div>
                )}
                {booking.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{booking.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{booking.vehicle ? 'Vehicle Information' : 'Customer Information'}</CardTitle>
              <CardDescription>
                {booking.vehicle ? 'Details about the vehicle for this booking' : 'Customer details for this booking'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {booking.vehicle ? (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {booking.vehicle.make} {booking.vehicle.model} ({booking.vehicle.year})
                    </dd>
                  </div>
                  {booking.vehicle.registration && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Registration</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.vehicle.registration}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {booking.customer_name && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Name</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.customer_name}</dd>
                    </div>
                  )}
                  {booking.customer_email && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.customer_email}</dd>
                    </div>
                  )}
                  {booking.customer_phone && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.customer_phone}</dd>
                    </div>
                  )}
                  {!booking.customer_name && !booking.customer_email && !booking.customer_phone && (
                    <div className="sm:col-span-2 text-center py-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No customer information available</p>
                    </div>
                  )}
                </dl>
              )}
            </CardContent>
          </Card>
        </div>
      </Suspense>
    </div>
  );
} 