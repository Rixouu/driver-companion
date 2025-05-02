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
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(booking.driver_id || null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(booking.vehicle?.id || null);
  const [currentDriverName, setCurrentDriverName] = useState<string | null>(null);
  const [currentVehicleName, setCurrentVehicleName] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!(booking.driver_id && booking.vehicle?.id));
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [originalVehicle, setOriginalVehicle] = useState<Vehicle | null>(null);
  const [isOriginalVehicleAvailable, setIsOriginalVehicleAvailable] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClientComponentClient<Database>();

  // Load available drivers and vehicles
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Fetch booking date and time for availability check
        const bookingDate = booking.date;
        const bookingTime = booking.time;
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
        let bookingVehicleId = booking.vehicle?.id;
        
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

    loadData();
  }, [supabase, booking]);

  useEffect(() => {
    // Fetch initial names if already assigned
    if (booking.driver_id || booking.vehicle?.id) {
      // Pass null explicitly if driver_id is undefined
      fetchAssignmentDetails(supabase, booking.driver_id || null, booking.vehicle?.id || null)
        .then(({ driverName, vehicleName }) => {
          setCurrentDriverName(driverName);
          setCurrentVehicleName(vehicleName);
          // If fully assigned initially, don't start in editing mode
          if (driverName && vehicleName) {
            setIsEditing(false);
          }
        });
    } else {
      // Explicitly set names to null when no assignments exist
      setCurrentDriverName(null);
      setCurrentVehicleName(null);
    }
  }, [supabase, booking.driver_id, booking.vehicle?.id]);

  const handleAssign = async () => {
    setIsSubmitting(true);
    try {
      const bookingUUID = booking.supabase_id;
      if (!bookingUUID || typeof bookingUUID !== 'string') {
         throw new Error('Valid Booking Supabase UUID is missing or invalid');
      }
      
      // Validate UUID format only if an ID is actually selected
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (selectedDriverId && !uuidPattern.test(selectedDriverId)) {
        throw new Error('Invalid Driver ID format (not a UUID)');
      }
      if (selectedVehicleId && !uuidPattern.test(selectedVehicleId)) {
        throw new Error('Invalid Vehicle ID format (not a UUID)');
      }

      // Prepare updates, explicitly setting null if needed
      const updates = {
        driver_id: selectedDriverId, // Will be null if "None" was selected
        vehicle_id: selectedVehicleId // Will be null if "None" was selected
      };
      
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingUUID);

      if (bookingUpdateError) {
        console.error("Error updating booking:", bookingUpdateError);
        throw bookingUpdateError;
      }

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
      const bookingDate = parseISO(booking.date);
      const startTime = `${bookingDate.toISOString().split('T')[0]}T${booking.time}:00`;
      const durationMinutes = parseInt(String(booking.duration || "60"));
      const endTimeDate = new Date(new Date(startTime).getTime() + durationMinutes * 60000);
      
      // Prepare dispatch update
      const dispatchUpdate = {
        driver_id: selectedDriverId,
        vehicle_id: selectedVehicleId,
        status: selectedDriverId && selectedVehicleId ? 'assigned' : 'pending',
        start_time: startTime,
        end_time: endTimeDate.toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingEntry) {
        const { error: updateError } = await supabase
          .from('dispatch_entries')
          .update(dispatchUpdate)
          .eq('id', existingEntry.id);
        if (updateError) throw updateError;
      } else {
        // Insert new dispatch entry (only if fully assigned for now)
        if (selectedDriverId && selectedVehicleId) { 
          const { error: insertError } = await supabase
            .from('dispatch_entries')
            .insert({
              ...dispatchUpdate,
              booking_id: bookingUUID,
              created_at: new Date().toISOString(),
            });
          if (insertError) throw insertError;
        }
      }

      toast({ description: "Assignment updated successfully" });
      setIsEditing(false); // Exit editing mode
      // Refresh assigned names
      fetchAssignmentDetails(supabase, selectedDriverId, selectedVehicleId)
        .then(({ driverName, vehicleName }) => {
          setCurrentDriverName(driverName);
          setCurrentVehicleName(vehicleName);
        });
      if (onAssignmentComplete) onAssignmentComplete();

    } catch (error: any) {
      console.error("Error during assignment:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setSelectedDriverId(booking.driver_id || null);
    setSelectedVehicleId(booking.vehicle?.id || null);
  };

  const getDriverById = (driverId: string) => {
    return availableDrivers.find(driver => driver.id === driverId);
  };

  const getVehicleById = (vehicleId: string) => {
    return availableVehicles.find(vehicle => vehicle.id === vehicleId);
  };

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
              <h3 className="text-base font-medium">Booking Details</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-muted-foreground">Pickup Date</div>
                  <div className="font-medium">{booking.date}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Pickup Time</div>
                  <div className="font-medium">{booking.time}</div>
                </div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Pickup Location</div>
                <div className="font-medium">{booking.pickup_location}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Dropoff Location</div>
                <div className="font-medium">{booking.dropoff_location}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Driver Column */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <UserIcon className="h-5 w-5" />
                <h3 className="text-base font-medium">Driver</h3>
              </div>
              
              {/* Driver Display - More robust check */}
              {isEditing ? (
                <Select 
                  value={selectedDriverId ?? "none"}
                  onValueChange={(value) => setSelectedDriverId(value === "none" ? null : value)}
                >
                  <SelectTrigger id="driver-select" className="w-full">
                    <SelectValue placeholder="Not assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not assigned</SelectItem>
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
                    {currentDriverName ? currentDriverName : "Not assigned"}
                  </p>
                </div>
              )}
              
              {/* Driver Details */}
              <div className="mt-3 p-3 bg-muted/30 border border-border rounded-md">
                <p className="text-sm font-medium text-muted-foreground">Driver Details</p>
                {selectedDriverId && getDriverById(selectedDriverId) && (
                  <div className="mt-2 grid gap-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <span className="text-sm">{getDriverById(selectedDriverId)?.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <span className="text-sm">{getDriverById(selectedDriverId)?.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
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
                <h3 className="text-base font-medium">Vehicle</h3>
              </div>
              
              {/* Vehicle Display - Now showing original vehicle when possible */}
              {isEditing ? (
                <Select 
                  value={selectedVehicleId ?? "none"}
                  onValueChange={(value) => setSelectedVehicleId(value === "none" ? null : value)}
                >
                  <SelectTrigger id="vehicle-select" className="w-full">
                    <SelectValue placeholder="Not assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not assigned</SelectItem>
                    
                    {/* Show original vehicle first if it exists */}
                    {originalVehicle && (
                      <SelectItem 
                        key={originalVehicle.id} 
                        value={originalVehicle.id}
                        disabled={!isOriginalVehicleAvailable}
                      >
                        {originalVehicle.make} {originalVehicle.model} ({originalVehicle.license_plate})
                        {!isOriginalVehicleAvailable && " - Not Available"}
                      </SelectItem>
                    )}
                    
                    {/* Show separator if we're displaying both original and alternatives */}
                    {originalVehicle && !isOriginalVehicleAvailable && availableVehicles.length > 0 && (
                      <SelectItem value="separator" disabled>
                        Alternative Vehicles
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
                    {currentVehicleName ? currentVehicleName : "Not assigned"}
                  </p>
                </div>
              )}
              
              {/* Vehicle Details */}
              <div className="mt-3 p-3 bg-muted/30 border border-border rounded-md">
                <p className="text-sm font-medium text-muted-foreground">Vehicle Details</p>
                {selectedVehicleId && getVehicleById(selectedVehicleId) && (
                  <div className="mt-2 grid gap-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">License Plate:</span>
                      <span className="text-sm">{getVehicleById(selectedVehicleId)?.license_plate || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vehicle Brand:</span>
                      <span className="text-sm">{getVehicleById(selectedVehicleId)?.make || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vehicle Model:</span>
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
                  Cancel
                </Button>
                <Button onClick={handleAssign} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Confirm Assignment"}
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleEditClick}
                className="w-full md:w-auto"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 