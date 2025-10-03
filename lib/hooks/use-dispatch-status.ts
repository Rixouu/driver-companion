import { useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { DispatchEntryWithRelations, DispatchStatus } from '@/types/dispatch';

interface UseDispatchStatusProps {
  assignments: DispatchEntryWithRelations[];
  setAssignments: React.Dispatch<React.SetStateAction<DispatchEntryWithRelations[]>>;
}

export const useDispatchStatus = ({ assignments, setAssignments }: UseDispatchStatusProps) => {
  const handleUpdateStatus = useCallback(async (entryId: string, newStatus: DispatchStatus) => {
    const originalAssignments = [...assignments];
    
    // Optimistic update
    setAssignments(prev => prev.map(assignment => 
      assignment.id === entryId 
        ? { ...assignment, status: newStatus, updated_at: new Date().toISOString() }
        : assignment
    ));

    try {
      const entry = assignments.find(e => e.id === entryId);
      if (!entry || !entry.booking_id) {
        throw new Error("Booking information not found for this dispatch entry.");
      }
      
      // Handle pending entries (they don't have dispatch entries yet)
      if (entryId.startsWith('pending-')) {
        // Create a new dispatch entry for this pending booking
        const supabase = createClient();
        
        // Construct start_time from booking data if available
        let startTime = entry.start_time;
        if (!startTime && entry.booking?.date && entry.booking?.time) {
          startTime = `${entry.booking.date}T${entry.booking.time}`;
        }
        
        const { data: newDispatchEntry, error: createError } = await supabase
          .from('dispatch_entries')
          .insert({
            booking_id: entry.booking_id,
            status: newStatus,
            start_time: startTime || new Date().toISOString(),
            driver_id: entry.driver_id,
            vehicle_id: entry.vehicle_id
          })
          .select()
          .single();

        if (createError) throw createError;

        // Update the assignment with the new dispatch entry ID
        setAssignments(prev => prev.map(assignment => 
          assignment.id === entryId 
            ? { ...assignment, id: newDispatchEntry.id, status: newStatus }
            : assignment
        ));
      } else {
        // Update existing dispatch entry
        const supabase = createClient();
        
        const { error: updateError } = await supabase
          .from('dispatch_entries')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', entryId);

        if (updateError) throw updateError;
      }

      // Also update the booking status if it's a status that should sync
      const statusesToSync = ['confirmed', 'assigned', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'];
      if (statusesToSync.includes(newStatus)) {
        const supabase = createClient();
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', entry.booking_id);

        if (bookingError) {
          console.error('Error updating booking status:', bookingError);
        }
      }

      toast({
        title: "Success",
        description: "Status updated successfully",
      });

    } catch (error) {
      console.error('Error updating status:', error);
      // Revert optimistic update
      setAssignments(originalAssignments);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  }, [assignments, setAssignments]);

  const handleUnassign = useCallback(async (entryId: string) => {
    const originalAssignments = [...assignments];
    
    // Optimistic update - remove the assignment
    setAssignments(prev => prev.filter(assignment => assignment.id !== entryId));

    try {
      const entry = assignments.find(e => e.id === entryId);
      if (!entry || !entry.booking_id) {
        throw new Error("Booking information not found for this dispatch entry.");
      }

      const supabase = createClient();

      // Delete the dispatch entry
      const { error: deleteError } = await supabase
        .from('dispatch_entries')
        .delete()
        .eq('id', entryId);

      if (deleteError) throw deleteError;

      // Update the booking to remove driver and vehicle assignments
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          driver_id: null,
          vehicle_id: null,
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.booking_id);

      if (bookingError) {
        console.error('Error updating booking:', bookingError);
      }

      toast({
        title: "Success",
        description: "Resources unassigned successfully",
      });

    } catch (error) {
      console.error('Error unassigning resources:', error);
      // Revert optimistic update
      setAssignments(originalAssignments);
      toast({
        title: "Error",
        description: "Failed to unassign resources",
        variant: "destructive",
      });
    }
  }, [assignments, setAssignments]);

  const handleAssignmentAction = useCallback((action: 'view-details' | 'start-trip' | 'complete-trip' | 'unassign', assignmentId: string) => {
    // This can be expanded based on specific action requirements
    console.log(`Action ${action} for assignment ${assignmentId}`);
  }, []);

  return {
    handleUpdateStatus,
    handleUnassign,
    handleAssignmentAction
  };
};
