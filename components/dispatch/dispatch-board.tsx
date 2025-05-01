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

  // Load dispatch entries and related data
  useEffect(() => {
    const loadDispatchData = async () => {
      const supabase = getSupabaseClient();
      setIsLoading(true);
      try {
        // Fetch dispatch entries with related bookings
        const { data: dispatchData, error: dispatchError } = await supabase
          .from('dispatch_entries')
          .select(`
            *,
            booking:bookings(*)
          `);

        if (dispatchError) throw dispatchError;

        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .in('status', ['publish', 'pending', 'confirmed', 'completed', 'cancelled'])
          .or('driver_id.is.null,status.in.(completed,cancelled)'); // Include bookings without assigned drivers AND completed/cancelled bookings

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
        const completedOrCancelledBookings = mappedBookings.filter(
          booking => (booking.status === 'completed' || booking.status === 'cancelled') &&
                    !mappedEntries.some(entry => entry.booking_id === booking.id)
        );
        
        if (completedOrCancelledBookings.length > 0) {
          const newEntries = completedOrCancelledBookings.map(booking => {
            const bookingDate = parseISO(booking.date);
            const startTime = `${bookingDate.toISOString().split('T')[0]}T${booking.time}:00`;
            const durationMinutes = parseInt(String(booking.duration || "60"));
            const endTimeDate = new Date(new Date(startTime).getTime() + durationMinutes * 60000);
            
            return {
              booking_id: booking.id,
              driver_id: booking.driver_id,
              vehicle_id: booking.vehicle?.id,
              status: booking.status,
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
            console.error('Error creating dispatch entries:', insertError);
          }
        }
        
        // Set state with the data
        setDispatchEntries(dispatchEntries);
        setAvailableDrivers(mappedDrivers);
        setAvailableVehicles(mappedVehicles);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading dispatch data:", error);
        toast({
          title: "Error",
          description: "Failed to load dispatch data",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    loadDispatchData();
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
        // Always ensure the status is synced with the booking status
        if (booking.status === 'completed' || booking.status === 'cancelled') {
          existingEntry.status = booking.status;
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
      } else if (booking.status === 'confirmed') {
        dispatchStatus = "pending";
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
    router.push("/dispatch/create");
  };

  const handleAssignDriver = async (dispatchId: string, driverId: string) => {
    const supabase = getSupabaseClient();
    try {
      const entryToUpdate = dispatchEntries.find(entry => entry.id === dispatchId);
      if (!entryToUpdate) throw new Error("Dispatch entry not found");

      // Update the dispatch entry with the driver ID
      const { data, error } = await supabase
        .from('dispatch_entries')
        .update({ 
          driver_id: driverId,
          status: entryToUpdate.vehicle_id ? 'assigned' : 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', dispatchId)
        .select();

      if (error) throw error;

      // Update the booking with the driver ID
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ driver_id: driverId })
        .eq('id', entryToUpdate.booking_id);

      if (bookingError) throw bookingError;

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
      console.error("Error assigning driver:", error);
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    }
  };

  const handleAssignVehicle = async (dispatchId: string, vehicleId: string) => {
    const supabase = getSupabaseClient();
    try {
      const entryToUpdate = dispatchEntries.find(entry => entry.id === dispatchId);
      if (!entryToUpdate) throw new Error("Dispatch entry not found");

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

      if (error) throw error;

      // Update the booking with the vehicle ID
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ vehicle_id: vehicleId })
        .eq('id', entryToUpdate.booking_id);

      if (bookingError) throw bookingError;

      // Create vehicle assignment record if a driver is assigned
      if (entryToUpdate.driver_id) {
        const { error: assignmentError } = await supabase
          .from('vehicle_assignments')
          .insert({
            vehicle_id: vehicleId,
            driver_id: entryToUpdate.driver_id,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: null
          });

        if (assignmentError) throw assignmentError;
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
      console.error("Error assigning vehicle:", error);
      toast({
        title: "Error",
        description: "Failed to assign vehicle",
        variant: "destructive",
      });
    }
  };

  const filteredEntries = dispatchEntries.filter((entry) => {
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
  });

  const hasFilters = !!Object.values(filters).some(Boolean) || !!searchQuery;

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
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
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search dispatch entries..."
              className="w-[250px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
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
                <DropdownMenuRadioItem value="assigned">Assigned</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="in_transit">In Transit</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cancelled">Cancelled</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={view === "board" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("board")}
            className="flex items-center"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Board
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
            className="flex items-center"
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
            <DispatchBoardView 
              entries={filteredEntries} 
              onAssignDriver={handleAssignDriver}
              onAssignVehicle={handleAssignVehicle}
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