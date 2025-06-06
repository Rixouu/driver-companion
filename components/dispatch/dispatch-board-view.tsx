"use client";

import { useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DispatchEntryWithRelations, DispatchStatus } from "@/types/dispatch";
import { CalendarIcon, ClockIcon, UserIcon, CarIcon, MapPinIcon, PhoneIcon } from "lucide-react";
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

interface DispatchBoardViewProps {
  entries: DispatchEntryWithRelations[];
  onAssignDriver?: (dispatchId: string, driverId: string) => void;
  onAssignVehicle?: (dispatchId: string, vehicleId: string) => void;
  onUnassignVehicle?: (dispatchId: string) => void;
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
}

function getStatusColor(status: DispatchStatus): string {
  const colors: Record<DispatchStatus, string> = {
    pending: "border-l-amber-400",
    assigned: "border-l-blue-400", 
    confirmed: "border-l-emerald-400",
    en_route: "border-l-purple-400",
    arrived: "border-l-indigo-400",
    in_progress: "border-l-cyan-400",
    completed: "border-l-green-400",
    cancelled: "border-l-red-400",
    emergency: "border-l-rose-400"
  };
  
  return colors[status] || "border-l-gray-400";
}

function DispatchCard({ 
  entry, 
  onClick,
  index 
}: { 
  entry: DispatchEntryWithRelations; 
  onClick: () => void;
  index: number;
}) {
  const formattedTime = format(parseISO(entry.start_time), "HH:mm");
  
  return (
    <Draggable draggableId={entry.id} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <Card 
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "cursor-pointer transition-all duration-200 mb-3 border-l-4 hover:shadow-md bg-card hover:bg-muted/50",
            getStatusColor(entry.status),
            snapshot.isDragging && "shadow-lg scale-105",
            "border border-border/50"
          )}
          onClick={onClick}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">
                #{entry.booking.wp_id || entry.booking.id.substring(0, 8)}
              </span>
              <span className="text-xs text-muted-foreground">{formattedTime}</span>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium truncate">
                {entry.booking.customer_name || "Unknown Customer"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {entry.booking.service_name || "Service"}
              </p>
            </div>

            <div className="flex items-center justify-between mt-3">
              <Badge 
                variant="outline" 
                className="text-xs border-current"
              >
                {entry.status.replace('_', ' ')}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {entry.driver_id && <UserIcon className="h-3 w-3 text-emerald-600" />}
                {entry.vehicle_id && <CarIcon className="h-3 w-3 text-blue-600" />}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}

function Column({ title, status, entries, count, emptyMessage, onCardClick }: ColumnProps) {
  const filteredEntries = entries.filter((entry) => entry.status === status);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 pb-2">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      
      <Droppable droppableId={status}>
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 min-h-0 transition-colors",
              snapshot.isDraggingOver && "bg-muted/30 rounded-lg"
            )}
          >
            {filteredEntries.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-center text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-lg">
                <span className="p-4">{emptyMessage}</span>
              </div>
            ) : (
              <div className="space-y-0 pr-2 pb-4">
                {filteredEntries.map((entry, index) => (
                  <DispatchCard 
                    key={entry.id} 
                    entry={entry} 
                    onClick={() => onCardClick(entry)}
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
          <h2 className="text-lg font-semibold">
            #{entry.booking.wp_id || entry.booking.id.substring(0, 8)}
          </h2>
          <Badge className={cn("text-sm", getStatusColor(entry.status).replace('border-l-','bg-').replace('-400', '-100'))}>
            {entry.status.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formattedDate} at {formattedTime}
        </p>
      </div>

      {/* Customer Info */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Customer Information</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{entry.booking.customer_name || "Unknown Customer"}</span>
          </div>
          {entry.booking.customer_phone && (
            <div className="flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
              <a 
                href={`tel:${entry.booking.customer_phone}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {entry.booking.customer_phone}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Service Details */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Service Details</h3>
        <div className="space-y-2">
          <p className="text-sm">{entry.booking.service_name || "Vehicle Service"}</p>
          {entry.booking.pickup_location && (
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">From:</p>
                <p className="text-sm">{entry.booking.pickup_location}</p>
              </div>
            </div>
          )}
          {entry.booking.dropoff_location && (
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">To:</p>
                <p className="text-sm">{entry.booking.dropoff_location}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Actions</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push(`/bookings/${entry.booking.id}`)}
          >
            View Full Details
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => router.push(`/dispatch/assignments?booking=${entry.booking.id}`)}
          >
            Manage Assignments
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

    // Update the database
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('dispatch_entries')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) throw error;

      // Also update booking status if needed
      const entry = entries.find(e => e.id === entryId);
      if (entry) {
        let bookingStatus = entry.booking.status;
        if (newStatus === 'completed') bookingStatus = 'completed';
        if (newStatus === 'cancelled') bookingStatus = 'cancelled';
        if (newStatus === 'confirmed') bookingStatus = 'confirmed';

        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ 
            status: bookingStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', entry.booking_id);

        if (bookingError) {
          console.error('Error updating booking status:', bookingError);
        }
      }

      toast({
        title: "Success",
        description: `Status updated to ${newStatus.replace('_', ' ')}`,
      });

    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  }, [entries, onStatusChange]);

  const statusCounts = {
    pending: entries.filter(e => e.status === 'pending').length,
    assigned: entries.filter(e => e.status === 'assigned').length,
    confirmed: entries.filter(e => e.status === 'confirmed').length,
    en_route: entries.filter(e => e.status === 'en_route').length,
    completed: entries.filter(e => e.status === 'completed').length,
    cancelled: entries.filter(e => e.status === 'cancelled').length,
  };
  
  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-6 gap-6 h-full overflow-hidden">
          <Column
            title="Pending"
            status="pending"
            entries={entries}
            count={statusCounts.pending}
            emptyMessage="No pending bookings"
            onCardClick={handleCardClick}
          />
          <Column
            title="Assigned"
            status="assigned"
            entries={entries}
            count={statusCounts.assigned}
            emptyMessage="No assigned bookings"
            onCardClick={handleCardClick}
          />
          <Column
            title="Confirmed"
            status="confirmed"
            entries={entries}
            count={statusCounts.confirmed}
            emptyMessage="No confirmed bookings"
            onCardClick={handleCardClick}
          />
          <Column
            title="En Route"
            status="en_route"
            entries={entries}
            count={statusCounts.en_route}
            emptyMessage="No active trips"
            onCardClick={handleCardClick}
          />
          <Column
            title="Completed"
            status="completed"
            entries={entries}
            count={statusCounts.completed}
            emptyMessage="No completed trips"
            onCardClick={handleCardClick}
          />
          <Column
            title="Cancelled"
            status="cancelled"
            entries={entries}
            count={statusCounts.cancelled}
            emptyMessage="No cancelled bookings"
            onCardClick={handleCardClick}
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