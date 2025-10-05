"use client";

import { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { 
  Search, 
  Filter,
  Calendar,
  Clock,
  MapPin,
  User,
  GripVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CrewTask, TaskType, TaskStatus } from "@/types/crew-tasks";
import { format } from "date-fns";

interface TasksTableProps {
  tasks: CrewTask[];
  onEditTask: (task: CrewTask) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTask: (task: CrewTask) => void;
  className?: string;
}

const getTaskTypeColor = (taskType: TaskType) => {
  const colors: Record<TaskType, string> = {
    charter: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
    regular: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
    training: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200",
    day_off: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200",
    meeting: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200",
    standby: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
    special: "bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200",
  };
  return colors[taskType] || colors.regular;
};

const getTaskStatusColor = (status: TaskStatus) => {
  const colors: Record<TaskStatus, string> = {
    scheduled: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    confirmed: "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
    completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200",
  };
  return colors[status] || colors.scheduled;
};

export function TasksTable({
  tasks,
  onEditTask,
  onDeleteTask,
  onViewTask,
  className,
}: TasksTableProps) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [draggedTask, setDraggedTask] = useState<CrewTask | null>(null);

  // Get unique drivers from tasks (using driver info from expanded tasks)
  const drivers = useMemo(() => {
    const driverMap = new Map();
    tasks.forEach(task => {
      if (!driverMap.has(task.driver_id)) {
        // Extract driver name from task data
        const driverName = task.drivers 
          ? `${task.drivers.first_name} ${task.drivers.last_name}`
          : `Driver ${task.driver_id}`;
        
        driverMap.set(task.driver_id, {
          id: task.driver_id,
          name: driverName,
        });
      }
    });
    return Array.from(driverMap.values());
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.customer_name?.toLowerCase().includes(query) ||
          task.location?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter !== "all" && task.task_type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && task.task_status !== statusFilter) {
        return false;
      }

      // Driver filter
      if (driverFilter !== "all" && task.driver_id !== driverFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, typeFilter, statusFilter, driverFilter]);

  const handleDragStart = (task: CrewTask) => {
    setDraggedTask(task);
    if (typeof window !== "undefined") {
      localStorage.setItem("draggedTask", JSON.stringify(task));
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("draggedTask");
    }
  };

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">All Tasks</h3>
            <p className="text-sm text-muted-foreground">
              {filteredTasks.length} of {tasks.length} tasks
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as TaskType | "all")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Task Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="charter">Charter</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="day_off">Day Off</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="standby">Standby</SelectItem>
              <SelectItem value="special">Special</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | "all")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Driver Filter */}
          <Select value={driverFilter} onValueChange={setDriverFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Driver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                        ? "No tasks match your filters"
                        : "No tasks found"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "cursor-move transition-opacity",
                      draggedTask?.id === task.id && "opacity-50"
                    )}
                  >
                    {/* Drag Handle */}
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>

                    {/* Task Number */}
                    <TableCell>
                      <span className="text-lg font-bold text-primary">
                        {task.task_number}
                      </span>
                    </TableCell>

                    {/* Task Title */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {task.title || t(`shifts.shiftType.${task.task_type}`)}
                        </div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {task.description}
                          </div>
                        )}
                        {task.customer_name && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {task.customer_name}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Type */}
                    <TableCell>
                      <Badge className={getTaskTypeColor(task.task_type)}>
                        {t(`shifts.shiftType.${task.task_type}`)}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge className={getTaskStatusColor(task.task_status)}>
                        {t(`shifts.status.${task.task_status}`)}
                      </Badge>
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(task.start_date), "MMM d")}
                        {task.is_multi_day && (
                          <>
                            <span className="text-muted-foreground">-</span>
                            {format(new Date(task.end_date), "MMM d")}
                            <Badge variant="outline" className="ml-1 text-xs">
                              {task.total_days}d
                            </Badge>
                          </>
                        )}
                      </div>
                    </TableCell>

                    {/* Time */}
                    <TableCell>
                      {task.start_time ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {task.start_time}
                          {task.hours_per_day && (
                            <span className="text-muted-foreground">
                              ({task.hours_per_day}h)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Driver */}
                    <TableCell>
                      <div className="text-sm">
                        {task.drivers 
                          ? `${task.drivers.first_name} ${task.drivers.last_name}`
                          : `Driver ${task.driver_id}`
                        }
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewTask(task)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTask(task)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this task?")) {
                              onDeleteTask(task.id);
                            }
                          }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}

