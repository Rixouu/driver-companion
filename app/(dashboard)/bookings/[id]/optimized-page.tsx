"use client";

import { Suspense, lazy } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { Booking } from '@/types/bookings';
import { BookingDetailsSkeleton } from '@/components/bookings/booking-details-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useBookingDetails } from '@/lib/hooks/use-booking-details';

// Lazy load heavy components
const BookingDetailsContent = lazy(() => import('./booking-details-content-optimized'));
const BookingWorkflow = lazy(() => import('@/components/bookings/booking-workflow'));
const BookingActions = lazy(() => import('@/components/bookings/booking-actions'));

interface OptimizedBookingDetailsPageProps {
  initialBooking?: Booking;
}

export default function OptimizedBookingDetailsPage({ 
  initialBooking 
}: OptimizedBookingDetailsPageProps) {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const id = params?.id as string;

  const { 
    booking, 
    loading, 
    error, 
    refetch 
  } = useBookingDetails(id, initialBooking);

  if (loading) {
    return <BookingDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested booking could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Booking #${booking.id}`}
        description={`Created on ${new Date(booking.created_at).toLocaleDateString()}`}
        backButton={{
          label: "Back to Bookings",
          onClick: () => router.push('/bookings')
        }}
      />

      <Suspense fallback={<BookingDetailsSkeleton />}>
        <BookingDetailsContent 
          booking={booking} 
          bookingId={id}
          onRefresh={refetch}
        />
      </Suspense>

      <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
        <BookingWorkflow 
          booking={{
            id: booking.id || id,
            status: booking.status || 'pending',
            created_at: booking.created_at || new Date().toISOString(),
            payment_status: booking.payment_status,
            payment_completed_at: booking.meta?.payment_completed_at,
            driver_id: booking.driver_id,
            vehicle_id: booking.vehicle_id,
            assigned_at: booking.meta?.assigned_at,
            completed_at: booking.meta?.completed_at,
            date: booking.date || '',
            time: booking.time || '',
            customer_email: booking.customer_email,
            customer_name: booking.customer_name,
            price: booking.price,
            payment_link: booking.payment_link,
            payment_link_generated_at: booking.meta?.payment_link_generated_at,
            payment_link_expires_at: booking.meta?.payment_link_expires_at,
            receipt_url: booking.meta?.receipt_url
          }}
          onMarkAsPaid={refetch}
          onAssignDriver={() => {
            // Handle driver assignment
            refetch();
          }}
          onMarkAsComplete={refetch}
          onRefresh={refetch}
          isOrganizationMember={true}
        />
      </Suspense>
    </div>
  );
}
