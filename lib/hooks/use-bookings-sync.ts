import { useState, useRef, useCallback } from 'react';
import { syncBookingsAction } from '@/app/actions/bookings';

interface BookingUpdateConfirmation {
  id: string;
  booking_id: string;
  current: any;
  updated: any;
  changes: string[];
  selectedChanges: Record<string, boolean>;
}

interface PendingSyncAction {
  newBookings: number;
  updatedBookings: number;
}

export const useBookingsSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const syncResultTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update confirmation state
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);
  const [bookingsToUpdate, setBookingsToUpdate] = useState<BookingUpdateConfirmation[]>([]);
  const [selectedBookingsToUpdate, setSelectedBookingsToUpdate] = useState<Record<string, boolean>>({});
  const [pendingSyncAction, setPendingSyncAction] = useState<PendingSyncAction | null>(null);
  const [bookingSelectedChanges, setBookingSelectedChanges] = useState<Record<string, Record<string, boolean>>>({});

  // Auto-dismiss sync result message after 5 seconds
  const clearSyncResult = useCallback(() => {
    if (syncResultTimeoutRef.current) {
      clearTimeout(syncResultTimeoutRef.current);
    }
    
    syncResultTimeoutRef.current = setTimeout(() => {
      setSyncResult(null);
    }, 5000);
  }, []);

  const completeSyncProcess = async () => {
    try {
      const result = await syncBookingsAction();
      return {
        success: true,
        message: `Successfully synced ${result.newBookings} new bookings and updated ${result.updatedBookings} existing bookings.`
      };
    } catch (error) {
      console.error('Error during complete sync:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during sync'
      };
    }
  };

  const handleSyncBookings = useCallback(async () => {
    try {
      setIsSyncing(true);
      
      // Check for updates first
      const checkResult = await fetch('/api/bookings/check-updates');
      const updates = await checkResult.json();
      
      if (!updates || !updates.updatableBookings || updates.updatableBookings.length === 0) {
        // No updatable bookings, just sync new ones if they exist
        if (updates.newBookings > 0) {
          // Complete sync with just new bookings
          const result = await completeSyncProcess();
          setSyncResult(result);
        } else {
          // No changes at all
          setSyncResult({
            success: true,
            message: 'All bookings are already up to date.'
          });
        }
      } else {
        // We have updates to confirm
        console.log('Found updates:', updates);
        
        // Set the bookings to update without auto-selecting them
        setBookingsToUpdate(updates.updatableBookings.map((booking: BookingUpdateConfirmation) => ({
          ...booking,
          selectedChanges: {} // Initialize with no preselected changes
        })));
        
        // Initialize empty selection objects
        const emptySelectionMap: Record<string, boolean> = {};
        updates.updatableBookings.forEach((booking: BookingUpdateConfirmation) => {
          emptySelectionMap[booking.id] = false; // Initialize all bookings as unselected
        });
        setSelectedBookingsToUpdate(emptySelectionMap);
        
        // Initialize empty change selections
        const emptyChangeMap: Record<string, Record<string, boolean>> = {};
        updates.updatableBookings.forEach((booking: BookingUpdateConfirmation) => {
          emptyChangeMap[booking.id] = {};
          // Initialize all changes as unselected
          booking.changes?.forEach((change: string) => {
            emptyChangeMap[booking.id][change] = false;
          });
        });
        setBookingSelectedChanges(emptyChangeMap);
        
        // Store action info for new bookings
        setPendingSyncAction({
          newBookings: updates.newBookings || 0,
          updatedBookings: updates.updatableBookings.length
        });
        
        // Show the update confirmation dialog
        setShowUpdateConfirmation(true);
      }
    } catch (error) {
      console.error('Error syncing bookings:', error);
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error syncing bookings'
      });
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const syncBookingsFromWordPress = useCallback(async () => {
    try {
      setIsSyncing(true);
      
      // Get selected bookings and their changes
      const selectedBookings = bookingsToUpdate.filter(booking => 
        selectedBookingsToUpdate[booking.id]
      );
      
      if (selectedBookings.length === 0) {
        setSyncResult({
          success: false,
          message: 'Please select at least one booking to update.'
        });
        return;
      }
      
      // Prepare the updates with selected changes
      const updatesWithChanges = selectedBookings.map(booking => ({
        id: booking.id,
        changes: booking.changes?.filter(change => 
          bookingSelectedChanges[booking.id]?.[change]
        ) || []
      })).filter(update => update.changes.length > 0);
      
      if (updatesWithChanges.length === 0) {
        setSyncResult({
          success: false,
          message: 'Please select at least one change to apply for the selected bookings.'
        });
        return;
      }
      
      // Call the sync action with selected updates
      const result = await syncBookingsAction(updatesWithChanges);
      
      setSyncResult({
        success: true,
        message: `Successfully synced ${result.newBookings} new bookings and updated ${result.updatedBookings} existing bookings.`
      });
      
      // Close the dialog and reset state
      setShowUpdateConfirmation(false);
      setBookingsToUpdate([]);
      setSelectedBookingsToUpdate({});
      setBookingSelectedChanges({});
      setPendingSyncAction(null);
      
    } catch (error) {
      console.error('Error syncing bookings from WordPress:', error);
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error syncing bookings'
      });
    } finally {
      setIsSyncing(false);
    }
  }, [bookingsToUpdate, selectedBookingsToUpdate, bookingSelectedChanges]);

  return {
    // Sync state
    isSyncing,
    syncResult,
    setSyncResult,
    clearSyncResult,
    
    // Update confirmation state
    showUpdateConfirmation,
    setShowUpdateConfirmation,
    bookingsToUpdate,
    setBookingsToUpdate,
    selectedBookingsToUpdate,
    setSelectedBookingsToUpdate,
    pendingSyncAction,
    setPendingSyncAction,
    bookingSelectedChanges,
    setBookingSelectedChanges,
    
    // Actions
    handleSyncBookings,
    syncBookingsFromWordPress,
  };
};
