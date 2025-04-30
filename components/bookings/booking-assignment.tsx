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
    if (vehicleData) vehicleName = vehicleData.name || `${vehicleData.brand} ${vehicleData.model}`;
  }
  return { driverName, vehicleName };
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

        // Fetch vehicles that are available (not in maintenance)
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('status', 'active');

        if (vehiclesError) throw vehiclesError;

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

      // Set status to pending if either driver or vehicle is unassigned
      const dispatchStatus = selectedDriverId && selectedVehicleId ? 'assigned' : 'pending';
      const dispatchUpdate = {
        driver_id: selectedDriverId,
        vehicle_id: selectedVehicleId,
        status: dispatchStatus,
        start_time: startTime,
        end_time: endTimeDate.toISOString(),
        notes: booking.notes,
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
    // Reset selections to current assignment if user cancels edit later?
    // Or just let them select new ones. Simpler: just allow re-selection.
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
    <div className="space-y-6">
      {/* Remove this duplicate title section */}
      {/* 
      <h2 className="text-xl font-semibold">
        {t('bookings.assignment.title')}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t('bookings.assignment.summary')}
      </p> 
      */}

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          {/* Existing loading spinner code */}
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow border">
          {/* Remove this h3 title and its container div */}
          {/* 
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-foreground">{t('bookings.assignment.title')}</h3>
          </div> 
          */}

          <div className="p-4 space-y-6">
            {/* Booking Summary */}
            <div className="border rounded-md">
              <div className="px-4 py-3 border-b">
                <h4 className="text-sm font-medium text-foreground">{t('bookings.assignment.bookingDetails')}</h4>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">{t('bookings.details.fields.pickupDate')}</span>
                  <span className="text-foreground">{booking.date}</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground mb-1">{t('bookings.details.fields.pickupTime')}</span>
                  <span className="text-foreground">{booking.time}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground mb-1">{t('bookings.details.fields.pickupLocation')}</span>
                  <span className="text-foreground">{booking.pickup_location}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs text-muted-foreground mb-1">{t('bookings.details.fields.dropoffLocation')}</span>
                  <span className="text-foreground">{booking.dropoff_location}</span>
                </div>
              </div>
            </div>

            {isEditing ? (
              // EDITING MODE: Show Select dropdowns
              <div className="grid gap-6 md:grid-cols-2">
                {/* Driver Selection */}
                <div className="space-y-2">
                  <Label htmlFor="driver-select">{t("bookings.assignment.driver")}</Label>
                  <Select 
                    value={selectedDriverId ?? "none"}
                    onValueChange={(value) => setSelectedDriverId(value === "none" ? null : value)}
                  >
                    <SelectTrigger id="driver-select">
                      <SelectValue placeholder={t("bookings.assignment.selectDriver")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {availableDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vehicle Selection */}
                <div className="space-y-2">
                  <Label htmlFor="vehicle-select">{t("bookings.assignment.vehicle")}</Label>
                  <Select 
                    value={selectedVehicleId ?? "none"}
                    onValueChange={(value) => setSelectedVehicleId(value === "none" ? null : value)}
                  >
                    <SelectTrigger id="vehicle-select">
                      <SelectValue placeholder={t("bookings.assignment.selectVehicle")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {availableVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              // DISPLAY MODE: Show assigned details
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    {t('bookings.assignment.driver')}
                  </label>
                  <p className="text-foreground">{currentDriverName || t('common.notAssigned')}</p>
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
                    <CarIcon className="h-4 w-4 text-muted-foreground" />
                    {t('bookings.assignment.vehicle')}
                  </label>
                  <p className="text-foreground">{currentVehicleName || t('common.notAssigned')}</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t flex justify-end">
            {isEditing ? (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleAssign} disabled={isSubmitting}>
                  {isSubmitting ? t("common.saving") : t("bookings.assignment.confirmAssignment")}
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleEditClick}
                className="w-full md:w-auto"
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 