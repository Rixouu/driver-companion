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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
  const supabase = createClientComponentClient<Database>();
  
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
        const { data: freshBooking, error } = await supabase
          .from('bookings')
          .select('id, driver_id, vehicle_id')
          .eq('id', booking.supabase_id)
          .single();
          
        if (error) throw error;
        
        console.log("[DEBUG] Fresh booking data:", freshBooking);
        
        // Only update these specific fields
        setCurrentBooking({
          ...booking,
          driver_id: freshBooking.driver_id || null,
          vehicle: freshBooking.vehicle_id ? { id: freshBooking.vehicle_id } : null
        });
        
        // Set the initial selection values based on the fresh data
        setSelectedDriverId(freshBooking.driver_id || null);
        setSelectedVehicleId(freshBooking.vehicle_id || null);
        
        // Get the names for display
        const { driverName, vehicleName } = await fetchAssignmentDetails(
          supabase, 
          freshBooking.driver_id, 
          freshBooking.vehicle_id
        );
        
        console.log("[DEBUG] Display names from fresh data:", { driverName, vehicleName });
        setCurrentDriverName(driverName);
        setCurrentVehicleName(vehicleName);
        
        // Set edit mode only if we don't have both driver and vehicle
        setIsEditing(!(freshBooking.driver_id && freshBooking.vehicle_id));
        
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
      setIsLoading(true);
      try {
        // Fetch booking date and time for availability check
        const bookingDate = currentBooking.date;
        const bookingTime = currentBooking.time;
        const bookingDateTimeStr = `${bookingDate}T${bookingTime}:00`;
        const bookingDateTime = new Date(bookingDateTimeStr);

        // Fetch drivers that are available
        const { data: driversData, error: driversError } = await supabase
          .from('drivers')
          .select('*')
          .eq('status', 'available');

        if (driversError) throw driversError;

        // Fetch ALL vehicles to check if the original vehicle exists
        const { data: allVehiclesData, error: allVehiclesError } = await supabase
          .from('vehicles')
          .select('*');

        if (allVehiclesError) throw allVehiclesError;

        // Fetch vehicles that are available (not in maintenance)
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('status', 'active');

        if (vehiclesError) throw vehiclesError;

        // Check if the booking has an original vehicle
        let bookingVehicleId = currentBooking.vehicle?.id;
        
        if (bookingVehicleId) {
          // Find the original vehicle in all vehicles
          const originalVehicleData = allVehiclesData?.find(v => v.id === bookingVehicleId);
          
          if (originalVehicleData) {
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
            const isAvailable = vehiclesData?.some(v => v.id === bookingVehicleId);
            setIsOriginalVehicleAvailable(!!isAvailable);
          }
        }

        // Fetch driver availability records
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('driver_availability')
          .select('*');
          
        if (availabilityError) throw availabilityError;

        // Fetch current vehicle assignments
        const { data: vehicleAssignments, error: assignmentsError } = await supabase
          .from('vehicle_assignments')
          .select('*')
          .eq('status', 'active');
          
        if (assignmentsError) throw assignmentsError;

        // Filter drivers based on availability
        const availableDriversList = driversData?.filter(driver => {
          // Get this driver's unavailability records
          const driverUnavailability = availabilityData?.filter(
            avail => avail.driver_id === driver.id && 
            (avail.status === 'unavailable' || avail.status === 'leave' || avail.status === 'training')
          );

          // If driver has no unavailability records, they're available
          if (!driverUnavailability || driverUnavailability.length === 0) {
            return true;
          }

          // Check if any unavailability conflicts with booking time
          const hasConflict = driverUnavailability.some(avail => {
            const availStartDate = new Date(avail.start_date);
            const availEndDate = new Date(avail.end_date);
            
            return bookingDateTime >= availStartDate && bookingDateTime <= availEndDate;
          });

          // Driver is available if there's no conflict
          return !hasConflict;
        });

        // Filter vehicles based on current assignments and maintenance status
        const assignedVehicleIds = new Set(
          vehicleAssignments?.map(assignment => assignment.vehicle_id) || []
        );

        const availableVehiclesList = vehiclesData?.filter(vehicle => 
          !assignedVehicleIds.has(vehicle.id) && vehicle.status === 'active'
        );

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
        setAvailableVehicles(mappedVehicles);
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
      if (selectedDriverId && !uuidPattern.test(selectedDriverId)) {
        throw new Error('Invalid Driver ID format (not a UUID)');
      }
      if (selectedVehicleId && !uuidPattern.test(selectedVehicleId)) {
        throw new Error('Invalid Vehicle ID format (not a UUID)');
      }

      // Process driver_id and vehicle_id values with more careful null handling
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
      
      // Prepare updates - now with our carefully processed values
      const updates = {
        driver_id,
        vehicle_id
      };
      
      console.log("[DEBUG] Sending to DB:", updates);
      
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

      // Update dispatch_entries similarly, allowing nulls
      const { data: existingEntry, error: dispatchError } = await supabase
        .from('dispatch_entries')
        .select('id')
        .eq('booking_id', bookingUUID) 
        .maybeSingle();

      if (dispatchError && dispatchError.code !== 'PGRST116') {
        throw dispatchError;
      }

      // Calculate start/end times for dispatch
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
      
      // Prepare dispatch update with our processed values
      const dispatchUpdate = {
        driver_id,
        vehicle_id,
        status: assignmentStatus,
        start_time: startTime,
        end_time: endTimeDate.toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log("[DEBUG] Dispatch update payload:", dispatchUpdate);

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

      toast({ description: t('bookings.assignment.assignSuccess') });
      
      console.log("[DEBUG] Assignment completed, updating state", { driver_id, vehicle_id });
      
      // Update our local state with the new values
      // This will ensure the UI reflects the changes immediately
      setCurrentBooking((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          driver_id: driver_id,
          vehicle: vehicle_id ? { id: vehicle_id } : null
        };
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