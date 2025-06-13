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
  FilterIcon
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { toast } from '@/components/ui/use-toast';
import { useSharedDispatchState } from "@/lib/hooks/use-shared-dispatch-state";
import { cn } from '@/lib/utils/styles';
import { createClient } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { DispatchEntryWithRelations, DispatchStatus } from '@/types/dispatch';
import DispatchMap from './dispatch-map';
import DispatchBoardView from './dispatch-board-view';
import { useRouter } from 'next/navigation';

interface BookingListItemProps {
  booking: any;
  isSelected: boolean;
  isExpanded: boolean;
  onClick: () => void;
  onToggleExpand: () => void;
}

function BookingListItem({ booking, isSelected, isExpanded, onClick, onToggleExpand }: BookingListItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'en_route': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
          <Badge variant="outline" className={cn("text-xs", getStatusColor(booking.status))}>
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

function MapViewWithSidebar({ assignments, onAssignmentSelect, onVehicleSelect }: {
  assignments: DispatchEntryWithRelations[];
  onAssignmentSelect: (assignment: DispatchEntryWithRelations) => void;
  onVehicleSelect: (vehicleId: string) => void;
}) {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'pending' | 'assigned' | 'confirmed' | 'en_route' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedAssignment, setSelectedAssignment] = useState<DispatchEntryWithRelations | null>(null);
  const router = useRouter();

  const handleBookingSelect = (booking: any) => {
    if (!booking) return;
    setSelectedBookingId(booking.id);
    // Find the assignment and trigger route display
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
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  // Convert assignments to bookings for the sidebar, ensuring unique entries
  const allBookings = assignments
    .filter(a => a.booking)
    .reduce((unique, assignment) => {
      const booking = assignment.booking!;
      if (!unique.find(b => b.id === booking.id)) {
        unique.push({ ...booking, status: assignment.status }); // Use dispatch status
      }
      return unique;
    }, [] as any[]);

  // Filter bookings based on search and status filter
  const bookings = allBookings.filter(booking => {
    const matchesSearch = !searchQuery || 
      booking.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.wp_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.service_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = sidebarFilter === 'all' || booking.status === sidebarFilter;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-r bg-background flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Today's Bookings</h3>
              <Badge variant="secondary">{bookings.length} / {allBookings.length}</Badge>
            </div>
            
            {/* Search */}
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

            {/* Filter */}
            <div className="mb-3">
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
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/dispatch/assignments')}
              >
                <SettingsIcon className="h-4 w-4 mr-1" />
                Assignments
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSidebar(false)}
                title="Hide Panel"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <div className="space-y-1 p-2">
              {bookings.map((booking) => (
                <BookingListItem
                  key={booking.id}
                  booking={booking}
                  isSelected={selectedBookingId === booking.id}
                  isExpanded={expandedCards.has(booking.id)}
                  onClick={() => handleBookingSelect(booking)}
                  onToggleExpand={() => toggleCardExpansion(booking.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        {!showSidebar && (
          <Button
            size="sm"
            variant="outline"
            className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm border-2 dark:bg-gray-900/90 shadow-lg"
            onClick={() => setShowSidebar(true)}
            title="Show Panel"
          >
            <ListIcon className="h-4 w-4 mr-1" />
            Show List
          </Button>
        )}
        
        <DispatchMap
          assignments={assignments}
          selectedAssignment={selectedAssignment}
          onAssignmentSelect={onAssignmentSelect}
          onVehicleSelect={onVehicleSelect}
          className="h-full"
        />
      </div>
    </div>
  );
}

export default function RealTimeDispatchCenter() {
  const { t } = useI18n();
  const router = useRouter();
  const [activeView, setActiveView] = useState<'board' | 'map'>('board');
  const [assignments, setAssignments] = useState<DispatchEntryWithRelations[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DispatchStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [view, setView] = useState<'map' | 'board'>('board');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { lastUpdate, updateDispatchStatus, unassignResources } = useSharedDispatchState();

  const loadDispatchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('dispatch_entries')
        .select(`
          *,
          booking:bookings(
            *,
            driver:drivers(id, first_name, last_name, email, phone, profile_image_url),
            vehicle:vehicles(id, name, plate_number, brand, model, year, image_url, status)
          )
        `)
        .order('start_time', { ascending: false });

      if (error) throw error;
      
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

      setAssignments(loadedAssignments);
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
      
      await updateDispatchStatus(entryId, newStatus, entry.booking_id);

      toast({
        title: "Success",
        description: `Status updated to ${newStatus.replace('_', ' ')}`,
      });

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
      await unassignResources(dispatchId);

      // Also update the booking status to 'pending'
      const assignmentToUnassign = originalAssignments.find(a => a.id === dispatchId);
      if (assignmentToUnassign && assignmentToUnassign.booking_id) {
        const supabase = createClient();
        const { error } = await supabase
          .from('bookings')
          .update({ 
            status: 'pending',
            driver_id: null,
            vehicle_id: null
          })
          .eq('id', assignmentToUnassign.booking_id);

        if (error) throw error;
      }

      toast({
        title: t("dispatch.assignments.messages.unassignSuccess"),
      });

    } catch (error) {
      console.error("Failed to unassign:", error);
      // Revert optimistic update
      setAssignments(originalAssignments);
      toast({
        title: "Error",
        description: t("dispatch.assignments.messages.unassignError"),
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center px-4 gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Real-Time Dispatch Center</h1>
            <Badge variant="outline" className="text-xs">
              {assignments.length} assignments
            </Badge>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assignments..."
                className="w-[250px] pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DispatchStatus | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="en_route">En Route</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center rounded-md border">
              <Button
                variant={activeView === 'board' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('board')}
                className="rounded-r-none"
              >
                <Grid3X3Icon className="h-4 w-4 mr-1" />
                Board
              </Button>
              <Button
                variant={activeView === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('map')}
                className="rounded-l-none"
              >
                <MapIcon className="h-4 w-4 mr-1" />
                Map
              </Button>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadDispatchData}
              disabled={isLoading}
            >
              <RefreshCwIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'board' ? (
          <div className="h-full p-4">
            <DispatchBoardView
              entries={filteredAssignments}
              onStatusChange={handleUpdateStatus}
              onUnassign={handleUnassign}
            />
          </div>
        ) : (
          <MapViewWithSidebar
            assignments={filteredAssignments}
            onAssignmentSelect={(assignment) => {
              // For map view, just show a toast - the route will be handled by the map component
              // when booking markers are clicked (if they were implemented with geocoding)
              console.log('Assignment selected for route display:', assignment);
            }}
            onVehicleSelect={(vehicleId) => {
              toast({
                title: "Vehicle Selected",
                description: `Vehicle ${vehicleId.slice(0, 8)} selected`,
              });
            }}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t bg-background/95 backdrop-blur">
        <div className="flex h-8 items-center px-4 text-xs text-muted-foreground">
          <span>Last updated: {format(lastRefresh, 'HH:mm:ss')}</span>
          <div className="ml-auto flex items-center gap-4">
            <span>{filteredAssignments.length} assignments</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dispatch/assignments')}
              className="h-6 text-xs"
            >
              Manage Assignments
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 