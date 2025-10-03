import { useState, useCallback } from 'react';
import { BookingWithRelations } from '@/types/dispatch';
import { useSharedDispatchState } from '@/lib/hooks/use-shared-dispatch-state';

interface UseAssignmentManagementProps {
  bookings: BookingWithRelations[];
  setBookings: React.Dispatch<React.SetStateAction<BookingWithRelations[]>>;
}

export const useAssignmentManagement = ({ bookings, setBookings }: UseAssignmentManagementProps) => {
  const { updateAssignment, unassignResources } = useSharedDispatchState();
  
  // Modal states
  const [smartModalOpen, setSmartModalOpen] = useState(false);
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<BookingWithRelations | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null);

  const handleOpenSmartModal = useCallback((booking: BookingWithRelations) => {
    setSelectedBookingForModal(booking);
    setSmartModalOpen(true);
  }, []);

  const handleViewDetails = useCallback((bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setDetailsOpen(true);
    }
  }, [bookings]);

  const handleCloseDetails = useCallback(() => {
    setDetailsOpen(false);
    setSelectedBooking(null);
  }, []);

  const handleAssignDriver = useCallback(async (bookingId: string, driverId: string) => {
    try {
      await updateAssignment(bookingId, { driver_id: driverId });
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, driver_id: driverId }
          : booking
      ));
    } catch (error) {
      console.error('Error assigning driver:', error);
    }
  }, [updateAssignment, setBookings]);

  const handleAssignVehicle = useCallback(async (bookingId: string, vehicleId: string) => {
    try {
      await updateAssignment(bookingId, { vehicle_id: vehicleId });
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, vehicle_id: vehicleId }
          : booking
      ));
    } catch (error) {
      console.error('Error assigning vehicle:', error);
    }
  }, [updateAssignment, setBookings]);

  const handleUnassign = useCallback(async (bookingId: string) => {
    try {
      await unassignResources(bookingId);
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, driver_id: null, vehicle_id: null }
          : booking
      ));
    } catch (error) {
      console.error('Error unassigning resources:', error);
    }
  }, [unassignResources, setBookings]);

  const handleUnassignDriver = useCallback(async (bookingId: string) => {
    try {
      await updateAssignment(bookingId, { driver_id: null });
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, driver_id: null }
          : booking
      ));
    } catch (error) {
      console.error('Error unassigning driver:', error);
    }
  }, [updateAssignment, setBookings]);

  const handleUnassignVehicle = useCallback(async (bookingId: string) => {
    try {
      await updateAssignment(bookingId, { vehicle_id: null });
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, vehicle_id: null }
          : booking
      ));
    } catch (error) {
      console.error('Error unassigning vehicle:', error);
    }
  }, [updateAssignment, setBookings]);

  return {
    // Modal states
    smartModalOpen,
    setSmartModalOpen,
    selectedBookingForModal,
    setSelectedBookingForModal,
    detailsOpen,
    setDetailsOpen,
    selectedBooking,
    setSelectedBooking,
    
    // Actions
    handleOpenSmartModal,
    handleViewDetails,
    handleCloseDetails,
    handleAssignDriver,
    handleAssignVehicle,
    handleUnassign,
    handleUnassignDriver,
    handleUnassignVehicle,
  };
};
