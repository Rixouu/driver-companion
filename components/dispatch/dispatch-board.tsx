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
import { Badge } from "@/components/ui/badge";
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
  ChevronRight,
  UserIcon,
  CarIcon,
  MapPinIcon,
  PhoneIcon,
  MoreVerticalIcon,
  EditIcon,
  EyeIcon,
  UserXIcon,
  CarFront,
  CheckIcon
} from "lucide-react";
import { format, parseISO, isToday, isThisWeek, isThisMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
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
import { createClient } from "@/lib/supabase";
import { Driver, Vehicle } from "@/types";
import { Booking } from "@/types/bookings";
import { useSharedDispatchState } from "@/lib/hooks/use-shared-dispatch-state";

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
  status: 'available',
  availability_status: dbDriver.availability_status || 'available',
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
  supabase_id: dbBooking.id,
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
  const [dateRangeFilter, setDateRangeFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [viewMode, setViewMode] = useState<"all" | "today" | "week" | "month">("all");

  // Stats derived from available resources
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [availableDriverCount, setAvailableDriverCount] = useState(0);
  const [availableVehicleCount, setAvailableVehicleCount] = useState(0);

  // Shared dispatch state for cross-component synchronization
  const { lastUpdate, updateDispatchStatus, updateAssignment, unassignResources } = useSharedDispatchState();

  // Load dispatch entries and related data using MCP Supabase for accurate counts
  useEffect(() => {
    const loadDispatchData = async () => {
      setIsLoading(true);
      try {
        console.log('[Dispatch Board] Fetching latest dispatch data');
        
        // Use MCP Supabase to get accurate driver counts
        const driversResponse = await fetch('/api/mcp/drivers-availability');
        if (driversResponse.ok) {
          const driversData = await driversResponse.json();
          const mappedDrivers = driversData.map(mapDriverFromDB);
          setAvailableDrivers(mappedDrivers);
          setTotalDrivers(mappedDrivers.length);
          setAvailableDriverCount(mappedDrivers.filter((d: Driver) => d.availability_status === 'available').length);
        } else {
          // Fallback to Supabase client
          const supabase = createClient();
          const { data: driversData, error: driversError } = await supabase
            .from('drivers')
            .select('*')
            .is('deleted_at', null);

          if (!driversError && driversData) {
            const mappedDrivers = driversData.map(mapDriverFromDB);
            setAvailableDrivers(mappedDrivers);
            setTotalDrivers(mappedDrivers.length);
            setAvailableDriverCount(mappedDrivers.filter((d: Driver) => d.availability_status === 'available').length);
          }
        }

        // Get vehicle counts
        const vehiclesResponse = await fetch('/api/mcp/vehicles-availability');
        if (vehiclesResponse.ok) {
          const vehiclesData = await vehiclesResponse.json();
          const mappedVehicles = vehiclesData.map(mapVehicleFromDB);
          setAvailableVehicles(mappedVehicles);
          setTotalVehicles(mappedVehicles.length);
          setAvailableVehicleCount(mappedVehicles.filter((v: Vehicle) => v.status === 'active').length);
        } else {
          // Fallback to Supabase client
          const supabase = createClient();
          const { data: vehiclesData, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('status', 'active')
            .is('deleted_at', null);

          if (!vehiclesError && vehiclesData) {
            const mappedVehicles = vehiclesData.map(mapVehicleFromDB);
            setAvailableVehicles(mappedVehicles);
            setTotalVehicles(mappedVehicles.length);
            setAvailableVehicleCount(mappedVehicles.length);
          }
        }

        // Fetch dispatch entries and bookings
        const supabase = createClient();
        
        // Fetch dispatch entries with related bookings
        const { data: dispatchData, error: dispatchError } = await supabase
          .from('dispatch_entries')
          .select(`
            *,
            booking:bookings(*),
            driver:drivers(*),
            vehicle:vehicles(*)
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

        const mappedBookings = bookingsData?.map(mapBookingFromDB) || [];

        // Process and combine the data
        const mappedEntries = dispatchData?.map(entry => ({
          ...entry,
          booking: entry.booking,
          driver: entry.driver,
          vehicle: entry.vehicle
        })) || [];
        
        const dispatchEntries = createDispatchEntriesFromBookings(mappedBookings, mappedEntries);
        
        // Set state with the data
        console.log('[Dispatch Board] Setting dispatch entries:', dispatchEntries.length);
        setDispatchEntries(dispatchEntries);
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
  }, [lastUpdate]); // Re-load when shared state updates

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
        return {
          ...existingEntry,
          booking: booking,
          driver: existingEntry.driver,
          vehicle: existingEntry.vehicle
        };
      }
      
      // Create a new entry
      const bookingDate = parseISO(booking.date);
              const startTime = `${bookingDate.toISOString().split('T')[0]}T${booking.time}`;
      
      // Calculate estimated end time
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
      } else if (booking.driver_id) {
        dispatchStatus = "assigned";
      }
      
      return {
        id: crypto.randomUUID(),
        booking_id: booking.id,
        driver_id: booking.driver_id || null,
        vehicle_id: null,
        status: dispatchStatus,
        notes: booking.notes,
        start_time: startTime,
        end_time: endTimeDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        booking: booking,
        driver: null,
        vehicle: null
      };
    });
  };

  const handleStatusFilterChange = (status: DispatchStatus | undefined) => {
    setFilters((prev) => ({
      ...prev,
      status: status,
    }));
  };

  const handleDateFilterChange = (period: "all" | "today" | "week" | "month") => {
    setDateRangeFilter(period);
    setViewMode(period);
  };

  const handleCreateEntry = () => {
    router.push("/dispatch/create" as any);
  };

  const handleQuickAssign = async (dispatchId: string) => {
    try {
      const entryToUpdate = dispatchEntries.find(entry => entry.id === dispatchId);
      if (!entryToUpdate) throw new Error("Dispatch entry not found");

      const availableDriversList = availableDrivers.filter(d => d.availability_status === 'available');
      const availableVehiclesList = availableVehicles.filter(v => v.status === 'active');
      
      if (availableDriversList.length === 0 || availableVehiclesList.length === 0) {
        toast({
          title: "Assignment Failed", 
          description: "No available drivers or vehicles for quick assignment",
          variant: "destructive",
        });
        return;
      }

      // Smart vehicle selection based on service name
      let selectedVehicle = availableVehiclesList[0]; // fallback
      const serviceName = entryToUpdate.booking.service_name?.toLowerCase() || '';
      
      if (serviceName.includes('alphard') || serviceName.includes('luxury')) {
        const alphard = availableVehiclesList.find(v => 
          (v.make?.toLowerCase().includes('toyota') || false) && (v.model?.toLowerCase().includes('alphard') || false)
        );
        if (alphard) selectedVehicle = alphard;
      } else if (serviceName.includes('z class') || serviceName.includes('z-class')) {
        const zClass = availableVehiclesList.find(v => 
          (v.make?.toLowerCase().includes('mercedes') || false) && (v.model?.toLowerCase().includes('z') || false)
        );
        if (zClass) selectedVehicle = zClass;
      }

      const selectedDriver = availableDriversList[0]; // Pick first available driver

      await handleAssignDriverAndVehicle(dispatchId, selectedDriver.id, selectedVehicle.id);
    } catch (error) {
      console.error("[Quick Assign] Error:", error);
      toast({
        title: "Error",
        description: "Failed to assign driver and vehicle",
        variant: "destructive",
      });
    }
  };

  const handleAssignDriverAndVehicle = async (dispatchId: string, driverId: string, vehicleId: string) => {
    const supabase = createClient();
    try {
      const entryToUpdate = dispatchEntries.find(entry => entry.id === dispatchId);
      if (!entryToUpdate) throw new Error("Dispatch entry not found");

      // Update the dispatch entry
      const { error: dispatchError } = await supabase
        .from('dispatch_entries')
        .update({ 
          driver_id: driverId,
          vehicle_id: vehicleId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', dispatchId);

      if (dispatchError) throw dispatchError;

      // Update the booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          driver_id: driverId,
          vehicle_id: vehicleId
        })
        .eq('id', entryToUpdate.booking_id);

      if (bookingError) throw bookingError;

      // Update local state
      setDispatchEntries(prev => prev.map(entry => 
        entry.id === dispatchId 
          ? { 
              ...entry, 
              driver_id: driverId,
              vehicle_id: vehicleId,
              status: 'assigned' as DispatchStatus
            } 
          : entry
      ));

      toast({
        title: "Success",
        description: "Driver and vehicle assigned successfully",
      });
    } catch (error) {
      console.error("[Assign] Error:", error);
      throw error;
    }
  };

  const handleUnassign = async (dispatchId: string) => {
    try {
      const entryToUpdate = dispatchEntries.find(entry => entry.id === dispatchId);
      if (!entryToUpdate) throw new Error("Dispatch entry not found");

      // Use shared state handler for synchronization
      await unassignResources(dispatchId, entryToUpdate.booking_id);

      toast({
        title: "Success",
        description: "Driver and vehicle unassigned successfully",
      });
    } catch (error) {
      console.error("[Unassign] Error:", error);
      toast({
        title: "Error",
        description: "Failed to unassign driver and vehicle",
        variant: "destructive",
      });
    }
  };

  const filterDispatchByDateRange = (entries: DispatchEntryWithRelations[]) => {
    if (dateRangeFilter === "all") {
      return entries;
    }

    const now = new Date();
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.start_time);
      
      switch (dateRangeFilter) {
        case "today":
          return isToday(entryDate);
        case "week":
          return isThisWeek(entryDate);
        case "month":
          return isThisMonth(entryDate);
        default:
          return true;
      }
    });
  };

  const filteredEntries = filterDispatchByDateRange(dispatchEntries.filter((entry) => {
    let matchesSearch = true;
    let matchesStatus = true;

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const customerMatch = entry.booking.customer_name?.toLowerCase().includes(lowerCaseQuery);
      const serviceMatch = entry.booking.service_name?.toLowerCase().includes(lowerCaseQuery);
      const idMatch = entry.booking.wp_id?.toLowerCase().includes(lowerCaseQuery);
      
      matchesSearch = customerMatch || serviceMatch || idMatch || false;
    }
    
    if (filters.status) {
      matchesStatus = entry.status === filters.status;
    }

    return matchesSearch && matchesStatus;
  }));

  const hasFilters = !!Object.values(filters).some(Boolean) || !!searchQuery || dateRangeFilter !== "all";

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
    setDateRangeFilter("all");
    setViewMode("all");
  };

  // Calculate counts for the summary cards
  const pendingCount = filteredEntries.filter(e => e.status === 'pending').length;
  const assignedCount = filteredEntries.filter(e => e.status === 'assigned' || e.status === 'confirmed').length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">{availableDriverCount}/{totalDrivers}</p>
                <p className="text-sm text-muted-foreground">Available Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">{availableVehicleCount}/{totalVehicles}</p>
                <p className="text-sm text-muted-foreground">Available Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">{assignedCount}</p>
                <p className="text-sm text-muted-foreground">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by customer, service, or booking ID..."
              className="w-full sm:w-[300px] pl-8 bg-background border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Date Filter */}
          <Select value={dateRangeFilter} onValueChange={handleDateFilterChange}>
            <SelectTrigger className="w-full sm:w-auto bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto bg-background border-border">
                {filters.status ? sentenceCase(filters.status) : 'All Status'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filters.status || 'all'} onValueChange={(value) => handleStatusFilterChange(value === 'all' ? undefined : value as DispatchStatus)}>
                <DropdownMenuRadioItem value="all">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    All Status
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pending">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    Pending
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="confirmed">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Confirmed
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="assigned">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Assigned
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="en_route">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    En Route
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Completed
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Cancelled
                  </div>
                </DropdownMenuRadioItem>
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
      
      {/* Main Content */}
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
            onQuickAssign={handleQuickAssign}
            onUnassign={handleUnassign}
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
    </div>
  );
} 