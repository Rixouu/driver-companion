import { Suspense, useState } from 'react'
import { Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatting'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingDetailSkeleton } from './booking-detail-skeleton'
import { Booking } from '@/types/bookings'
import { toast } from '@/components/ui/use-toast'
import { useI18n } from '@/lib/i18n/context'
import { getStatusBadgeClasses } from '@/lib/utils/styles'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader
          title={`Booking: ${booking.service_name}`}
          description={`View details for booking #${booking.id}`}
        />
        <div className="flex items-center gap-2">
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
            className={cn(getStatusBadgeClasses(booking.status))}
          >
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
      </div>
      
      <Suspense fallback={<BookingDetailSkeleton />}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Booking Summary */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>{t('bookings.details.sections.summary')}</CardTitle>
              <CardDescription>{t('bookings.details.createdOn', { date: formatDate(booking.created_at ?? booking.date) })}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('bookings.details.fields.serviceName')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.service_name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('bookings.details.fields.bookingId')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.id}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('bookings.details.fields.pickupDate')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatDate(booking.date)}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('bookings.details.fields.pickupTime')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.time}</dd>
                </div>
                {booking.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('bookings.details.fields.comment')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{booking.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>{t('bookings.details.sections.client')}</CardTitle>
              <CardDescription>{t('bookings.details.sections.client')}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {booking.customer_name && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('bookings.details.fields.customerName')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.customer_name}</dd>
                  </div>
                )}
                {booking.customer_email && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('bookings.details.fields.email')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.customer_email}</dd>
                  </div>
                )}
                {booking.customer_phone && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('bookings.details.fields.phone')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.customer_phone}</dd>
                  </div>
                )}
                {!booking.customer_name && !booking.customer_email && !booking.customer_phone && (
                  <div className="sm:col-span-2 text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.noResults')}</p>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          {booking.vehicle && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t('bookings.details.sections.vehicle')}</CardTitle>
                <CardDescription>{t('bookings.details.sections.vehicle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('bookings.details.fields.vehicle')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {/* Use vehicle_type from quotation if available, otherwise fall back to vehicle object */}
                      {booking.meta?.vehicle_type || 
                       (booking.vehicle?.make && booking.vehicle?.model ? 
                         `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.year || 'N/A'})` : 
                         'Toyota Hiace Grand Cabin')}
                    </dd>
                  </div>
                  {booking.vehicle?.license_plate && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('bookings.details.fields.licensePlate')}</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{booking.vehicle.license_plate}</dd>
                    </div>
                  )}
                  {/* Show quotation info if this is a multi-service booking */}
                  {booking.meta?.quotation_id && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">From Quotation</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        <Link href={`/quotations/${booking.meta.quotation_id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          View Original Quotation
                        </Link>
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Pricing Information */}
          {booking.price && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t('bookings.details.sections.pricing')}</CardTitle>
                <CardDescription>{t('bookings.details.sections.pricing')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('bookings.pricing.total')}</span>
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {booking.price.formatted || `${booking.price.currency} ${booking.price.amount}`}
                    </span>
                  </div>

                  {typeof booking.price === 'object' && Object.keys(booking.price).length > 3 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
                      {Object.entries(booking.price)
                        .filter(([key]) => !['amount', 'currency', 'formatted'].includes(key))
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center mt-2">
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
              </CardContent>
            </Card>
          )}
        </div>
      </Suspense>
    </div>
  );
} 