"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { DispatchEntryWithRelations, DispatchStatus } from '@/types/dispatch';

// Custom event for dispatch state updates
const DISPATCH_UPDATE_EVENT = 'dispatch-state-update';

interface DispatchUpdateEvent extends CustomEvent {
  detail: {
    type: 'status_update' | 'assignment_update' | 'unassign' | 'refresh';
    dispatchId?: string;
    bookingId?: string;
    data?: any;
  };
}

export function useSharedDispatchState() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Broadcast dispatch update to other components
  const broadcastUpdate = useCallback((type: string, data: any = {}) => {
    const event = new CustomEvent(DISPATCH_UPDATE_EVENT, {
      detail: { type, ...data }
    }) as DispatchUpdateEvent;
    window.dispatchEvent(event);
    setLastUpdate(new Date());
  }, []);

  // Force refresh
  const forceRefresh = useCallback(() => {
    broadcastUpdate('refresh');
  }, [broadcastUpdate]);

  // Update dispatch entry status
  const updateDispatchStatus = useCallback(async (dispatchId: string, newStatus: DispatchStatus, bookingId?: string) => {
    try {
      const supabase = createClient();
      
      // Update dispatch entry
      const { error: dispatchError } = await supabase
        .from('dispatch_entries')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', dispatchId);

      if (dispatchError) throw dispatchError;

      // Update booking status if needed
      if (bookingId) {
        let bookingStatus = '';
        if (newStatus === 'completed') bookingStatus = 'completed';
        else if (newStatus === 'cancelled') bookingStatus = 'cancelled';
        else if (newStatus === 'confirmed') bookingStatus = 'confirmed';
        else if (newStatus === 'pending') bookingStatus = 'pending';

        if (bookingStatus) {
          const { error: bookingError } = await supabase
            .from('bookings')
            .update({ 
              status: bookingStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', bookingId);

          if (bookingError) {
            console.error('Error updating booking status:', bookingError);
          }
        }
      }

      // Broadcast update
      broadcastUpdate('status_update', { dispatchId, newStatus, bookingId });
      forceRefresh();
      
      return true;
    } catch (error) {
      console.error('Error updating dispatch status:', error);
      throw error;
    }
  }, [broadcastUpdate, forceRefresh]);

  // Update assignment
  const updateAssignment = useCallback(async (dispatchId: string, driverId?: string | null, vehicleId?: string | null, bookingId?: string) => {
    try {
      const supabase = createClient();
      
      // Update dispatch entry
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (driverId !== undefined) updateData.driver_id = driverId;
      if (vehicleId !== undefined) updateData.vehicle_id = vehicleId;
      
      // Set status based on assignment
      if (driverId && vehicleId) {
        updateData.status = 'assigned';
      } else if (!driverId && !vehicleId) {
        updateData.status = 'pending';
      }

      const { error: dispatchError } = await supabase
        .from('dispatch_entries')
        .update(updateData)
        .eq('id', dispatchId);

      if (dispatchError) throw dispatchError;

      // Update booking
      if (bookingId) {
        const bookingUpdateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (driverId !== undefined) bookingUpdateData.driver_id = driverId;
        if (vehicleId !== undefined) bookingUpdateData.vehicle_id = vehicleId;
        if (updateData.status) bookingUpdateData.status = updateData.status;

        const { error: bookingError } = await supabase
          .from('bookings')
          .update(bookingUpdateData)
          .eq('id', bookingId);

        if (bookingError) {
          console.error('Error updating booking assignment:', bookingError);
        }
      }

      // Broadcast update
      broadcastUpdate('assignment_update', { dispatchId, driverId, vehicleId, bookingId });
      forceRefresh();
      
      return true;
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  }, [broadcastUpdate, forceRefresh]);

  // Unassign resources
  const unassignResources = useCallback(async (dispatchId: string, bookingId?: string) => {
    try {
      // Explicitly set status to pending on unassignment
      await updateAssignment(dispatchId, null, null, bookingId);
      await updateDispatchStatus(dispatchId, 'pending', bookingId);

      // NEW: remove any driver_availability records created for this booking
      if (bookingId) {
        try {
          const supabase = createClient();
          // Records created on assignment always have a note like "Assigned to booking <bookingId>"
          const { data: toDelete, error: findErr } = await supabase
            .from('driver_availability')
            .select('id')
            .like('notes', `%${bookingId}%`);

          if (findErr) {
            console.error('[Unassign] Error fetching availability records to delete:', findErr);
          } else if (toDelete && toDelete.length) {
            const ids = toDelete.map((r: any) => r.id);
            const { error: delErr } = await supabase
              .from('driver_availability')
              .delete()
              .in('id', ids);
            if (delErr) {
              console.error('[Unassign] Error deleting availability records:', delErr);
            } else {
              console.log(`[Unassign] Removed ${ids.length} driver availability record(s) for booking ${bookingId}`);
            }
          }
        } catch (dbErr) {
          console.error('[Unassign] Unexpected error cleaning availability records:', dbErr);
        }
      }
      
      broadcastUpdate('unassign', { dispatchId, bookingId });
      forceRefresh();
      
      return true;
    } catch (error) {
      console.error('Error unassigning resources:', error);
      throw error;
    }
  }, [updateAssignment, updateDispatchStatus, broadcastUpdate, forceRefresh]);

  // Listen for updates from other components
  useEffect(() => {
    const handleDispatchUpdate = (event: DispatchUpdateEvent) => {
      setLastUpdate(new Date());
    };

    window.addEventListener(DISPATCH_UPDATE_EVENT, handleDispatchUpdate as EventListener);
    
    return () => {
      window.removeEventListener(DISPATCH_UPDATE_EVENT, handleDispatchUpdate as EventListener);
    };
  }, []);

  return {
    lastUpdate,
    updateDispatchStatus,
    updateAssignment,
    unassignResources,
    forceRefresh,
    broadcastUpdate
  };
} 