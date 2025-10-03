import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { DispatchEntryWithRelations, DispatchStatus } from '@/types/dispatch';

interface UseDispatchDataProps {
  lastUpdate?: Date;
}

export const useDispatchData = ({ lastUpdate }: UseDispatchDataProps = {}) => {
  const [assignments, setAssignments] = useState<DispatchEntryWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadDispatchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // First get all dispatch entries
      const { data: dispatchData, error: dispatchError } = await supabase
        .from('dispatch_entries')
        .select(`
          *,
          driver:drivers(*),
          vehicle:vehicles(*),
          booking:bookings(
            *,
            driver:drivers(id, first_name, last_name, email, phone, profile_image_url),
            vehicle:vehicles(id, name, plate_number, brand, model, year, image_url, status)
          )
        `)
        .order('start_time', { ascending: false });

      if (dispatchError) throw dispatchError;

      // Also get all bookings that need dispatch management (confirmed, assigned, etc.)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          driver:drivers(id, first_name, last_name, email, phone, profile_image_url),
          vehicle:vehicles(id, name, plate_number, brand, model, year, image_url, status)
        `)
        .in('status', ['confirmed', 'assigned', 'pending'])
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Combine dispatch entries with bookings that don't have dispatch entries yet
      const allEntries = [...(dispatchData || [])];
      
      // Add bookings without dispatch entries as pending entries
      const bookingsWithoutDispatch = (bookingsData || []).filter(booking => 
        !dispatchData?.some(entry => entry.booking_id === booking.id)
      );

      // Only include bookings with valid date/time data
      const validBookings = bookingsWithoutDispatch.filter(booking => 
        booking.date && booking.time && 
        typeof booking.date === 'string' && 
        typeof booking.time === 'string'
      );

      console.log(`[Dispatch] Found ${bookingsWithoutDispatch.length} bookings without dispatch, ${validBookings.length} have valid date/time`);

      const pendingEntries = validBookings.map(booking => ({
        id: `pending-${booking.id}`, // Generate unique ID for pending entries
        booking_id: booking.id,
        status: booking.status as DispatchStatus, // Use actual booking status instead of hardcoded 'pending'
        driver_id: booking.driver_id,
        vehicle_id: booking.vehicle_id,
        start_time: null, // Don't set start_time for pending entries, let the UI handle it
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        driver: booking.driver,
        vehicle: booking.vehicle,
        booking: booking
      }));

      const data = [...allEntries, ...pendingEntries];
      
      // Transform the data to match our interface expectations
      const loadedAssignments = (data || []).map(entry => ({
        ...entry,
        booking: {
          ...entry.booking,
          supabase_id: entry.booking.id,
          // Map vehicle license_plate from plate_number if vehicle exists
          vehicle: entry.booking.vehicle ? {
            ...entry.booking.vehicle,
            license_plate: entry.booking.vehicle.plate_number,
          } : null
        }
      })) as unknown as DispatchEntryWithRelations[];

      // Deduplicate entries by booking_id - keep only the most recent entry for each booking
      // Priority: dispatch entries over pending entries, then use most recent
      const uniqueAssignments = loadedAssignments.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.booking_id === current.booking_id);
        
        if (existingIndex === -1) {
          // First entry for this booking
          acc.push(current);
        } else {
          const existing = acc[existingIndex];
          
          // Priority: dispatch entries over pending entries
          const isCurrentDispatch = !current.id.startsWith('pending-');
          const isExistingDispatch = !existing.id.startsWith('pending-');
          
          if (isCurrentDispatch && !isExistingDispatch) {
            // Current is dispatch entry, existing is pending - replace
            acc[existingIndex] = current;
          } else if (!isCurrentDispatch && isExistingDispatch) {
            // Current is pending, existing is dispatch - keep existing
          } else {
            // Both same type - use most recent
            const currentDate = new Date(current.updated_at || current.created_at);
            const existingDate = new Date(existing.updated_at || existing.created_at);
            
            if (currentDate > existingDate) {
              acc[existingIndex] = current;
            }
          }
        }
        
        return acc;
      }, [] as DispatchEntryWithRelations[]);

      console.log(`[Dispatch] Loaded ${loadedAssignments.length} entries, deduplicated to ${uniqueAssignments.length} unique bookings`);
      
      // Debug: Log some sample entries to see the structure
      if (uniqueAssignments.length > 0) {
        console.log('[Dispatch] Sample entry structure:', {
          id: uniqueAssignments[0].id,
          status: uniqueAssignments[0].status,
          start_time: uniqueAssignments[0].start_time,
          booking_date: uniqueAssignments[0].booking?.date,
          booking_time: uniqueAssignments[0].booking?.time
        });
      }
      
      // Show all relevant entries for dispatch management
      const filteredAssignments = uniqueAssignments.filter(entry => {
        // Always show entries with active dispatch statuses
        if (['pending', 'assigned', 'confirmed', 'en_route', 'arrived', 'in_progress'].includes(entry.status)) {
          return true;
        }
        
        // For completed/cancelled dispatch entries, only show if they're recent (within last 24 hours)
        if (['completed', 'cancelled'].includes(entry.status)) {
          const entryDate = new Date(entry.updated_at || entry.created_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return entryDate > oneDayAgo;
        }
        
        return false;
      });
      
      console.log(`[Dispatch] Filtered to ${filteredAssignments.length} relevant entries`);
      
      setAssignments(filteredAssignments);
      setLastRefresh(new Date());

    } catch (error) {
      console.error('Error loading dispatch data:', error);
      toast({
        title: "Error",
        description: "Failed to load dispatch data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount and when lastUpdate changes
  useEffect(() => {
    loadDispatchData();
  }, [lastUpdate, loadDispatchData]);

  // Listen for broadcasted updates
  useEffect(() => {
    const handleDispatchUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.type === 'assignment_update' || customEvent.detail.type === 'refresh') {
        loadDispatchData();
      }
    };

    window.addEventListener('dispatch-state-update', handleDispatchUpdate);

    return () => {
      window.removeEventListener('dispatch-state-update', handleDispatchUpdate);
    };
  }, [loadDispatchData]);

  return {
    assignments,
    setAssignments,
    isLoading,
    lastRefresh,
    loadDispatchData
  };
};
