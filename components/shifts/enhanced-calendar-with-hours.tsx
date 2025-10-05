"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Plus, Eye, EyeOff, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from "date-fns";
import type { CrewTask } from "@/types/crew-tasks";
import { useI18n } from "@/lib/i18n/context";

interface EnhancedCalendarWithHoursProps {
  schedule: any[];
  dates: string[];
  viewMode: "day" | "week" | "month";
  selectedDate: Date;
  onTaskClick?: (task: CrewTask) => void;
  onCellClick?: (driverId: string, date: string) => void;
  onDriverClick?: (driverId: string) => void;
  onDateChange?: (date: Date) => void;
  visibleDrivers?: string[];
  onDriverVisibilityToggle?: (driverId: string, visible: boolean) => void;
}

export function EnhancedCalendarWithHours({
  schedule,
  dates,
  viewMode,
  selectedDate,
  onTaskClick,
  onCellClick,
  onDriverClick,
  onDateChange,
  visibleDrivers = [],
  onDriverVisibilityToggle,
}: EnhancedCalendarWithHoursProps) {
  const { t } = useI18n();

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
      if (driverSchedule.driver) {
        hours[driverSchedule.driver.id] = {
          driver: driverSchedule.driver,
          totalHours: 0,
          taskCount: 0,
          dailyHours: {}
        };
      }
    });

    // Calculate hours for each task
    schedule.forEach((driverSchedule) => {
      if (driverSchedule.driver) {
        Object.entries(driverSchedule.dates).forEach(([date, dayData]: [string, any]) => {
          if (dayData.tasks && Array.isArray(dayData.tasks)) {
            const dayHours = dayData.tasks.reduce((sum: number, task: CrewTask) => 
              sum + (task.hours_per_day || 0), 0
            );
            
            if (hours[driverSchedule.driver.id]) {
              hours[driverSchedule.driver.id].totalHours += dayHours;
              hours[driverSchedule.driver.id].taskCount += dayData.tasks.length;
              hours[driverSchedule.driver.id].dailyHours[date] = dayHours;
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

  const getViewModeLabel = () => {
    switch (viewMode) {
      case "day":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      default:
        return "Period";
    }
  };

  const filteredSchedule = useMemo(() => {
    if (visibleDrivers.length === 0) return schedule;
    return schedule.filter((driverSchedule) => 
      driverSchedule.driver && visibleDrivers.includes(driverSchedule.driver.id)
    );
  }, [schedule, visibleDrivers]);

  return (
    <div className="space-y-4">
      {/* Enhanced Hours Summary Header */}
      <Card className="overflow-hidden">
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
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Display */}
          <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(dates[0]), "MMM d")} - {format(new Date(dates[dates.length - 1]), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          {/* Driver Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.values(driverHours).map(({ driver, totalHours, taskCount, dailyHours }) => {
              const isVisible = visibleDrivers.length === 0 || visibleDrivers.includes(driver.id);
              
              return (
                <div
                  key={driver.id}
                  className={cn(
                    "group relative p-4 rounded-xl border-2 transition-all duration-200",
                    isVisible 
                      ? "bg-card hover:shadow-lg hover:border-primary/20 border-border" 
                      : "bg-muted/30 opacity-60 border-muted"
                  )}
                >
                  {/* Driver Info Section */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        isVisible ? "bg-primary/10" : "bg-muted"
                      )}>
                        <User className={cn(
                          "h-5 w-5",
                          isVisible ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {driver.first_name} {driver.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {taskCount} task{taskCount !== 1 ? 's' : ''} • {totalHours}h total
                        </p>
                      </div>
                    </div>
                    
                    {/* Visibility Toggle */}
                    {onDriverVisibilityToggle && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDriverVisibilityToggle(driver.id, !isVisible)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {isVisible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Hours Summary */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge 
                      variant={getHoursBadgeVariant(totalHours)}
                      className="text-sm font-medium px-3 py-1"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {totalHours}h
                    </Badge>
                    <div className={`text-sm font-semibold ${getHoursColor(totalHours)}`}>
                      {totalHours > 0 ? `${((totalHours / 8) * 100).toFixed(0)}%` : '0%'}
                    </div>
                  </div>

                  {/* Daily Hours Breakdown */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Daily Hours:</div>
                    <div className="grid grid-cols-2 gap-1">
                      {dates.slice(0, 4).map((date) => {
                        const dayHours = dailyHours[date] || 0;
                        const dayName = format(new Date(date), "EEE");
                        const dayNumber = format(new Date(date), "d");
                        
                        return (
                          <div key={date} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {dayName} {dayNumber}
                            </span>
                            <span className={cn(
                              "font-medium",
                              dayHours > 0 ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {dayHours}h
                            </span>
                          </div>
                        );
                      })}
                      {dates.length > 4 && (
                        <div className="col-span-2 text-xs text-muted-foreground text-center pt-1">
                          +{dates.length - 4} more day{dates.length - 4 !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="w-48 p-4 text-left font-medium sticky left-0 bg-background z-10">
                    Driver
                  </th>
                  {dates.map((date) => (
                    <th
                      key={date}
                      className="w-32 p-4 text-center font-medium min-w-[120px]"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {format(new Date(date), "EEE")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(date), "MMM d")}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSchedule.map((driverSchedule) => {
                  if (!driverSchedule.driver) return null;
                  
                  const driver = driverSchedule.driver;
                  const driverData = driverHours[driver.id];
                  const isVisible = visibleDrivers.length === 0 || visibleDrivers.includes(driver.id);
                  
                  return (
                    <tr key={driver.id} className="border-b hover:bg-muted/50">
                      {/* Driver Column with Hours */}
                      <td className="sticky left-0 bg-background z-10 p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDriverClick?.(driver.id)}
                              className="h-auto p-2 justify-start flex-1"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-sm">
                                  {driver.first_name} {driver.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {driverData?.taskCount || 0} tasks • {driverData?.totalHours || 0}h
                                </p>
                              </div>
                            </Button>
                            {onDriverVisibilityToggle && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDriverVisibilityToggle(driver.id, !isVisible)}
                                className="h-8 w-8 p-0"
                              >
                                {isVisible ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                          
                          {/* Total Hours for Period */}
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={getHoursBadgeVariant(driverData?.totalHours || 0)}
                              className="text-xs"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {driverData?.totalHours || 0}h
                            </Badge>
                            <span className={`text-xs font-medium ${getHoursColor(driverData?.totalHours || 0)}`}>
                              {driverData?.totalHours ? `${((driverData.totalHours / 8) * 100).toFixed(0)}%` : '0%'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date Columns */}
                      {dates.map((date) => {
                        const dayData = driverSchedule.dates[date];
                        const dayHours = driverData?.dailyHours[date] || 0;
                        
                        return (
                          <td
                            key={date}
                            className="p-2 min-w-[120px]"
                          >
                            <div className="space-y-2">
                              {/* Day Hours Display */}
                              <div className="text-center">
                                <Badge 
                                  variant={dayHours > 0 ? "outline" : "secondary"}
                                  className="text-xs"
                                >
                                  {dayHours}h
                                </Badge>
                              </div>

                              {/* Tasks */}
                              <div className="space-y-1">
                                {dayData?.tasks?.map((task: CrewTask) => (
                                  <div
                                    key={task.id}
                                    onClick={() => onTaskClick?.(task)}
                                    className="p-2 rounded text-xs cursor-pointer hover:bg-muted transition-colors"
                                  >
                                    <div className="font-medium truncate">
                                      {task.title}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {task.start_time} - {task.end_time}
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs mt-1"
                                    >
                                      {t(`shifts.shiftType.${task.task_type}`)}
                                    </Badge>
                                  </div>
                                )) || (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onCellClick?.(driver.id, date)}
                                    className="w-full h-8 text-muted-foreground hover:text-foreground"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add
                                  </Button>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
