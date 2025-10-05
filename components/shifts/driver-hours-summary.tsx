"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, ChevronDown, ChevronUp, User, TrendingUp, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { format } from "date-fns";
import type { DriverTaskSchedule, CrewTask } from "@/types/crew-tasks";
import { getDriverCapacitySettings, getCapacityHoursForViewMode, type DriverCapacitySetting } from "@/lib/services/driver-capacity";

interface DriverHoursSummaryProps {
  schedule: DriverTaskSchedule[];
  viewMode: "day" | "week" | "month";
  selectedDate: Date;
  showDriverHours?: boolean;
  onToggleDriverHours?: (show: boolean) => void;
  driverCapacities?: Array<{
    driver_id: string;
    capacity_percentage: number;
    max_hours: number;
  }>;
  visibleDrivers?: string[];
  onDriverVisibilityToggle?: (driverId: string, visible: boolean) => void;
}

export function DriverHoursSummary({
  schedule,
  viewMode,
  selectedDate,
  showDriverHours = true,
  onToggleDriverHours,
  driverCapacities = [],
  visibleDrivers = [],
  onDriverVisibilityToggle
}: DriverHoursSummaryProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(true);
  const [capacitySettings, setCapacitySettings] = useState<DriverCapacitySetting[]>([]);
  const [isLoadingCapacities, setIsLoadingCapacities] = useState(true);

  // Load driver capacity settings from database
  useEffect(() => {
    const loadCapacitySettings = async () => {
      setIsLoadingCapacities(true);
      try {
        const { capacitySettings, error } = await getDriverCapacitySettings();
        if (error) {
          console.error('Error loading capacity settings:', error);
        } else {
          setCapacitySettings(capacitySettings);
        }
      } catch (error) {
        console.error('Error loading capacity settings:', error);
      } finally {
        setIsLoadingCapacities(false);
      }
    };

    loadCapacitySettings();
  }, []);

  // Helper to get capacity setting for a specific driver
  const getDriverCapacitySetting = (driverId: string): DriverCapacitySetting | null => {
    return capacitySettings.find(setting => setting.driver_id === driverId) || null;
  };

  // Calculate hours for each driver
  const driverHours = useMemo(() => {
    const hours: Record<string, { 
      driver: any;
      totalHours: number;
      taskCount: number;
      dailyHours: Record<string, number>;
      capacityPercentage: number;
      maxHours: number;
    }> = {};

    // Initialize driver data
    schedule.forEach((driverSchedule) => {
      if (driverSchedule.driver_id) {
        const capacitySetting = getDriverCapacitySetting(driverSchedule.driver_id);
        const capacity = driverCapacities.find(c => c.driver_id === driverSchedule.driver_id);
        
        // Get the maximum hours for the current view mode from database settings
        const maxHours = getCapacityHoursForViewMode(capacitySetting, viewMode);
        
        hours[driverSchedule.driver_id] = {
          driver: {
            id: driverSchedule.driver_id,
            first_name: driverSchedule.driver_name?.split(' ')[0] || 'Unknown',
            last_name: driverSchedule.driver_name?.split(' ').slice(1).join(' ') || 'Driver'
          },
          totalHours: 0,
          taskCount: 0,
          dailyHours: {},
          capacityPercentage: capacity?.capacity_percentage || 100,
          maxHours: maxHours // Use database-driven max hours
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
  }, [schedule, driverCapacities, viewMode, capacitySettings]);

  const getHoursColor = (hours: number, maxHours: number) => {
    const percentage = (hours / maxHours) * 100;
    if (percentage >= 100) return "text-red-600 dark:text-red-400"; // Over capacity - red
    if (percentage >= 90) return "text-orange-600 dark:text-orange-400"; // Very high - orange
    if (percentage >= 80) return "text-yellow-600 dark:text-yellow-400"; // High - yellow
    if (percentage >= 60) return "text-blue-600 dark:text-blue-400"; // Moderate - blue
    return "text-green-600 dark:text-green-400"; // Low - green
  };

  const getHoursBadgeVariant = (hours: number, maxHours: number) => {
    const percentage = (hours / maxHours) * 100;
    if (percentage >= 100) return "destructive"; // Over capacity - red
    if (percentage >= 90) return "default"; // Very high - orange
    if (percentage >= 80) return "secondary"; // High - yellow
    if (percentage >= 60) return "outline"; // Moderate - blue
    return "secondary"; // Low - green
  };

  const getProgressBarColor = (hours: number, maxHours: number) => {
    const percentage = (hours / maxHours) * 100;
    if (percentage >= 100) return "bg-red-500"; // Over capacity - red
    if (percentage >= 90) return "bg-orange-500"; // Very high - orange
    if (percentage >= 80) return "bg-yellow-500"; // High - yellow
    if (percentage >= 60) return "bg-blue-500"; // Moderate - blue
    return "bg-green-500"; // Low - green
  };

  const getViewModeLabel = () => {
    switch (viewMode) {
      case "day":
        return t('shifts.driverHours.today');
      case "week":
        return t('shifts.driverHours.thisWeek');
      case "month":
        return t('shifts.driverHours.thisMonth');
      default:
        return t('shifts.driverHours.thisWeek');
    }
  };

  const getViewModeTitle = () => {
    switch (viewMode) {
      case "day":
        return t('shifts.driverHours.todayTitle');
      case "week":
        return t('shifts.driverHours.thisWeekTitle');
      case "month":
        return t('shifts.driverHours.thisMonthTitle');
      default:
        return t('shifts.driverHours.title');
    }
  };

  const getViewModeSubtitle = () => {
    switch (viewMode) {
      case "day":
        return t('shifts.driverHours.todaySubtitle');
      case "week":
        return t('shifts.driverHours.thisWeekSubtitle');
      case "month":
        return t('shifts.driverHours.thisMonthSubtitle');
      default:
        return t('shifts.driverHours.subtitle');
    }
  };

  const totalDrivers = Object.keys(driverHours).length;
  const totalHours = Object.values(driverHours).reduce((sum, driver) => sum + driver.totalHours, 0);
  const averageHours = totalDrivers > 0 ? totalHours / totalDrivers : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">
                {getViewModeTitle()}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {getViewModeSubtitle()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:items-center sm:gap-2">
            {/* Collapse/Expand Section */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-center gap-2 w-full"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span className="text-sm">Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span className="text-sm">Expand</span>
                </>
              )}
            </Button>
            
            {/* Show/Hide Hours/Tasks */}
            {onToggleDriverHours && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleDriverHours(!showDriverHours)}
                className="flex items-center justify-center gap-2 w-full"
                title={showDriverHours ? "Hide hours display in calendar" : "Show hours display in calendar"}
              >
                {showDriverHours ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span className="text-sm">Hide Hours</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span className="text-sm">Show Hours</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Summary Stats */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted/50">
            <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium">{totalDrivers} Drivers</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted/50">
            <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium">{totalHours.toFixed(1)}h Total</p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted/50">
            <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm font-medium">{averageHours.toFixed(1)}h Avg</p>
              <p className="text-xs text-muted-foreground">Per Driver</p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Hours Details */}
      <div className={cn(
        "transition-all duration-300 ease-in-out overflow-hidden",
        isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <CardContent className="pt-0 px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {Object.values(driverHours).map((driverData) => {
              const capacityPercentage = (driverData.totalHours / driverData.maxHours) * 100;
              const isOverCapacity = capacityPercentage > driverData.capacityPercentage;
              
              const isVisible = visibleDrivers.length === 0 || visibleDrivers.includes(driverData.driver.id);
              
              return (
                <div key={driverData.driver.id} className={cn(
                  "p-3 sm:p-4 rounded-lg border transition-colors",
                  isVisible ? "bg-card hover:bg-muted/50" : "bg-muted/30 border-dashed opacity-60"
                )}>
                  {/* Header with Driver Info and Toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium text-sm">
                        {driverData.driver.first_name} {driverData.driver.last_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {driverData.taskCount} tasks • {getViewModeLabel()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getHoursBadgeVariant(driverData.totalHours, driverData.maxHours)}>
                        {driverData.totalHours}h
                      </Badge>
                      {onDriverVisibilityToggle && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDriverVisibilityToggle(driverData.driver.id, !isVisible)}
                          className="h-8 w-8 p-0"
                          title={isVisible ? "Hide driver from calendar" : "Show driver in calendar"}
                        >
                          {isVisible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Simplified Progress Indicators */}
                  {isVisible && (
                    <div className="space-y-3">
                      {/* Hours Progress */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Hours</span>
                          <span className={cn(
                            "font-medium",
                            getHoursColor(driverData.totalHours, driverData.maxHours)
                          )}>
                            {driverData.totalHours}/{driverData.maxHours}h
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              getProgressBarColor(driverData.totalHours, driverData.maxHours)
                            )}
                          />
                        </div>
                      </div>

                      {/* Capacity Status */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className={cn(
                          "font-medium",
                          isOverCapacity ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                        )}>
                          {capacityPercentage.toFixed(0)}% / {driverData.capacityPercentage}%
                        </span>
                      </div>

                      {/* Status Indicator */}
                      {isOverCapacity && (
                        <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          Over Capacity
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hidden State Message */}
                  {!isVisible && (
                    <div className="text-center py-2">
                      <div className="text-xs text-muted-foreground">
                        Hidden from calendar
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
