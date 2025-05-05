import Link from 'next/link'
import { Suspense, useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatting'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingDetailSkeleton } from './booking-detail-skeleton'
import { Booking } from '@/types/bookings'
import { toast } from '@/components/ui/use-toast'
import { useI18n } from '@/lib/i18n/context'
import { QuotationMessageContainer } from '@/components/quotations/quotation-containers'

interface BookingDetailProps {
  booking: Booking
}

export function BookingDetail({ booking }: BookingDetailProps) {
  const [isSending, setIsSending] = useState(false);
  const { t } = useI18n();

  // Function to handle sending a quotation
  const handleSendQuotation = async () => {
    if (!booking.id) return;
    
    setIsSending(true);
    
    try {
      const response = await fetch(`/api/quotations/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: booking.id }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send quotation');
      }
      
      toast({
        title: t('quotations.notifications.sendSuccess'),
        description: t('quotations.email.subject', { companyName: 'Your Company' }),
      });
      
      // Refresh the page after successful send
      window.location.reload();
    } catch (error) {
      console.error('Error sending quotation:', error);
      toast({
        title: t('system.notifications.error'),
        description: error instanceof Error ? error.message : t('system.notifications.error'),
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

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
            <CardHeader className="relative">
              <CardTitle>Booking Information</CardTitle>
              <CardDescription>Details about this booking</CardDescription>
              <div className="absolute top-6 right-6 flex items-center gap-2">
                {/* Send button for draft status */}
                {booking.status === 'draft' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleSendQuotation}
                    disabled={isSending}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {isSending ? 'Sending...' : 'Send'}
                  </Button>
                )}
                <Badge 
                  className={
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                    booking.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100' :
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
                
                {/* Price section with better visual separation */}
                {booking.price && (
                  <div className="sm:col-span-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">Price Details</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {booking.price.formatted || `${booking.price.currency} ${booking.price.amount}`}
                        </span>
                      </div>
                      
                      {/* Only show breakdown if there's extended price information */}
                      {booking.price && typeof booking.price === 'object' && Object.keys(booking.price).length > 3 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-sm">
                          {Object.entries(booking.price)
                            .filter(([key]) => !['amount', 'currency', 'formatted'].includes(key))
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center mt-1">
                                <span className="text-gray-500 dark:text-gray-400 capitalize">
                                  {key.replace(/_/g, ' ')}
                                </span>
                                <span className="text-gray-900 dark:text-gray-100">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
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
        
        {/* Add the Messages Component */}
        {booking.id && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>Communicate with the customer about this booking</CardDescription>
              </CardHeader>
              <CardContent>
                <QuotationMessageContainer id={booking.id} />
              </CardContent>
            </Card>
          </div>
        )}
      </Suspense>
    </div>
  );
} 