import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getBookingByIdFromDatabase } from '@/lib/api/bookings-service';
import { BookingDetailsSkeleton } from '@/components/bookings/booking-details-skeleton';
import OptimizedBookingDetailsPage from './optimized-page';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailsPageOptimized({ params: awaitedParams }: Props) {
  const params = await awaitedParams;
  const { id } = params;

  if (!id) {
    notFound();
  }

  // Fetch booking data on the server for better performance
  const { booking, error } = await getBookingByIdFromDatabase(id);

  if (error || !booking) {
    notFound();
  }

  return (
    <Suspense fallback={<BookingDetailsSkeleton />}>
      <OptimizedBookingDetailsPage initialBooking={booking} />
    </Suspense>
  );
}
