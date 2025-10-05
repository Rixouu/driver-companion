"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter,
  Calendar,
  Clock,
  MapPin,
  User,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CrewTask, TaskType } from "@/types/crew-tasks";
import { format } from "date-fns";

interface UnassignedTasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onAssignTask: (taskId: string, driverId: string) => Promise<void>;
  onEditTask: (task: CrewTask) => void;
}

// Mock data for unassigned tasks - Replace with actual API call
const mockUnassignedTasks: CrewTask[] = [];

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

export function UnassignedTasksPanel({
  isOpen,
  onClose,
  startDate,
  endDate,
  onAssignTask,
  onEditTask,
}: UnassignedTasksPanelProps) {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<CrewTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<CrewTask[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<TaskType | "all">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [draggedTask, setDraggedTask] = useState<CrewTask | null>(null);

  // Load unassigned tasks
  useEffect(() => {
    if (isOpen) {
      loadUnassignedTasks();
    }
  }, [isOpen, startDate, endDate]);

  // Filter tasks based on search and type
  useEffect(() => {
    let filtered = tasks;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(task => task.task_type === selectedType);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, selectedType]);

  const loadUnassignedTasks = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });
      
      const response = await fetch(`/api/crew-tasks/unassigned?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch unassigned tasks");
      }
      
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Error loading unassigned tasks:", error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (task: CrewTask) => {
    setDraggedTask(task);
    // Store task data for calendar drop
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

  const taskTypes: Array<{ value: TaskType | "all"; label: string }> = [
    { value: "all", label: "All Types" },
    { value: "charter", label: "Charter" },
    { value: "regular", label: "Regular" },
    { value: "training", label: "Training" },
    { value: "day_off", label: "Day Off" },
    { value: "maintenance", label: "Maintenance" },
    { value: "meeting", label: "Meeting" },
    { value: "standby", label: "Standby" },
    { value: "special", label: "Special" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Unassigned Tasks</SheetTitle>
          <SheetDescription>
            Drag tasks to the calendar to assign them to drivers
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {taskTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type.value)}
                  className="text-xs"
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Task Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredTasks.length} task(s) {searchQuery || selectedType !== "all" ? "found" : "unassigned"}
            </span>
            <Button variant="ghost" size="sm" onClick={loadUnassignedTasks}>
              Refresh
            </Button>
          </div>

          {/* Tasks List */}
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-2 pr-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="mt-4 text-sm text-muted-foreground">Loading tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    {searchQuery || selectedType !== "all"
                      ? "No tasks match your filters"
                      : "No unassigned tasks"}
                  </p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "p-4 border rounded-lg cursor-move transition-all hover:shadow-md",
                      draggedTask?.id === task.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Drag Handle */}
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />

                      {/* Task Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-primary">
                                {task.task_number}
                              </span>
                              <h3 className="font-semibold truncate">
                                {task.title || t(`shifts.shiftType.${task.task_type}`)}
                              </h3>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <Badge className={getTaskTypeColor(task.task_type)}>
                            {t(`shifts.shiftType.${task.task_type}`)}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {/* Date */}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(task.start_date), "MMM d")}
                              {task.is_multi_day && (
                                <> - {format(new Date(task.end_date), "MMM d")}</>
                              )}
                            </span>
                          </div>

                          {/* Time */}
                          {task.start_time && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{task.start_time}</span>
                              {task.hours_per_day && (
                                <span className="ml-1">({task.hours_per_day}h)</span>
                              )}
                            </div>
                          )}

                          {/* Location */}
                          {task.location && (
                            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{task.location}</span>
                            </div>
                          )}

                          {/* Customer */}
                          {task.customer_name && (
                            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                              <User className="h-4 w-4" />
                              <span className="truncate">{task.customer_name}</span>
                            </div>
                          )}
                        </div>

                        {/* Multi-day indicator */}
                        {task.is_multi_day && (
                          <Badge variant="outline" className="text-xs">
                            {task.total_days} days
                          </Badge>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditTask(task)}
                            className="flex-1"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              // This would open a driver selection dialog
                              // For now, just show the functionality
                              alert("Select a driver to assign this task to, or drag it to the calendar");
                            }}
                            className="flex-1"
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

