"use client";

import { useState, useCallback } from "react";
import { format, parseISO, startOfWeek, addDays, isSameDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DispatchEntryWithRelations, DispatchStatus } from "@/types/dispatch";
import { CalendarIcon, ClockIcon, UserIcon, CarIcon, MapPinIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn, getDispatchStatusBadgeClasses, getDispatchStatusBorderColor } from "@/lib/utils/styles";
import { useRouter } from "next/navigation";
import SidePanelDetails from "./side-panel-details";

interface DispatchTimetableProps {
  entries: DispatchEntryWithRelations[];
  onStatusChange?: (entryId: string, newStatus: DispatchStatus) => void;
}


function TimetableCard({ 
  entry, 
  onClick,
  onStatusChange
}: { 
  entry: DispatchEntryWithRelations; 
  onClick: () => void;
  onStatusChange?: (entryId: string, newStatus: DispatchStatus) => void;
}) {
  // Safely format the time, handling invalid dates
  const formattedTime = (() => {
    try {
      if (!entry.start_time) {
        // For pending entries without start_time, try to get from booking
        if (entry.booking?.date && entry.booking?.time) {
          return entry.booking.time;
        }
        return "TBD";
      }
      
      const parsedDate = parseISO(entry.start_time);
      if (isNaN(parsedDate.getTime())) {
        // Invalid date, try to get from booking
        if (entry.booking?.date && entry.booking?.time) {
          return entry.booking.time;
        }
        return "TBD";
      }
      
      return format(parsedDate, "HH:mm");
    } catch (error) {
      // Fallback to booking time or TBD
      if (entry.booking?.time) {
        return entry.booking.time;
      }
      return "TBD";
    }
  })();

  const router = useRouter();
  const isAssigned = entry.driver_id && entry.vehicle_id;
  
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/bookings/${entry.booking.id}`);
  };

  const handleEditBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/bookings/${entry.booking.id}/edit`);
  };

  // Calculate position based on time
  const getTimePosition = () => {
    try {
      if (entry.booking?.time) {
        const [hours, minutes] = entry.booking.time.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        const topPosition = (totalMinutes / 60) * 48; // 48px per hour
        return Math.max(0, topPosition);
      }
    } catch (error) {
      console.warn('Error calculating time position:', error);
    }
    return 0;
  };

  const timePosition = getTimePosition();
  
  return (
    <div
      className={cn(
        "absolute left-1 right-1 rounded-md cursor-pointer transition-all duration-200 hover:shadow-md",
        "border-l-4 h-12",
        getDispatchStatusBorderColor(entry.status),
        "bg-card hover:bg-muted/50 border border-border/50"
      )}
      style={{ top: `${timePosition}px` }}
      onClick={onClick}
    >
      <div className="p-2 h-full flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-foreground truncate mb-1">
            #{entry.booking.wp_id || entry.booking.id.substring(0, 8)}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {entry.booking.service_name || "Service"}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleViewDetails}
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/50 ml-2 flex-shrink-0"
          title="View Details"
        >
          <EyeIcon className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function DispatchTimetable({ 
  entries,
  onStatusChange
}: DispatchTimetableProps) {
  const { t } = useI18n();
  const [selectedEntry, setSelectedEntry] = useState<DispatchEntryWithRelations | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Week navigation state
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    return startOfWeekDate;
  });

  // Generate week days for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(currentWeek, i);
    return day;
  });

  const handleCardClick = useCallback((entry: DispatchEntryWithRelations) => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
  }, []);

  // Week navigation functions
  const goToPreviousWeek = useCallback(() => {
    setCurrentWeek(prev => addDays(prev, -7));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentWeek(prev => addDays(prev, 7));
  }, []);

  const goToCurrentWeek = useCallback(() => {
    const now = new Date();
    const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 });
    setCurrentWeek(startOfWeekDate);
  }, []);

  // Filter entries based on current week
  const filteredEntries = entries.filter(entry => {
    if (!entry.booking?.date) return false;
    const bookingDate = new Date(entry.booking.date);
    const weekStart = currentWeek;
    const weekEnd = addDays(currentWeek, 6);
    
    return bookingDate >= weekStart && bookingDate <= weekEnd;
  });

  return (
    <>
      {/* Week Navigation - Responsive for Mobile/Tablet/Desktop */}
      <div className="mb-6">
        {/* Mobile: Stack everything vertically */}
        <div className="flex flex-col lg:hidden space-y-4">
          {/* Title and Date - Stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h2 className="text-lg font-semibold">Dispatch Timetable</h2>
            <div className="text-sm text-muted-foreground">
              Week of {format(currentWeek, "MMM dd, yyyy")}
            </div>
          </div>
          
          {/* Navigation Buttons - Responsive layout */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                className="gap-2 flex-1 sm:flex-none"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Previous Week</span>
                <span className="sm:hidden">Prev</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentWeek}
                className="gap-2 flex-1 sm:flex-none"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">This Week</span>
                <span className="sm:hidden">This</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
                className="gap-2 flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Next Week</span>
                <span className="sm:hidden">Next</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop: Everything in one row */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Dispatch Timetable</h2>
            <div className="text-sm text-muted-foreground">
              Week of {format(currentWeek, "MMM dd, yyyy")}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="gap-2"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentWeek}
              className="gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="gap-2"
            >
              Next Week
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timetable */}
      <div className="border rounded-lg overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-8 bg-muted/50 border-b">
          <div className="p-3 text-sm font-medium text-muted-foreground border-r">
            Time
          </div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-3 text-center border-r last:border-r-0">
              <div className="text-sm font-medium text-foreground">
                {format(day, "EEE")}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(day, "MMM dd")}
              </div>
            </div>
          ))}
        </div>

        {/* Timetable Body */}
        <div className="grid grid-cols-8 min-h-[600px]">
          {/* Time Column */}
          <div className="border-r bg-muted/20">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="h-12 border-b border-border/20 flex items-center justify-center text-xs text-muted-foreground">
                {i % 2 === 0 && `${i.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="border-r last:border-r-0 relative">
              {/* Find bookings for this day */}
              {filteredEntries
                .filter(entry => {
                  if (!entry.booking?.date) return false;
                  const bookingDate = new Date(entry.booking.date);
                  return isSameDay(bookingDate, day);
                })
                .map((entry, entryIndex) => (
                  <TimetableCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => handleCardClick(entry)}
                    onStatusChange={onStatusChange}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Booking Details Side Panel */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
          </SheetHeader>
          {selectedEntry && (
            <div className="mt-6">
              <SidePanelDetails
                entry={selectedEntry}
                onUnassign={() => {}}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
