"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { CrewTaskCalendarGrid } from "@/components/shifts/crew-task-calendar-grid";
import { EnhancedCalendarGrid } from "@/components/shifts/enhanced-calendar-grid";
import { EnhancedCalendarWithHours } from "@/components/shifts/enhanced-calendar-with-hours";
import { UnifiedCalendar } from "@/components/shifts/unified-calendar";
import { ShiftFilters } from "@/components/shifts/shift-filters";
import { ShiftStatistics } from "@/components/shifts/shift-statistics";
import { UnassignedBookings } from "@/components/shifts/unassigned-bookings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ShiftTabsList } from "@/components/shifts/shift-tabs-list";
import { useCrewTasks } from "@/lib/hooks/use-crew-tasks";
import { Booking } from "@/types/bookings";
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CalendarDays } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { TaskCreationSheet } from "@/components/shifts/task-creation-sheet";
import { RevampedUnassignedPanel } from "@/components/shifts/revamped-unassigned-panel";
import { UnifiedTasksTable } from "@/components/shifts/unified-tasks-table";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { GoogleMapsProvider } from "@/components/providers/google-maps-provider";
import { RevampedDriverCapacityModal } from "@/components/shifts/revamped-driver-capacity-modal";
import { SmartAssignment } from "@/components/shifts/smart-assignment";
import { ConflictDetectionModal } from "@/components/shifts/conflict-detection-modal";
import type { CrewTask } from "@/types/crew-tasks";

type ViewType = "day" | "week" | "month";

export default function ShiftsPage() {
  const { t } = useI18n();
  const [viewType, setViewType] = useState<ViewType>("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("schedule");
  
  // Sheet/Panel state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUnassignedPanelOpen, setIsUnassignedPanelOpen] = useState(false);
  const [sheetDriverId, setSheetDriverId] = useState<string | undefined>();
  const [sheetDate, setSheetDate] = useState<string | undefined>();
  const [editingTask, setEditingTask] = useState<CrewTask | undefined>();
  const [drivers, setDrivers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);
  const [allTasks, setAllTasks] = useState<CrewTask[]>([]);
  const [visibleDrivers, setVisibleDrivers] = useState<string[]>([]);
  const [showDriverHours, setShowDriverHours] = useState(true);
  const [driverCapacities, setDriverCapacities] = useState<any[]>([]);
  
  // Conflict detection state
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictTask, setConflictTask] = useState<any>(null);
  const [conflictDrivers, setConflictDrivers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showDriverToggle, setShowDriverToggle] = useState(false);
  

  // Calculate date range based on view type
  const getDateRange = () => {
    const date = selectedDate;
    
    switch (viewType) {
      case "day":
        return {
          start: format(date, "yyyy-MM-dd"),
          end: format(date, "yyyy-MM-dd"),
        };
      case "week":
        return {
          start: format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          end: format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      case "month":
        return {
          start: format(startOfMonth(date), "yyyy-MM-dd"),
          end: format(endOfMonth(date), "yyyy-MM-dd"),
        };
    }
  };

  const dateRange = getDateRange();

  // Generate array of dates for the range
  const dates = eachDayOfInterval({
    start: new Date(dateRange.start),
    end: new Date(dateRange.end),
  }).map((date) => format(date, "yyyy-MM-dd"));

  // Fetch crew tasks schedule data
  const { data, meta, isLoading, error, refetch } = useCrewTasks({
    startDate: dateRange.start,
    endDate: dateRange.end,
    driverIds: selectedDriverIds.length > 0 ? selectedDriverIds : undefined,
    autoRefetch: true,
    refetchInterval: 120000, // 2 minutes
  });

  // Process schedule data to include all drivers (even those without tasks)
  const processedSchedule = useMemo(() => {
    if (!data || !Array.isArray(data) || drivers.length === 0) {
      return data || [];
    }

    // Create a map of existing driver schedules
    const scheduleMap = new Map();
    data.forEach((driverSchedule: any) => {
      if (driverSchedule.driver_id) {
        scheduleMap.set(driverSchedule.driver_id, driverSchedule);
      } else if (driverSchedule.driver_id === null) {
        // Handle unassigned tasks
        scheduleMap.set('unassigned', driverSchedule);
      }
    });

    // Create schedule entries for all drivers, including those without tasks
    const allDriverSchedules = drivers.map(driver => {
      const existingSchedule = scheduleMap.get(driver.id);
      if (existingSchedule) {
        return existingSchedule;
      }

      // Create empty schedule for driver without tasks
      return {
        driver_id: driver.id,
        driver_name: `${driver.first_name} ${driver.last_name}`,
        dates: {}
      };
    });

    // Add unassigned tasks if they exist
    const unassignedSchedule = scheduleMap.get('unassigned');
    if (unassignedSchedule) {
      allDriverSchedules.push(unassignedSchedule);
    }

    return allDriverSchedules;
  }, [data, drivers]);

  // Load all tasks for the table (extract from schedule data)
  useEffect(() => {
    if (processedSchedule && Array.isArray(processedSchedule)) {
      const tasks: CrewTask[] = [];
      processedSchedule.forEach((driver: any) => {
        Object.values(driver.dates).forEach((dayData: any) => {
          if (dayData.tasks && Array.isArray(dayData.tasks)) {
            tasks.push(...dayData.tasks);
          }
        });
      });
      setAllTasks(tasks);
    } else {
      setAllTasks([]);
    }
  }, [processedSchedule]);

  // Load drivers for modal (exclude fake unassigned driver)
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const supabase = createClient();
        const unassignedDriverId = '00000000-0000-0000-0000-000000000000';
        const { data, error } = await supabase
          .from("drivers")
          .select("id, first_name, last_name")
          .neq("id", unassignedDriverId) // Exclude fake unassigned driver
          .order("first_name");
        
        if (error) {
          console.error("Error loading drivers:", error);
        } else {
          setDrivers(data || []);
          // Initialize visible drivers with all drivers
          setVisibleDrivers(data?.map(d => d.id) || []);
        }
      } catch (err) {
        console.error("Error loading drivers:", err);
      }
    };
    
    loadDrivers();
  }, []);

  const handleTaskClick = (task: CrewTask) => {
    // Open task details or navigate
    handleEditTask(task);
  };

  const handleCellClick = (driverId: string, date: string) => {
    // Open task creation sheet
    setSheetDriverId(driverId);
    setSheetDate(date);
    setEditingTask(undefined);
    setIsSheetOpen(true);
  };

  const handleTaskCreate = async (task: any, applyToMultiple: boolean, selectedDriverIds: string[], isEditing: boolean = false, editingTaskId?: string) => {
    try {
      console.log('handleTaskCreate called with:', {
        task,
        applyToMultiple,
        selectedDriverIds,
        isEditing,
        editingTaskId
      });

      // If editing existing task
      if (isEditing && editingTaskId) {
        console.log('Updating existing task:', editingTaskId);
        const response = await fetch(`/api/crew-tasks/${editingTaskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(task),
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error('Update failed:', error);
          throw new Error(error.error || "Failed to update task");
        }
        
        const result = await response.json();
        console.log('Update successful:', result);
        toast.success('Task updated successfully');
        await refetch();
        return;
      }
      
      // Creating new task(s)
      // Use unassigned driver ID if no driver is selected
      const unassignedDriverId = '00000000-0000-0000-0000-000000000000';
      const driversToCreate = applyToMultiple 
        ? (selectedDriverIds.length > 0 ? selectedDriverIds : [unassignedDriverId])
        : [task.driver_id || unassignedDriverId];
      console.log('Creating tasks for drivers:', driversToCreate);
      
      // Create tasks for all selected drivers
      const promises = driversToCreate.map(driverId =>
        fetch("/api/crew-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...task,
            driver_id: driverId,
          }),
        })
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => !r.ok);
      
      if (errors.length > 0) {
        console.error('Some tasks failed to create:', errors);
        
        // Check if any are conflict errors (409)
        const conflictErrors = errors.filter(r => r.status === 409);
        if (conflictErrors.length > 0) {
          // Handle conflicts
          const conflictDetails = await Promise.all(
            conflictErrors.map(async (error, index) => {
              try {
                const errorData = await error.json();
                const driverId = driversToCreate[results.indexOf(error)];
                const driver = drivers.find(d => d.id === driverId);
                return {
                  driverId,
                  driverName: driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown Driver',
                  conflicts: errorData.conflicts || []
                };
              } catch (e) {
                console.error('Error parsing conflict data:', e);
                return null;
              }
            })
          );
          
          const validConflicts = conflictDetails.filter(Boolean);
          if (validConflicts.length > 0) {
            setConflicts(validConflicts);
            setConflictTask(task);
            setConflictDrivers(driversToCreate);
            setShowConflictModal(true);
            return; // Don't throw error, let user resolve conflicts
          }
        }
        
        throw new Error(`Failed to create ${errors.length} task(s)`);
      }
      
      console.log('All tasks created successfully');
      toast.success(`Created ${driversToCreate.length} task(s) successfully`);
      
      // Refresh the data
      await refetch();
    } catch (error) {
      console.error("Error creating/updating task:", error);
      throw error;
    }
  };

  const handleEditTask = (task: CrewTask) => {
    setEditingTask(task);
    setSheetDriverId(task.driver_id);
    setSheetDate(task.start_date);
    setIsSheetOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/crew-tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete task');
      }

      toast.success('Task deleted successfully');
      await refetch();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete task');
      throw error;
    }
  };

  const handleConflictResolve = async (resolution: 'skip' | 'overwrite', driverIds: string[]) => {
    try {
      if (resolution === 'skip') {
        // Skip creating tasks for these drivers
        toast.info(`Skipped creating tasks for ${driverIds.length} driver(s) due to conflicts`);
        setShowConflictModal(false);
        return;
      }

      if (resolution === 'overwrite') {
        // For overwrite, we need to delete existing tasks first, then create new ones
        const driverConflicts = conflicts.filter(conflict => driverIds.includes(conflict.driverId));
        
        // First, delete existing conflicting tasks
        const deletePromises = driverConflicts.flatMap(conflict => 
          conflict.conflicts.map((conflictTask: any) => 
            fetch(`/api/crew-tasks/${conflictTask.id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            })
          )
        );
        
        await Promise.all(deletePromises);
        
        // Then create new tasks for these drivers
        const createPromises = driverIds.map(driverId =>
          fetch("/api/crew-tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...conflictTask,
              driver_id: driverId,
            }),
          })
        );
        
        const results = await Promise.all(createPromises);
        const errors = results.filter(r => !r.ok);
        
        if (errors.length > 0) {
          throw new Error(`Failed to create ${errors.length} task(s) after overwrite`);
        }
        
        toast.success(`Overwrote and created ${driverIds.length} task(s) successfully`);
        await refetch();
      }
      
      setShowConflictModal(false);
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resolve conflicts');
    }
  };

  const handleSmartAssign = async (assignments: Array<{ taskId: string; driverId: string }>) => {
    try {
      for (const assignment of assignments) {
        const response = await fetch(`/api/crew-tasks/${assignment.taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driver_id: assignment.driverId })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to assign task ${assignment.taskId}`);
        }
      }
      
      toast.success(`Successfully assigned ${assignments.length} task(s)`);
      refetch();
    } catch (error) {
      console.error('Error assigning tasks:', error);
      toast.error('Failed to assign tasks');
    }
  };


  const handleViewTask = (task: CrewTask) => {
    // Navigate to task details or open in modal
    console.log("Viewing task:", task);
  };

  const handleAssignTask = async (taskId: string, driverId: string) => {
    try {
      const response = await fetch(`/api/crew-tasks/${taskId}`, {
        method: "PATCH", // API uses PATCH, not PUT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: driverId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to assign task");
      }
      
      await refetch();
    } catch (error) {
      console.error("Error assigning task:", error);
      throw error;
    }
  };

  const handleTaskDrop = async (taskId: string, driverId: string, date: string) => {
    // Fetch the task to validate start date
    try {
      const res = await fetch(`/api/crew-tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      const task: any = await res.json();
      const start = task?.start_date as string | undefined;
      const today = new Date().toISOString().split('T')[0];
      
      if (!start) {
        toast.error("Invalid task: missing start date.");
        return;
      }
      if (date < today) {
        toast.error(`Cannot move task to ${date}. Tasks cannot be moved to past dates.`);
        return;
      }
      if (date !== start) {
        toast.error(`Cannot move task to ${date}. Tasks can only be dropped on their start date (${start}).`);
        return;
      }
    } catch (e) {
      console.error("Validation error:", e);
      toast.error("Failed to validate task move");
      return;
    }

    try {
      const response = await fetch(`/api/crew-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: driverId,
          start_date: date,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to move task");
      }
      
      toast.success("Task moved successfully");
      await refetch();
    } catch (error) {
      console.error("Error moving task:", error);
      toast.error("Failed to move task");
    }
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSheetDriverId(undefined);
    setSheetDate(undefined);
    setEditingTask(undefined);
  };


  const handleDriverClick = (driverId: string) => {
    // Navigate to driver details
    window.location.href = `/drivers/${driverId}`;
  };

  const handleDriverVisibilityToggle = (driverId: string, visible: boolean) => {
    if (visible) {
      setVisibleDrivers(prev => [...prev, driverId]);
    } else {
      setVisibleDrivers(prev => prev.filter(id => id !== driverId));
    }
  };

  return (
    <GoogleMapsProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <div className="flex flex-col gap-6">
      {/* Page Header */}
      <PageHeader
        title={t('shifts.title')}
        description={t('shifts.description')}
      >
        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:items-center sm:gap-2 sm:w-auto">
          <Button
            size="sm"
            onClick={() => {
              setSheetDriverId(undefined);
              setSheetDate(undefined);
              setEditingTask(undefined);
              setIsSheetOpen(true);
            }}
            className="w-full"
          >
            {t('shifts.buttons.createTask')}
          </Button>
          <RevampedDriverCapacityModal 
            drivers={drivers} 
            onCapacityUpdate={setDriverCapacities} 
          />
        </div>
      </PageHeader>

      {/* Filters and Controls */}
      <div className="space-y-4">
        <ShiftFilters
          viewType={viewType}
          onViewTypeChange={setViewType}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onRefresh={refetch}
        />
      </div>

      {/* Main Content - No Tabs, Just Schedule */}
      <div className="mt-2 space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('shifts.errors.loadFailed')}: {error.message}
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <Card className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </Card>
            ) : processedSchedule && processedSchedule.length > 0 ? (
              <UnifiedCalendar
                schedule={processedSchedule}
                viewMode={viewType}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onTaskClick={handleTaskClick}
                onCellClick={handleCellClick}
                onDriverClick={handleDriverClick}
                visibleDrivers={visibleDrivers}
                onDriverVisibilityToggle={handleDriverVisibilityToggle}
                onTaskDrop={handleTaskDrop}
                showDriverHours={showDriverHours}
                onToggleDriverHours={setShowDriverHours}
                calendarViewMode={viewMode}
                onCalendarViewModeChange={setViewMode}
                driverCapacities={driverCapacities}
              />
            ) : (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks scheduled for this period</p>
                </div>
              </Card>
            )}
      </div>

      {/* Unified Tasks Table - Includes All Tasks and Unassigned */}
      <div className="mt-6">
        <UnifiedTasksTable
          tasks={allTasks}
          drivers={drivers}
          viewMode={viewType}
          selectedDate={selectedDate}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onAssignTask={handleAssignTask}
        />
      </div>

      {/* Task Creation/Edit Sheet */}
      <TaskCreationSheet
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        onSave={handleTaskCreate}
        selectedDriverId={sheetDriverId}
        selectedDate={sheetDate}
        drivers={drivers}
        isLoading={isLoading}
        editingTask={editingTask}
      />

      {/* Conflict Detection Modal */}
      <ConflictDetectionModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        task={conflictTask}
        driverConflicts={conflicts}
        onResolve={handleConflictResolve}
      />

    </div>
    </GoogleMapsProvider>
  );
}

