"use client";

import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, User, Calendar, Edit, Trash2, Eye, EyeOff, Settings, Search, Filter } from "lucide-react";
import { CrewTask } from "@/types/crew-tasks";
import { useI18n } from "@/lib/i18n/context";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from "date-fns";

interface EnhancedTasksTableProps {
  tasks: CrewTask[];
  drivers: Array<{ id: string; first_name: string; last_name: string }>;
  viewMode: "day" | "week" | "month";
  selectedDate: Date;
  onEditTask?: (task: CrewTask) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function EnhancedTasksTable({ 
  tasks, 
  drivers, 
  viewMode, 
  selectedDate, 
  onEditTask, 
  onDeleteTask 
}: EnhancedTasksTableProps) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  // Filter out the unassigned driver from the list
  const unassignedDriverId = '00000000-0000-0000-0000-000000000000';
  const availableDrivers = drivers.filter(driver => driver.id !== unassignedDriverId);
  const [visibleDrivers, setVisibleDrivers] = useState<string[]>(availableDrivers.map(d => d.id));
  const [showDriverToggle, setShowDriverToggle] = useState(false);

  // Calculate date range based on view mode
  const getDateRange = () => {
    switch (viewMode) {
      case "day":
        return { start: selectedDate, end: selectedDate };
      case "week":
        return { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) };
      case "month":
        return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
      default:
        return { start: selectedDate, end: selectedDate };
    }
  };

  const dateRange = getDateRange();

  // Filter tasks by date range and visible drivers
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Check if task is within date range
      const taskDate = new Date(task.start_date);
      const isInDateRange = isWithinInterval(taskDate, {
        start: dateRange.start,
        end: dateRange.end
      });

      // Check if driver is visible
      const isDriverVisible = !task.driver_id || visibleDrivers.includes(task.driver_id);

      // Check search term
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.location?.toLowerCase().includes(searchTerm.toLowerCase());

      // Check task type filter
      const matchesType = filterType === "all" || task.task_type === filterType;

      return isInDateRange && isDriverVisible && matchesSearch && matchesType;
    });
  }, [tasks, dateRange, visibleDrivers, searchTerm, filterType]);

  // Calculate hours per driver
  const driverHours = useMemo(() => {
    const hours: Record<string, { 
      driver: { id: string; first_name: string; last_name: string };
      totalHours: number;
      taskCount: number;
    }> = {};

    // Initialize driver data
    availableDrivers.forEach(driver => {
      if (visibleDrivers.includes(driver.id)) {
        hours[driver.id] = {
          driver,
          totalHours: 0,
          taskCount: 0
        };
      }
    });

    // Calculate hours for each task
    filteredTasks.forEach(task => {
      if (task.driver_id && visibleDrivers.includes(task.driver_id)) {
        const driverData = hours[task.driver_id];
        if (driverData) {
          driverData.totalHours += task.hours_per_day || 0;
          driverData.taskCount += 1;
        }
      }
    });

    return Object.values(hours).sort((a, b) => b.totalHours - a.totalHours);
  }, [filteredTasks, drivers, visibleDrivers]);

  const handleDriverToggle = (driverId: string, checked: boolean) => {
    if (checked) {
      setVisibleDrivers(prev => [...prev, driverId]);
    } else {
      setVisibleDrivers(prev => prev.filter(id => id !== driverId));
    }
  };

  const handleSelectAllDrivers = () => {
    setVisibleDrivers(availableDrivers.map(d => d.id));
  };

  const handleSelectNoneDrivers = () => {
    setVisibleDrivers([]);
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

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tasks & Hours - {getViewModeLabel()}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDriverToggle(!showDriverToggle)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Drivers ({visibleDrivers.length}/{availableDrivers.length})
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="charter">Charter</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="day_off">Day Off</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Driver Visibility Toggle */}
        {showDriverToggle && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Driver Visibility</h4>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAllDrivers}>
                  All
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSelectNoneDrivers}>
                  None
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {drivers.map((driver) => {
                const isVisible = visibleDrivers.includes(driver.id);
                return (
                  <div key={driver.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`driver-${driver.id}`}
                      checked={isVisible}
                      onCheckedChange={(checked) => 
                        handleDriverToggle(driver.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`driver-${driver.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {driver.first_name} {driver.last_name}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Hours Summary */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Hours Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {driverHours.map(({ driver, totalHours, taskCount }) => (
              <div
                key={driver.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {driver.first_name} {driver.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {taskCount} task{taskCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={getHoursBadgeVariant(totalHours)}
                    className="text-xs font-medium"
                  >
                    {totalHours}h
                  </Badge>
                  <div className={`text-xs font-medium ${getHoursColor(totalHours)}`}>
                    {totalHours > 0 ? `${((totalHours / 8) * 100).toFixed(0)}%` : '0%'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No tasks found for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.driver_id ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {task.drivers?.first_name} {task.drivers?.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t(`shifts.shiftType.${task.task_type}`) || task.task_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(task.start_date), "MMM d")}
                          {task.end_date !== task.start_date && 
                            ` - ${format(new Date(task.end_date), "MMM d")}`
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {task.start_time} - {task.end_time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className={`font-medium ${getHoursColor(task.hours_per_day || 0)}`}>
                          {task.hours_per_day || 0}h
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-32">{task.location}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onEditTask && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDeleteTask && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
