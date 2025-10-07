"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Calendar, Grid3X3, List } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { TaskCell } from "./task-cell";
import type { DriverTaskSchedule, CrewTask } from "@/types/crew-tasks";

interface ImprovedMonthlyCalendarProps {
  schedule: DriverTaskSchedule[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onTaskClick?: (task: CrewTask) => void;
  onCellClick?: (driverId: string, date: string) => void;
  onDriverClick?: (driverId: string) => void;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
}

export function ImprovedMonthlyCalendar({
  schedule,
  selectedDate,
  onDateChange,
  onTaskClick,
  onCellClick,
  onDriverClick,
  viewMode = "grid",
  onViewModeChange
}: ImprovedMonthlyCalendarProps) {
  const { t } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  // Calculate month boundaries
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add some days from previous/next month for better context
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - 7);
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + 7);
  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onDateChange(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
    onDateChange(newMonth);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateChange(today);
  };

  // Grid view component
  const GridView = () => (
    <div className="space-y-4">
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange?.("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange?.("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[1200px]">
            {/* Day Headers */}
            <div className="sticky top-0 z-20 bg-background border-b">
              <div className="grid grid-cols-[200px_repeat(31,minmax(100px,1fr))]">
                <div className="p-3 border-r bg-muted/50 font-semibold text-foreground flex items-center justify-center">
                  {t('shifts.table.driver')}
                </div>
                {monthDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-3 border-r text-center font-medium text-sm flex flex-col items-center justify-center",
                      isToday(day) && "bg-primary/10 text-primary font-bold",
                      !isSameMonth(day, currentMonth) && "text-muted-foreground bg-muted/20"
                    )}
                  >
                    <div>{format(day, "EEE")}</div>
                    <div className="text-lg">{format(day, "d")}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver Rows */}
            <div className="divide-y">
              {schedule.map((driverSchedule) => {
                if (!driverSchedule?.driver_id) return null;
                
                return (
                  <div key={driverSchedule.driver_id} className="flex">
                    {/* Driver Name */}
                    <div className="w-48 min-w-[12rem] p-3 border-r bg-muted/20 hover:bg-muted/40 transition-colors">
                      <button
                        onClick={() => onDriverClick?.(driverSchedule.driver_id)}
                        className="text-left hover:text-primary transition-colors w-full"
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
                      {monthDays.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const dayData = driverSchedule.dates[dateStr] || { tasks: [], task_count: 0 };
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isTodayDate = isToday(day);

                        return (
                          <div
                            key={dateStr}
                            className={cn(
                              "flex-1 min-w-[100px] border-r p-1",
                              !isCurrentMonth && "bg-muted/10",
                              isTodayDate && "bg-primary/5"
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
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>
    </div>
  );

  // List view component
  const ListView = () => (
    <div className="space-y-4">
      {/* Month Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange?.("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange?.("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {schedule.map((driverSchedule) => {
          if (!driverSchedule?.driver_id) return null;
          
          const allTasks = Object.values(driverSchedule.dates).flatMap(day => day.tasks);
          
          return (
            <Card key={driverSchedule.driver_id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{driverSchedule.driver_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {driverSchedule.driver_id.slice(0, 8)}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {allTasks.length} tasks
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {allTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No tasks assigned for this month
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {allTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => onTaskClick?.(task)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{task.task_type}</Badge>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(task.start_date), "MMM d")} • {task.start_time} - {task.end_time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{task.hours_per_day || 0}h</p>
                          {task.location && (
                            <p className="truncate max-w-[200px]">{task.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {viewMode === "grid" ? <GridView /> : <ListView />}
    </div>
  );
}
