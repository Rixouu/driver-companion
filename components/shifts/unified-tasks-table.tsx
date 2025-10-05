"use client";

import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, User, Calendar, Edit, Trash2, GripVertical, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { CrewTask } from "@/types/crew-tasks";
import { useI18n } from "@/lib/i18n/context";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EnhancedAssignModal } from "./enhanced-assign-modal";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
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
  const [selectedTaskForDelete, setSelectedTaskForDelete] = useState<CrewTask | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter tasks by assignment status
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by assignment status
    if (activeTab === "assigned") {
      filtered = filtered.filter(task => 
        task.driver_id && 
        task.driver_id !== null && 
        task.driver_id !== '00000000-0000-0000-0000-000000000000'
      );
    } else if (activeTab === "unassigned") {
      filtered = filtered.filter(task => 
        !task.driver_id || 
        task.driver_id === null || 
        task.driver_id === '00000000-0000-0000-0000-000000000000'
      );
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

    // Sort by date (start_date) - earliest first
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return dateA.getTime() - dateB.getTime();
    });

    return filtered;
  }, [tasks, activeTab, searchTerm, filterType]);

  // Pagination logic
  const totalItems = filteredTasks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterType]);

  // Count tasks by status
  const assignedCount = tasks.filter(t => 
    t.driver_id && 
    t.driver_id !== null && 
    t.driver_id !== '00000000-0000-0000-0000-000000000000'
  ).length;
  const unassignedCount = tasks.filter(t => 
    !t.driver_id || 
    t.driver_id === null || 
    t.driver_id === '00000000-0000-0000-0000-000000000000'
  ).length;

  const handleDragStart = (e: React.DragEvent, task: CrewTask) => {
    e.stopPropagation();
    setDraggedTask(task);
    
    // Set drag data
    e.dataTransfer.setData("application/json", JSON.stringify(task));
    e.dataTransfer.effectAllowed = "move";
    
    // Store task in localStorage as backup for cross-component drag
    if (typeof window !== "undefined") {
      localStorage.setItem("draggedTask", JSON.stringify(task));
    }
    
    // Add visual feedback class to body
    document.body.classList.add("dragging-task");
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("draggedTask");
    }
    
    // Remove visual feedback class from body
    document.body.classList.remove("dragging-task");
  };

  const handleAssignClick = (task: CrewTask) => {
    setSelectedTaskForAssign(task);
    setShowDriverDialog(true);
  };

  const handleDeleteClick = (task: CrewTask) => {
    setSelectedTaskForDelete(task);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async (taskId: string) => {
    if (onDeleteTask) {
      await onDeleteTask(taskId);
    }
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
        {/* Tasks Table - Desktop */}
        <div className="hidden lg:block rounded-md border">
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
              {paginatedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No tasks found for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTasks.map((task) => (
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
                      {task.driver_id && task.driver_id !== null && task.driver_id !== '00000000-0000-0000-0000-000000000000' ? (
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
                        {(!task.driver_id || task.driver_id === null || task.driver_id === '00000000-0000-0000-0000-000000000000') && (
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
                              handleDeleteClick(task);
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

        {/* Mobile Card Layout */}
        <div className="lg:hidden space-y-4">
          {paginatedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found for the selected period
            </div>
          ) : (
            paginatedTasks.map((task) => (
              <Card 
                key={task.id} 
                className={cn(
                  "p-4 cursor-grab active:cursor-grabbing transition-all duration-200",
                  draggedTask?.id === task.id && "opacity-50 scale-95"
                )}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-3">
                  {/* Task Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{task.title}</h3>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {(!task.driver_id || task.driver_id === null || task.driver_id === '00000000-0000-0000-0000-000000000000') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAssignClick(task)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
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
                          onClick={() => handleDeleteClick(task)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Task Details */}
                  <div className="space-y-3">
                    {/* Primary Info Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm">Driver:</span>
                        <span className="font-medium text-sm">
                          {task.driver_id && task.driver_id !== null && task.driver_id !== '00000000-0000-0000-0000-000000000000' 
                            ? drivers.find(d => d.id === task.driver_id)?.first_name + ' ' + drivers.find(d => d.id === task.driver_id)?.last_name
                            : 'Unassigned'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className={`font-medium text-sm ${getHoursColor(task.hours_per_day || 0)}`}>
                          {task.hours_per_day || 0}h
                        </span>
                      </div>
                    </div>

                    {/* Secondary Info Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm">Date:</span>
                        <span className="font-medium text-sm">{format(new Date(task.start_date), 'MMM d, yyyy')}</span>
                      </div>
                      {task.start_time && (
                        <span className="text-xs text-muted-foreground">
                          {task.start_time}
                        </span>
                      )}
                    </div>

                    {/* Location Row */}
                    {task.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm">Location:</span>
                        <span className="font-medium text-sm truncate flex-1">{task.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Task Type Badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Badge variant="outline" className="text-xs">
                      {task.task_type}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {task.start_time && (
                        <span className="text-xs text-muted-foreground">
                          {task.start_time}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t">
            {/* Mobile: Compact pagination */}
            <div className="flex flex-col sm:hidden gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('shifts.tasksHours.pagination.rowsPerPage')}</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Desktop: Full pagination */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('shifts.tasksHours.pagination.rowsPerPage')}</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('shifts.tasksHours.pagination.showing', { start: startIndex + 1, end: Math.min(endIndex, totalItems), total: totalItems })}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('shifts.tasksHours.pagination.previous')}</span>
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline">{t('shifts.tasksHours.pagination.next')}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Enhanced Driver Assignment Modal */}
      <EnhancedAssignModal
        isOpen={showDriverDialog}
        onClose={() => setShowDriverDialog(false)}
        task={selectedTaskForAssign}
        drivers={drivers}
        onAssign={handleQuickAssign}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        task={selectedTaskForDelete}
        onDelete={handleDeleteConfirm}
      />
    </Card>
  );
}
