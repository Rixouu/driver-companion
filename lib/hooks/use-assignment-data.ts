import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { BookingWithRelations, DriverWithAvailability, VehicleWithStatus } from '@/types/dispatch';

interface UseAssignmentDataProps {
  lastUpdate?: Date;
}

export const useAssignmentData = ({ lastUpdate }: UseAssignmentDataProps = {}) => {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [drivers, setDrivers] = useState<DriverWithAvailability[]>([]);
  const [vehicles, setVehicles] = useState<VehicleWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      const { data: dispatchData, error: dispatchError } = await supabase
        .from('dispatch_entries')
        .select(`*`);

      if (dispatchError) throw dispatchError;
      const dispatchMap = new Map(dispatchData?.map(d => [d.booking_id, d]) || []);

      // Load bookings with related data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          driver:drivers(id, first_name, last_name, profile_image_url, phone, email),
          vehicle:vehicles(id, name, plate_number, brand, model, image_url)
        `)
        .in('status', ['pending', 'confirmed', 'publish', 'assigned'])
        .order('date', { ascending: true });

      if (bookingsError) throw bookingsError;
      
      const combinedBookings = bookingsData?.map(booking => {
        const dispatchEntry = dispatchMap.get(booking.id);
        const bookingWithDispatchInfo = {
          ...booking,
          wp_id: booking.wp_id || undefined,
          customer_name: booking.customer_name || undefined,
          customer_email: booking.customer_email || undefined,
          customer_phone: booking.customer_phone || undefined,
          driver_id: dispatchEntry?.driver_id || booking.driver_id,
          vehicle_id: dispatchEntry?.vehicle_id || booking.vehicle_id,
          pickup_location: booking.pickup_location || undefined,
          dropoff_location: booking.dropoff_location || undefined,
          notes: booking.notes || undefined,
          status: dispatchEntry ? dispatchEntry.status : booking.status,
          dispatch_entry_id: dispatchEntry?.id,
          service_type_name: undefined, // Will be populated separately
          driver: booking.driver ? {
            ...booking.driver,
            phone: booking.driver.phone || undefined,
            email: booking.driver.email || undefined,
            profile_image_url: booking.driver.profile_image_url || undefined,
          } : undefined,
          vehicle: booking.vehicle ? {
            ...booking.vehicle,
            name: booking.vehicle.name || undefined,
            image_url: booking.vehicle.image_url || undefined,
          } : undefined,
        };
        return bookingWithDispatchInfo;
      }) || [];
      
      setBookings(combinedBookings);

      // Load service type names for bookings
      if (combinedBookings.length > 0) {
        const serviceIds = combinedBookings
          .map(booking => booking.service_id)
          .filter(id => id) as string[];
        
        if (serviceIds.length > 0) {
          const { data: serviceTypesData } = await supabase
            .from('service_types')
            .select('id, name')
            .in('id', serviceIds);
          
          if (serviceTypesData) {
            const serviceTypesMap = new Map(serviceTypesData.map(st => [st.id, st.name]));
            const updatedBookings = combinedBookings.map(booking => ({
              ...booking,
              service_type_name: booking.service_id ? serviceTypesMap.get(booking.service_id) : undefined
            }));
            setBookings(updatedBookings);
          }
        }
      }

      // Load drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .is('deleted_at', null);

      if (driversError) throw driversError;

      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active');

      if (vehiclesError) throw vehiclesError;

      // Process drivers - real data only
      const processedDrivers: DriverWithAvailability[] = driversData?.map(driver => ({
        ...driver,
        phone: driver.phone || undefined,
        email: driver.email || undefined,
        profile_image_url: driver.profile_image_url || undefined,
        status: 'available',
        is_available: true
      })) || [];

      // Process vehicles - real data only
      const processedVehicles: VehicleWithStatus[] = vehiclesData?.map(vehicle => ({
        ...vehicle,
        name: vehicle.name || undefined,
        image_url: vehicle.image_url || undefined,
        year: parseInt(vehicle.year) || 2023,
        is_available: vehicle.status === 'active'
      })) || [];

      setDrivers(processedDrivers);
      setVehicles(processedVehicles);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load assignment data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount and when lastUpdate changes
  useEffect(() => {
    loadData();
  }, [lastUpdate, loadData]);

  return {
    bookings,
    setBookings,
    drivers,
    setDrivers,
    vehicles,
    setVehicles,
    isLoading,
    loadData
  };
};
