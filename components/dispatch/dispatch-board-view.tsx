"use client";

import { useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DispatchEntryWithRelations, DispatchStatus } from "@/types/dispatch";
import { CalendarIcon, ClockIcon, UserIcon, CarIcon, MapPinIcon, PhoneIcon, MoreVerticalIcon, EditIcon, EyeIcon, UserXIcon, Zap } from "lucide-react";
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
  const formattedTime = format(parseISO(entry.start_time), "HH:mm");
  const router = useRouter();
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

  const handleUnassign = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnassign) {
      onUnassign(entry.id);
    }
  };
  
  return (
    <Draggable draggableId={entry.id} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <Card 
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "cursor-pointer transition-all duration-200 mb-3 border-l-4 hover:shadow-md bg-card hover:bg-muted/50 border border-border/50",
            getStatusColor(entry.status),
            snapshot.isDragging && "shadow-lg scale-105 rotate-2"
          )}
          onClick={onClick}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">
                  #{entry.booking.wp_id || entry.booking.id.substring(0, 8)}
                </span>
                <Badge className={cn("text-xs", getStatusBadgeStyle(entry.status))}>
                  {entry.status.replace('_', ' ')}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {formattedTime}
              </span>
            </div>
            
            <div className="space-y-2 mb-3">
              <p className="text-sm font-medium truncate text-foreground">
                {entry.booking.customer_name || "Unknown Customer"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {entry.booking.service_name || "Service"}
              </p>
              {entry.booking.pickup_location && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  {entry.booking.pickup_location}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {entry.driver_id && (
                  <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full text-xs">
                    <UserIcon className="h-3 w-3" />
                    Driver
                  </div>
                )}
                {entry.vehicle_id && (
                  <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                    <CarIcon className="h-3 w-3" />
                    Vehicle
                  </div>
                )}
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
                  {isAssigned && onUnassign && (
                    <DropdownMenuItem onClick={handleUnassign}>
                      <UserXIcon className="h-4 w-4 mr-2" />
                      Unassign All
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
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

function DispatchDetailsPanel({ 
  entry, 
  onAssignDriver, 
  onAssignVehicle, 
  onUnassignVehicle,
  availableDrivers = [],
  availableVehicles = []
}: {
  entry: DispatchEntryWithRelations;
  onAssignDriver?: (dispatchId: string, driverId: string) => void;
  onAssignVehicle?: (dispatchId: string, vehicleId: string) => void;
  onUnassignVehicle?: (dispatchId: string) => void;
  availableDrivers?: Driver[];
  availableVehicles?: Vehicle[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const formattedDate = format(parseISO(entry.start_time), "MMM d, yyyy");
  const formattedTime = format(parseISO(entry.start_time), "HH:mm");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            #{entry.booking.wp_id || entry.booking.id.substring(0, 8)}
          </h2>
          <Badge className={cn("text-sm", getStatusBadgeStyle(entry.status))}>
            {entry.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formattedDate} at {formattedTime}
        </p>
      </div>

      {/* Customer Info */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-foreground">Customer Information</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{entry.booking.customer_name || "Unknown Customer"}</span>
          </div>
          {entry.booking.customer_phone && (
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
              <a 
                href={`tel:${entry.booking.customer_phone}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {entry.booking.customer_phone}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Service Details */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-foreground">Service Details</h3>
        <div className="space-y-2">
          <p className="text-sm text-foreground">{entry.booking.service_name || "Vehicle Service"}</p>
          {entry.booking.pickup_location && (
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">From:</p>
                <p className="text-sm text-foreground">{entry.booking.pickup_location}</p>
              </div>
            </div>
          )}
          {entry.booking.dropoff_location && (
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">To:</p>
                <p className="text-sm text-foreground">{entry.booking.dropoff_location}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm text-foreground">Actions</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push(`/bookings/${entry.booking.id}`)}
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View Full Details
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push(`/bookings/${entry.booking.id}/edit`)}
          >
            <EditIcon className="h-4 w-4 mr-2" />
            Edit Booking
          </Button>

          {entry.booking.customer_phone && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.open(`tel:${entry.booking.customer_phone}`)}
            >
              <PhoneIcon className="h-4 w-4 mr-2" />
              Call Customer
            </Button>
          )}
        </div>
      </div>
    </div>
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

  const handleCardClick = useCallback((entry: DispatchEntryWithRelations) => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
  }, []);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as DispatchStatus;
    const entryId = draggableId;

    // Optimistically update the UI first
    if (onStatusChange) {
      onStatusChange(entryId, newStatus);
    }
  }, [onStatusChange]);

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
  
  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 lg:grid-cols-5 gap-4 h-full overflow-hidden">
          <Column
            title="Pending"
            status="pending"
            entries={entries}
            count={statusCounts.pending}
            emptyMessage="No pending bookings"
            onCardClick={handleCardClick}
            onQuickAssign={onQuickAssign}
            onUnassign={onUnassign}
          />
          <Column
            title="Assigned"
            status="assigned"
            entries={entries}
            count={statusCounts.assigned}
            emptyMessage="No assigned bookings"
            onCardClick={handleCardClick}
            onQuickAssign={onQuickAssign}
            onUnassign={onUnassign}
          />
          <Column
            title="Confirmed"
            status="confirmed"
            entries={entries}
            count={statusCounts.confirmed}
            emptyMessage="No confirmed bookings"
            onCardClick={handleCardClick}
            onQuickAssign={onQuickAssign}
            onUnassign={onUnassign}
          />
          <Column
            title="Completed"
            status="completed"
            entries={entries}
            count={statusCounts.completed}
            emptyMessage="No completed trips"
            onCardClick={handleCardClick}
            onQuickAssign={onQuickAssign}
            onUnassign={onUnassign}
          />
          <Column
            title="Cancelled"
            status="cancelled"
            entries={entries}
            count={statusCounts.cancelled}
            emptyMessage="No cancelled bookings"
            onCardClick={handleCardClick}
            onQuickAssign={onQuickAssign}
            onUnassign={onUnassign}
          />
        </div>
      </DragDropContext>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
          </SheetHeader>
          {selectedEntry && (
            <div className="mt-6">
              <DispatchDetailsPanel
                entry={selectedEntry}
                onAssignDriver={onAssignDriver}
                onAssignVehicle={onAssignVehicle}
                onUnassignVehicle={onUnassignVehicle}
                availableDrivers={availableDrivers}
                availableVehicles={availableVehicles}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
} 