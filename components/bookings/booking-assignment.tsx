"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserIcon, CarIcon, Edit } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Booking } from "@/types/bookings";
import { Driver, DriverAvailabilityStatus } from "@/types/drivers";
import { Vehicle } from "@/types/vehicles";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";
import { parseISO } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";

interface BookingAssignmentProps {
  booking: Booking;
  onAssignmentComplete?: () => void;
}

// Helper function to fetch driver/vehicle names (you might already have this or similar)
async function fetchAssignmentDetails(supabase: any, driverId: string | null, vehicleId: string | null): Promise<{ driverName: string | null, vehicleName: string | null }> {
  let driverName: string | null = null;
  let vehicleName: string | null = null;

  if (driverId) {
    const { data: driverData } = await supabase.from('drivers').select('first_name, last_name').eq('id', driverId).single();
    if (driverData) driverName = `${driverData.first_name} ${driverData.last_name}`;
  }
  if (vehicleId) {
    const { data: vehicleData } = await supabase.from('vehicles').select('name, brand, model').eq('id', vehicleId).single();
    if (vehicleData) {
      // Only set vehicleName if we have actual data to display
      if (vehicleData.name || (vehicleData.brand && vehicleData.model)) {
        vehicleName = vehicleData.name || `${vehicleData.brand} ${vehicleData.model}`;
      }
    }
  }
  
  return { 
    driverName: driverName || null, 
    vehicleName: vehicleName || null 
  };
}

export default function BookingAssignment({ booking, onAssignmentComplete }: BookingAssignmentProps) {
  const { t } = useI18n();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // State for current data
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [currentDriverName, setCurrentDriverName] = useState<string | null>(null);
  const [currentVehicleName, setCurrentVehicleName] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // State for available options
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [originalVehicle, setOriginalVehicle] = useState<Vehicle | null>(null);
  const [isOriginalVehicleAvailable, setIsOriginalVehicleAvailable] = useState<boolean>(true);
  
  // Status flags
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Load fresh booking data from the database on mount
  useEffect(() => {
    async function fetchFreshBookingData() {
      if (!booking.supabase_id) return;
      
      setIsLoading(true);
      try {
        console.log("[DEBUG] Fetching fresh booking data from database...");
        const { data: freshBookingData, error } = await supabase
          .from('bookings')
          .select(`
            id,
            driver_id,
            vehicle_id,
            vehicles (id, make, model, year, license_plate, name, brand) 
          `)
          .eq('id', booking.supabase_id)
          .single();
          
        if (error) throw error;
        
        const freshVehicle = freshBookingData?.vehicles as import('@/types/vehicles').Vehicle | null;

        console.log("[DEBUG] Fresh booking data:", freshBookingData);
        console.log("[DEBUG] Fresh vehicle data from join:", freshVehicle);
        
        setCurrentBooking({
          ...booking,
          driver_id: freshBookingData.driver_id || undefined,
          vehicle: freshVehicle 
            ? { 
                id: freshVehicle.id,
                make: freshVehicle.make || freshVehicle.brand || 'N/A', 
                model: freshVehicle.model || freshVehicle.name || 'N/A', 
                year: String(freshVehicle.year || '0000'), 
                registration: freshVehicle.license_plate
              } as import('@/types/bookings').Vehicle 
            : undefined
        });
        
        setSelectedDriverId(freshBookingData.driver_id || null);
        setSelectedVehicleId(freshBookingData.vehicle_id || null);
        
        // Get the names for display
        const { driverName, vehicleName } = await fetchAssignmentDetails(
          supabase, 
          freshBookingData.driver_id, 
          freshBookingData.vehicle_id
        );
        
        console.log("[DEBUG] Display names from fresh data:", { driverName, vehicleName });
        setCurrentDriverName(driverName);
        setCurrentVehicleName(vehicleName);
        
        // Set edit mode only if we don't have both driver and vehicle
        setIsEditing(!(freshBookingData.driver_id && freshBookingData.vehicle_id));
        
        setHasInitialized(true);
      } catch (error) {
        console.error("Error fetching fresh booking data:", error);
        // Fall back to props data if we can't get fresh data
        setCurrentBooking(booking);
        setSelectedDriverId(booking.driver_id || null);
        setSelectedVehicleId(booking.vehicle?.id || null);
        setIsEditing(!(booking.driver_id && booking.vehicle?.id));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFreshBookingData();
  }, [booking.supabase_id, supabase]);

  // Load available drivers and vehicles
  useEffect(() => {
    if (!hasInitialized || !currentBooking) return;
    
    async function loadAvailabilityData() {
      if (!currentBooking) {
        console.warn("[DEBUG] loadAvailabilityData called with null currentBooking, returning.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Fetch booking date and time for availability check
        const bookingDate = currentBooking.date;
        const bookingTime = currentBooking.time;
        const bookingDateTimeStr = `${bookingDate}T${bookingTime}:00`;
        const bookingDateTime = new Date(bookingDateTimeStr);
        
        console.log("[DEBUG] Checking availability for booking datetime:", bookingDateTimeStr);

        // Create a time buffer for the booking (e.g., 2 hours before and after)
        const bufferHours = 2;
        const bookingStartTime = new Date(bookingDateTime);
        bookingStartTime.setHours(bookingStartTime.getHours() - bufferHours);
        
        const bookingEndTime = new Date(bookingDateTime);
        const durationMinutes = parseInt(String(currentBooking.duration || "60"));
        bookingEndTime.setMinutes(bookingEndTime.getMinutes() + durationMinutes + (bufferHours * 60));
        
        // Format dates for database queries
        const startTimeISO = bookingStartTime.toISOString();
        const endTimeISO = bookingEndTime.toISOString();
        
        console.log("[DEBUG] Availability check window:", { 
          start: startTimeISO, 
          end: endTimeISO,
          bookingId: currentBooking!.supabase_id
        });

        // Fetch ALL drivers to display in the dropdown
        const { data: allDriversData, error: driversError } = await supabase
          .from('drivers')
          .select('*')
          .returns<import('@/types/drivers').Driver[]>();

        if (driversError) throw driversError;
        
        // Fetch driver availability records to check conflicts
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('driver_availability')
          .select('*');
          
        if (availabilityError) throw availabilityError;
        
        // Fetch existing bookings to check which drivers and vehicles are already assigned
        // during the time window of this booking
        const { data: existingBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, driver_id, vehicle_id, date, time, duration')
          .neq('id', currentBooking.supabase_id) // Exclude current booking
          .eq('status', 'confirmed'); // Only consider confirmed bookings
          
        if (bookingsError) throw bookingsError;
        
        console.log("[DEBUG] Found existing bookings:", existingBookings?.length || 0);
        
        // Create sets of unavailable driver and vehicle IDs
        const unavailableDriverIds = new Set<string>();
        const unavailableVehicleIds = new Set<string>();
        
        // Check existing bookings for conflicts
        existingBookings?.forEach(booking => {
          // Convert booking time to Date object for comparison
          const bookingTimeStr = `${booking.date}T${booking.time}:00`;
          const bookingTime = new Date(bookingTimeStr);
          const bookingEnd = new Date(bookingTime);
          bookingEnd.setMinutes(bookingEnd.getMinutes() + parseInt(String(booking.duration || "60")));
          
          // Check if this booking overlaps with our time window
          const hasOverlap = (
            (bookingTime >= bookingStartTime && bookingTime <= bookingEndTime) || // Booking starts during our window
            (bookingEnd >= bookingStartTime && bookingEnd <= bookingEndTime) || // Booking ends during our window
            (bookingTime <= bookingStartTime && bookingEnd >= bookingEndTime) // Booking spans our entire window
          );
          
          if (hasOverlap) {
            // Mark this driver as unavailable
            if (booking.driver_id) {
              unavailableDriverIds.add(booking.driver_id);
            }
            
            // Mark this vehicle as unavailable
            if (booking.vehicle_id) {
              unavailableVehicleIds.add(booking.vehicle_id);
            }
          }
        });
        
        // Check driver availability records
        availabilityData?.forEach(availability => {
          // Only consider unavailable statuses
          if (availability.status === 'unavailable' || 
              availability.status === 'leave' || 
              availability.status === 'training') {
            
            const availStartDate = new Date(availability.start_date);
            const availEndDate = new Date(availability.end_date);
            
            // Check if any unavailability record conflicts with our booking window
            const hasConflict = (
              (availStartDate <= bookingEndTime && availEndDate >= bookingStartTime)
            );
            
            if (hasConflict) {
              unavailableDriverIds.add(availability.driver_id);
            }
          }
        });
        
        console.log("[DEBUG] Unavailable resources:", { 
          drivers: unavailableDriverIds.size, 
          vehicles: unavailableVehicleIds.size 
        });

        // Fetch ALL vehicles to check if the original vehicle exists
        const { data: allVehiclesData, error: allVehiclesError } = await supabase
          .from('vehicles')
          .select('*');

        if (allVehiclesError) throw allVehiclesError;

        // Filter available drivers
        const availableDriversList = allDriversData?.filter(driver => 
          // Driver is available if not in the unavailable set and is active
          driver.status && driver.status === 'available'
        );
        
        // Filter available vehicles
        const availableVehiclesList = allVehiclesData?.filter(vehicle => 
          // Vehicle is available if not in the unavailable set and is active
          !unavailableVehicleIds.has(vehicle.id) && vehicle.status === 'active'
        );

        // Check if the booking has an original vehicle
        let bookingVehicleId = currentBooking!.vehicle?.id;
        
        if (bookingVehicleId) {
          // Find the original vehicle in all vehicles
          const originalVehicleData = allVehiclesData?.find(v => v.id === bookingVehicleId);
          
          if (originalVehicleData) {
            // Map vehicle data to our expected format
            const mappedOriginalVehicle = {
              id: originalVehicleData.id,
              created_at: originalVehicleData.created_at,
              updated_at: originalVehicleData.updated_at,
              make: originalVehicleData.brand || "",
              model: originalVehicleData.model || "",
              year: parseInt(originalVehicleData.year) || new Date().getFullYear(),
              license_plate: originalVehicleData.plate_number || "",
              vin: originalVehicleData.vin || "",
              image_url: originalVehicleData.image_url || undefined,
              status: originalVehicleData.status as 'active' | 'maintenance' | 'retired',
              last_inspection: originalVehicleData.last_inspection || undefined
            } as Vehicle;
            
            setOriginalVehicle(mappedOriginalVehicle);
            
            // Check if the original vehicle is currently available
            // A vehicle is unavailable if:
            // 1. It's in the unavailable set (already assigned to another booking)
            // 2. It's not in the active status
            const isAvailable = !unavailableVehicleIds.has(bookingVehicleId) && 
                               originalVehicleData.status === 'active';
            
            setIsOriginalVehicleAvailable(isAvailable);
            console.log("[DEBUG] Original vehicle availability:", { 
              id: bookingVehicleId, 
              isAvailable, 
              status: originalVehicleData.status 
            });
          }
        }

        // Convert to expected types
        const mappedDrivers = availableDriversList?.map(driver => ({
          // Ensure all required Driver fields are present
          id: driver.id,
          first_name: driver.first_name,
          last_name: driver.last_name,
          full_name: `${driver.first_name} ${driver.last_name}`,
          email: driver.email || "",
          phone: driver.phone || undefined,
          license_number: driver.license_number || undefined,
          status: driver.status as DriverAvailabilityStatus || 'available', // Use fetched status
          created_at: driver.created_at || new Date().toISOString(),
          // Add other optional fields if they exist on the fetched data
          line_id: driver.line_id || undefined,
          license_expiry: driver.license_expiry || undefined,
          profile_image_url: driver.profile_image_url || undefined,
          address: driver.address || undefined,
          emergency_contact: driver.emergency_contact || undefined,
          notes: driver.notes || undefined,
          user_id: driver.user_id || undefined,
          assigned_vehicles: [],
          updated_at: driver.updated_at || undefined,
          deleted_at: driver.deleted_at || null,
        })) as Driver[];

        const mappedVehicles = availableVehiclesList?.map(vehicle => ({
          id: vehicle.id,
          created_at: vehicle.created_at,
          updated_at: vehicle.updated_at,
          make: vehicle.brand || "",
          model: vehicle.model || "",
          year: parseInt(vehicle.year) || new Date().getFullYear(),
          license_plate: vehicle.plate_number || "",
          vin: vehicle.vin || "",
          image_url: vehicle.image_url || undefined,
          status: vehicle.status as 'active' | 'maintenance' | 'retired',
          last_inspection: vehicle.last_inspection || undefined
        })) as Vehicle[];

        setAvailableDrivers(mappedDrivers);
        console.log("[DEBUG] Available drivers:", mappedDrivers.length);
        
        setAvailableVehicles(mappedVehicles);
        console.log("[DEBUG] Available vehicles:", mappedVehicles.length);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading assignment data:", error);
        toast({
          title: "Error",
          description: "Failed to load available drivers and vehicles",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }

    loadAvailabilityData();
  }, [hasInitialized, currentBooking, supabase]);

  // Add a more detailed logging in value change handler
  const handleValueChange = (field: 'driver' | 'vehicle', value: string) => {
    console.log(`[DEBUG] ${field} selection changed to: '${value}'`);
    if (field === 'driver') {
      setSelectedDriverId(value === "none" ? null : value);
      console.log(`[DEBUG] selectedDriverId set to:`, value === "none" ? null : value);
    } else if (field === 'vehicle') {
      setSelectedVehicleId(value === "none" ? null : value);
      console.log(`[DEBUG] selectedVehicleId set to:`, value === "none" ? null : value);
    }
  };

  const handleAssign = async () => {
    console.log('[DEBUG] --- Assignment process started ---');
    console.log('[DEBUG] Initial values:', {
      selectedDriverId,
      selectedVehicleId,
      isDriverNone: selectedDriverId === "none",
      isVehicleNone: selectedVehicleId === "none",
      isDriverNull: selectedDriverId === null,
      isVehicleNull: selectedVehicleId === null
    });

    setIsSubmitting(true);
    try {
      if (!currentBooking?.supabase_id) {
        throw new Error('Valid Booking Supabase UUID is missing');
      }
      const bookingUUID = currentBooking.supabase_id;
      
      // Validate UUID format only if an ID is actually selected
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (selectedDriverId && selectedDriverId !== "none" && !uuidPattern.test(selectedDriverId)) {
        throw new Error('Invalid Driver ID format (not a UUID)');
      }
      if (selectedVehicleId && selectedVehicleId !== "none" && !uuidPattern.test(selectedVehicleId)) {
        throw new Error('Invalid Vehicle ID format (not a UUID)');
      }

      // Process driver_id and vehicle_id values with careful null handling
      let driver_id: string | null = null;
      let vehicle_id: string | null = null;
      
      // Handle driver ID
      if (selectedDriverId !== "none" && selectedDriverId !== null) {
        driver_id = selectedDriverId;
      }
      
      // Handle vehicle ID
      if (selectedVehicleId !== "none" && selectedVehicleId !== null) {
        vehicle_id = selectedVehicleId;
      }
      
      console.log("[DEBUG] Processed values for DB update:", { driver_id, vehicle_id });
      
      // Prepare updates
      const updates = {
        driver_id,
        vehicle_id
      };
      
      console.log("[DEBUG] Sending to DB:", updates);
      
      // Start a transaction to ensure all related updates are atomic
      // First update the booking
      const { data: updateResult, error: bookingUpdateError } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingUUID)
        .select();

      if (bookingUpdateError) {
        console.error("[DEBUG] Error updating booking:", bookingUpdateError);
        throw bookingUpdateError;
      }

      console.log("[DEBUG] Booking update result:", updateResult);

      // Calculate booking time window
      const bookingDate = parseISO(currentBooking.date);
      const startTime = `${bookingDate.toISOString().split('T')[0]}T${currentBooking.time}:00`;
      const durationMinutes = parseInt(String(currentBooking.duration || "60"));
      const endTimeDate = new Date(new Date(startTime).getTime() + durationMinutes * 60000);
      
      // Determine assignment status
      const isFullyAssigned = driver_id !== null && vehicle_id !== null;
      const assignmentStatus = isFullyAssigned ? 'assigned' : 'pending';
      
      console.log("[DEBUG] Assignment status:", { 
        isFullyAssigned, 
        assignmentStatus,
        driver_id_set: driver_id !== null,
        vehicle_id_set: vehicle_id !== null
      });

      // Update vehicle status if a vehicle is assigned
      if (vehicle_id) {
        console.log("[DEBUG] Updating vehicle status to 'assigned' for vehicle:", vehicle_id);
        const { error: vehicleUpdateError } = await supabase
          .from('vehicles')
          .update({ 
            status: 'assigned',
            updated_at: new Date().toISOString() 
          })
          .eq('id', vehicle_id);
          
        if (vehicleUpdateError) {
          console.error("[DEBUG] Error updating vehicle status:", vehicleUpdateError);
          // Log but don't throw error - continue with remaining operations
        }
      }
      
      // Update driver status if a driver is assigned
      if (driver_id) {
        console.log("[DEBUG] Creating driver unavailability record for the booking timeframe");
        
        // First check if an overlapping availability record already exists
        const { data: existingAvailability, error: checkAvailabilityError } = await supabase
          .from('driver_availability')
          .select('id')
          .eq('driver_id', driver_id)
          .lte('start_date', endTimeDate.toISOString())
          .gte('end_date', startTime)
          .eq('notes', `Assigned to booking ${bookingUUID}`)
          .maybeSingle();
          
        if (checkAvailabilityError) {
          console.error("[DEBUG] Error checking existing driver availability:", checkAvailabilityError);
        }
        
        // If an availability record already exists for this booking, update it
        // Otherwise create a new one
        if (existingAvailability) {
          console.log("[DEBUG] Updating existing driver availability record");
          const { error: updateAvailError } = await supabase
            .from('driver_availability')
            .update({
              start_date: startTime,
              end_date: endTimeDate.toISOString(),
              status: 'unavailable',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAvailability.id);
            
          if (updateAvailError) {
            console.error("[DEBUG] Error updating driver availability record:", updateAvailError);
          }
        } else {
          // Create a driver_availability record to mark the driver as unavailable 
          // during the booking timeframe
          const { error: driverAvailError } = await supabase
            .from('driver_availability')
            .insert({
              driver_id: driver_id,
              start_date: startTime,
              end_date: endTimeDate.toISOString(),
              status: 'unavailable',
              notes: `Assigned to booking ${bookingUUID}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (driverAvailError) {
            console.error("[DEBUG] Error creating driver availability record:", driverAvailError);
          }
        }
      }
      
      // Prepare dispatch update
      const dispatchUpdate = {
        driver_id,
        vehicle_id,
        status: assignmentStatus,
        start_time: startTime,
        end_time: endTimeDate.toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log("[DEBUG] Dispatch update payload:", dispatchUpdate);

      // Update dispatch entry if it exists
      const { data: existingEntry, error: dispatchError } = await supabase
        .from('dispatch_entries')
        .select('id')
        .eq('booking_id', bookingUUID) 
        .maybeSingle();

      if (dispatchError && dispatchError.code !== 'PGRST116') {
        throw dispatchError;
      }

      if (existingEntry) {
        console.log("[DEBUG] Updating existing dispatch entry:", existingEntry.id);
        const { data: dispatchUpdateResult, error: updateError } = await supabase
          .from('dispatch_entries')
          .update(dispatchUpdate)
          .eq('id', existingEntry.id)
          .select();
          
        if (updateError) {
          console.error("[DEBUG] Error updating dispatch:", updateError);
          throw updateError;
        }
        console.log("[DEBUG] Dispatch update result:", dispatchUpdateResult);
      } else {
        // Insert new dispatch entry only if fully assigned
        if (isFullyAssigned) { 
          console.log("[DEBUG] Creating new dispatch entry (fully assigned)");
          const { data: newDispatch, error: insertError } = await supabase
            .from('dispatch_entries')
            .insert({
              ...dispatchUpdate,
              booking_id: bookingUUID,
              created_at: new Date().toISOString(),
            })
            .select();
            
          if (insertError) {
            console.error("[DEBUG] Error inserting dispatch:", insertError);
            throw insertError;
          }
          console.log("[DEBUG] New dispatch created:", newDispatch);
        } else {
          console.log("[DEBUG] Not creating dispatch entry - not fully assigned");
        }
      }

      // Create entry in vehicle_assignments if a vehicle is assigned
      if (driver_id && vehicle_id) {
        console.log("[DEBUG] Creating or updating vehicle assignment record");
        
        // First check if an assignment already exists for this combination
        const { data: existingAssignment, error: checkAssignmentError } = await supabase
          .from('vehicle_assignments')
          .select('id')
          .eq('vehicle_id', vehicle_id)
          .eq('driver_id', driver_id)
          .eq('status', 'active')
          .maybeSingle();
          
        if (checkAssignmentError) {
          console.error("[DEBUG] Error checking existing vehicle assignment:", checkAssignmentError);
        }
        
        if (existingAssignment) {
          console.log("[DEBUG] Updating existing vehicle assignment record");
          const { error: updateAssignmentError } = await supabase
            .from('vehicle_assignments')
            .update({
              start_date: startTime,
              end_date: endTimeDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAssignment.id);
            
          if (updateAssignmentError) {
            console.error("[DEBUG] Error updating vehicle assignment:", updateAssignmentError);
          }
        } else {
          const { error: assignmentError } = await supabase
            .from('vehicle_assignments')
            .insert({
              vehicle_id: vehicle_id,
              driver_id: driver_id,
              start_date: startTime,
              end_date: endTimeDate.toISOString(),
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (assignmentError) {
            console.error("[DEBUG] Error creating vehicle assignment:", assignmentError);
          }
        }
      }

      toast({ description: t('bookings.assignment.assignSuccess') });
      
      console.log("[DEBUG] Assignment completed, updating state", { driver_id, vehicle_id });
      
      // Update our local state with the new values
      // This will ensure the UI reflects the changes immediately
      setCurrentBooking((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          driver_id: driver_id,
          vehicle: vehicle_id ? { id: vehicle_id } : undefined
        } as any; // Type assertion to avoid TypeScript errors
      });
      
      // Exit editing mode
      setIsEditing(false);
      
      // Explicitly set current names to null when "Not assigned" is selected
      if (!driver_id && !vehicle_id) {
        console.log("[DEBUG] Both driver and vehicle are null, explicitly setting display to 'Not assigned'");
        setCurrentDriverName(null);
        setCurrentVehicleName(null);
      } else {
        // Refresh display names
        const { driverName, vehicleName } = await fetchAssignmentDetails(
          supabase, 
          driver_id, 
          vehicle_id
        );
        setCurrentDriverName(driverName);
        setCurrentVehicleName(vehicleName);
        console.log("[DEBUG] Updated names:", { driverName, vehicleName });
      }
      
      // Notify parent
      if (onAssignmentComplete) {
        console.log("[DEBUG] Calling onAssignmentComplete callback to refresh UI");
        onAssignmentComplete();
      }
      
      console.log('[DEBUG] --- Assignment process completed successfully ---');
    } catch (error: any) {
      console.error("[DEBUG] --- Assignment process failed ---", error);
      toast({ 
        title: t('common.error'), 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    // Use current booking data for initial values
    setSelectedDriverId(currentBooking?.driver_id || null);
    setSelectedVehicleId(currentBooking?.vehicle?.id || null);
  };

  const getDriverById = (driverId: string) => {
    return availableDrivers.find(driver => driver.id === driverId);
  };

  const getVehicleById = (vehicleId: string) => {
    return availableVehicles.find(vehicle => vehicle.id === vehicleId);
  };

  // If we don't have current booking data yet, show loading
  if (!currentBooking && isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Booking Details Section */}
          <div className="border rounded-md overflow-hidden">
            <div className="px-4 py-3 bg-text-muted border-b">
              <h3 className="text-base font-medium">{t('bookings.assignment.bookingDetails')}</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">{t('bookings.assignment.pickupDate')}</div>
                  <div className="font-medium">{currentBooking?.date}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('bookings.assignment.pickupTime')}</div>
                  <div className="font-medium">{currentBooking?.time}</div>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">{t('bookings.assignment.pickupLocation')}</div>
                <div className="font-medium">{currentBooking?.pickup_location}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('bookings.assignment.dropoffLocation')}</div>
                <div className="font-medium">{currentBooking?.dropoff_location}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Driver Column */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <UserIcon className="h-5 w-5" />
                <h3 className="text-base font-medium">{t('bookings.assignment.driver')}</h3>
              </div>
              
              {/* Driver Display - More robust check */}
              {isEditing ? (
                <Select 
                  value={selectedDriverId ?? "none"}
                  onValueChange={(value) => handleValueChange('driver', value)}
                >
                  <SelectTrigger id="driver-select" className="w-full">
                    <SelectValue placeholder={t('bookings.assignment.notAssigned')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('bookings.assignment.notAssigned')}</SelectItem>
                    {availableDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 border rounded-md">
                  <p className="text-foreground">
                    {currentDriverName ? currentDriverName : t('bookings.assignment.notAssigned')}
                  </p>
                </div>
              )}
              
              {/* Driver Details */}
              <div className="mt-3 p-3 bg-muted/30 border border-border rounded-md">
                <p className="text-sm font-medium text-muted-foreground">{t('bookings.assignment.driverDetails')}</p>
                {selectedDriverId && getDriverById(selectedDriverId) && (
                  <div className="mt-2 grid gap-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('bookings.assignment.name')}:</span>
                      <span className="text-sm">{getDriverById(selectedDriverId)?.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('bookings.assignment.phone')}:</span>
                      <span className="text-sm">{getDriverById(selectedDriverId)?.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('bookings.assignment.email')}:</span>
                      <span className="text-sm">{getDriverById(selectedDriverId)?.email || "—"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Vehicle Column */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <CarIcon className="h-5 w-5" />
                <h3 className="text-base font-medium">{t('bookings.assignment.vehicle')}</h3>
              </div>
              
              {/* Vehicle Display - Now showing original vehicle when possible */}
              {isEditing ? (
                <Select 
                  value={selectedVehicleId ?? "none"}
                  onValueChange={(value) => handleValueChange('vehicle', value)}
                >
                  <SelectTrigger id="vehicle-select" className="w-full">
                    <SelectValue placeholder={t('bookings.assignment.notAssigned')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('bookings.assignment.notAssigned')}</SelectItem>
                    
                    {/* Show original vehicle first if it exists */}
                    {originalVehicle && (
                      <SelectItem 
                        key={originalVehicle.id} 
                        value={originalVehicle.id}
                        disabled={!isOriginalVehicleAvailable}
                      >
                        {originalVehicle.make} {originalVehicle.model} ({originalVehicle.license_plate})
                        {!isOriginalVehicleAvailable && ` - ${t('bookings.assignment.notAvailable')}`}
                      </SelectItem>
                    )}
                    
                    {/* Show separator if we're displaying both original and alternatives */}
                    {originalVehicle && !isOriginalVehicleAvailable && availableVehicles.length > 0 && (
                      <SelectItem value="separator" disabled>
                        {t('bookings.assignment.alternativeVehicles')}
                      </SelectItem>
                    )}
                    
                    {/* Show available alternatives only if different from original vehicle */}
                    {availableVehicles
                      .filter(vehicle => !originalVehicle || vehicle.id !== originalVehicle.id)
                      .map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 border rounded-md">
                  <p className="text-foreground">
                    {currentVehicleName ? currentVehicleName : t('bookings.assignment.notAssigned')}
                  </p>
                </div>
              )}
              
              {/* Vehicle Details */}
              <div className="mt-3 p-3 bg-muted/30 border border-border rounded-md">
                <p className="text-sm font-medium text-muted-foreground">{t('bookings.assignment.vehicleDetails')}</p>
                {selectedVehicleId && getVehicleById(selectedVehicleId) && (
                  <div className="mt-2 grid gap-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('bookings.assignment.licensePlate')}:</span>
                      <span className="text-sm">{getVehicleById(selectedVehicleId)?.license_plate || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('bookings.assignment.vehicleBrand')}:</span>
                      <span className="text-sm">{getVehicleById(selectedVehicleId)?.make || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t('bookings.assignment.vehicleModel')}:</span>
                      <span className="text-sm">{getVehicleById(selectedVehicleId)?.model || "—"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end border-t pt-4 mt-4">
            {isEditing ? (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAssign} disabled={isSubmitting}>
                  {isSubmitting ? t('bookings.assignment.saving') : t('bookings.assignment.confirmAssignment')}
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleEditClick}
                className="w-full md:w-auto"
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('bookings.assignment.edit')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 