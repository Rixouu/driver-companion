"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { 
  DispatchAssignment, 
  DispatchAssignmentWithRelations, 
  DispatchStatus,
  AssignmentCreateInput,
  AssignmentUpdateInput,
  DispatchFilter,
  DispatchStats
} from '@/types/dispatch';
import { toast } from '@/components/ui/use-toast';

interface UseDispatchManagementOptions {
  autoLoad?: boolean;
  enableRealtime?: boolean;
}

export function useDispatchManagement(options: UseDispatchManagementOptions = {}) {
  const { autoLoad = true, enableRealtime = true } = options;

  const [assignments, setAssignments] = useState<DispatchAssignmentWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DispatchStats | null>(null);

  const supabase = createClient();

  // Load dispatch assignments
  const loadAssignments = useCallback(async (filters?: DispatchFilter) => {
    setIsLoading(true);
    setError(null);

    try {
      // For now, we'll create dispatch assignments from existing bookings
      // This bridges the gap between old dispatch_entries and new dispatch_assignments
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          driver:drivers(id, first_name, last_name, email, phone, profile_image_url, status),
          vehicle:vehicles(id, name, plate_number, brand, model, image_url, status)
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Transform bookings into dispatch assignments
      const transformedAssignments: DispatchAssignmentWithRelations[] = bookingsData?.map(booking => {
        // Map booking status to dispatch status
        let dispatchStatus: DispatchStatus = 'pending';
        if (booking.status === 'completed') dispatchStatus = 'completed';
        else if (booking.status === 'cancelled') dispatchStatus = 'cancelled';
        else if (booking.status === 'confirmed' && booking.driver_id) dispatchStatus = 'confirmed';
        else if (booking.driver_id) dispatchStatus = 'assigned';

        const assignment: DispatchAssignmentWithRelations = {
          id: booking.id, // Using booking ID as assignment ID for now
          booking_id: booking.id,
          driver_id: booking.driver_id ?? undefined,
          vehicle_id: booking.vehicle_id ?? undefined,
          status: dispatchStatus,
          assigned_by: undefined,
          assigned_at: booking.driver_id ? (booking.updated_at ?? undefined) : undefined,
          started_at: undefined,
          arrived_at: undefined,
          completed_at: booking.status === 'completed' ? (booking.updated_at ?? undefined) : undefined,
          estimated_arrival: undefined,
          actual_arrival: undefined,
          pickup_location: booking.pickup_location ? {
            lat: 0, lng: 0, // Would need to geocode the address
            address: booking.pickup_location
          } : undefined,
          dropoff_location: booking.dropoff_location ? {
            lat: 0, lng: 0, // Would need to geocode the address  
            address: booking.dropoff_location
          } : undefined,
          route_data: undefined,
          distance_km: booking.distance ? parseFloat(booking.distance) : undefined,
          estimated_duration_minutes: booking.duration ? parseInt(booking.duration) : undefined,
          actual_duration_minutes: undefined,
          notes: booking.notes,
          priority: 0,
          created_at: booking.created_at || new Date().toISOString(),
          updated_at: booking.updated_at || new Date().toISOString(),
          booking: {
            id: booking.id,
            wp_id: booking.wp_id,
            customer_name: booking.customer_name,
            customer_phone: booking.customer_phone,
            customer_email: booking.customer_email,
            pickup_location: booking.pickup_location,
            dropoff_location: booking.dropoff_location,
            service_name: booking.service_name,
            date: booking.date,
            time: booking.time,
            status: booking.status,
            duration: booking.duration,
            notes: booking.notes
          },
          driver: booking.driver ? {
            id: booking.driver.id,
            first_name: booking.driver.first_name,
            last_name: booking.driver.last_name,
            email: booking.driver.email,
            phone: booking.driver.phone,
            profile_image_url: booking.driver.profile_image_url,
            status: booking.driver.status
          } : undefined,
          vehicle: booking.vehicle ? {
            id: booking.vehicle.id,
            name: booking.vehicle.name,
            plate_number: booking.vehicle.plate_number,
            brand: booking.vehicle.brand,
            model: booking.vehicle.model,
            image_url: booking.vehicle.image_url,
            status: booking.vehicle.status
          } : undefined
        };

        return assignment;
      }) || [];

      // Apply filters
      let filteredAssignments = transformedAssignments;
      if (filters) {
        if (filters.status) {
          filteredAssignments = filteredAssignments.filter(a => a.status === filters.status);
        }
        if (filters.driver_id) {
          filteredAssignments = filteredAssignments.filter(a => a.driver_id === filters.driver_id);
        }
        if (filters.vehicle_id) {
          filteredAssignments = filteredAssignments.filter(a => a.vehicle_id === filters.vehicle_id);
        }
        if (filters.date_from) {
          filteredAssignments = filteredAssignments.filter(a => 
            a.booking?.date && a.booking.date >= filters.date_from!
          );
        }
        if (filters.date_to) {
          filteredAssignments = filteredAssignments.filter(a => 
            a.booking?.date && a.booking.date <= filters.date_to!
          );
        }
      }

      setAssignments(filteredAssignments);
      calculateStats(filteredAssignments);

    } catch (err) {
      console.error('Error loading dispatch assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
      toast({
        title: "Error",
        description: "Failed to load dispatch assignments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Calculate dispatch stats
  const calculateStats = (assignments: DispatchAssignmentWithRelations[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    const stats: DispatchStats = {
      total_assignments: assignments.length,
      pending_assignments: assignments.filter(a => a.status === 'pending').length,
      active_assignments: assignments.filter(a => 
        ['assigned', 'confirmed', 'en_route', 'in_progress'].includes(a.status)
      ).length,
      completed_today: assignments.filter(a => 
        a.status === 'completed' && 
        a.completed_at?.split('T')[0] === today
      ).length,
      average_completion_time: 0, // Would calculate from actual data
      online_vehicles: 0, // Would come from tracking data
      available_drivers: 0 // Would calculate from driver availability
    };

    setStats(stats);
  };

  // Assign driver to assignment
  const assignDriver = async (assignmentId: string, driverId: string) => {
    setIsSubmitting(true);
    try {
      // Update the booking with driver assignment
      const { error } = await supabase
        .from('bookings')
        .update({ 
          driver_id: driverId,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // Update local state
      setAssignments(prev => prev.map(assignment => 
        assignment.id === assignmentId 
          ? { 
              ...assignment, 
              driver_id: driverId,
              status: assignment.vehicle_id ? 'assigned' : 'pending',
              assigned_at: new Date().toISOString()
            }
          : assignment
      ));

      toast({
        title: "Success",
        description: "Driver assigned successfully",
      });

    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assign vehicle to assignment
  const assignVehicle = async (assignmentId: string, vehicleId: string) => {
    setIsSubmitting(true);
    try {
      // Update the booking with vehicle assignment
      const { error } = await supabase
        .from('bookings')
        .update({ 
          vehicle_id: vehicleId,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;

      // Update local state
      setAssignments(prev => prev.map(assignment => 
        assignment.id === assignmentId 
          ? { 
              ...assignment, 
              vehicle_id: vehicleId,
              status: assignment.driver_id ? 'assigned' : 'pending'
            }
          : assignment
      ));

      toast({
        title: "Success",
        description: "Vehicle assigned successfully",
      });

    } catch (error) {
      console.error('Error assigning vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to assign vehicle",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update assignment status
  const updateStatus = async (assignmentId: string, status: DispatchStatus) => {
    setIsSubmitting(true);
    try {
      let updateData: any = { updated_at: new Date().toISOString() };

      // Map dispatch status to booking status
      if (status === 'completed') {
        updateData.status = 'completed';
      } else if (status === 'cancelled') {
        updateData.status = 'cancelled';
      } else if (status === 'confirmed') {
        updateData.status = 'confirmed';
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', assignmentId);

      if (error) throw error;

      // Update local state
      setAssignments(prev => prev.map(assignment => 
        assignment.id === assignmentId 
          ? { 
              ...assignment, 
              status,
              ...(status === 'completed' && { completed_at: new Date().toISOString() }),
              ...(status === 'en_route' && { started_at: new Date().toISOString() }),
              ...(status === 'arrived' && { arrived_at: new Date().toISOString() })
            }
          : assignment
      ));

      toast({
        title: "Success",
        description: "Status updated successfully",
      });

    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk assignment
  const bulkAssign = async (assignments: Array<{ bookingId: string; driverId?: string; vehicleId?: string }>) => {
    setIsSubmitting(true);
    try {
      for (const assignment of assignments) {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (assignment.driverId) updateData.driver_id = assignment.driverId;
        if (assignment.vehicleId) updateData.vehicle_id = assignment.vehicleId;

        const { error } = await supabase
          .from('bookings')
          .update(updateData)
          .eq('id', assignment.bookingId);

        if (error) throw error;
      }

      await loadAssignments(); // Reload to get fresh data

      toast({
        title: "Success",
        description: `Successfully assigned ${assignments.length} bookings`,
      });

    } catch (error) {
      console.error('Error in bulk assignment:', error);
      toast({
        title: "Error",
        description: "Failed to complete bulk assignment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get assignments by status
  const getAssignmentsByStatus = (status: DispatchStatus) => {
    return assignments.filter(assignment => assignment.status === status);
  };

  // Get assignments for driver
  const getAssignmentsForDriver = (driverId: string) => {
    return assignments.filter(assignment => assignment.driver_id === driverId);
  };

  // Get assignments for vehicle
  const getAssignmentsForVehicle = (vehicleId: string) => {
    return assignments.filter(assignment => assignment.vehicle_id === vehicleId);
  };

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadAssignments();
    }
  }, [autoLoad, loadAssignments]);

  return {
    assignments,
    isLoading,
    isSubmitting,
    error,
    stats,
    loadAssignments,
    assignDriver,
    assignVehicle,
    updateStatus,
    bulkAssign,
    getAssignmentsByStatus,
    getAssignmentsForDriver,
    getAssignmentsForVehicle
  };
} 