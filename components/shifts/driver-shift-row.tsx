"use client";

import { ShiftScheduleGrid, ShiftBooking } from "@/types/shifts";
import { BookingCell } from "./booking-cell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface DriverShiftRowProps {
  driver: {
    id: string;
    name: string;
  };
  dates: string[];
  grid: ShiftScheduleGrid;
  onBookingClick?: (booking: ShiftBooking) => void;
  onCellClick?: (driverId: string, date: string) => void;
  onDriverClick?: (driverId: string) => void;
}

export function DriverShiftRow({
  driver,
  dates,
  grid,
  onBookingClick,
  onCellClick,
  onDriverClick,
}: DriverShiftRowProps) {
  const driverData = grid[driver.id] || {};
  
  // Get initials from driver name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div 
      className="grid hover:bg-muted/30 transition-colors"
      style={{ gridTemplateColumns: `200px repeat(${dates.length}, minmax(120px, 1fr))` }}
    >
      {/* Driver Info Column */}
      <div className="p-4 border-r flex items-center gap-3 sticky left-0 bg-background z-10">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(driver.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Button
            variant="link"
            className="h-auto p-0 text-sm font-medium text-foreground hover:text-primary truncate w-full justify-start"
            onClick={() => onDriverClick?.(driver.id)}
          >
            {driver.name}
          </Button>
        </div>
      </div>

      {/* Booking Cells */}
      {dates.map((date) => {
        const dayData = driverData[date];
        const isToday = new Date().toISOString().split("T")[0] === date;

        return (
          <div
            key={`${driver.id}-${date}`}
            className={cn(
              "border-r min-h-[80px]",
              isToday && "bg-primary/5"
            )}
          >
            <BookingCell
              driverId={driver.id}
              date={date}
              data={dayData}
              onBookingClick={onBookingClick}
              onCellClick={onCellClick}
            />
          </div>
        );
      })}
    </div>
  );
}

