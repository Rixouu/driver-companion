import { useMemo } from 'react';
import { BookingWithRelations, DriverWithAvailability, VehicleWithStatus } from '@/types/dispatch';

interface UseAssignmentStatsProps {
  bookings: BookingWithRelations[];
  drivers: DriverWithAvailability[];
  vehicles: VehicleWithStatus[];
}

export const useAssignmentStats = ({ bookings, drivers, vehicles }: UseAssignmentStatsProps) => {
  const stats = useMemo(() => {
    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter(d => d.is_available).length;
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.is_available).length;
    const pendingBookings = bookings.filter(b => !b.driver_id || !b.vehicle_id).length;
    const assignedBookings = bookings.filter(b => b.driver_id && b.vehicle_id).length;
    const totalBookings = bookings.length;

    // Calculate assignment percentages
    const assignmentRate = totalBookings > 0 ? (assignedBookings / totalBookings) * 100 : 0;
    const driverUtilization = totalDrivers > 0 ? (assignedBookings / totalDrivers) * 100 : 0;
    const vehicleUtilization = totalVehicles > 0 ? (assignedBookings / totalVehicles) * 100 : 0;

    // Status breakdown
    const statusBreakdown = {
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      assigned: bookings.filter(b => b.status === 'assigned').length,
      publish: bookings.filter(b => b.status === 'publish').length,
    };

    // Service type breakdown
    const serviceBreakdown = bookings.reduce((acc, booking) => {
      const serviceType = booking.service_type_name || 'Unknown';
      acc[serviceType] = (acc[serviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      // Basic counts
      totalDrivers,
      availableDrivers,
      totalVehicles,
      availableVehicles,
      pendingBookings,
      assignedBookings,
      totalBookings,
      
      // Percentages
      assignmentRate: Math.round(assignmentRate * 100) / 100,
      driverUtilization: Math.round(driverUtilization * 100) / 100,
      vehicleUtilization: Math.round(vehicleUtilization * 100) / 100,
      
      // Breakdowns
      statusBreakdown,
      serviceBreakdown,
      
      // Availability
      driverAvailability: totalDrivers > 0 ? Math.round((availableDrivers / totalDrivers) * 100) : 0,
      vehicleAvailability: totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 0,
    };
  }, [bookings, drivers, vehicles]);

  return stats;
};
