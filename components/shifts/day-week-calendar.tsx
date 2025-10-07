"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Plus, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from "date-fns";
import type { CrewTask } from "@/types/crew-tasks";
import { useI18n } from "@/lib/i18n/context";

// Color scheme matching the monthly view
const getTaskTypeColor = (taskType: string, colorOverride?: string) => {
  if (colorOverride) {
    // If colorOverride is provided, return a default color scheme
    return {
      bg: 'bg-slate-50 dark:bg-slate-950/40',
      text: 'text-slate-900 dark:text-slate-100',
      border: 'border-l-slate-600 dark:border-l-slate-400',
      badge: 'bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-200'
    };
  }
  
  const colors: Record<string, {
    bg: string;
    text: string;
    border: string;
    badge: string;
  }> = {
    charter: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-900 dark:text-blue-100',
      border: 'border-l-blue-600 dark:border-l-blue-400',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
    },
    regular: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-900 dark:text-emerald-100',
      border: 'border-l-emerald-600 dark:border-l-emerald-400',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
    },
    training: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-900 dark:text-purple-100',
      border: 'border-l-purple-600 dark:border-l-purple-400',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200'
    },
    maintenance: {
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      text: 'text-orange-900 dark:text-orange-100',
      border: 'border-l-orange-600 dark:border-l-orange-400',
      badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200'
    },
    standby: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-900 dark:text-amber-100',
      border: 'border-l-amber-600 dark:border-l-amber-400',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
    },
    special: {
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-900 dark:text-red-100',
      border: 'border-l-red-600 dark:border-l-red-400',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200'
    },
    meeting: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-900 dark:text-indigo-100',
      border: 'border-l-indigo-600 dark:border-l-indigo-400',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200'
    },
    day_off: {
      bg: 'bg-gray-50 dark:bg-gray-950/40',
      text: 'text-gray-900 dark:text-gray-100',
      border: 'border-l-gray-600 dark:border-l-gray-400',
      badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/60 dark:text-gray-200'
    },
    default: {
      bg: 'bg-slate-50 dark:bg-slate-950/40',
      text: 'text-slate-900 dark:text-slate-100',
      border: 'border-l-slate-600 dark:border-l-slate-400',
      badge: 'bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-200'
    }
  };
  
  return colors[taskType] || colors.default;
};

interface DayWeekCalendarProps {
  schedule: any[];
  viewMode: "day" | "week";
  selectedDate: Date;
  onTaskClick?: (task: CrewTask) => void;
  onCellClick?: (driverId: string, date: string) => void;
  onDriverClick?: (driverId: string) => void;
  onDateChange?: (date: Date) => void;
  visibleDrivers?: string[];
  onDriverVisibilityToggle?: (driverId: string, visible: boolean) => void;
  onTaskDrop?: (taskId: string, driverId: string, date: string) => void;
  showDriverHours?: boolean;
  onToggleDriverHours?: (show: boolean) => void;
}

export function DayWeekCalendar({
  schedule,
  viewMode,
  selectedDate,
  onTaskClick,
  onCellClick,
  onDriverClick,
  onDateChange,
  visibleDrivers = [],
  onDriverVisibilityToggle,
  onTaskDrop,
  showDriverHours = true,
  onToggleDriverHours,
}: DayWeekCalendarProps) {
  const { t } = useI18n();

  // Calculate date range based on view mode
  const getDateRange = () => {
    if (viewMode === "day") {
      return {
        start: selectedDate,
        end: selectedDate,
      };
    } else {
      return {
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
      };
    }
  };

  const dateRange = getDateRange();
  const dates = eachDayOfInterval({
    start: dateRange.start,
    end: dateRange.end,
  }).map(date => format(date, "yyyy-MM-dd"));

  // Calculate hours for each driver
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
    // Filter based on visibility settings
    if (visibleDrivers.length === 0) return schedule;
    return schedule.filter((driverSchedule) => 
      driverSchedule.driver_id && visibleDrivers.includes(driverSchedule.driver_id)
    );
  }, [schedule, visibleDrivers]);

  const getViewModeLabel = () => {
    switch (viewMode) {
      case "day":
        return t('shifts.viewModes.today');
      case "week":
        return t('shifts.viewModes.thisWeek');
      default:
        return t('shifts.viewModes.thisWeek');
    }
  };

  // Drop handlers for drag and drop functionality
  const [dragOverCell, setDragOverCell] = useState<{driverId: string, date: string} | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent, driverId: string, date: string) => {
    e.preventDefault();
    setDragOverCell({ driverId, date });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're leaving the cell entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverCell(null);
    }
  };

  const handleDrop = (e: React.DragEvent, driverId: string, date: string) => {
    e.preventDefault();
    
    // Validate drop - only allow dropping on the task's start date and not in the past
    const today = new Date().toISOString().split('T')[0];
    try {
      const draggedTaskData = e.dataTransfer.getData("application/json");
      if (draggedTaskData) {
        const draggedTask = JSON.parse(draggedTaskData);
        const start = draggedTask?.start_date as string | undefined;
        if (!start) {
          alert("Invalid task data. Missing start date.");
          setDragOverCell(null);
          return;
        }
        if (date < today) {
          alert(`Cannot move task to ${date}. Tasks cannot be moved to past dates.`);
          setDragOverCell(null);
          return;
        }
        if (date !== start) {
          alert(`Cannot move task to ${date}. Tasks can only be dropped on their start date (${start}).`);
          setDragOverCell(null);
          return;
        }
      }
    } catch (err) {
      console.error("Error validating drop:", err);
      setDragOverCell(null);
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
    
    setDragOverCell(null);
    
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

  return (
    <div className="space-y-4">
      {/* Hours Summary Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">
                  {t('shifts.driverHours.title')}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('shifts.driverHours.subtitle')}
                </p>
              </div>
            </div>
            {onToggleDriverHours && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleDriverHours(!showDriverHours)}
                className="flex items-center gap-2"
              >
                {showDriverHours ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    {t('common.hide')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    {t('common.show')}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        {showDriverHours && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.values(driverHours).map(({ driver, totalHours, taskCount, dailyHours }) => {
              const isVisible = visibleDrivers.length === 0 || visibleDrivers.includes(driver.id);
              
              return (
                <div
                  key={driver.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                    isVisible 
                      ? "bg-card hover:shadow-sm" 
                      : "bg-muted/50 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-base">
                        {driver.first_name} {driver.last_name}
                      </p>
                <p className="text-sm text-muted-foreground">
                  {taskCount} {taskCount !== 1 ? t('shifts.taskSummary.tasks') : t('shifts.taskSummary.task')} • {totalHours}{t('shifts.taskSummary.hours')} {t('shifts.taskSummary.total')}
                </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getHoursBadgeVariant(totalHours)}
                      className="text-xs font-medium"
                    >
                      {totalHours}{t('shifts.taskSummary.hours')}
                    </Badge>
                    <div className={`text-xs font-medium ${getHoursColor(totalHours)}`}>
                      {totalHours > 0 ? `${((totalHours / 8) * 100).toFixed(0)}%` : '0%'}
                    </div>
                    {onDriverVisibilityToggle && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDriverVisibilityToggle(driver.id, !isVisible)}
                        className="h-6 w-6 p-0"
                      >
                        {isVisible ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
        )}
      </Card>

      {/* Calendar Grid - Matching Month View Style */}
      <Card className="overflow-hidden">
        <div className="w-full">
            {/* Day Headers */}
            <div className="sticky top-0 z-20 bg-background border-b">
              <div className="flex">
                <div className="w-40 min-w-[10rem] p-3 border-r bg-muted/50 font-semibold text-foreground flex items-center justify-center">
                  {t('shifts.schedule.driver')}
                </div>
                {dates.map((date) => {
                  const dateObj = new Date(date);
                  const isToday = format(dateObj, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  
                  return (
                    <div
                      key={date}
                      className={cn(
                        "flex-1 min-w-[80px] p-3 border-r text-center font-medium text-sm flex flex-col items-center justify-center",
                        isToday && "bg-primary/10 text-primary font-bold"
                      )}
                    >
                      <div>{t(`shifts.schedule.days.${format(dateObj, "EEEE").toLowerCase()}`)}</div>
                      <div className="text-lg">{format(dateObj, "d")}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Driver Rows */}
            <div className="divide-y">
              {filteredSchedule.map((driverSchedule) => {
                if (!driverSchedule.driver_id) return null;
                
                const driver = {
                  id: driverSchedule.driver_id,
                  first_name: driverSchedule.driver_name?.split(' ')[0] || 'Unknown',
                  last_name: driverSchedule.driver_name?.split(' ').slice(1).join(' ') || 'Driver'
                };
                const driverData = driverHours[driverSchedule.driver_id];
                const isVisible = visibleDrivers.length === 0 || visibleDrivers.includes(driverSchedule.driver_id);
                
                return (
                  <div key={driverSchedule.driver_id} className="flex">
                    {/* Driver Name Column - Matching Month View */}
                    <div className="w-40 min-w-[10rem] p-3 border-r bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="space-y-2">
                        <button
                          onClick={() => onDriverClick?.(driverSchedule.driver_id)}
                          className="text-left hover:text-primary transition-colors w-full"
                        >
                          <div className="font-semibold text-base">
                            {driver.first_name} {driver.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {driverData?.taskCount || 0} {driverData?.taskCount !== 1 ? t('shifts.taskSummary.tasks') : t('shifts.taskSummary.task')} • {driverData?.totalHours || 0}{t('shifts.taskSummary.hours')} {t('shifts.taskSummary.total')}
                          </div>
                        </button>
                        
                        {/* Hours Summary */}
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={getHoursBadgeVariant(driverData?.totalHours || 0)}
                            className="text-xs"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {driverData?.totalHours || 0}{t('shifts.taskSummary.hours')}
                          </Badge>
                          <span className={`text-xs font-medium ${getHoursColor(driverData?.totalHours || 0)}`}>
                            {driverData?.totalHours ? `${((driverData.totalHours / 8) * 100).toFixed(0)}%` : '0%'}
                          </span>
                        </div>
                        
                        {/* Visibility Toggle */}
                        {onDriverVisibilityToggle && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDriverVisibilityToggle(driverSchedule.driver_id, !isVisible)}
                            className="h-6 w-6 p-0"
                          >
                            {isVisible ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Task Cells - Matching Month View */}
                    {dates.map((date) => {
                      const dayData = driverSchedule.dates[date] || { tasks: [], task_count: 0 };
                      const dayHours = driverData?.dailyHours[date] || 0;
                      const dateObj = new Date(date);
                      const isToday = format(dateObj, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                      
                      return (
                        <div
                          key={date}
                          className={cn(
                            "flex-1 min-w-[80px] border-r p-1 transition-all duration-200",
                            isToday && "bg-primary/5",
                            dragOverCell?.driverId === driverSchedule.driver_id && 
                            dragOverCell?.date === date && 
                            "bg-primary/20 border-2 border-primary border-dashed"
                          )}
                          onDragOver={handleDragOver}
                          onDragEnter={(e) => handleDragEnter(e, driverSchedule.driver_id, date)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, driverSchedule.driver_id, date)}
                        >
                          <div className="space-y-1">
                            {/* Day Hours Display */}
                            <div className="text-center">
                              <Badge 
                                variant={dayHours > 0 ? "outline" : "secondary"}
                                className="text-xs"
                              >
                                {dayHours}{t('shifts.taskSummary.hours')}
                              </Badge>
                            </div>

                            {/* Tasks */}
                            <div className="space-y-1">
                              {dayData.tasks?.map((task: CrewTask, index: number) => {
                                const colors = getTaskTypeColor(task.task_type, task.color_override);
                                
                                return (
                                  <div
                                    key={`${task.id}-${date}-${index}`}
                                    onClick={() => onTaskClick?.(task)}
                                    className={cn(
                                      "p-2 rounded text-xs cursor-pointer transition-colors border-l-4",
                                      colors.bg,
                                      colors.text,
                                      colors.border,
                                      "hover:opacity-80"
                                    )}
                                  >
                                    <div className="font-medium truncate">
                                      {task.title}
                                    </div>
                                    <div className="text-muted-foreground text-[10px]">
                                      {task.start_time} - {task.end_time}
                                    </div>
                                    <Badge 
                                      className={cn(
                                        "text-[8px] px-1 py-0 h-4 mt-1",
                                        colors.badge
                                      )}
                                    >
                                      {t(`shifts.shiftType.${task.task_type}`)}
                                    </Badge>
                                  </div>
                                );
                              }) || (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onCellClick?.(driverSchedule.driver_id, date)}
                                  className="w-full h-8 text-muted-foreground hover:text-foreground text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {t('shifts.calendar.addTask')}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
        </div>
      </Card>
    </div>
  );
}
