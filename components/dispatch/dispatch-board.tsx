"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CalendarIcon,
  Grid3X3Icon,
  ListIcon,
  PlusIcon,
  FilterIcon,
  SearchIcon,
  XIcon,
  LayoutIcon,
  LayoutGrid,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { sentenceCase } from "change-case";
import { cn } from "@/lib/utils/styles";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import DispatchBoardView from "@/components/dispatch/dispatch-board-view";
import DispatchCalendarView from "@/components/dispatch/dispatch-calendar-view";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { DispatchEntry, DispatchFilter, DispatchStatus, DispatchEntryWithRelations } from "@/types/dispatch";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "@/components/ui/use-toast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { Booking } from "@/types/bookings";
import { Driver } from "@/types/drivers";
import { Vehicle } from "@/types/vehicles";

// Type adapters to convert database types to component types
const mapDriverFromDB = (dbDriver: any): Driver => ({
  id: dbDriver.id,
  first_name: dbDriver.first_name,
  last_name: dbDriver.last_name,
  email: dbDriver.email,
  phone: dbDriver.phone || null,
  line_id: dbDriver.line_id || null,
  license_number: dbDriver.license_number || null,
  license_expiry: dbDriver.license_expiry || null,
  status: dbDriver.status,
  availability_status: dbDriver.availability_status || dbDriver.status,
  profile_image_url: dbDriver.profile_image_url || null,
  address: dbDriver.address || null,
  emergency_contact: dbDriver.emergency_contact || null,
  notes: dbDriver.notes || null,
  user_id: dbDriver.user_id || null,
  created_at: dbDriver.created_at || new Date().toISOString(),
  updated_at: dbDriver.updated_at || new Date().toISOString(),
  deleted_at: dbDriver.deleted_at || null
});

const mapVehicleFromDB = (dbVehicle: any): Vehicle => ({
  id: dbVehicle.id,
  created_at: dbVehicle.created_at,
  updated_at: dbVehicle.updated_at,
  make: dbVehicle.brand || "",
  model: dbVehicle.model || "",
  year: parseInt(dbVehicle.year) || new Date().getFullYear(),
  license_plate: dbVehicle.plate_number || "",
  vin: dbVehicle.vin || "",
  image_url: dbVehicle.image_url,
  status: dbVehicle.status as 'active' | 'maintenance' | 'retired',
  last_inspection: dbVehicle.last_inspection
});

const mapBookingFromDB = (dbBooking: any): Booking => ({
  id: dbBooking.id,
  supabase_id: dbBooking.id, // Using the same ID for both fields
  date: dbBooking.date,
  time: dbBooking.time,
  status: dbBooking.status,
  service_name: dbBooking.service_name || "",
  service_id: dbBooking.service_id || "",
  customer_name: dbBooking.customer_name || null,
  customer_email: dbBooking.customer_email || null,
  customer_phone: dbBooking.customer_phone || null,
  driver_id: dbBooking.driver_id || null,
  pickup_location: dbBooking.pickup_location || null,
  dropoff_location: dbBooking.dropoff_location || null,
  distance: dbBooking.distance || null,
  duration: dbBooking.duration || "60",
  notes: dbBooking.notes || null,
  wp_id: dbBooking.wp_id || "",
  created_at: dbBooking.created_at || null,
  updated_at: dbBooking.updated_at || null
});

export default function DispatchBoard() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"board" | "calendar">("board");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dispatchEntries, setDispatchEntries] = useState<DispatchEntryWithRelations[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<DispatchFilter>({});
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [dateRangeFilter, setDateRangeFilter] = useState<"all" | "day" | "week" | "month">("all");
  const [viewMode, setViewMode] = useState<"all" | "day" | "week" | "month">("all");

  // Load dispatch entries and related data
  useEffect(() => {
    const loadDispatchData = async () => {
      const supabase = getSupabaseClient();
      setIsLoading(true);
      try {
        console.log('[Dispatch Board] Fetching latest dispatch data');
        
        // Fetch dispatch entries with related bookings
        const { data: dispatchData, error: dispatchError } = await supabase
          .from('dispatch_entries')
          .select(`
            *,
            booking:bookings(*)
          `)
          .order('created_at', { ascending: false });

        if (dispatchError) throw dispatchError;

        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .in('status', ['publish', 'pending', 'confirmed', 'completed', 'cancelled'])
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;

        // Fetch drivers
        const { data: driversData, error: driversError } = await supabase
          .from('drivers')
          .select('*')
          .in('status', ['active', 'available']); // Include both active and available drivers

        if (driversError) throw driversError;

        // Fetch vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('status', 'active');

        if (vehiclesError) throw vehiclesError;

        // Fetch driver availability
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

        // Map data to expected types
        const mappedDrivers = driversData?.map(mapDriverFromDB) || [];
        const mappedVehicles = vehiclesData?.map(mapVehicleFromDB) || [];
        const mappedBookings = bookingsData?.map(mapBookingFromDB) || [];

        // Set available drivers (filtering out those with conflicts)
        const availableDriversWithSchedule = mapDriverFromDB ? driversData?.map(mapDriverFromDB) || [] : [];
        setAvailableDrivers(availableDriversWithSchedule);

        // Set available vehicles (filtering out those already assigned)
        const availableVehiclesFiltered = filterAvailableVehicles(mappedVehicles, vehicleAssignments || []);
        setAvailableVehicles(availableVehiclesFiltered);

        // Process and combine the data
        const mappedEntries = dispatchData?.map(entry => ({
          ...entry,
          booking: entry.booking
        })) || [];
        
        const dispatchEntries = createDispatchEntriesFromBookings(mappedBookings, mappedEntries);
        
        // Ensure that entries for completed and cancelled bookings are created in the database
        const newBookingsWithoutEntries = mappedBookings.filter(
          booking => !mappedEntries.some(entry => entry.booking_id === booking.id)
        );
        
        if (newBookingsWithoutEntries.length > 0) {
          console.log(`[Dispatch Board] Found ${newBookingsWithoutEntries.length} new bookings without dispatch entries`);
          
          const newEntries = newBookingsWithoutEntries.map(booking => {
            const bookingDate = parseISO(booking.date);
            const startTime = `${bookingDate.toISOString().split('T')[0]}T${booking.time}:00`;
            const durationMinutes = parseInt(String(booking.duration || "60"));
            const endTimeDate = new Date(new Date(startTime).getTime() + durationMinutes * 60000);
            
            // Determine status based on booking status
            let status: DispatchStatus = "pending";
            if (booking.status === 'completed') {
              status = "completed";
            } else if (booking.status === 'cancelled') {
              status = "cancelled";
            } else if (booking.status === 'confirmed' && booking.driver_id) {
              status = "confirmed";
            } else if (booking.driver_id && booking.vehicle?.id) {
              status = "assigned";
            }
            
            return {
              booking_id: booking.id,
              driver_id: booking.driver_id,
              vehicle_id: booking.vehicle?.id,
              status: status,
              notes: booking.notes,
              start_time: startTime,
              end_time: endTimeDate.toISOString()
            };
          });
          
          // Insert the new entries into the database
          const { error: insertError } = await supabase
            .from('dispatch_entries')
            .insert(newEntries);
            
          if (insertError) {
            console.error('[Dispatch Board] Error creating dispatch entries:', insertError);
          } else {
            console.log('[Dispatch Board] Successfully created dispatch entries for new bookings');
          }
        }
        
        // Set state with the data
        console.log('[Dispatch Board] Setting dispatch entries:', dispatchEntries.length);
        setDispatchEntries(dispatchEntries);
        setAvailableDrivers(mappedDrivers);
        setAvailableVehicles(mappedVehicles);
        setIsLoading(false);
      } catch (error) {
        console.error("[Dispatch Board] Error loading dispatch data:", error);
        toast({
          title: "Error",
          description: "Failed to load dispatch data",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    loadDispatchData();

    // Set up a refresh interval (every 5 minutes)
    const refreshInterval = setInterval(() => {
      console.log('[Dispatch Board] Auto-refreshing dispatch data');
      loadDispatchData();
    }, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Filter drivers based on availability for a specific booking time
  const filterAvailableDrivers = (
    drivers: Driver[], 
    availabilities: any[], 
    bookings: Booking[]
  ): Driver[] => {
    return drivers.filter(driver => {
      // Check if driver has any unavailability at the time of any booking
      const driverAvailabilities = availabilities.filter(
        avail => avail.driver_id === driver.id && 
        (avail.status === 'unavailable' || avail.status === 'leave' || avail.status === 'training')
      );
      
      // If no unavailability records, driver is available
      if (driverAvailabilities.length === 0) return true;
      
      // Check for conflicts with any booking
      for (const booking of bookings) {
        const bookingDate = parseISO(booking.date);
        const bookingStartTime = `${bookingDate.toISOString().split('T')[0]}T${booking.time}:00`;
        
        // Check if any unavailability conflicts with this booking time
        const hasConflict = driverAvailabilities.some(avail => {
          const availStartDate = parseISO(avail.start_date);
          const availEndDate = parseISO(avail.end_date);
          const bookingDateTime = parseISO(bookingStartTime);
          
          return bookingDateTime >= availStartDate && bookingDateTime <= availEndDate;
        });
        
        if (hasConflict) return false;
      }
      
      return true;
    });
  };

  // Filter vehicles based on current assignments
  const filterAvailableVehicles = (
    vehicles: Vehicle[], 
    assignments: any[]
  ): Vehicle[] => {
    // Get all vehicle IDs that are currently assigned
    const assignedVehicleIds = new Set(
      assignments
        .filter(assignment => assignment.status === 'active')
        .map(assignment => assignment.vehicle_id)
    );
    
    // Return only vehicles that are not in the assigned set and are active
    return vehicles.filter(vehicle => 
      !assignedVehicleIds.has(vehicle.id) && 
      vehicle.status === 'active'
    );
  };

  // Create dispatch entries from bookings
  const createDispatchEntriesFromBookings = (
    bookings: Booking[],
    existingEntries: any[]
  ): DispatchEntryWithRelations[] => {
    // Convert existing entries to a map for quick lookup
    const existingEntriesMap = new Map(
      existingEntries.map(entry => [entry.booking_id, entry])
    );
    
    // Create dispatch entries for each booking
    return bookings.map(booking => {
      // Check if there's already an entry for this booking
      const existingEntry = existingEntriesMap.get(booking.id);
      if (existingEntry) {
        // Preserve the in_transit status from existing entries
        if (existingEntry.status === 'in_transit') {
          return {
            ...existingEntry,
            booking: booking
          };
        }
        
        // Always ensure the status is synced with the booking status
        if (booking.status === 'completed' || booking.status === 'cancelled') {
          existingEntry.status = booking.status;
        } else if (booking.status === 'confirmed' && existingEntry.driver_id) {
          // If booking is confirmed and has a driver assigned, set status to confirmed
          existingEntry.status = 'confirmed';
        }
        return {
          ...existingEntry,
          booking: booking
        };
      }
      
      // Create a new entry
      const bookingDate = parseISO(booking.date);
      const startTime = `${bookingDate.toISOString().split('T')[0]}T${booking.time}:00`;
      
      // Calculate estimated end time (add duration in minutes to start time)
      // Ensure duration is a string before parsing
      const durationMinutes = parseInt(String(booking.duration || "60"));
      const endTimeDate = new Date(new Date(startTime).getTime() + durationMinutes * 60000);
      
      // Map booking status to dispatch status
      let dispatchStatus: DispatchStatus = "pending";
      if (booking.status === 'completed') {
        dispatchStatus = "completed";
      } else if (booking.status === 'cancelled') {
        dispatchStatus = "cancelled";
      } else if (booking.status === 'confirmed' && booking.driver_id) {
        dispatchStatus = "confirmed";
      } else if (booking.status === 'confirmed') {
        dispatchStatus = "pending";
      } else if (booking.driver_id && booking.vehicle?.id) {
        dispatchStatus = "assigned";
      }
      
      return {
        id: crypto.randomUUID(),
        booking_id: booking.id,
        driver_id: booking.driver_id || null,
        vehicle_id: (booking.vehicle?.id || null) as string | null,
        status: dispatchStatus,
        notes: booking.notes,
        start_time: startTime,
        end_time: endTimeDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        booking: booking
      };
    });
  };

  const handleStatusFilterChange = (status: DispatchStatus | undefined) => {
    setFilters((prev) => ({
      ...prev,
      status: status,
    }));
  };

  const handleCreateEntry = () => {
    // Navigate to create entry page
    router.push("/dispatch/create" as any);
  };

  const handleAssignDriver = async (dispatchId: string, driverId: string) => {
    const supabase = getSupabaseClient();
    try {
      const entryToUpdate = dispatchEntries.find(entry => entry.id === dispatchId);
      if (!entryToUpdate) throw new Error("Dispatch entry not found");

      console.log(`[Driver Assign] Starting assignment for dispatch ${dispatchId}`, { 
        newDriverId: driverId, 
        currentDriverId: entryToUpdate.driver_id,
        hasVehicle: !!entryToUpdate.vehicle_id,
        bookingId: entryToUpdate.booking_id
      });

      // Determine the new status based on the booking status and assignment
      let newStatus = entryToUpdate.status;
      if (entryToUpdate.booking.status === 'confirmed') {
        newStatus = 'confirmed';
      } else if (entryToUpdate.vehicle_id) {
        newStatus = 'assigned';
      } else {
        newStatus = 'pending';
      }

      // Update the dispatch entry with the driver ID
      const { data, error } = await supabase
        .from('dispatch_entries')
        .update({ 
          driver_id: driverId,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', dispatchId)
        .select();

      if (error) {
        console.error(`[Driver Assign] Error updating dispatch entry:`, error);
        throw error;
      }
      
      console.log(`[Driver Assign] Successfully updated dispatch entry`);

      // Update the booking with the driver ID
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ driver_id: driverId })
        .eq('id', entryToUpdate.booking_id);

      if (bookingError) {
        console.error(`[Driver Assign] Error updating booking:`, bookingError);
        throw bookingError;
      }
      
      console.log(`[Driver Assign] Successfully updated booking`);

      // Create a driver availability record for this booking
      try {
        const bookingStartTime = new Date(entryToUpdate.start_time);
        const bookingEndTime = entryToUpdate.end_time ? new Date(entryToUpdate.end_time) : 
          new Date(bookingStartTime.getTime() + 60 * 60 * 1000); // Default 1 hour if no end time
        
        console.log(`[Driver Assign] Creating driver availability record for booking from ${bookingStartTime} to ${bookingEndTime}`);
        
        const { error: availabilityError } = await supabase
          .from('driver_availability')
          .insert({
            driver_id: driverId,
            start_date: bookingStartTime.toISOString(),
            end_date: bookingEndTime.toISOString(),
            status: 'unavailable',
            notes: `Assigned to booking ${entryToUpdate.booking_id}`
          });

        if (availabilityError) {
          console.error(`[Driver Assign] Error creating driver availability record:`, availabilityError);
        } else {
          console.log(`[Driver Assign] Successfully created driver availability record`);
        }
      } catch (availErr) {
        console.error(`[Driver Assign] Error in driver availability creation:`, availErr);
      }

      // If a vehicle is already assigned, create a vehicle assignment
      if (entryToUpdate.vehicle_id) {
        console.log(`[Driver Assign] Creating vehicle assignment for driver ${driverId} and vehicle ${entryToUpdate.vehicle_id}`);
        
        const { error: assignmentError } = await supabase
          .from('vehicle_assignments')
          .insert({
            vehicle_id: entryToUpdate.vehicle_id,
            driver_id: driverId,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: null
          });

        if (assignmentError) {
          console.error(`[Driver Assign] Error creating vehicle assignment:`, assignmentError);
        } else {
          console.log(`[Driver Assign] Successfully created vehicle assignment`);
        }
      } else {
        console.log(`[Driver Assign] No vehicle assigned, skipping vehicle assignment creation`);
      }

      // Update local state
      setDispatchEntries(prev => prev.map(entry => 
        entry.id === dispatchId 
          ? { 
              ...entry, 
              driver_id: driverId,
              status: entry.vehicle_id ? 'assigned' : 'pending'
            } 
          : entry
      ));

      toast({
        title: "Success",
        description: t("dispatch.messages.driverAssigned"),
      });
    } catch (error) {
      console.error("[Driver Assign] Error in handleAssignDriver:", error);
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    }
  };

  const handleUnassignVehicle = async (dispatchId: string) => {
    const supabase = getSupabaseClient();
    try {
      const entryToUpdate = dispatchEntries.find(entry => entry.id === dispatchId);
      if (!entryToUpdate) throw new Error("Dispatch entry not found");
      
      console.log(`[Vehicle Unassign] Starting unassignment for dispatch ${dispatchId}`, { 
        currentVehicleId: entryToUpdate.vehicle_id,
        bookingId: entryToUpdate.booking_id
      });

      if (!entryToUpdate.vehicle_id) {
        console.log(`[Vehicle Unassign] No vehicle assigned to dispatch ${dispatchId}`);
        return;
      }

      // Update the dispatch entry to remove vehicle ID
      const { data, error } = await supabase
        .from('dispatch_entries')
        .update({ 
          vehicle_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', dispatchId)
        .select();

      if (error) {
        console.error(`[Vehicle Unassign] Error updating dispatch entry:`, error);
        throw error;
      }

      console.log(`[Vehicle Unassign] Successfully updated dispatch entry`);

      // Update the booking to remove vehicle ID
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ vehicle_id: null })
        .eq('id', entryToUpdate.booking_id);

      if (bookingError) {
        console.error(`[Vehicle Unassign] Error updating booking:`, bookingError);
        throw bookingError;
      }

      console.log(`[Vehicle Unassign] Successfully updated booking`);

      // If there's an active vehicle assignment, end it
      if (entryToUpdate.driver_id) {
        console.log(`[Vehicle Unassign] Checking for active vehicle assignments with vehicle_id: ${entryToUpdate.vehicle_id}`);
        
        const { data: assignments, error: assignmentQueryError } = await supabase
          .from('vehicle_assignments')
          .select('*')
          .eq('vehicle_id', entryToUpdate.vehicle_id)
          .eq('status', 'active');
        
        if (assignmentQueryError) {
          console.error(`[Vehicle Unassign] Error querying vehicle assignments:`, assignmentQueryError);
        } else if (assignments && assignments.length > 0) {
          console.log(`[Vehicle Unassign] Found ${assignments.length} active assignments to end`);
          
          for (const assignment of assignments) {
            const { error: assignmentError } = await supabase
              .from('vehicle_assignments')
              .update({
                status: 'inactive',
                end_date: new Date().toISOString()
              })
              .eq('id', assignment.id);

            if (assignmentError) {
              console.error(`[Vehicle Unassign] Error ending vehicle assignment ${assignment.id}:`, assignmentError);
            } else {
              console.log(`[Vehicle Unassign] Successfully ended vehicle assignment ${assignment.id}`);
            }
          }
        } else {
          console.log(`[Vehicle Unassign] No active vehicle assignments found`);
        }
      }

      // Update local state
      setDispatchEntries(prev => prev.map(entry => 
        entry.id === dispatchId 
          ? { 
              ...entry, 
              vehicle_id: null
            } 
          : entry
      ));

      toast({
        title: "Success",
        description: t("dispatch.messages.vehicleUnassigned", { defaultValue: "Vehicle has been unassigned" }),
      });
    } catch (error) {
      console.error("[Vehicle Unassign] Error in handleUnassignVehicle:", error);
      toast({
        title: "Error",
        description: "Failed to unassign vehicle",
        variant: "destructive",
      });
    }
  };

  const handleAssignVehicle = async (dispatchId: string, vehicleId: string) => {
    const supabase = getSupabaseClient();
    try {
      const entryToUpdate = dispatchEntries.find(entry => entry.id === dispatchId);
      if (!entryToUpdate) throw new Error("Dispatch entry not found");

      console.log(`[Vehicle Assign] Starting assignment for dispatch ${dispatchId}`, { 
        newVehicleId: vehicleId, 
        currentVehicleId: entryToUpdate.vehicle_id,
        bookingId: entryToUpdate.booking_id,
        hasDriver: !!entryToUpdate.driver_id
      });

      // If there's already a vehicle assigned, unassign it first
      if (entryToUpdate.vehicle_id && entryToUpdate.vehicle_id !== vehicleId) {
        console.log(`[Vehicle Assign] Unassigning previous vehicle ${entryToUpdate.vehicle_id} before assigning new one`);
        await handleUnassignVehicle(dispatchId);
      }

      // Update the dispatch entry with the vehicle ID
      const { data, error } = await supabase
        .from('dispatch_entries')
        .update({ 
          vehicle_id: vehicleId,
          status: entryToUpdate.driver_id ? 'assigned' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', dispatchId)
        .select();

      if (error) {
        console.error(`[Vehicle Assign] Error updating dispatch entry:`, error);
        throw error;
      }

      console.log(`[Vehicle Assign] Successfully updated dispatch entry`);

      // Update the booking with the vehicle ID
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ vehicle_id: vehicleId })
        .eq('id', entryToUpdate.booking_id);

      if (bookingError) {
        console.error(`[Vehicle Assign] Error updating booking:`, bookingError);
        throw bookingError;
      }

      console.log(`[Vehicle Assign] Successfully updated booking`);

      // Create vehicle assignment record if a driver is assigned
      if (entryToUpdate.driver_id) {
        console.log(`[Vehicle Assign] Creating vehicle assignment record for driver ${entryToUpdate.driver_id} and vehicle ${vehicleId}`);
        
        const { error: assignmentError } = await supabase
          .from('vehicle_assignments')
          .insert({
            vehicle_id: vehicleId,
            driver_id: entryToUpdate.driver_id,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: null
          });

        if (assignmentError) {
          console.error(`[Vehicle Assign] Error creating vehicle assignment:`, assignmentError);
          throw assignmentError;
        }
        
        console.log(`[Vehicle Assign] Successfully created vehicle assignment`);
      } else {
        console.log(`[Vehicle Assign] No driver assigned, skipping vehicle assignment creation`);
      }

      // Update local state
      setDispatchEntries(prev => prev.map(entry => 
        entry.id === dispatchId 
          ? { 
              ...entry, 
              vehicle_id: vehicleId,
              status: entry.driver_id ? 'assigned' : 'pending'
            } 
          : entry
      ));

      toast({
        title: "Success",
        description: t("dispatch.messages.vehicleAssigned"),
      });
    } catch (error) {
      console.error("[Vehicle Assign] Error in handleAssignVehicle:", error);
      toast({
        title: "Error",
        description: "Failed to assign vehicle",
        variant: "destructive",
      });
    }
  };

  const filterDispatchByDateRange = (entries: DispatchEntryWithRelations[]) => {
    if (viewMode === "all") {
      return entries;
    }

    if (viewMode === "day") {
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      return entries.filter(entry => {
        const entryDate = new Date(entry.start_time);
        return entryDate >= startOfDay && entryDate <= endOfDay;
      });
    }

    if (viewMode === "week") {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for week starting on Monday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return entries.filter(entry => {
        const entryDate = new Date(entry.start_time);
        return entryDate >= startOfWeek && entryDate <= endOfWeek;
      });
    }

    if (viewMode === "month") {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
      
      return entries.filter(entry => {
        const entryDate = new Date(entry.start_time);
        return entryDate >= startOfMonth && entryDate <= endOfMonth;
      });
    }

    return entries;
  };

  // Navigation functions
  const navigatePrevious = () => {
    if (viewMode === "month") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    } else if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else if (viewMode === "day") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const navigateNext = () => {
    if (viewMode === "month") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    } else if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else if (viewMode === "day") {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Format current date range for display
  const getDateRangeDisplay = () => {
    if (viewMode === "day") {
      return format(currentDate, "MMMM d, yyyy");
    } else if (viewMode === "week") {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${format(startOfWeek, "MMMM d")} - ${format(endOfWeek, "d, yyyy")}`;
      } else if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
        return `${format(startOfWeek, "MMMM d")} - ${format(endOfWeek, "MMMM d, yyyy")}`;
      } else {
        return `${format(startOfWeek, "MMMM d, yyyy")} - ${format(endOfWeek, "MMMM d, yyyy")}`;
      }
    } else if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy");
    }
    return "All Dates";
  };

  const filteredEntries = filterDispatchByDateRange(dispatchEntries.filter((entry) => {
    let matchesSearch = true;
    let matchesStatus = true;

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const idMatch = entry.id.toLowerCase().includes(lowerCaseQuery);
      const bookingMatch = entry.booking_id.toLowerCase().includes(lowerCaseQuery);
      const notesMatch = entry.notes ? entry.notes.toLowerCase().includes(lowerCaseQuery) : false;
      
      matchesSearch = idMatch || bookingMatch || notesMatch;
    }
    
    if (filters.status) {
      matchesStatus = entry.status === filters.status;
    }

    return matchesSearch && matchesStatus;
  }));

  const hasFilters = !!Object.values(filters).some(Boolean) || !!searchQuery || viewMode !== "all";

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
    setViewMode("all");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search dispatch entries..."
              className="w-full sm:w-[250px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                {filters.status ? sentenceCase(filters.status) : 'All Entries'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filters.status || 'all'} onValueChange={(value) => handleStatusFilterChange(value === 'all' ? undefined : value as DispatchStatus)}>
                <DropdownMenuRadioItem value="all">All Entries</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="confirmed">Confirmed</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="assigned">Assigned</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="in_transit">In Transit</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cancelled">Cancelled</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <XIcon className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={view === "board" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("board")}
            className="flex items-center flex-1 sm:flex-auto justify-center"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Board
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
            className="flex items-center flex-1 sm:flex-auto justify-center"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <Tabs 
          value={view} 
          onValueChange={(value) => setView(value as "board" | "calendar")} 
          className="flex-1 flex flex-col"
        >
          <TabsContent 
            value="board" 
            className="flex-1 data-[state=active]:flex data-[state=active]:flex-col mt-0"
          >
            <div className="flex items-center justify-between mb-4 bg-card rounded-md p-2 border">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as "all" | "day" | "week" | "month")}
                className="bg-background border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="View mode"
              >
                <option value="all">All Dates</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              
              {viewMode !== "all" && (
                <div className="flex items-center gap-1 ml-2">
                  <Button variant="outline" size="icon" onClick={navigatePrevious} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={navigateToday} className="h-8 px-2 text-xs sm:text-sm">Today</Button>
                  <Button variant="outline" size="icon" onClick={navigateNext} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {viewMode !== "all" && (
                <h2 className="text-sm sm:text-base font-medium flex items-center gap-1 whitespace-nowrap ml-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{getDateRangeDisplay()}</span>
                </h2>
              )}
              
              <div className="flex-1"></div>
            </div>
            
            <DispatchBoardView 
              entries={filteredEntries} 
              onAssignDriver={handleAssignDriver}
              onAssignVehicle={handleAssignVehicle}
              onUnassignVehicle={handleUnassignVehicle}
              availableDrivers={availableDrivers}
              availableVehicles={availableVehicles}
            />
          </TabsContent>
          <TabsContent 
            value="calendar" 
            className="flex-1 data-[state=active]:flex data-[state=active]:flex-col mt-0"
          >
            <DispatchCalendarView 
              entries={filteredEntries} 
              currentDate={currentDate} 
              setCurrentDate={setCurrentDate} 
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 