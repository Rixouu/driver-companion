"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskCell, type CrewTask, type DayTaskData } from "./task-cell";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { DriverTaskSchedule } from "@/types/crew-tasks";

interface CrewTaskCalendarGridProps {
  schedule: DriverTaskSchedule[];
  dates: string[]; // Array of date strings (ISO format)
  onTaskClick?: (task: CrewTask) => void;
  onCellClick?: (driverId: string, date: string) => void;
  onDriverClick?: (driverId: string) => void;
}

export function CrewTaskCalendarGrid({
  schedule,
  dates,
  onTaskClick,
  onCellClick,
  onDriverClick,
}: CrewTaskCalendarGridProps) {
  const { t } = useI18n();

  if (!schedule || schedule.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <p>{t('drivers.errors.noDriversAvailable')}</p>
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
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${dates.length}, minmax(150px, 1fr))` }}>
              {/* Driver Column Header */}
              <div className="p-4 border-r bg-muted/50 font-semibold text-foreground">
                {t('shifts.table.driver')}
              </div>

              {/* Date Column Headers */}
              {dates.map((date) => {
                const parsedDate = parseISO(date);
                const dayName = format(parsedDate, "EEE");
                const dayNumber = format(parsedDate, "d");
                const monthName = format(parsedDate, "MMM");
                const isToday = format(new Date(), "yyyy-MM-dd") === date;
                const isWeekend = [0, 6].includes(parsedDate.getDay());

                return (
                  <div
                    key={date}
                    className={cn(
                      "p-4 border-r text-center",
                      isToday && "bg-primary/10",
                      isWeekend && !isToday && "bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "font-semibold text-foreground",
                      isToday && "text-primary"
                    )}>
                      {dayName}
                    </div>
                    <div className={cn(
                      "text-2xl font-bold text-foreground",
                      isToday && "text-primary"
                    )}>
                      {dayNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {monthName}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Driver Rows */}
          <div className="divide-y">
            {schedule.map((driver) => (
              <div
                key={driver.driver_id}
                className="grid hover:bg-muted/20 transition-colors"
                style={{ gridTemplateColumns: `200px repeat(${dates.length}, minmax(150px, 1fr))` }}
              >
                {/* Driver Name Cell */}
                <div
                  className="p-4 border-r bg-muted/20 flex items-center cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => onDriverClick?.(driver.driver_id)}
                >
                  <div>
                    <div className="font-semibold text-foreground">
                      {driver.driver_name}
                    </div>
                    {/* Optional: Show driver stats */}
                    <div className="text-xs text-muted-foreground mt-1">
                      {Object.values(driver.dates).reduce((acc, day) => acc + day.task_count, 0)} {t('shifts.booking.bookings')}
                    </div>
                  </div>
                </div>

                {/* Date Cells - Tasks */}
                {dates.map((date) => {
                  const dayData = driver.dates[date];
                  
                  return (
                    <div
                      key={`${driver.driver_id}-${date}`}
                      className="border-r"
                    >
                      <TaskCell
                        driverId={driver.driver_id}
                        date={date}
                        data={dayData}
                        onTaskClick={onTaskClick}
                        onCellClick={onCellClick}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer - Summary */}
          <div className="border-t bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            {schedule.length} {t('shifts.table.drivers')} • {dates.length} {t('shifts.table.days')}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}

