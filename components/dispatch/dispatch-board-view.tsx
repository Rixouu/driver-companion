"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DispatchEntry, DispatchStatus, DispatchEntryWithRelations } from "@/types/dispatch";
import { PlusIcon, InfoIcon, CarIcon, UserIcon, CalendarIcon, ClockIcon, User2Icon, MapPinIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils/styles";
import { Driver } from "@/types/drivers";
import { Vehicle } from "@/types/vehicles";
import { useRouter } from "next/navigation";

interface DispatchBoardViewProps {
  entries: DispatchEntryWithRelations[];
  onAssignDriver?: (dispatchId: string, driverId: string) => void;
  onAssignVehicle?: (dispatchId: string, vehicleId: string) => void;
  onUnassignVehicle?: (dispatchId: string) => void;
  availableDrivers?: Driver[];
  availableVehicles?: Vehicle[];
}

interface ColumnProps {
  title: string;
  status: DispatchStatus;
  entries: DispatchEntryWithRelations[];
  emptyMessage: string;
  onAssignDriver?: (dispatchId: string, driverId: string) => void;
  onAssignVehicle?: (dispatchId: string, vehicleId: string) => void;
  onUnassignVehicle?: (dispatchId: string) => void;
  availableDrivers?: Driver[];
  availableVehicles?: Vehicle[];
}

function getStatusColor(status: DispatchStatus): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "assigned":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "confirmed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "in_transit":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}

function formatTimeRange(startTime: string, endTime: string | null): string {
  const start = format(parseISO(startTime), "HH:mm");
  if (!endTime) return `${start} - ?`;
  const end = format(parseISO(endTime), "HH:mm");
  return `${start} - ${end}`;
}

interface DispatchCardProps {
  entry: DispatchEntryWithRelations;
  onAssignDriver?: (dispatchId: string, driverId: string) => void;
  onAssignVehicle?: (dispatchId: string, vehicleId: string) => void;
  onUnassignVehicle?: (dispatchId: string) => void;
  availableDrivers?: Driver[];
  availableVehicles?: Vehicle[];
}

function DispatchCard({ 
  entry, 
  onAssignDriver, 
  onAssignVehicle, 
  onUnassignVehicle,
  availableDrivers = [], 
  availableVehicles = [] 
}: DispatchCardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const formattedDate = format(parseISO(entry.start_time), "MMM d, yyyy");
  const timeRange = formatTimeRange(entry.start_time, entry.end_time);
  
  // Simplified booking card
  return (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardHeader className="py-3 px-4">
        <div className="flex flex-col">
          <CardTitle className="text-sm font-medium">
            #{entry.booking.wp_id || entry.booking.id.substring(0, 8)}
          </CardTitle>
          <Badge className={`mt-1 ${getStatusColor(entry.status)}`}>
            {t(`dispatch.status.${entry.status}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="py-2 px-4 space-y-2">
        <div className="flex items-center text-sm">
          <CalendarIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center text-sm">
          <ClockIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
          <span>{timeRange}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-3 px-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs h-8"
          onClick={() => router.push(`/bookings/${entry.booking.id}`)}
        >
          {t("dispatch.actions.viewDetails", { defaultValue: "View Details" })}
        </Button>
      </CardFooter>
    </Card>
  );
}

function Column({ 
  title, 
  status, 
  entries, 
  emptyMessage,
  onAssignDriver,
  onAssignVehicle,
  onUnassignVehicle,
  availableDrivers,
  availableVehicles
}: ColumnProps) {
  const filteredEntries = entries.filter((entry) => entry.status === status);
  
  return (
    <div className="flex flex-col bg-muted/30 rounded-lg p-3 min-h-[400px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">{title}</h3>
        <Badge variant="outline" className="font-normal">
          {filteredEntries.length}
        </Badge>
      </div>
      <div className="flex-1 overflow-auto">
        {filteredEntries.length === 0 ? (
          <div className="flex items-center justify-center h-24 bg-background/50 rounded-md border border-dashed text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <DispatchCard 
              key={entry.id} 
              entry={entry} 
              onAssignDriver={onAssignDriver}
              onAssignVehicle={onAssignVehicle}
              onUnassignVehicle={onUnassignVehicle}
              availableDrivers={availableDrivers}
              availableVehicles={availableVehicles}
            />
          ))
        )}
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
  availableVehicles = []
}: DispatchBoardViewProps) {
  const { t } = useI18n();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <Column
        title={t("dispatch.board.pending", { defaultValue: "Pending" })}
        status="pending"
        entries={entries}
        emptyMessage={t("dispatch.empty.description", { defaultValue: "No entries" })}
        onAssignDriver={onAssignDriver}
        onAssignVehicle={onAssignVehicle}
        onUnassignVehicle={onUnassignVehicle}
        availableDrivers={availableDrivers}
        availableVehicles={availableVehicles}
      />
      <Column
        title={t("dispatch.board.confirmed", { defaultValue: "Confirmed" })}
        status="confirmed"
        entries={entries}
        emptyMessage={t("dispatch.empty.description", { defaultValue: "No entries" })}
        onAssignDriver={onAssignDriver}
        onAssignVehicle={onAssignVehicle}
        onUnassignVehicle={onUnassignVehicle}
        availableDrivers={availableDrivers}
        availableVehicles={availableVehicles}
      />
      <Column
        title={t("dispatch.board.assigned", { defaultValue: "Assigned" })}
        status="assigned"
        entries={entries}
        emptyMessage={t("dispatch.empty.description", { defaultValue: "No entries" })}
        onAssignDriver={onAssignDriver}
        onAssignVehicle={onAssignVehicle}
        onUnassignVehicle={onUnassignVehicle}
        availableDrivers={availableDrivers}
        availableVehicles={availableVehicles}
      />
      <Column
        title={t("dispatch.board.inTransit", { defaultValue: "In Transit" })}
        status="in_transit"
        entries={entries}
        emptyMessage={t("dispatch.empty.description", { defaultValue: "No entries" })}
        onAssignDriver={onAssignDriver}
        onAssignVehicle={onAssignVehicle}
        onUnassignVehicle={onUnassignVehicle}
        availableDrivers={availableDrivers}
        availableVehicles={availableVehicles}
      />
      <Column
        title={t("dispatch.board.completed", { defaultValue: "Completed" })}
        status="completed"
        entries={entries}
        emptyMessage={t("dispatch.empty.description", { defaultValue: "No entries" })}
        onUnassignVehicle={onUnassignVehicle}
      />
      <Column
        title={t("dispatch.board.cancelled", { defaultValue: "Cancelled" })}
        status="cancelled"
        entries={entries}
        emptyMessage={t("dispatch.empty.description", { defaultValue: "No entries" })}
        onUnassignVehicle={onUnassignVehicle}
      />
    </div>
  );
} 