"use client";

import { useState, useCallback } from "react";
import { format, parseISO, startOfWeek, addDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DispatchEntryWithRelations, DispatchStatus } from "@/types/dispatch";
import { CalendarIcon, ClockIcon, UserIcon, CarIcon, MapPinIcon, PhoneIcon, MoreVerticalIcon, EditIcon, EyeIcon, UserXIcon, Zap, CheckIcon, GripVerticalIcon, EyeOffIcon, SettingsIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn, getDispatchStatusDotColor, getDispatchStatusBadgeClasses, getDispatchStatusBorderColor } from "@/lib/utils/styles";
import { Driver } from "@/types/drivers";
import { Vehicle } from "@/types/vehicles";
import { useRouter } from "next/navigation";
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult,
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableProvided,
  DroppableStateSnapshot
} from '@hello-pangea/dnd';
import { createClient } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSharedDispatchState } from "@/lib/hooks/use-shared-dispatch-state";
import { BookingDetailsSidebar } from '@/components/shared/booking-details-sidebar';

interface DispatchBoardViewProps {
  entries: DispatchEntryWithRelations[];
  onAssignDriver?: (dispatchId: string, driverId: string) => void;
  onAssignVehicle?: (dispatchId: string, vehicleId: string) => void;
  onUnassignVehicle?: (dispatchId: string) => void;
  onQuickAssign?: (dispatchId: string) => void;
  onUnassign?: (dispatchId: string) => void;
  availableDrivers?: Driver[];
  availableVehicles?: Vehicle[];
  onStatusChange?: (entryId: string, newStatus: DispatchStatus) => void;
  columnOrder?: DispatchStatus[];
  setColumnOrder?: (order: DispatchStatus[]) => void;
  hiddenColumns?: Set<DispatchStatus>;
  visibleColumns?: DispatchStatus[];
  columnConfig?: Record<DispatchStatus, { title: string; emptyMessage: string }>;
  statusCounts?: Record<DispatchStatus, number>;
}

interface ColumnProps {
  title: string;
  status: DispatchStatus;
  entries: DispatchEntryWithRelations[];
  count: number;
  emptyMessage: string;
  onCardClick: (entry: DispatchEntryWithRelations) => void;
  onQuickAssign?: (dispatchId: string) => void;
  onUnassign?: (dispatchId: string) => void;
}


function DispatchCard({ 
  entry, 
  onClick,
  index,
  onQuickAssign,
  onUnassign
}: { 
  entry: DispatchEntryWithRelations; 
  onClick: () => void;
  index: number;
  onQuickAssign?: (dispatchId: string) => void;
  onUnassign?: (dispatchId: string) => void;
}) {
  // Safely format the time, handling invalid dates
  const formattedTime = (() => {
    try {
      if (!entry.start_time) {
        // For pending entries without start_time, try to get from booking
        if (entry.booking?.date && entry.booking?.time) {
          return entry.booking.time;
        }
        return "TBD";
      }
      
      const parsedDate = parseISO(entry.start_time);
      if (isNaN(parsedDate.getTime())) {
        // Invalid date, try to get from booking
        if (entry.booking?.date && entry.booking?.time) {
          return entry.booking.time;
        }
        return "TBD";
      }
      
      return format(parsedDate, "HH:mm");
    } catch (error) {
      // Fallback to booking time or TBD
      if (entry.booking?.time) {
        return entry.booking.time;
      }
      return "TBD";
    }
  })();
  const router = useRouter();
  const { unassignResources } = useSharedDispatchState();
  const isAssigned = entry.driver_id && entry.vehicle_id;
  
  const handleQuickAssign = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickAssign) {
      onQuickAssign(entry.id);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/bookings/${entry.booking.id}`);
  };

  const handleEditBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/bookings/${entry.booking.id}/edit`);
  };

  const handleUnassign = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (entry.booking?.id) {
      await unassignResources(entry.id, entry.booking.id);
      toast({
        title: "Unassigned",
        description: "Booking has been returned to pending status."
      });
    }
  };
  
  return (
    <Draggable draggableId={entry.id} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "cursor-pointer transition-all duration-200 mb-2 border-l-4 hover:shadow-lg bg-card hover:bg-muted/50 border border-border/50 rounded-lg group",
            getDispatchStatusBorderColor(entry.status),
            snapshot.isDragging && "shadow-xl scale-105 rotate-1 z-50"
          )}
          onClick={onClick}
        >
          {/* Compact half-size card design */}
          <div className="p-3">
            {/* Header row - ID and time */}
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm text-foreground">
                #{entry.booking.wp_id || entry.booking.id.substring(0, 8)}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ClockIcon className="h-3 w-3" />
                <span className="font-medium">{formattedTime}</span>
              </div>
            </div>

            {/* Status badge */}
            <div className="mb-2">
              <Badge className={cn("text-xs font-medium px-2 py-0.5", getDispatchStatusBadgeClasses(entry.status))}>
                {entry.status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Customer name */}
            <div className="mb-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {entry.booking.customer_name || "Unknown Customer"}
              </p>
            </div>

            {/* Service type */}
            <div className="mb-2">
              <p className="text-xs text-muted-foreground truncate">
                {entry.booking.service_name || "Service"}
              </p>
            </div>

            {/* View details icon */}
            <div className="flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleViewDetails}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/50"
                title="View Details"
              >
                <EyeIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function Column({ title, status, entries, count, emptyMessage, onCardClick, onQuickAssign, onUnassign }: ColumnProps) {
  const filteredEntries = entries.filter((entry) => entry.status === status);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: getDispatchStatusDotColor(status) }}
          />
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        </div>
        <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
          {count}
        </Badge>
      </div>
      
      <Droppable droppableId={status}>
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 min-h-0 transition-colors rounded-lg",
              snapshot.isDraggingOver && "bg-muted/30 border-2 border-dashed border-primary/50"
            )}
          >
            {filteredEntries.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-center text-muted-foreground text-sm border-2 border-dashed border-border/30 rounded-lg">
                <span className="p-4">{emptyMessage}</span>
              </div>
            ) : (
              <div className="space-y-0 pr-2 pb-4">
                {filteredEntries.map((entry, index) => (
                  <DispatchCard 
                    key={entry.id} 
                    entry={entry} 
                    onClick={() => onCardClick(entry)}
                    onQuickAssign={onQuickAssign}
                    onUnassign={onUnassign}
                    index={index}
                  />
                ))}
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

// Draggable column wrapper
function DraggableColumn({ 
  title, 
  status, 
  entries, 
  count, 
  emptyMessage, 
  onCardClick, 
  onQuickAssign, 
  onUnassign,
  index 
}: ColumnProps & { index: number }) {
  return (
    <Draggable draggableId={`column-${status}`} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "flex flex-col h-full",
            snapshot.isDragging && "opacity-50"
          )}
        >
          {/* Column header with drag indicator */}
          <div
            {...provided.dragHandleProps}
            className="flex items-center justify-between mb-4 sticky top-0 bg-background z-20 pb-2 border-b border-border/50 cursor-move hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <GripVerticalIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getDispatchStatusDotColor(status) }}
              />
              <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            </div>
            <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
              {count}
            </Badge>
          </div>
          
          <Droppable droppableId={status}>
            {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex-1 min-h-0 transition-colors rounded-lg",
                  snapshot.isDraggingOver && "bg-muted/30 border-2 border-dashed border-primary/50"
                )}
              >
                {entries.filter((entry) => entry.status === status).length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-center text-muted-foreground text-sm border-2 border-dashed border-border/30 rounded-lg">
                    <span className="p-4">{emptyMessage}</span>
                  </div>
                ) : (
                  <div className="space-y-0 pr-2 pb-4">
                    {entries.filter((entry) => entry.status === status).map((entry, index) => (
                      <DispatchCard 
                        key={entry.id} 
                        entry={entry} 
                        onClick={() => onCardClick(entry)}
                        onQuickAssign={onQuickAssign}
                        onUnassign={onUnassign}
                        index={index}
                      />
                    ))}
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
}

export default function DispatchBoardView({ 
  entries,
  onAssignDriver,
  onAssignVehicle,
  onUnassignVehicle,
  onQuickAssign,
  onUnassign,
  availableDrivers = [],
  availableVehicles = [],
  onStatusChange,
  columnOrder = ['pending', 'assigned', 'confirmed', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'],
  setColumnOrder,
  hiddenColumns = new Set(),
  visibleColumns = ['pending', 'assigned', 'confirmed', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'],
  columnConfig = {
    pending: { title: 'Pending', emptyMessage: 'No pending bookings' },
    assigned: { title: 'Assigned', emptyMessage: 'No assigned bookings' },
    confirmed: { title: 'Confirmed', emptyMessage: 'No confirmed bookings' },
    en_route: { title: 'En Route', emptyMessage: 'No en route bookings' },
    arrived: { title: 'Arrived', emptyMessage: 'No arrived bookings' },
    in_progress: { title: 'In Progress', emptyMessage: 'No in progress bookings' },
    completed: { title: 'Completed', emptyMessage: 'No completed bookings' },
    cancelled: { title: 'Cancelled', emptyMessage: 'No cancelled bookings' }
  },
  statusCounts = {
    pending: 0,
    assigned: 0,
    confirmed: 0,
    en_route: 0,
    arrived: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0
  }
}: DispatchBoardViewProps) {
  const { t } = useI18n();
  const [selectedEntry, setSelectedEntry] = useState<DispatchEntryWithRelations | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Week navigation state
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    return startOfWeekDate;
  });

  const handleCardClick = useCallback((entry: DispatchEntryWithRelations) => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
  }, []);

  // Week navigation functions
  const goToPreviousWeek = useCallback(() => {
    setCurrentWeek(prev => addDays(prev, -7));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeek(prev => addDays(prev, 7));
  }, []);

  const goToCurrentWeek = useCallback(() => {
    const now = new Date();
    const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 });
    setCurrentWeek(startOfWeekDate);
  }, []);

  // Filter entries based on current week
  const filteredEntries = entries.filter(entry => {
    if (!entry.booking?.date) return false;
    const bookingDate = new Date(entry.booking.date);
    const weekStart = currentWeek;
    const weekEnd = addDays(currentWeek, 6);
    
    return bookingDate >= weekStart && bookingDate <= weekEnd;
  });

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    // Handle column reordering
    if (type === 'COLUMN') {
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;
      
      const newColumnOrder = Array.from(columnOrder);
      const [reorderedColumn] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, reorderedColumn);
      
      if (setColumnOrder) {
        setColumnOrder(newColumnOrder);
      }
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('dispatch-column-order', JSON.stringify(newColumnOrder));
      }
      
      return;
    }

    // Handle card reordering between columns
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as DispatchStatus;
    const entryId = draggableId;

    // Find the entry being moved
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    // Don't update if status is the same
    if (entry.status === newStatus) return;

    // Optimistically update the UI first
    if (onStatusChange) {
      onStatusChange(entryId, newStatus);
    }
  }, [onStatusChange, columnOrder, setColumnOrder, entries]);

  
  return (
    <>
      {/* Week Navigation - Responsive for Mobile/Tablet/Desktop */}
      <div className="mb-6">
        {/* Mobile: Stack everything vertically */}
        <div className="flex flex-col lg:hidden space-y-4">
          {/* Title and Date - Stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h2 className="text-lg font-semibold">Dispatch Board</h2>
            <div className="text-sm text-muted-foreground">
              Week of {format(currentWeek, "MMM dd, yyyy")}
            </div>
          </div>
          
          {/* Navigation Buttons - Responsive layout */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                className="gap-2 flex-1 sm:flex-none"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Previous Week</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentWeek}
                className="gap-2 flex-1 sm:flex-none"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">This Week</span>
                <span className="sm:hidden">This</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                className="gap-2 flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Next Week</span>
                <span className="sm:hidden">Next</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop: Everything in one row */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Dispatch Board</h2>
            <div className="text-sm text-muted-foreground">
              Week of {format(currentWeek, "MMM dd, yyyy")}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="gap-2"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
              className="gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="gap-2"
            >
              Next Week
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
          {(provided: DroppableProvided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "grid gap-4 h-full overflow-visible",
                visibleColumns.length === 1 && "grid-cols-1",
                visibleColumns.length === 2 && "grid-cols-1 sm:grid-cols-2",
                visibleColumns.length === 3 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
                visibleColumns.length === 4 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
                visibleColumns.length >= 5 && "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
              )}
            >
              {visibleColumns.map((status, index) => {
                const config = columnConfig[status];
                if (!config) return null;
                
                return (
                  <DraggableColumn
                    key={status}
                    title={config.title}
                    status={status}
                    entries={filteredEntries}
                    count={filteredEntries.filter(e => e.status === status).length}
                    emptyMessage={config.emptyMessage}
                    onCardClick={handleCardClick}
                    onQuickAssign={onQuickAssign}
                    onUnassign={onUnassign}
                    index={index}
                  />
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>


      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
          </SheetHeader>
          {selectedEntry && (
            <div className="mt-6">
              <BookingDetailsSidebar
                entry={selectedEntry}
                variant="dispatch"
                showDateInHeader={true}
                showNotes={true}
                showCustomerInfoFirst={false}
                notesType="customer"
                onUnassign={() => onUnassignVehicle?.(selectedEntry.id)}
                onReassign={() => {
                  // Add reassign functionality
                  console.log('Reassign driver for entry:', selectedEntry.id);
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
} 