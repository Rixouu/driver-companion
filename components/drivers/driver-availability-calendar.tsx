"use client"

import { useState, useEffect, useMemo } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, 
  addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, 
  isWithinInterval, parseISO, isValid } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, 
  Car, Clock, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils/styles"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useI18n } from "@/lib/i18n/context"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { DriverAvailabilityForm } from "./driver-availability-form"
import { getDriverAvailability } from "@/lib/services/driver-availability"
import { getDriverBookings } from "@/app/actions/bookings"
import type { DriverAvailability, Driver } from "@/types/drivers"
import type { Booking } from "@/types/bookings"

// View types
type CalendarView = "day" | "week" | "month"

// Helper to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400";
    case "unavailable":
      return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400";
    case "leave":
      return "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400";
    case "training":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400";
    case "booking":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 font-medium";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300";
  }
};

interface DriverAvailabilityCalendarProps {
  driver: Driver
}

export function DriverAvailabilityCalendar({ driver }: DriverAvailabilityCalendarProps) {
  const { toast } = useToast()
  const { t } = useI18n()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>("month")
  const [availabilityRecords, setAvailabilityRecords] = useState<DriverAvailability[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  // Calculate date range based on view
  const dateRange = useMemo(() => {
    switch (view) {
      case "day":
        return { start: currentDate, end: currentDate };
      case "week":
        return { 
          start: startOfWeek(currentDate, { weekStartsOn: 0 }), 
          end: endOfWeek(currentDate, { weekStartsOn: 0 }) 
        };
      case "month":
      default:
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
  }, [currentDate, view]);
  
  // Get days in current view
  const daysInView = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);
  
  // Fetch availability and booking data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log('[Calendar] Fetching availability and bookings for driver', driver.id, 'range', dateRange);
      // Fetch availability data
      const availabilityData = await getDriverAvailability(driver.id);
      console.log('[Calendar] Availability records', availabilityData);
      setAvailabilityRecords(availabilityData);
      
      // Format date range for bookings query
      const startDate = format(dateRange.start, "yyyy-MM-dd");
      const endDate = format(dateRange.end, "yyyy-MM-dd");
      console.log('[Calendar] Fetching bookings between', startDate, 'and', endDate);
      // Fetch bookings for this driver within the date range
      const { bookings: driverBookings, error: bookingErr } = await getDriverBookings(driver.id, {
        upcoming: true,
        limit: 30
      });
      if (bookingErr) {
        console.error('[Calendar] Error fetching bookings', bookingErr);
      }
      console.log('[Calendar] Bookings fetched', driverBookings);
      setBookings(driverBookings || []);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast({
        title: "Error",
        description: "Failed to load calendar data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    
    const handleDataRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.driverId === driver.id) {
        fetchData();
      }
    };
    document.addEventListener('refresh-driver-data', handleDataRefresh);
    
    return () => {
      document.removeEventListener('refresh-driver-data', handleDataRefresh);
    };
  }, [driver.id, dateRange.start, dateRange.end]);
  
  // Navigation functions
  const goToToday = () => setCurrentDate(new Date());
  
  const goToPrevious = () => {
    switch (view) {
      case "day":
        setCurrentDate(prevDate => addDays(prevDate, -1));
        break;
      case "week":
        setCurrentDate(prevDate => subWeeks(prevDate, 1));
        break;
      case "month":
        setCurrentDate(prevDate => subMonths(prevDate, 1));
        break;
    }
  };
  
  const goToNext = () => {
    switch (view) {
      case "day":
        setCurrentDate(prevDate => addDays(prevDate, 1));
        break;
      case "week":
        setCurrentDate(prevDate => addWeeks(prevDate, 1));
        break;
      case "month":
        setCurrentDate(prevDate => addMonths(prevDate, 1));
        break;
    }
  };
  
  // Check if a date has availability
  const getAvailabilityForDate = (date: Date) => {
    return availabilityRecords.find(record => {
      if (!record.start_date || !record.end_date) return false;
      
      try {
        const startDate = parseISO(record.start_date);
        const endDate = parseISO(record.end_date);
        
        if (!isValid(startDate) || !isValid(endDate)) return false;
        
        return isWithinInterval(date, { start: startDate, end: endDate });
      } catch (error) {
        return false;
      }
    });
  };
  
  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    return bookings.filter(booking => booking.date === formattedDate);
  };
  
  // Handle adding new availability
  const handleAddAvailability = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedDate(null);
  };
  
  // Handle successful form submission
  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    fetchData();
  };
  
  // Format view title based on current view and date
  const viewTitle = useMemo(() => {
    switch (view) {
      case "day":
        return format(currentDate, "MMMM d, yyyy");
      case "week":
        return `${format(dateRange.start, "MMM d")} - ${format(dateRange.end, "MMM d, yyyy")}`;
      case "month":
      default:
        return format(currentDate, "MMMM yyyy");
    }
  }, [currentDate, view, dateRange]);
  
  // Calculate grid columns based on view
  const gridCols = view === "day" ? "grid-cols-1" : "grid-cols-7";
  
  // Handle view change
  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
        <CardTitle className="text-lg sm:text-xl">{t("drivers.availability.calendar")}</CardTitle>
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
          <Button variant="outline" size="sm" onClick={goToToday} className="h-8 w-auto">
            {t("common.today", { defaultValue: "Today" })}
          </Button>
          
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={goToPrevious} className="h-8 w-8 sm:h-9 sm:w-9 rounded-r-none">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium text-sm sm:text-base px-2 min-w-[120px] text-center">
              {viewTitle}
            </div>
            <Button variant="outline" size="icon" onClick={goToNext} className="h-8 w-8 sm:h-9 sm:w-9 rounded-l-none">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {view === "month" 
                  ? t("common.month", { defaultValue: "Month" }) 
                  : view === "week" 
                    ? t("common.week", { defaultValue: "Week" }) 
                    : t("common.day", { defaultValue: "Day" })}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewChange("day")}>
                {t("common.day", { defaultValue: "Day" })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewChange("week")}>
                {t("common.week", { defaultValue: "Week" })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewChange("month")}>
                {t("common.month", { defaultValue: "Month" })}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">{t("drivers.availability.loading", { defaultValue: "Loading..." })}</div>
        ) : (
          <>
            {/* Weekday Headers - only for week and month views */}
            {view !== "day" && (
              <div className={`grid ${gridCols} gap-1 text-center text-xs sm:text-sm font-medium text-muted-foreground mb-2`}>
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <div key={index} className="py-1">
                    {day}
                  </div>
                ))}
              </div>
            )}
            
            {/* Calendar Grid */}
            <div className={`grid ${gridCols} gap-1`}>
              {daysInView.map((day, i) => {
                const availability = getAvailabilityForDate(day);
                const dayBookings = getBookingsForDate(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[80px] sm:min-h-[100px] p-1 border rounded-md transition-colors relative flex flex-col gap-1",
                      !isCurrentMonth && view === "month" && "opacity-50 bg-muted/30",
                      isToday && "border-primary",
                      "hover:bg-accent/50"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div
                        className={cn(
                          "text-xs sm:text-sm font-medium flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full",
                          isToday && "bg-primary text-primary-foreground",
                          !isCurrentMonth && view === "month" && "text-muted-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 sm:h-6 sm:w-6"
                            onClick={() => handleAddAvailability(day)}
                          >
                            <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                    
                    {/* Display availability status */}
                    {availability && (
                      <Badge 
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1 py-0.5 h-auto leading-tight justify-center truncate", 
                          getStatusColor(availability.status)
                        )}
                      >
                        {(availability.status as any) === 'booking' 
                          ? 'Booking'
                          : t(`drivers.availability.statuses.${availability.status}`, { defaultValue: availability.status })}
                      </Badge>
                    )}
                    
                    {/* Display bookings */}
                    {dayBookings.map((booking, idx) => (
                      <Badge 
                        key={`booking-${booking.id || idx}`}
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1 py-0.5 h-auto leading-tight justify-start truncate flex gap-1 items-center", 
                          getStatusColor("booking")
                        )}
                      >
                        <Clock className="h-2 w-2 flex-shrink-0" />
                        <span className="truncate">{booking.time && booking.time.substring(0, 5)}</span>
                      </Badge>
                    ))}
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-4">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusColor("available"))}>
                {t("drivers.availability.statuses.available")}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusColor("unavailable"))}>
                {t("drivers.availability.statuses.unavailable")}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusColor("leave"))}>
                {t("drivers.availability.statuses.leave")}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusColor("training"))}>
                {t("drivers.availability.statuses.training")}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusColor("booking"))}>Booking</Badge>
            </div>
          </>
        )}
      </CardContent>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? (
                t("drivers.availability.setAvailabilityFor", { 
                  date: format(selectedDate, "PP"),
                  defaultValue: `Set Availability for ${format(selectedDate, "PP")}`
                })
              ) : (
                t("drivers.availability.setAvailability", { 
                  defaultValue: "Set Availability" 
                })
              )}
            </DialogTitle>
          </DialogHeader>
          <DriverAvailabilityForm
            driverId={driver.id}
            initialData={{
              driver_id: driver.id,
              start_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
              end_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
              status: "available",
              id: "",
              created_at: "",
              updated_at: "",
              notes: ""
            }}
            onSuccess={handleFormSuccess}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
} 