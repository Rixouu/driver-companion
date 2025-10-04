"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { CrewTaskCalendarGrid } from "@/components/shifts/crew-task-calendar-grid";
import { ShiftFilters } from "@/components/shifts/shift-filters";
import { ShiftStatistics } from "@/components/shifts/shift-statistics";
import { UnassignedBookings } from "@/components/shifts/unassigned-bookings";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ShiftTabsList } from "@/components/shifts/shift-tabs-list";
import { useCrewTasks } from "@/lib/hooks/use-crew-tasks";
import { CrewTask, CreateCrewTaskRequest } from "@/types/crew-tasks";
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CalendarDays } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { TaskAssignmentModal } from "@/components/shifts/task-assignment-modal";
import { createClient } from "@/lib/supabase";

type ViewType = "week" | "2weeks" | "month";

export default function ShiftsPage() {
  const { t } = useI18n();
  const [viewType, setViewType] = useState<ViewType>("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("schedule");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDriverId, setModalDriverId] = useState<string | undefined>();
  const [modalDate, setModalDate] = useState<string | undefined>();
  const [modalTaskNumber, setModalTaskNumber] = useState<number | undefined>();
  const [drivers, setDrivers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([]);

  // Calculate date range based on view type
  const getDateRange = () => {
    const date = selectedDate;
    
    switch (viewType) {
      case "week":
        return {
          start: format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          end: format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      case "2weeks":
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        return {
          start: format(weekStart, "yyyy-MM-dd"),
          end: format(addDays(weekStart, 13), "yyyy-MM-dd"),
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

  // Fetch crew task schedule data
  const { data, meta, isLoading, error, refetch, createTask } = useCrewTasks({
    startDate: dateRange.start,
    endDate: dateRange.end,
    driverIds: selectedDriverIds.length > 0 ? selectedDriverIds : undefined,
    autoRefetch: true,
    refetchInterval: 120000, // 2 minutes
  });

  // Load drivers for modal
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("drivers")
          .select("id, first_name, last_name")
          .order("first_name");
        
        if (error) {
          console.error("Error loading drivers:", error);
        } else {
          setDrivers(data || []);
        }
      } catch (err) {
        console.error("Error loading drivers:", err);
      }
    };
    
    loadDrivers();
  }, []);

  const handleTaskClick = (task: CrewTask) => {
    // If task is linked to booking, navigate to booking details
    if (task.booking_id) {
      window.location.href = `/bookings/${task.booking_id}`;
    } else {
      // Otherwise, open task details modal (TODO: implement)
      console.log("Task clicked:", task);
    }
  };

  const handleCellClick = (driverId: string, date: string) => {
    // Open task creation modal
    setModalDriverId(driverId);
    setModalDate(date);
    setModalTaskNumber(undefined); // Let user choose
    setIsModalOpen(true);
  };

  const handleTaskCreate = async (task: CreateCrewTaskRequest) => {
    try {
      await createTask(task);
      // Modal will close automatically on success
    } catch (error) {
      console.error("Error creating task:", error);
      // Error handling is done in the modal
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalDriverId(undefined);
    setModalDate(undefined);
    setModalTaskNumber(undefined);
  };

  const handleDriverClick = (driverId: string) => {
    // Navigate to driver details
    window.location.href = `/drivers/${driverId}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <PageHeader
        title={t('shifts.title')}
        description={t('shifts.description')}
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(new Date(dateRange.start), "MMM d")} - {format(new Date(dateRange.end), "MMM d, yyyy")}
          </span>
        </div>
      </PageHeader>

      {/* Filters */}
      <ShiftFilters
        viewType={viewType}
        onViewTypeChange={setViewType}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedDriverIds={selectedDriverIds}
        onDriverIdsChange={setSelectedDriverIds}
        onRefresh={refetch}
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ShiftTabsList value={activeTab} onValueChange={setActiveTab} />
        
        <div className="mt-8">
          {/* Schedule Tab */}
          <TabsContent value="schedule">
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
            ) : data ? (
            <CrewTaskCalendarGrid
              schedule={data}
              dates={dates}
              onTaskClick={handleTaskClick}
              onCellClick={handleCellClick}
              onDriverClick={handleDriverClick}
            />
          ) : (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('shifts.booking.noBookings')}</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Unassigned Bookings Tab */}
          <TabsContent value="unassigned">
            <UnassignedBookings
              startDate={dateRange.start}
              endDate={dateRange.end}
              onAssign={(bookingId, driverId) => {
                // Handle assignment
                console.log("Assign booking:", bookingId, "to driver:", driverId);
                refetch();
              }}
            />
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            <ShiftStatistics
              startDate={dateRange.start}
              endDate={dateRange.end}
              driverIds={selectedDriverIds}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Task Assignment Modal */}
      <TaskAssignmentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleTaskCreate}
        selectedDriverId={modalDriverId}
        selectedDate={modalDate}
        selectedTaskNumber={modalTaskNumber}
        drivers={drivers}
        isLoading={isLoading}
      />
    </div>
  );
}

