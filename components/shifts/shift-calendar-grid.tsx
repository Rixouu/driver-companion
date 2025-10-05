"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShiftSchedule, ShiftBooking } from "@/types/shifts";
import { DriverShiftRow } from "./driver-shift-row";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface ShiftCalendarGridProps {
  schedule: ShiftSchedule;
  onBookingClick?: (booking: ShiftBooking) => void;
  onCellClick?: (driverId: string, date: string) => void;
  onDriverClick?: (driverId: string) => void;
}

export function ShiftCalendarGrid({
  schedule,
  onBookingClick,
  onCellClick,
  onDriverClick,
}: ShiftCalendarGridProps) {
  const { drivers, dates, grid } = schedule;

  if (!drivers || drivers.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <p>No drivers available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ScrollArea className="w-full">
        <div className="min-w-full">
          {/* Header Row - Dates */}
          <div className="sticky top-0 z-20 bg-background border-b">
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(120px,1fr))]">
              {/* Driver Column Header */}
              <div className="p-4 border-r bg-muted/50 font-semibold">
                Driver
              </div>

              {/* Date Column Headers */}
              {dates.map((date) => {
                const parsedDate = parseISO(date);
                const dayName = format(parsedDate, "EEE");
                const dayNumber = format(parsedDate, "d");
                const monthName = format(parsedDate, "MMM");
                const isToday = format(new Date(), "yyyy-MM-dd") === date;

                return (
                  <div
                    key={date}
                    className={cn(
                      "p-4 border-r text-center",
                      isToday && "bg-primary/10"
                    )}
                  >
                    <div className="text-xs font-medium text-muted-foreground">
                      {dayName}
                    </div>
                    <div className={cn(
                      "text-lg font-semibold",
                      isToday && "text-primary"
                    )}>
                      {dayNumber}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {monthName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Driver Rows */}
          <div className="divide-y">
            {drivers.map((driver) => (
              <DriverShiftRow
                key={driver.id}
                driver={driver}
                dates={dates}
                grid={grid}
                onBookingClick={onBookingClick}
                onCellClick={onCellClick}
                onDriverClick={onDriverClick}
              />
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Footer Summary */}
      <div className="border-t bg-muted/30 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            <span className="font-medium">{drivers.length}</span> drivers
            <span className="mx-2">•</span>
            <span className="font-medium">{dates.length}</span> days
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-xs">Cancelled</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

