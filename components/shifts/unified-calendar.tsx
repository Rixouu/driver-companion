"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Calendar, Grid3X3, List, Clock, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, addDays, subDays } from "date-fns";
import { ja, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { TaskCell } from "./task-cell";
import { DriverHoursSummary } from "./driver-hours-summary";
import type { DriverTaskSchedule, CrewTask } from "@/types/crew-tasks";

interface UnifiedCalendarProps {
  schedule: DriverTaskSchedule[];
  viewMode: "day" | "week" | "month";
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onTaskClick?: (task: CrewTask) => void;
  onCellClick?: (driverId: string, date: string) => void;
  onDriverClick?: (driverId: string) => void;
  visibleDrivers?: string[];
  onDriverVisibilityToggle?: (driverId: string, visible: boolean) => void;
  onTaskDrop?: (taskId: string, driverId: string, date: string) => void;
  showDriverHours?: boolean;
  onToggleDriverHours?: (show: boolean) => void;
  calendarViewMode?: "grid" | "list";
  onCalendarViewModeChange?: (mode: "grid" | "list") => void;
  driverCapacities?: Array<{
    driver_id: string;
    capacity_percentage: number;
    max_hours: number;
  }>;
}

export function UnifiedCalendar({
  schedule,
  viewMode,
  selectedDate,
  onDateChange,
  onTaskClick,
  onCellClick,
  onDriverClick,
  visibleDrivers = [],
  onDriverVisibilityToggle,
  onTaskDrop,
  showDriverHours = true,
  onToggleDriverHours,
  calendarViewMode = "grid",
  onCalendarViewModeChange,
  driverCapacities = []
}: UnifiedCalendarProps) {
  const { t, locale } = useI18n();
  const [currentDate, setCurrentDate] = useState(selectedDate);
  
  // Get the appropriate locale for date formatting
  const getDateLocale = () => {
    return locale === 'ja' ? ja : enUS;
  };

  // Calculate date range based on view mode
  const getDateRange = () => {
    switch (viewMode) {
      case "day":
        return {
          start: selectedDate,
          end: selectedDate,
        };
      case "week":
        return {
          start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
        };
      case "month":
        return {
          start: startOfMonth(selectedDate),
          end: endOfMonth(selectedDate),
        };
    }
  };

  const dateRange = getDateRange();
  const dates = eachDayOfInterval({
    start: dateRange.start,
    end: dateRange.end,
  }).map(date => format(date, "yyyy-MM-dd"));

  // Calculate hours for each driver (for day/week views)
  const driverHours = useMemo(() => {
    const hours: Record<string, { 
      driver: any;
      totalHours: number;
      taskCount: number;
      dailyHours: Record<string, number>;
    }> = {};

    // Initialize driver data
    schedule.forEach((driverSchedule) => {
      if (driverSchedule.driver_id) {
        hours[driverSchedule.driver_id] = {
          driver: {
            id: driverSchedule.driver_id,
            first_name: driverSchedule.driver_name?.split(' ')[0] || 'Unknown',
            last_name: driverSchedule.driver_name?.split(' ').slice(1).join(' ') || 'Driver'
          },
          totalHours: 0,
          taskCount: 0,
          dailyHours: {}
        };
      }
    });

    // Calculate hours for each task
    schedule.forEach((driverSchedule) => {
      if (driverSchedule.driver_id) {
        Object.entries(driverSchedule.dates).forEach(([date, dayData]: [string, any]) => {
          if (dayData.tasks && Array.isArray(dayData.tasks)) {
            const dayHours = dayData.tasks.reduce((sum: number, task: CrewTask) => 
              sum + (task.hours_per_day || 0), 0
            );
            
            if (hours[driverSchedule.driver_id]) {
              hours[driverSchedule.driver_id].totalHours += dayHours;
              hours[driverSchedule.driver_id].taskCount += dayData.tasks.length;
              hours[driverSchedule.driver_id].dailyHours[date] = dayHours;
            }
          }
        });
      }
    });

    return hours;
  }, [schedule]);

  const getHoursColor = (hours: number) => {
    if (hours >= 8) return "text-green-600 dark:text-green-400";
    if (hours >= 6) return "text-yellow-600 dark:text-yellow-400";
    if (hours >= 4) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getHoursBadgeVariant = (hours: number) => {
    if (hours >= 8) return "default";
    if (hours >= 6) return "secondary";
    if (hours >= 4) return "outline";
    return "destructive";
  };

  const filteredSchedule = useMemo(() => {
    const unassignedDriverId = '00000000-0000-0000-0000-000000000000';
    
    // First filter out the fake unassigned driver
    let filtered = schedule.filter((driverSchedule) => 
      driverSchedule.driver_id && driverSchedule.driver_id !== unassignedDriverId
    );
    
    // Then filter based on visibility settings
    if (visibleDrivers.length > 0) {
      filtered = filtered.filter((driverSchedule) => 
        visibleDrivers.includes(driverSchedule.driver_id)
      );
    }
    
    return filtered;
  }, [schedule, visibleDrivers]);

  const getViewModeLabel = () => {
    switch (viewMode) {
      case "day":
        return t('shifts.viewModes.today');
      case "week":
        return t('shifts.viewModes.thisWeek');
      case "month":
        return t('shifts.viewModes.thisMonth');
      default:
        return t('shifts.viewModes.thisWeek');
    }
  };

  // Navigation handlers
  const handlePrevious = () => {
    let newDate: Date;
    switch (viewMode) {
      case "day":
        newDate = subDays(selectedDate, 1);
        break;
      case "week":
        newDate = subDays(selectedDate, 7);
        break;
      case "month":
        newDate = subMonths(selectedDate, 1);
        break;
    }
    setCurrentDate(newDate);
    onDateChange(newDate);
  };

  const handleNext = () => {
    let newDate: Date;
    switch (viewMode) {
      case "day":
        newDate = addDays(selectedDate, 1);
        break;
      case "week":
        newDate = addDays(selectedDate, 7);
        break;
      case "month":
        newDate = addMonths(selectedDate, 1);
        break;
    }
    setCurrentDate(newDate);
    onDateChange(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateChange(today);
  };

  // Drop handlers for drag and drop functionality
  const [dragOverCell, setDragOverCell] = useState<{driverId: string, date: string} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValidation, setDragValidation] = useState<{isValid: boolean, draggedTask: any} | null>(null);
  const [dragTimeout, setDragTimeout] = useState<NodeJS.Timeout | null>(null);

  // Check if a column should be highlighted
  const isColumnHighlighted = (dateStr: string) => {
    return dragOverCell?.date === dateStr && dragValidation;
  };

  // Check if a column is valid for drop
  const isColumnValid = (dateStr: string) => {
    return dragOverCell?.date === dateStr && dragValidation?.isValid;
  };

  // Check if a column is invalid for drop
  const isColumnInvalid = (dateStr: string) => {
    return dragOverCell?.date === dateStr && dragValidation && !dragValidation.isValid;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  // Global drag end handler to clear state
  const handleDragEnd = () => {
    // Clear any pending timeouts
    if (dragTimeout) {
      clearTimeout(dragTimeout);
      setDragTimeout(null);
    }
    
    setDragOverCell(null);
    setIsDragging(false);
    setDragValidation(null);
  };

  const handleDragEnter = (e: React.DragEvent, driverId: string, date: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any existing timeout
    if (dragTimeout) {
      clearTimeout(dragTimeout);
      setDragTimeout(null);
    }
    
    setDragOverCell({ driverId, date });
    setIsDragging(true);
    
    // Validate the drop
    if (typeof window !== "undefined") {
      const draggedTaskStr = localStorage.getItem("draggedTask");
      if (draggedTaskStr) {
        try {
          const draggedTask = JSON.parse(draggedTaskStr);
          
          // Get today's date in YYYY-MM-DD format
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          
          // Validate: Only allow dropping on the task's exact start_date and not in the past
          const isValid = date === draggedTask.start_date && date >= todayStr;
          setDragValidation({ isValid, draggedTask });
          e.dataTransfer.dropEffect = isValid ? "move" : "none";
          
          // Add visual feedback with smooth transition
          const target = e.currentTarget as HTMLElement;
          target.style.transition = "all 0.2s ease-in-out";
        } catch (error) {
          console.error("Error parsing dragged task:", error);
          setDragValidation({ isValid: false, draggedTask: null });
          e.dataTransfer.dropEffect = "none";
        }
      } else {
        setDragValidation({ isValid: false, draggedTask: null });
        e.dataTransfer.dropEffect = "none";
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're actually leaving the drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // Only clear if mouse is truly outside the element
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      // Use timeout to prevent flickering during long holds
      const timeout = setTimeout(() => {
        setDragOverCell(null);
        setIsDragging(false);
        setDragValidation(null);
        setDragTimeout(null);
      }, 100); // Small delay to prevent flickering
      
      setDragTimeout(timeout);
    }
  };

  const handleDrop = (e: React.DragEvent, driverId: string, date: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check validation before dropping
    if (dragValidation && !dragValidation.isValid) {
      const today = new Date().toISOString().split('T')[0];
      const start = dragValidation.draggedTask?.start_date;
      if (date < today) {
        alert(`Cannot move task to ${date}. Tasks cannot be moved to past dates.`);
      } else if (start && date !== start) {
        alert(`Cannot move task to ${date}. Tasks can only be dropped on their start date (${start}).`);
      } else {
        alert(`Cannot move task to ${date}.`);
      }
      setDragOverCell(null);
      setIsDragging(false);
      setDragValidation(null);
      return;
    }
    
    // Add smooth drop animation
    const target = e.currentTarget as HTMLElement;
    target.style.transition = "all 0.3s ease-out";
    target.style.transform = "scale(1.02)";
    target.style.backgroundColor = "rgb(34 197 94 / 0.1)"; // green-500/10
    
    // Reset animation after completion
    setTimeout(() => {
      target.style.transform = "scale(1)";
      target.style.backgroundColor = "";
      target.style.transition = "";
    }, 300);
    
    // Clear drag state after animation starts
    setDragOverCell(null);
    setIsDragging(false);
    setDragValidation(null);
    
    try {
      const draggedTaskData = e.dataTransfer.getData("application/json");
      if (draggedTaskData) {
        const draggedTask = JSON.parse(draggedTaskData);
        if (onTaskDrop && draggedTask.id) {
          onTaskDrop(draggedTask.id, driverId, date);
        }
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  // Grid view component
  const GridView = () => (
    <div className="space-y-4">
      {/* Calendar Grid */}
        <Card className="overflow-hidden">
          <ScrollArea className="w-full" onDragEnd={handleDragEnd}>
           <div className="min-w-[600px] sm:min-w-[800px] lg:min-w-[1200px]">
            {/* Day Headers */}
            <div className="sticky top-0 z-20 bg-background border-b">
              <div className={cn(
                "grid",
                viewMode === "day" ? "grid-cols-[120px_1fr] sm:grid-cols-[150px_1fr] lg:grid-cols-[200px_1fr]" :
                viewMode === "week" ? "grid-cols-[120px_repeat(7,minmax(60px,1fr))] sm:grid-cols-[150px_repeat(7,minmax(80px,1fr))] lg:grid-cols-[200px_repeat(7,minmax(120px,1fr))]" :
                "grid-cols-[120px_repeat(31,minmax(40px,1fr))] sm:grid-cols-[150px_repeat(31,minmax(60px,1fr))] lg:grid-cols-[200px_repeat(31,minmax(100px,1fr))]"
              )}>
                <div className="p-3 border-r bg-muted/50 font-semibold text-foreground flex items-center justify-center">
                  {t('shifts.table.driver')}
                </div>
                {dates.map((dateStr) => {
                  const date = new Date(dateStr);
                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        "p-1 sm:p-2 lg:p-3 border-r text-center font-medium text-xs sm:text-sm flex flex-col items-center justify-center",
                        isToday(date) && "bg-primary/10 text-primary font-bold",
                        viewMode === "month" && !isSameMonth(date, selectedDate) && "text-muted-foreground bg-muted/20"
                      )}
                    >
                      <div className="text-xs sm:text-sm">{format(date, "EEE", { locale: getDateLocale() })}</div>
                      <div className="text-xs sm:text-sm lg:text-lg">{format(date, "d")}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Driver Rows */}
            <div className="divide-y">
              {filteredSchedule.map((driverSchedule) => {
                if (!driverSchedule?.driver_id) return null;
                
                return (
                  <div key={driverSchedule.driver_id} className="flex">
                    {/* Driver Name */}
                    <div className="w-28 min-w-[7rem] sm:w-36 sm:min-w-[9rem] lg:w-48 lg:min-w-[12rem] p-1 sm:p-2 lg:p-3 border-r bg-muted/20 hover:bg-muted/40 transition-colors">
                      <button
                        onClick={() => onDriverClick?.(driverSchedule.driver_id)}
                        className="text-left hover:text-primary transition-colors w-full"
                      >
                        <div className="font-medium text-xs sm:text-sm">
                          {driverSchedule.driver_name}
                        </div>
                        {/* Hours summary for all views when showDriverHours is enabled */}
                        {showDriverHours && (
                          <div className="mt-2 text-xs">
                            <div className={cn("font-medium", getHoursColor(driverHours[driverSchedule.driver_id]?.totalHours || 0))}>
                              {driverHours[driverSchedule.driver_id]?.totalHours || 0}/40h
                            </div>
                            <div className="text-muted-foreground">
                              {driverHours[driverSchedule.driver_id]?.taskCount || 0} {t('shifts.driverHours.tasks')}
                            </div>
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Task Cells */}
                    <div className="flex flex-1 min-w-0">
                      {dates.map((dateStr) => {
                        const dayData = driverSchedule.dates[dateStr] || { tasks: [], task_count: 0 };
                        const date = new Date(dateStr);
                        const isCurrentMonth = viewMode === "month" ? isSameMonth(date, selectedDate) : true;
                        const isTodayDate = isToday(date);

                        return (
                          <div
                            key={dateStr}
                            className={cn(
                              "flex-1 min-w-[40px] sm:min-w-[60px] lg:min-w-[100px] border-r p-1 transition-all duration-200",
                              viewMode === "month" && !isCurrentMonth && "bg-muted/10",
                              isTodayDate && "bg-primary/5",
                              // Column highlighting for whole column - subtle
                              isColumnHighlighted(dateStr) && dragValidation?.isValid && 
                              "bg-green-50 dark:bg-green-900/10",
                              isColumnHighlighted(dateStr) && dragValidation && !dragValidation.isValid && 
                              "bg-red-50 dark:bg-red-900/10",
                              // Cell-specific highlighting - minimal and clean
                              dragOverCell?.driverId === driverSchedule.driver_id && 
                              dragOverCell?.date === dateStr && 
                              dragValidation?.isValid &&
                              "bg-green-100 dark:bg-green-900/20 border-2 border-green-300 border-dashed",
                              // Invalid drop zone - subtle feedback
                              dragOverCell?.driverId === driverSchedule.driver_id && 
                              dragOverCell?.date === dateStr && 
                              dragValidation && !dragValidation.isValid &&
                              "bg-red-100 dark:bg-red-900/20 border-2 border-red-300 border-dashed cursor-not-allowed"
                            )}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, driverSchedule.driver_id, dateStr)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, driverSchedule.driver_id, dateStr)}
                          >
                            <TaskCell
                              driverId={driverSchedule.driver_id}
                              date={dateStr}
                              data={dayData}
                              onTaskClick={onTaskClick}
                              onCellClick={onCellClick}
                              isDragOver={dragOverCell?.driverId === driverSchedule.driver_id && dragOverCell?.date === dateStr}
                              onTaskDrop={onTaskDrop}
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
      {/* Tasks List */}
      <div className="space-y-4">
        {filteredSchedule.map((driverSchedule) => {
          if (!driverSchedule?.driver_id) return null;
          
          const allTasks = Object.values(driverSchedule.dates).flatMap(day => day.tasks);
          
          return (
            <Card key={driverSchedule.driver_id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{driverSchedule.driver_name}</h3>
                  </div>
                  <Badge variant="outline">
                    {allTasks.length} tasks
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {allTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No tasks assigned for this period
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
    <div className={cn("space-y-6", isDragging && "cursor-grabbing")}>
      {/* Driver Hours Summary - Now shows for all view modes */}
      <DriverHoursSummary
        schedule={schedule}
        viewMode={viewMode}
        selectedDate={selectedDate}
        showDriverHours={showDriverHours}
        driverCapacities={driverCapacities}
        visibleDrivers={visibleDrivers}
        onDriverVisibilityToggle={onDriverVisibilityToggle}
      />

      {/* Calendar Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {viewMode === "day" ? format(selectedDate, "EEEE, MMMM d, yyyy", { locale: getDateLocale() }) :
             viewMode === "week" ? `${format(dateRange.start, "MMM d", { locale: getDateLocale() })} - ${format(dateRange.end, "MMM d, yyyy", { locale: getDateLocale() })}` :
             format(selectedDate, "MMMM yyyy", { locale: getDateLocale() })}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              {t('shifts.calendar.today')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Calendar Controls - Desktop: inline, Mobile/Tablet: 2 columns in 1 row */}
        <div className="grid grid-cols-2 lg:flex lg:flex-row items-stretch lg:items-center gap-3">
          {/* Total Hours Display */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-black text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              {(() => {
                const totalHours = Object.values(driverHours).reduce((total, driver) => total + (driver.totalHours || 0), 0);
                const maxHours = Object.values(driverHours).length * 40; // Assuming 40h per driver as max capacity
                return `${totalHours.toFixed(1)}/${maxHours}h`;
              })()}
            </span>
            <span className="text-xs opacity-80">
              {viewMode === "day" ? t('shifts.driverHours.today') : viewMode === "week" ? t('shifts.driverHours.thisWeek') : t('shifts.driverHours.thisMonth')}
            </span>
          </div>
          
          {/* Hide Hours Button */}
          {onToggleDriverHours && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleDriverHours(!showDriverHours)}
              className="flex items-center gap-2"
            >
              {showDriverHours ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  {t('shifts.driverHours.hideHours')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {t('shifts.driverHours.showHours')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Content */}
      <GridView />
    </div>
  );
}
