"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  MapIcon,
  Grid3X3Icon,
  SearchIcon,
  CarIcon,
  UserIcon,
  CalendarIcon,
  MoreVerticalIcon,
  PlayIcon,
  CheckCircleIcon,
  PhoneIcon,
  EyeIcon,
  RefreshCwIcon,
  ClockIcon,
  MapPinIcon,
  SettingsIcon,
  ListIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FilterIcon,
  PanelLeftOpenIcon,
  PanelLeftCloseIcon,
  GripVerticalIcon,
  EyeOffIcon,
  EyeIcon as EyeIconSolid
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { toast } from '@/components/ui/use-toast';
import { useSharedDispatchState } from "@/lib/hooks/use-shared-dispatch-state";
import { cn, getDispatchStatusBadgeClasses } from '@/lib/utils/styles';
import { createClient } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { DispatchEntryWithRelations, DispatchStatus } from '@/types/dispatch';
import DispatchMap from './dispatch-map';
import DispatchBoardView from './dispatch-board-view';
import DispatchTimetable from './dispatch-timetable';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface BookingListItemProps {
  booking: any;
  isSelected: boolean;
  isExpanded: boolean;
  onClick: () => void;
  onToggleExpand: () => void;
}

function BookingListItem({ booking, isSelected, isExpanded, onClick, onToggleExpand }: BookingListItemProps) {

  return (
    <div 
      className={cn(
        "border-l-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-r-md",
        isSelected ? "bg-primary/5 border-l-primary" : "border-l-transparent"
      )}
    >
      <div className="p-3 space-y-2" onClick={onClick}>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">
            #{booking.wp_id || booking.id.substring(0, 8)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {format(parseISO(`${booking.date}T${booking.time}`), "HH:mm")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronRightIcon className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        
        <div>
          <p className="font-medium text-sm truncate">{booking.customer_name || "Unknown"}</p>
          <p className="text-xs text-muted-foreground truncate">{booking.service_name}</p>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("text-xs", getDispatchStatusBadgeClasses(booking.status))}>
            {booking.status.replace('_', ' ')}
          </Badge>
          <div className="flex items-center gap-1">
            {booking.driver_id && <UserIcon className="h-3 w-3 text-green-600" />}
            {booking.vehicle_id && <CarIcon className="h-3 w-3 text-blue-600" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t bg-muted/20">
          {booking.pickup_location && (
            <div className="flex items-center gap-2 text-xs">
              <MapPinIcon className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{booking.pickup_location}</span>
            </div>
          )}
          {booking.customer_phone && (
            <div className="flex items-center gap-2 text-xs">
              <PhoneIcon className="h-3 w-3 text-muted-foreground" />
              <span>{booking.customer_phone}</span>
            </div>
          )}
          {booking.notes && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Notes:</span> {booking.notes}
            </div>
          )}
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-6 text-xs flex-1">
              <EyeIcon className="h-3 w-3 mr-1" />
              View
            </Button>
            {booking.customer_phone && (
              <Button size="sm" variant="outline" className="h-6 text-xs flex-1">
                <PhoneIcon className="h-3 w-3 mr-1" />
                Call
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ assignments, selectedBookingId, onBookingSelect, onToggleExpand, expandedCards }: any) {
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'pending' | 'assigned' | 'confirmed' | 'en_route' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Convert assignments to bookings for the sidebar, ensuring unique entries
  const allBookings = assignments
    .filter((a: any) => a.booking)
    .reduce((unique: any[], assignment: any) => {
      const booking = assignment.booking!;
      if (!unique.find(b => b.id === booking.id)) {
        unique.push({ ...booking, status: assignment.status }); // Use dispatch status
      }
      return unique;
    }, [] as any[]);

  // Filter bookings based on search and status filter
  const bookings = allBookings.filter((booking: any) => {
    const matchesSearch = !searchQuery || 
      booking.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.wp_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = sidebarFilter === 'all' || booking.status === sidebarFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-background flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Today's Bookings</h3>
          <Badge variant="secondary">{bookings.length} / {allBookings.length}</Badge>
        </div>
        
        <div className="relative mb-3">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search bookings..."
            className="pl-8 h-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <Select value={sidebarFilter} onValueChange={(value: any) => setSidebarFilter(value)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="en_route">En Route</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="space-y-1 p-2">
          {bookings.map((booking: any) => (
            <BookingListItem
              key={booking.id}
              booking={booking}
              isSelected={selectedBookingId === booking.id}
              isExpanded={expandedCards.has(booking.id)}
              onClick={() => onBookingSelect(booking)}
              onToggleExpand={() => onToggleExpand(booking.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MapViewWithSidebar({ assignments, onAssignmentSelect, onVehicleSelect }: {
  assignments: DispatchEntryWithRelations[];
  onAssignmentSelect: (assignment: DispatchEntryWithRelations) => void;
  onVehicleSelect: (vehicleId: string) => void;
}) {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedAssignment, setSelectedAssignment] = useState<DispatchEntryWithRelations | null>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const handleBookingSelect = (booking: any) => {
    if (!booking) return;
    setSelectedBookingId(booking.id);
    const assignment = assignments.find(a => a.booking_id === booking.id);
    if (assignment) {
      setSelectedAssignment(assignment);
      onAssignmentSelect(assignment);
      toast({
        title: "Route Display",
        description: `Showing route for booking #${booking.wp_id || booking.id?.substring(0, 8)}`,
      });
    }
  };

  const toggleCardExpansion = (bookingId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) newSet.delete(bookingId);
      else newSet.add(bookingId);
      return newSet;
    });
  };

  const sidebarProps = {
    assignments,
    selectedBookingId,
    onBookingSelect: handleBookingSelect,
    expandedCards,
    onToggleExpand: toggleCardExpansion,
  };

  if (isDesktop) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)]">
        {showSidebar && (
          <div className="w-80 border-r bg-background flex flex-col">
            <SidebarContent {...sidebarProps} />
          </div>
        )}
        <div className="flex-1 relative">
          <Button
            size="sm"
            variant="outline"
            className="absolute top-4 left-4 z-20 bg-background/90 backdrop-blur-sm"
            onClick={() => setShowSidebar(prev => !prev)}
          >
            {showSidebar ? <PanelLeftCloseIcon className="h-4 w-4" /> : <PanelLeftOpenIcon className="h-4 w-4" />}
          </Button>
          <DispatchMap
            assignments={assignments}
            selectedAssignment={selectedAssignment}
            onAssignmentSelect={onAssignmentSelect}
            onVehicleSelect={onVehicleSelect}
            className="min-h-[calc(100vh-12rem)]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] relative">
      <DispatchMap
        assignments={assignments}
        selectedAssignment={selectedAssignment}
        onAssignmentSelect={onAssignmentSelect}
        onVehicleSelect={onVehicleSelect}
        className="min-h-[calc(100vh-12rem)]"
      />
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 shadow-lg"
          >
            <ListIcon className="h-4 w-4 mr-2" />
            Show Bookings
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[60%] flex flex-col p-0">
           <SidebarContent {...sidebarProps} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function RealTimeDispatchCenter() {
  const { t } = useI18n();
  const router = useRouter();
  const [activeView, setActiveView] = useState<'board' | 'map' | 'timetable'>('board');
  const [assignments, setAssignments] = useState<DispatchEntryWithRelations[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DispatchStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [view, setView] = useState<'map' | 'board'>('board');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { lastUpdate, updateDispatchStatus, unassignResources } = useSharedDispatchState();

  // Column settings state - use consistent default order to prevent hydration issues
  const [columnOrder, setColumnOrder] = useState<DispatchStatus[]>(['pending', 'assigned', 'confirmed', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled']);

  const [hiddenColumns, setHiddenColumns] = useState<Set<DispatchStatus>>(new Set());

  // Load saved settings after hydration to prevent hydration mismatch
  useEffect(() => {
    const savedOrder = localStorage.getItem('dispatch-column-order');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed)) {
          setColumnOrder(parsed);
        }
      } catch (error) {
        console.warn('Failed to parse saved column order:', error);
      }
    }

    const savedHidden = localStorage.getItem('dispatch-hidden-columns');
    if (savedHidden) {
      try {
        const parsed = JSON.parse(savedHidden);
        if (Array.isArray(parsed)) {
          setHiddenColumns(new Set(parsed));
        }
      } catch (error) {
        console.warn('Failed to parse saved hidden columns:', error);
      }
    }
  }, []);

  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Column configuration
  const columnConfig = {
    pending: { title: 'Pending', emptyMessage: 'No pending bookings' },
    assigned: { title: 'Assigned', emptyMessage: 'No assigned bookings' },
    confirmed: { title: 'Confirmed', emptyMessage: 'No confirmed bookings' },
    en_route: { title: 'En Route', emptyMessage: 'No en route bookings' },
    arrived: { title: 'Arrived', emptyMessage: 'No arrived bookings' },
    in_progress: { title: 'In Progress', emptyMessage: 'No in progress bookings' },
    completed: { title: 'Completed', emptyMessage: 'No completed bookings' },
    cancelled: { title: 'Cancelled', emptyMessage: 'No cancelled bookings' }
  };

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((status: DispatchStatus) => {
    setHiddenColumns(prev => {
      const newHidden = new Set(prev);
      if (newHidden.has(status)) {
        newHidden.delete(status);
      } else {
        newHidden.add(status);
      }
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('dispatch-hidden-columns', JSON.stringify(Array.from(newHidden)));
      }
      
      return newHidden;
    });
  }, []);

  // Get visible columns
  const visibleColumns = columnOrder.filter(status => !hiddenColumns.has(status));

  const loadDispatchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      // First get all dispatch entries
      const { data: dispatchData, error: dispatchError } = await supabase
        .from('dispatch_entries')
        .select(`
          *,
          driver:drivers(*),
          vehicle:vehicles(*),
          booking:bookings(
            *,
            driver:drivers(id, first_name, last_name, email, phone, profile_image_url),
            vehicle:vehicles(id, name, plate_number, brand, model, year, image_url, status)
          )
        `)
        .order('start_time', { ascending: false });

      if (dispatchError) throw dispatchError;

      // Also get all bookings that need dispatch management (confirmed, assigned, etc.)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          driver:drivers(id, first_name, last_name, email, phone, profile_image_url),
          vehicle:vehicles(id, name, plate_number, brand, model, year, image_url, status)
        `)
        .in('status', ['confirmed', 'assigned', 'pending'])
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Combine dispatch entries with bookings that don't have dispatch entries yet
      const allEntries = [...(dispatchData || [])];
      
      // Add bookings without dispatch entries as pending entries
      const bookingsWithoutDispatch = (bookingsData || []).filter(booking => 
        !dispatchData?.some(entry => entry.booking_id === booking.id)
      );

      // Only include bookings with valid date/time data
      const validBookings = bookingsWithoutDispatch.filter(booking => 
        booking.date && booking.time && 
        typeof booking.date === 'string' && 
        typeof booking.time === 'string'
      );

      console.log(`[Dispatch] Found ${bookingsWithoutDispatch.length} bookings without dispatch, ${validBookings.length} have valid date/time`);

      const pendingEntries = validBookings.map(booking => ({
        id: `pending-${booking.id}`, // Generate unique ID for pending entries
        booking_id: booking.id,
        status: booking.status as DispatchStatus, // Use actual booking status instead of hardcoded 'pending'
        driver_id: booking.driver_id,
        vehicle_id: booking.vehicle_id,
        start_time: null, // Don't set start_time for pending entries, let the UI handle it
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        driver: booking.driver,
        vehicle: booking.vehicle,
        booking: booking
      }));

      const data = [...allEntries, ...pendingEntries];
      
      // Transform the data to match our interface expectations
      const loadedAssignments = (data || []).map(entry => ({
        ...entry,
        booking: {
          ...entry.booking,
          supabase_id: entry.booking.id,
          // Map vehicle license_plate from plate_number if vehicle exists
          vehicle: entry.booking.vehicle ? {
            ...entry.booking.vehicle,
            license_plate: entry.booking.vehicle.plate_number,
          } : null
        }
      })) as unknown as DispatchEntryWithRelations[];

      // Deduplicate entries by booking_id - keep only the most recent entry for each booking
      // Priority: dispatch entries over pending entries, then use most recent
      const uniqueAssignments = loadedAssignments.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.booking_id === current.booking_id);
        
        if (existingIndex === -1) {
          // First entry for this booking
          acc.push(current);
        } else {
          const existing = acc[existingIndex];
          
          // Priority: dispatch entries over pending entries
          const isCurrentDispatch = !current.id.startsWith('pending-');
          const isExistingDispatch = !existing.id.startsWith('pending-');
          
          if (isCurrentDispatch && !isExistingDispatch) {
            // Current is dispatch entry, existing is pending - replace
            acc[existingIndex] = current;
          } else if (!isCurrentDispatch && isExistingDispatch) {
            // Current is pending, existing is dispatch - keep existing
          } else {
            // Both same type - use most recent
            const currentDate = new Date(current.updated_at || current.created_at);
            const existingDate = new Date(existing.updated_at || existing.created_at);
            
            if (currentDate > existingDate) {
              acc[existingIndex] = current;
            }
          }
        }
        
        return acc;
      }, [] as DispatchEntryWithRelations[]);

      console.log(`[Dispatch] Loaded ${loadedAssignments.length} entries, deduplicated to ${uniqueAssignments.length} unique bookings`);
      
      // Debug: Log some sample entries to see the structure
      if (uniqueAssignments.length > 0) {
        console.log('[Dispatch] Sample entry structure:', {
          id: uniqueAssignments[0].id,
          status: uniqueAssignments[0].status,
          start_time: uniqueAssignments[0].start_time,
          booking_date: uniqueAssignments[0].booking?.date,
          booking_time: uniqueAssignments[0].booking?.time
        });
      }
      
      // Show all relevant entries for dispatch management
      const filteredAssignments = uniqueAssignments.filter(entry => {
        // Always show entries with active dispatch statuses
        if (['pending', 'assigned', 'confirmed', 'en_route', 'arrived', 'in_progress'].includes(entry.status)) {
          return true;
        }
        
        // For completed/cancelled dispatch entries, only show if they're recent (within last 24 hours)
        if (['completed', 'cancelled'].includes(entry.status)) {
          const entryDate = new Date(entry.updated_at || entry.created_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return entryDate > oneDayAgo;
        }
        
        return false;
      });
      
      console.log(`[Dispatch] Filtered to ${filteredAssignments.length} relevant entries`);
      
      setAssignments(filteredAssignments);
      setLastRefresh(new Date());

    } catch (error) {
      console.error('Error loading dispatch data:', error);
      toast({
        title: "Error",
        description: "Failed to load dispatch data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDispatchData();
  }, [lastUpdate, loadDispatchData]);

  // Listen for broadcasted updates
  useEffect(() => {
    const handleDispatchUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.type === 'assignment_update' || customEvent.detail.type === 'refresh') {
        loadDispatchData();
      }
    };

    window.addEventListener('dispatch-state-update', handleDispatchUpdate);

    return () => {
      window.removeEventListener('dispatch-state-update', handleDispatchUpdate);
    };
  }, [loadDispatchData]);

  const handleUpdateStatus = async (entryId: string, newStatus: DispatchStatus) => {
    const originalAssignments = [...assignments];
    
    // Optimistic update
    setAssignments(prev => prev.map(assignment => 
      assignment.id === entryId 
        ? { ...assignment, status: newStatus, updated_at: new Date().toISOString() }
        : assignment
    ));

    try {
      const entry = assignments.find(e => e.id === entryId);
      if (!entry || !entry.booking_id) {
        throw new Error("Booking information not found for this dispatch entry.");
      }
      
      // Handle pending entries (they don't have dispatch entries yet)
      if (entryId.startsWith('pending-')) {
        // Create a new dispatch entry for this pending booking
        const supabase = createClient();
        
        // Construct start_time from booking data if available
        let startTime = entry.start_time;
        if (!startTime && entry.booking?.date && entry.booking?.time) {
                      startTime = `${entry.booking.date}T${entry.booking.time}`;
        }
        
        const { data: newDispatchEntry, error: createError } = await supabase
          .from('dispatch_entries')
          .insert({
            booking_id: entry.booking_id,
            status: newStatus,
            start_time: startTime || new Date().toISOString(),
            driver_id: entry.driver_id,
            vehicle_id: entry.vehicle_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;

        // Update the booking status
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', entry.booking_id);

        if (bookingError) {
          console.warn('Error updating booking status:', bookingError);
        }

        toast({
          title: "Success",
          description: `Status updated to ${newStatus.replace('_', ' ')}`,
        });
      } else {
        // Regular dispatch entry update
        await updateDispatchStatus(entryId, newStatus, entry.booking_id);

        toast({
          title: "Success",
          description: `Status updated to ${newStatus.replace('_', ' ')}`,
        });
      }

    } catch (error) {
      console.error('Error updating status:', error);
      // Revert optimistic update
      setAssignments(originalAssignments);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment?.booking_id) {
      router.push(`/bookings/${assignment.booking_id}`);
    }
  };



  const handleUnassign = async (dispatchId: string) => {
    const originalAssignments = [...assignments];
    
    // Optimistic update
    setAssignments(prev => prev.filter(a => a.id !== dispatchId));

    try {
      const entry = originalAssignments.find(a => a.id === dispatchId);
      if (!entry || !entry.booking_id) {
        throw new Error("Entry not found");
      }

      // Handle pending entries
      if (dispatchId.startsWith('pending-')) {
        // For pending entries, just update the booking to remove assignments
        const supabase = createClient();
        const { error } = await supabase
          .from('bookings')
          .update({ 
            driver_id: null,
            vehicle_id: null,
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', entry.booking_id);

        if (error) throw error;
      } else {
        // For regular dispatch entries, use the unassign function
        await unassignResources(dispatchId);

        // Also update the booking status to 'pending'
        const supabase = createClient();
        const { error } = await supabase
          .from('bookings')
          .update({ 
            driver_id: null,
            vehicle_id: null,
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', entry.booking_id);

        if (error) {
          console.error('Error updating booking:', error);
        }
      }

      toast({
        title: "Success",
        description: "Resources unassigned successfully",
      });

    } catch (error) {
      console.error('Error unassigning resources:', error);
      // Revert optimistic update
      setAssignments(originalAssignments);
      toast({
        title: "Error",
        description: "Failed to unassign resources",
        variant: "destructive",
      });
    }
  };

  const handleAssignmentAction = (action: 'view-details' | 'start-trip' | 'complete-trip' | 'unassign', assignmentId: string) => {
    // ... existing code ...
  };

  const filteredAssignments = assignments.filter(assignment => {
    const booking = assignment.booking;
    if (!booking) return false;
    
    const matchesSearch = !searchQuery || 
      booking.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.wp_id && booking.wp_id.toString().toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate status counts
  const statusCounts = {
    pending: assignments.filter(e => e.status === 'pending').length,
    assigned: assignments.filter(e => e.status === 'assigned').length,
    confirmed: assignments.filter(e => e.status === 'confirmed').length,
    en_route: assignments.filter(e => e.status === 'en_route').length,
    arrived: assignments.filter(e => e.status === 'arrived').length,
    in_progress: assignments.filter(e => e.status === 'in_progress').length,
    completed: assignments.filter(e => e.status === 'completed').length,
    cancelled: assignments.filter(e => e.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      {/* Header - Matching pricing page style */}
      <div className="border-b border-border/40 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Dispatch Center</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              Real-time booking management and assignment tracking
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DispatchStatus | 'all')}>
          <SelectTrigger className="w-full sm:w-40">
            <FilterIcon className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                All Status
              </div>
            </SelectItem>
            <SelectItem value="pending">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                Pending
              </div>
            </SelectItem>
            <SelectItem value="assigned">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Assigned
              </div>
            </SelectItem>
            <SelectItem value="confirmed">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Confirmed
              </div>
            </SelectItem>
            <SelectItem value="en_route">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                En Route
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Completed
              </div>
            </SelectItem>
            <SelectItem value="cancelled">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Cancelled
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Actions - Responsive button layout */}
        <div className="flex items-center gap-2">
          {activeView === 'board' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnSettings(true)}
              className="gap-2 flex-1 sm:flex-none"
            >
              <SettingsIcon className="h-4 w-4" />
              Columns
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDispatchData}
            disabled={isLoading}
            className={cn(
              "gap-2",
              activeView === 'board' ? "flex-1 sm:flex-none" : "w-full"
            )}
          >
            <RefreshCwIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs - Modern style like pricing page */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'board' | 'map' | 'timetable')} className="w-full">
        <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TabsList className="flex flex-wrap h-auto min-h-12 items-center justify-start rounded-none border-0 bg-transparent p-0 text-muted-foreground">
            <TabsTrigger 
              value="board" 
              className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
            >
              <Grid3X3Icon className="w-4 h-4 mr-2" />
              Board View
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Map View
            </TabsTrigger>
            <TabsTrigger 
              value="timetable" 
              className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Timetable
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent value="board" className="mt-6">
          <DispatchBoardView
            entries={filteredAssignments}
            onStatusChange={handleUpdateStatus}
            onUnassign={handleUnassign}
            onUnassignVehicle={handleUnassign}
            columnOrder={columnOrder}
            setColumnOrder={setColumnOrder}
            hiddenColumns={hiddenColumns}
            visibleColumns={visibleColumns}
            columnConfig={columnConfig}
            statusCounts={statusCounts}
          />
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <MapViewWithSidebar
            assignments={filteredAssignments}
            onAssignmentSelect={(assignment) => {
              console.log('Assignment selected for route display:', assignment);
            }}
            onVehicleSelect={(vehicleId) => {
              toast({
                title: "Vehicle Selected",
                description: `Vehicle ${vehicleId.slice(0, 8)} selected`,
              });
            }}
          />
        </TabsContent>

        <TabsContent value="timetable" className="mt-6">
          <DispatchTimetable
            entries={filteredAssignments}
            onStatusChange={handleUpdateStatus}
          />
        </TabsContent>
      </Tabs>

      {/* Column Settings Modal */}
      <Sheet open={showColumnSettings} onOpenChange={setShowColumnSettings}>
        <SheetContent className="w-[420px] sm:w-[480px]">
          <SheetHeader className="pb-4 border-b border-border/50">
            <SheetTitle className="text-lg font-semibold flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Column Settings
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              Customize which columns are visible and their order
            </p>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Show/Hide Columns */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <EyeIconSolid className="h-4 w-4" />
                  Show/Hide Columns
                </h4>
                <Badge variant="outline" className="text-xs">
                  {visibleColumns.length} of {columnOrder.length} visible
                </Badge>
              </div>
              
              <div className="space-y-2">
                {columnOrder.map((status) => {
                  const config = columnConfig[status];
                  if (!config) return null;
                  
                  const isHidden = hiddenColumns.has(status);
                  const count = statusCounts[status];
                  
                  return (
                    <div 
                      key={status} 
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                        "hover:bg-muted/50 hover:border-border/80",
                        isHidden 
                          ? "bg-muted/30 border-border/30 opacity-60" 
                          : "bg-card border-border/50"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <GripVerticalIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors cursor-grab" />
                          <div className="w-3 h-3 rounded-full" style={{
                            backgroundColor: status === 'pending' ? '#f59e0b' :
                                           status === 'assigned' ? '#3b82f6' :
                                           status === 'confirmed' ? '#10b981' :
                                           status === 'en_route' ? '#8b5cf6' :
                                           status === 'arrived' ? '#6366f1' :
                                           status === 'in_progress' ? '#06b6d4' :
                                           status === 'completed' ? '#22c55e' :
                                           status === 'cancelled' ? '#ef4444' : '#6b7280'
                          }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "text-sm font-medium",
                            isHidden ? "text-muted-foreground" : "text-foreground"
                          )}>
                            {config.title}
                          </span>
                        </div>
                        <Badge 
                          variant={count > 0 ? "default" : "secondary"} 
                          className={cn(
                            "text-xs font-medium min-w-[24px] justify-center",
                            count > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {count}
                        </Badge>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleColumnVisibility(status)}
                        className={cn(
                          "gap-2 h-8 px-3 transition-all duration-200",
                          isHidden 
                            ? "text-muted-foreground hover:text-foreground hover:bg-muted" 
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        {isHidden ? (
                          <>
                            <EyeOffIcon className="h-4 w-4" />
                            <span className="text-xs font-medium">Show</span>
                          </>
                        ) : (
                          <>
                            <EyeIconSolid className="h-4 w-4" />
                            <span className="text-xs font-medium">Hide</span>
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 