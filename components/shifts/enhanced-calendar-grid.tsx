"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { TaskCell, type DayTaskData } from "./task-cell";
import { CrewTask } from "@/types/crew-tasks";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { DriverTaskSchedule } from "@/types/crew-tasks";

interface EnhancedCalendarGridProps {
  schedule: DriverTaskSchedule[];
  dates: string[]; // Array of date strings (ISO format)
  viewMode: "day" | "week" | "month";
  selectedDate: Date;
  onTaskClick?: (task: CrewTask) => void;
  onCellClick?: (driverId: string, date: string) => void;
  onDriverClick?: (driverId: string) => void;
  onDateChange?: (date: Date) => void;
}

export function EnhancedCalendarGrid({
  schedule,
  dates,
  viewMode,
  selectedDate,
  onTaskClick,
  onCellClick,
  onDriverClick,
  onDateChange,
}: EnhancedCalendarGridProps) {
  const { t } = useI18n();

  // Generate dates based on view mode
  const getDisplayDates = () => {
    switch (viewMode) {
      case "day":
        return [format(selectedDate, "yyyy-MM-dd")];
      case "week":
        return dates; // Use provided dates for week view
      case "month":
        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);
        const monthDates = eachDayOfInterval({ start: monthStart, end: monthEnd });
        return monthDates.map(date => format(date, "yyyy-MM-dd"));
      default:
        return dates;
    }
  };

  const displayDates = getDisplayDates();

  // Navigation for month view
  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange?.(newDate);
  };

  if (!schedule || schedule.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No drivers found</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header with navigation for month view */}
      {viewMode === "month" && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(selectedDate, "MMMM yyyy")}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className={cn(
        "overflow-auto",
        viewMode === "month" && "max-h-[600px]"
      )}>
        <div className="min-w-full">
          {/* Header Row */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <div className="flex">
              {/* Driver Name Column */}
              <div className="w-48 min-w-[12rem] p-3 border-r bg-muted/50 flex items-center justify-center">
                <span className="font-medium text-sm">Driver</span>
              </div>
              
              {/* Date Columns */}
              <div className="flex flex-1 min-w-0">
                {displayDates.map((dateStr) => {
                  const date = parseISO(dateStr);
                  const isCurrentMonth = viewMode === "month" ? isSameMonth(date, selectedDate) : true;
                  
                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        "flex-1 min-w-[120px] p-3 border-r text-center flex flex-col items-center justify-center",
                        viewMode === "month" && "min-w-[80px]",
                        !isCurrentMonth && "bg-muted/30 text-muted-foreground"
                      )}
                    >
                      <div className="text-sm font-medium">
                        {format(date, "EEE")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(date, "MMM d")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Driver Rows */}
          <div className="divide-y">
            {schedule.map((driverSchedule) => {
              // Add safety check for driver data
              if (!driverSchedule?.driver_id) {
                return null;
              }
              
              return (
                <div key={driverSchedule.driver_id} className="flex">
                  {/* Driver Name */}
                  <div className="w-48 min-w-[12rem] p-3 border-r bg-muted/20 hover:bg-muted/40 transition-colors">
                    <button
                      onClick={() => onDriverClick?.(driverSchedule.driver_id)}
                      className="text-left hover:text-primary transition-colors"
                    >
                      <div className="font-medium text-sm">
                        {driverSchedule.driver_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {driverSchedule.driver_id.slice(0, 8)}
                      </div>
                    </button>
                  </div>

                {/* Task Cells */}
                <div className="flex flex-1 min-w-0">
                  {displayDates.map((dateStr) => {
                    const date = parseISO(dateStr);
                    const isCurrentMonth = viewMode === "month" ? isSameMonth(date, selectedDate) : true;
                    const dayData = driverSchedule.dates[dateStr] as DayTaskData | undefined;
                    
                    return (
                      <div
                        key={dateStr}
                        className={cn(
                          "flex-1 min-w-[120px] border-r",
                          viewMode === "month" && "min-w-[80px]",
                          !isCurrentMonth && "bg-muted/20"
                        )}
                      >
                        <TaskCell
                          driverId={driverSchedule.driver_id}
                          date={dateStr}
                          data={dayData}
                          onTaskClick={onTaskClick}
                          onCellClick={onCellClick}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer with summary for month view */}
      {viewMode === "month" && (
        <div className="p-4 border-t bg-muted/20">
          <div className="text-sm text-muted-foreground text-center">
            Showing {schedule.length} drivers for {format(selectedDate, "MMMM yyyy")}
          </div>
        </div>
      )}
    </Card>
  );
}
