import { useState, useEffect, useCallback } from 'react';
import { Booking } from '@/types/bookings';
import { getBookingByIdFromDatabase } from '@/lib/api/bookings-service';

interface UseBookingDetailsReturn {
  booking: Booking | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBookingDetails(
  id: string, 
  initialBooking?: Booking
): UseBookingDetailsReturn {
  const [booking, setBooking] = useState<Booking | null>(initialBooking || null);
  const [loading, setLoading] = useState(!initialBooking);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { booking: loadedBooking, error: fetchError } = await getBookingByIdFromDatabase(id);
      
      if (fetchError) {
        setError(fetchError);
        return;
      }
      
      if (!loadedBooking) {
        setError('Booking not found');
        return;
      }
      
      setBooking(loadedBooking);
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refetch = useCallback(async () => {
    await fetchBooking();
  }, [fetchBooking]);

  useEffect(() => {
    if (!initialBooking) {
      fetchBooking();
    }
  }, [fetchBooking, initialBooking]);

  return {
    booking,
    loading,
    error,
    refetch
  };
}
