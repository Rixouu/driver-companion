"use client";

import { useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DispatchEntryWithRelations, DispatchStatus } from "@/types/dispatch";
import { CalendarIcon, ClockIcon, UserIcon, CarIcon, MapPinIcon, PhoneIcon, MoreVerticalIcon, EditIcon, EyeIcon, UserXIcon, Zap, CheckIcon, GripVerticalIcon, EyeOffIcon, SettingsIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils/styles";
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
import SidePanelDetails from "./side-panel-details";

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

function getStatusColor(status: DispatchStatus): string {
  const colors: Record<DispatchStatus, string> = {
    pending: "border-l-amber-500 dark:border-l-amber-400",
    assigned: "border-l-blue-500 dark:border-l-blue-400", 
    confirmed: "border-l-emerald-500 dark:border-l-emerald-400",
    en_route: "border-l-purple-500 dark:border-l-purple-400",
    arrived: "border-l-indigo-500 dark:border-l-indigo-400",
    in_progress: "border-l-cyan-500 dark:border-l-cyan-400",
    completed: "border-l-green-500 dark:border-l-green-400",
    cancelled: "border-l-red-500 dark:border-l-red-400"
  };
  
  return colors[status] || "border-l-gray-400 dark:border-l-gray-500";
}

function getStatusBadgeStyle(status: DispatchStatus): string {
  const styles: Record<DispatchStatus, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700",
    assigned: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700", 
    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700",
    en_route: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700",
    arrived: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700",
    in_progress: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700",
    completed: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700",
    cancelled: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
  };
  
  return styles[status] || "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700";
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
            "cursor-pointer transition-all duration-200 mb-2 border-l-4 hover:shadow-md bg-card hover:bg-muted/50 border border-border/50 rounded-md",
            getStatusColor(entry.status),
            snapshot.isDragging && "shadow-lg scale-105 rotate-1"
          )}
          onClick={onClick}
        >
          {/* Strip-style card */}
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-sm text-foreground">
                    #{entry.booking.wp_id || entry.booking.id.substring(0, 8)}
                  </div>
                  <Badge className={cn("text-xs", getStatusBadgeStyle(entry.status))}>
                    {entry.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate text-foreground">
                  {entry.booking.customer_name || "Unknown Customer"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {entry.booking.service_name || "Service"}
                </p>
                {entry.booking.pickup_location && (
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                    <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{entry.booking.pickup_location}</span>
                  </p>
                )}
              </div>

              {/* Assignment status and actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {formattedTime}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {entry.driver_id && (
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" title="Driver assigned" />
                    )}
                    {entry.vehicle_id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" title="Vehicle assigned" />
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVerticalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleViewDetails}>
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleEditBooking}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit Booking
                    </DropdownMenuItem>
                    {!isAssigned && onQuickAssign && (
                      <DropdownMenuItem onClick={handleQuickAssign}>
                        <Zap className="h-4 w-4 mr-2" />
                        Quick Assign
                      </DropdownMenuItem>
                    )}
                    {isAssigned && (
                      <DropdownMenuItem onClick={handleUnassign}>
                        <UserXIcon className="h-4 w-4 mr-2" />
                        Unassign All
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
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
  onStatusChange
}: DispatchBoardViewProps) {
  const { t } = useI18n();
  const [selectedEntry, setSelectedEntry] = useState<DispatchEntryWithRelations | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Column order state - default order
  const [columnOrder, setColumnOrder] = useState<DispatchStatus[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dispatch-column-order');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Fallback to default if parsing fails
        }
      }
    }
    return ['pending', 'assigned', 'confirmed', 'completed', 'cancelled'];
  });

  // Hidden columns state
  const [hiddenColumns, setHiddenColumns] = useState<Set<DispatchStatus>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dispatch-hidden-columns');
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          // Fallback to empty set if parsing fails
        }
      }
    }
    return new Set();
  });

  // Column settings modal state
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const handleCardClick = useCallback((entry: DispatchEntryWithRelations) => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
  }, []);

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
        localStorage.setItem('dispatch-hidden-columns', JSON.stringify([...newHidden]));
      }
      
      return newHidden;
    });
  }, []);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Handle column reordering (when dragging column headers)
    if (draggableId.startsWith('column-')) {
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;
      
      const newColumnOrder = Array.from(columnOrder);
      const [reorderedColumn] = newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, reorderedColumn);
      
      setColumnOrder(newColumnOrder);
      
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

    // Optimistically update the UI first
    if (onStatusChange) {
      onStatusChange(entryId, newStatus);
    }
  }, [onStatusChange, columnOrder]);

  const statusCounts = {
    pending: entries.filter(e => e.status === 'pending').length,
    assigned: entries.filter(e => e.status === 'assigned').length,
    confirmed: entries.filter(e => e.status === 'confirmed').length,
    en_route: entries.filter(e => e.status === 'en_route').length,
    arrived: entries.filter(e => e.status === 'arrived').length,
    in_progress: entries.filter(e => e.status === 'in_progress').length,
    completed: entries.filter(e => e.status === 'completed').length,
    cancelled: entries.filter(e => e.status === 'cancelled').length,
  };

  // Column configuration
  const columnConfig = {
    pending: { title: "Pending", emptyMessage: "No pending bookings" },
    assigned: { title: "Assigned", emptyMessage: "No assigned bookings" },
    confirmed: { title: "Confirmed", emptyMessage: "No confirmed bookings" },
    en_route: { title: "En Route", emptyMessage: "No en route bookings" },
    arrived: { title: "Arrived", emptyMessage: "No arrived bookings" },
    in_progress: { title: "In Progress", emptyMessage: "No in progress bookings" },
    completed: { title: "Completed", emptyMessage: "No completed trips" },
    cancelled: { title: "Cancelled", emptyMessage: "No cancelled bookings" },
  };

  // Filter out hidden columns
  const visibleColumns = columnOrder.filter(status => !hiddenColumns.has(status));
  
  return (
    <>
      {/* Settings Button */}
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowColumnSettings(true)}
          className="gap-2"
        >
          <SettingsIcon className="h-4 w-4" />
          Column Settings
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="columns" direction="horizontal">
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
                    entries={entries}
                    count={statusCounts[status]}
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

      {/* Column Settings Modal */}
      <Sheet open={showColumnSettings} onOpenChange={setShowColumnSettings}>
        <SheetContent className="w-[400px]">
          <SheetHeader>
            <SheetTitle>Column Settings</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-sm">Show/Hide Columns</h4>
            {columnOrder.map((status) => {
              const config = columnConfig[status];
              if (!config) return null;
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{config.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {statusCounts[status]}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleColumnVisibility(status)}
                    className="gap-2"
                  >
                    {hiddenColumns.has(status) ? (
                      <>
                        <EyeOffIcon className="h-4 w-4" />
                        Show
                      </>
                    ) : (
                      <>
                        <EyeIcon className="h-4 w-4" />
                        Hide
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
          </SheetHeader>
          {selectedEntry && (
            <div className="mt-6">
              <SidePanelDetails
                entry={selectedEntry}
                onUnassign={() => onUnassignVehicle?.(selectedEntry.id)}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
} 