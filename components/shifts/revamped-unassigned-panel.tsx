"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Filter,
  Calendar,
  Clock,
  MapPin,
  User,
  GripVertical,
  Plus,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Users,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CrewTask, TaskType } from "@/types/crew-tasks";
import { format } from "date-fns";

interface RevampedUnassignedPanelProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onAssignTask: (taskId: string, driverId: string) => Promise<void>;
  onEditTask: (task: CrewTask) => void;
  drivers: Array<{ id: string; first_name: string; last_name: string }>;
  onCreateTask: () => void;
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

const getPriorityColor = (priority: number) => {
  if (priority >= 3) return "text-red-600 dark:text-red-400";
  if (priority >= 2) return "text-orange-600 dark:text-orange-400";
  if (priority >= 1) return "text-yellow-600 dark:text-yellow-400";
  return "text-gray-600 dark:text-gray-400";
};

export function RevampedUnassignedPanel({
  isOpen,
  onClose,
  startDate,
  endDate,
  onAssignTask,
  onEditTask,
  drivers,
  onCreateTask,
}: RevampedUnassignedPanelProps) {
  const { t } = useI18n();
  const [tasks, setTasks] = useState<CrewTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<CrewTask[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<TaskType | "all">("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [draggedTask, setDraggedTask] = useState<CrewTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<CrewTask | null>(null);
  const [showDriverSelection, setShowDriverSelection] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Load unassigned tasks
  useEffect(() => {
    if (isOpen) {
      loadUnassignedTasks();
    }
  }, [isOpen, startDate, endDate]);

  // Filter tasks based on search and filters
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

    // Filter by priority
    if (selectedPriority !== "all") {
      const priority = parseInt(selectedPriority);
      filtered = filtered.filter(task => task.priority === priority);
    }

    // Sort by date (start_date) - earliest first
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, selectedType, selectedPriority]);

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

  const handleQuickAssign = (task: CrewTask, driverId: string) => {
    onAssignTask(task.id, driverId);
    setShowDriverSelection(false);
    setSelectedTask(null);
  };

  const handleBulkAssign = async (driverId: string) => {
    const tasksToAssign = filteredTasks.filter(task => !task.driver_id);
    for (const task of tasksToAssign) {
      await onAssignTask(task.id, driverId);
    }
    setShowDriverSelection(false);
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

  const priorityLevels = [
    { value: "all", label: "All Priorities" },
    { value: "0", label: "Low" },
    { value: "1", label: "Medium" },
    { value: "2", label: "High" },
    { value: "3", label: "Urgent" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Unassigned Tasks</h2>
            <p className="text-muted-foreground">
              {filteredTasks.length} unassigned task{filteredTasks.length !== 1 ? 's' : ''} • 
              Drag to calendar or assign directly
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
            <Button variant="outline" onClick={loadUnassignedTasks}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as TaskType | "all")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Task Type" />
              </SelectTrigger>
              <SelectContent>
                {taskTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityLevels.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDriverSelection(true)}
              disabled={filteredTasks.length === 0}
            >
              <Users className="h-4 w-4 mr-2" />
              Assign All to Driver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Smart assignment logic here
                alert("Smart assignment feature coming soon!");
              }}
              disabled={filteredTasks.length === 0}
            >
              <Zap className="h-4 w-4 mr-2" />
              Smart Assign
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-sm text-muted-foreground">Loading tasks...</p>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No unassigned tasks</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedType !== "all" || selectedPriority !== "all"
                    ? "No tasks match your filters"
                    : "All tasks are assigned or no tasks exist"}
                </p>
                <Button onClick={onCreateTask}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Task
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks.map((task) => (
                      <Card
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "cursor-move transition-all hover:shadow-lg group",
                          draggedTask?.id === task.id && "opacity-50"
                        )}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="text-2xl font-bold text-primary">
                                #{task.task_number}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getTaskTypeColor(task.task_type)}>
                                {t(`shifts.shiftType.${task.task_type}`)}
                              </Badge>
                              {task.priority > 0 && (
                                <div className={cn("text-xs font-medium", getPriorityColor(task.priority))}>
                                  P{task.priority}
                                </div>
                              )}
                            </div>
                          </div>
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Date & Time */}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(task.start_date), "MMM d")}
                              {task.end_date !== task.start_date && 
                                ` - ${format(new Date(task.end_date), "MMM d")}`
                              }
                            </span>
                          </div>

                          {task.start_time && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{task.start_time} - {task.end_time}</span>
                              <Badge variant="outline" className="text-xs">
                                {task.hours_per_day}h
                              </Badge>
                            </div>
                          )}

                          {task.location && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{task.location}</span>
                            </div>
                          )}

                          {task.customer_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{task.customer_name}</span>
                            </div>
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
                                setSelectedTask(task);
                                setShowDriverSelection(true);
                              }}
                              className="flex-1"
                            >
                              Assign
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTasks.map((task) => (
                      <Card
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "cursor-move transition-all hover:shadow-md group",
                          draggedTask?.id === task.id && "opacity-50"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl font-bold text-primary">
                                  #{task.task_number}
                                </span>
                                <h3 className="font-semibold truncate">{task.title}</h3>
                                <Badge className={getTaskTypeColor(task.task_type)}>
                                  {t(`shifts.shiftType.${task.task_type}`)}
                                </Badge>
                                {task.priority > 0 && (
                                  <div className={cn("text-xs font-medium", getPriorityColor(task.priority))}>
                                    P{task.priority}
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {format(new Date(task.start_date), "MMM d")}
                                    {task.end_date !== task.start_date && 
                                      ` - ${format(new Date(task.end_date), "MMM d")}`
                                    }
                                  </span>
                                </div>
                                
                                {task.start_time && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{task.start_time} - {task.end_time}</span>
                                  </div>
                                )}
                                
                                {task.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span className="truncate">{task.location}</span>
                                  </div>
                                )}
                                
                                {task.customer_name && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span className="truncate">{task.customer_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {task.hours_per_day}h
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditTask(task)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowDriverSelection(true);
                                }}
                              >
                                Assign
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Driver Selection Dialog */}
        <Dialog open={showDriverSelection} onOpenChange={setShowDriverSelection}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedTask ? `Assign Task #${selectedTask.task_number}` : "Assign All Tasks"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedTask 
                  ? `Select a driver to assign "${selectedTask.title}" to:`
                  : `Select a driver to assign all ${filteredTasks.length} tasks to:`
                }
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {drivers.map((driver) => (
                  <Button
                    key={driver.id}
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => selectedTask 
                      ? handleQuickAssign(selectedTask, driver.id)
                      : handleBulkAssign(driver.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">
                          {driver.first_name} {driver.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Available for assignment
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
