"use client";

import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, User, Calendar, Edit, Trash2, GripVertical, UserPlus } from "lucide-react";
import { CrewTask } from "@/types/crew-tasks";
import { useI18n } from "@/lib/i18n/context";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UnifiedTasksTableProps {
  tasks: CrewTask[];
  drivers: Array<{ id: string; first_name: string; last_name: string }>;
  viewMode: "day" | "week" | "month";
  selectedDate: Date;
  onEditTask?: (task: CrewTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onAssignTask?: (taskId: string, driverId: string) => Promise<void>;
}

export function UnifiedTasksTable({ 
  tasks, 
  drivers, 
  viewMode, 
  selectedDate, 
  onEditTask, 
  onDeleteTask,
  onAssignTask 
}: UnifiedTasksTableProps) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "assigned" | "unassigned">("all");
  const [draggedTask, setDraggedTask] = useState<CrewTask | null>(null);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState<CrewTask | null>(null);
  const [showDriverDialog, setShowDriverDialog] = useState(false);

  // Filter tasks by assignment status
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by assignment status
    const unassignedDriverId = '00000000-0000-0000-0000-000000000000';
    if (activeTab === "assigned") {
      filtered = filtered.filter(task => task.driver_id && task.driver_id !== unassignedDriverId);
    } else if (activeTab === "unassigned") {
      filtered = filtered.filter(task => !task.driver_id || task.driver_id === unassignedDriverId);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by task type
    if (filterType !== "all") {
      filtered = filtered.filter(task => task.task_type === filterType);
    }

    return filtered;
  }, [tasks, activeTab, searchTerm, filterType]);

  // Count tasks by status
  const unassignedDriverId = '00000000-0000-0000-0000-000000000000';
  const assignedCount = tasks.filter(t => t.driver_id && t.driver_id !== unassignedDriverId).length;
  const unassignedCount = tasks.filter(t => !t.driver_id || t.driver_id === unassignedDriverId).length;

  const handleDragStart = (e: React.DragEvent, task: CrewTask) => {
    setDraggedTask(task);
    e.dataTransfer.setData("application/json", JSON.stringify(task));
    e.dataTransfer.effectAllowed = "move";
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

  const handleAssignClick = (task: CrewTask) => {
    setSelectedTaskForAssign(task);
    setShowDriverDialog(true);
  };

  const handleQuickAssign = async (driverId: string) => {
    if (selectedTaskForAssign && onAssignTask) {
      await onAssignTask(selectedTaskForAssign.id, driverId);
      setShowDriverDialog(false);
      setSelectedTaskForAssign(null);
    }
  };

  const getTaskTypeColor = (taskType: string) => {
    const colors: Record<string, string> = {
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

  const getHoursColor = (hours: number) => {
    if (hours >= 8) return "text-green-600 dark:text-green-400";
    if (hours >= 6) return "text-yellow-600 dark:text-yellow-400";
    if (hours >= 4) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
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
      <CardHeader className="space-y-6 pb-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
              <div>
                <CardTitle className="text-xl font-semibold">
                  {t('shifts.tasksHours.title')}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('shifts.tasksHours.subtitle')}
                </p>
              </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Input
                placeholder={t('shifts.filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48 h-10">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('shifts.filters.allTypes')}</SelectItem>
                <SelectItem value="charter">Charter</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="day_off">Day Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enhanced Tabs Section */}
        <div className="border-b border-border/50">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 h-12">
              <TabsTrigger 
                value="all" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>{t('shifts.tabs.allTasks')}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {tasks.length}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="assigned" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>{t('shifts.tabs.assigned')}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {assignedCount}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="unassigned" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>{t('shifts.tabs.unassigned')}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {unassignedCount}
                  </Badge>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent>
        {/* Tasks Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>{t('shifts.tableHeaders.task')}</TableHead>
                <TableHead>{t('shifts.tableHeaders.driver')}</TableHead>
                <TableHead>{t('shifts.tableHeaders.type')}</TableHead>
                <TableHead>{t('shifts.tableHeaders.date')}</TableHead>
                <TableHead>{t('shifts.tableHeaders.time')}</TableHead>
                <TableHead>{t('shifts.tableHeaders.hours')}</TableHead>
                <TableHead>{t('shifts.tableHeaders.location')}</TableHead>
                <TableHead className="w-32">{t('shifts.tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No tasks found for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow 
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onEditTask?.(task)}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      draggedTask?.id === task.id && "opacity-50"
                    )}
                  >
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell onClick={(e) => { e.stopPropagation(); onEditTask?.(task); }}>
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.driver_id && task.driver_id !== '00000000-0000-0000-0000-000000000000' ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {(() => {
                              const driver = drivers.find(d => d.id === task.driver_id);
                              return driver ? `${driver.first_name} ${driver.last_name}` : `Driver ${task.driver_id}`;
                            })()}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {t('shifts.tabs.unassigned')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getTaskTypeColor(task.task_type)}>
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {(!task.driver_id || task.driver_id === '00000000-0000-0000-0000-000000000000') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignClick(task);
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        {onEditTask && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(task);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDeleteTask && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTask(task.id);
                            }}
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

      {/* Driver Assignment Dialog */}
      <Dialog open={showDriverDialog} onOpenChange={setShowDriverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTaskForAssign && `Assign Task: ${selectedTaskForAssign.title}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a driver to assign this task to:
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {drivers.filter(d => d.id !== '00000000-0000-0000-0000-000000000000').map((driver) => (
                <Button
                  key={driver.id}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => handleQuickAssign(driver.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">
                        {driver.first_name} {driver.last_name}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
