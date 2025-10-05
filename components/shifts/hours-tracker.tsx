"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Calendar, TrendingUp } from "lucide-react";
import { CrewTask } from "@/types/crew-tasks";

interface HoursTrackerProps {
  tasks: CrewTask[];
  drivers: Array<{ id: string; first_name: string; last_name: string }>;
  viewMode: "day" | "week" | "month";
  selectedDate: Date;
  visibleDrivers: string[];
}

export function HoursTracker({ 
  tasks, 
  drivers, 
  viewMode, 
  selectedDate, 
  visibleDrivers 
}: HoursTrackerProps) {
  const hoursData = useMemo(() => {
    const driverHours: Record<string, {
      driver: { id: string; first_name: string; last_name: string };
      totalHours: number;
      taskCount: number;
      tasks: CrewTask[];
    }> = {};

    // Initialize driver data
    drivers.forEach(driver => {
      if (visibleDrivers.includes(driver.id)) {
        driverHours[driver.id] = {
          driver,
          totalHours: 0,
          taskCount: 0,
          tasks: []
        };
      }
    });

    // Calculate hours for each task
    tasks.forEach(task => {
      if (task.driver_id && visibleDrivers.includes(task.driver_id)) {
        const driverData = driverHours[task.driver_id];
        if (driverData) {
          driverData.totalHours += task.hours_per_day || 0;
          driverData.taskCount += 1;
          driverData.tasks.push(task);
        }
      }
    });

    return Object.values(driverHours).sort((a, b) => b.totalHours - a.totalHours);
  }, [tasks, drivers, visibleDrivers]);

  const totalHours = hoursData.reduce((sum, driver) => sum + driver.totalHours, 0);
  const totalTasks = hoursData.reduce((sum, driver) => sum + driver.taskCount, 0);

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

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Hours Tracking - {getViewModeLabel()}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>Total: {totalHours}h</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{totalTasks} tasks</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hoursData.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tasks found for selected period</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hoursData.map(({ driver, totalHours, taskCount, tasks }) => (
              <div
                key={driver.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {driver.first_name} {driver.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {taskCount} task{taskCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={getHoursBadgeVariant(totalHours)}
                    className="text-sm font-medium"
                  >
                    {totalHours}h
                  </Badge>
                  <div className={`text-sm font-medium ${getHoursColor(totalHours)}`}>
                    {totalHours > 0 ? `${((totalHours / 8) * 100).toFixed(0)}%` : '0%'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {totalHours > 0 && (
          <div className="pt-3 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average per driver:</span>
              <span className="font-medium">
                {hoursData.length > 0 ? (totalHours / hoursData.length).toFixed(1) : 0}h
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
