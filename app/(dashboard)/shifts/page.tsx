"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ShiftCalendarGrid } from "@/components/shifts/shift-calendar-grid";
import { ShiftFilters } from "@/components/shifts/shift-filters";
import { ShiftStatistics } from "@/components/shifts/shift-statistics";
import { UnassignedBookings } from "@/components/shifts/unassigned-bookings";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useShiftSchedule } from "@/lib/hooks/use-shift-schedule";
import { ShiftBooking } from "@/types/shifts";
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CalendarDays } from "lucide-react";

type ViewType = "week" | "2weeks" | "month";

export default function ShiftsPage() {
  const [viewType, setViewType] = useState<ViewType>("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);

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

  // Fetch shift schedule data
  const { data, meta, isLoading, error, refetch } = useShiftSchedule({
    startDate: dateRange.start,
    endDate: dateRange.end,
    driverIds: selectedDriverIds.length > 0 ? selectedDriverIds : undefined,
    autoRefetch: true,
    refetchInterval: 120000, // 2 minutes
  });

  const handleBookingClick = (booking: ShiftBooking) => {
    // Navigate to booking details
    window.location.href = `/bookings/${booking.booking_id}`;
  };

  const handleDriverClick = (driverId: string) => {
    // Navigate to driver details or open modal
    console.log("Driver clicked:", driverId);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <PageHeader
        title="Driver Shift Schedule"
        description="Manage driver shifts, view assignments, and optimize scheduling"
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
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load shift schedule: {error.message}
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
            <ShiftCalendarGrid
              schedule={data}
              onBookingClick={handleBookingClick}
              onDriverClick={handleDriverClick}
            />
          ) : (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No shift data available for the selected period</p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Unassigned Bookings Tab */}
        <TabsContent value="unassigned" className="mt-6">
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
        <TabsContent value="statistics" className="mt-6">
          <ShiftStatistics
            startDate={dateRange.start}
            endDate={dateRange.end}
            driverIds={selectedDriverIds}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

