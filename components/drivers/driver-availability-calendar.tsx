"use client"

import { useState, useEffect, useMemo } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, 
  addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, 
  isWithinInterval, parseISO, isValid } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, 
  Car, Clock, ChevronDown, CalendarDays } from "lucide-react"
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
import { getStatusBadgeClasses } from "@/lib/utils/styles"
import { Calendar } from "react-big-calendar"

// View types
type CalendarView = "day" | "week" | "month"

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
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [showPastBookings, setShowPastBookings] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  
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
      // Fetch all bookings for this driver (not just upcoming)
      const { bookings: driverBookings, error: bookingErr } = await getDriverBookings(driver.id, {
        upcoming: undefined, // Get all bookings
        limit: 1000 // Get more bookings to show full history
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
  
  // Get filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Filter by search term
      if (searchTerm && !booking.service_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by status
      if (statusFilter && booking.status !== statusFilter) {
        return false;
      }
      
      return true;
    });
  }, [bookings, searchTerm, statusFilter]);
  
  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return filteredBookings.filter(booking => {
      // Only show bookings that match the exact date
      if (booking.date !== formattedDate) return false;
      
      // For past dates, only show if showPastBookings is true
      if (date < today && !showPastBookings) return false;
      
      return true;
    });
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

  // Handle booking click to show details
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsBookingDialogOpen(true);
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
            <CardHeader className="flex flex-col gap-4 pb-4">
        {/* Row 1: Title and Stats */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold tracking-tight">Availability Calendar</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Car className="h-4 w-4" />
                {filteredBookings.length} of {bookings.length} Bookings
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {availabilityRecords.length} Availability Records
              </span>
            </div>
          </div>
          
          {/* Calendar Navigation - Desktop Only */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="h-9">
              {t("common.today", { defaultValue: "Today" })}
            </Button>
            
            <Button 
              variant={showPastBookings ? "default" : "outline"} 
              size="sm" 
              onClick={() => setShowPastBookings(!showPastBookings)}
              className="h-9"
            >
              {showPastBookings ? "Hide Past" : "Show Past"}
            </Button>
          </div>
        </div>
        
        {/* Row 2: Mobile Action Buttons */}
        <div className="flex lg:hidden gap-2 w-full">
          <Button variant="outline" size="sm" onClick={goToToday} className="h-9 flex-1">
            {t("common.today", { defaultValue: "Today" })}
          </Button>
          
          <Button 
            variant={showPastBookings ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowPastBookings(!showPastBookings)}
            className="h-9 flex-1"
          >
            {showPastBookings ? "Hide Past" : "Show Past"}
          </Button>
        </div>
        
        {/* Row 3: Search - Full Width */}
        <div className="w-full">
          <input
            type="text"
            placeholder="Search services..."
            className="px-3 py-2 text-sm border rounded-md bg-background w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Row 4: Status Filter - Full Width */}
        <div className="w-full">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md bg-background w-full"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        
        {/* Row 5: Calendar Navigation and View - Full Width */}
        <div className="flex items-center gap-2 w-full">
          <Button variant="outline" size="icon" onClick={goToPrevious} className="h-8 w-8 sm:h-9 sm:w-9 rounded-r-none">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium text-xs sm:text-sm lg:text-base px-1 sm:px-2 min-w-[80px] sm:min-w-[120px] text-center flex-1">
            {viewTitle}
          </div>
          <Button variant="outline" size="icon" onClick={goToNext} className="h-8 w-8 sm:h-9 sm:w-9 rounded-l-none">
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-full">
                <span className="hidden sm:inline">
                  {view === "month" 
                    ? t("common.month", { defaultValue: "Month" }) 
                    : view === "week" 
                      ? t("common.week", { defaultValue: "Week" }) 
                      : t("common.day", { defaultValue: "Day" })}
                </span>
                <span className="sm:hidden">
                  {view === "month" ? "M" : view === "week" ? "W" : "D"}
                </span>
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
                  <div key={index} className="py-1 px-1">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Calendar Grid */}
            <div className={`grid ${gridCols} gap-1 sm:gap-2`}>
              {daysInView.map((day, i) => {
                const availability = getAvailabilityForDate(day);
                const dayBookings = getBookingsForDate(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] p-1 sm:p-2 border rounded-md transition-colors relative flex flex-col gap-1",
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
                          getStatusBadgeClasses(availability.status)
                        )}
                      >
                        {(availability.status as any) === 'booking' 
                          ? 'Booking'
                          : t(`drivers.availability.statuses.${availability.status}`, { defaultValue: availability.status })}
                      </Badge>
                    )}
                    
                    {/* Display bookings */}
                    {dayBookings.map((booking, idx) => (
                      <div 
                        key={`booking-${booking.id || idx}`}
                        className={cn(
                          "text-[10px] px-1.5 py-1 h-auto leading-tight justify-start truncate flex flex-col gap-0.5 rounded cursor-pointer transition-colors",
                          "min-h-[20px]",
                          // Use the existing purple badge styling that works with dark mode
                          "bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200",
                          "hover:bg-purple-200 dark:hover:bg-purple-800/50"
                        )}
                        title={`${booking.service_name || 'Service'} - ${booking.time || 'No time'} - ${booking.status || 'Unknown status'}`}
                        onClick={() => handleBookingClick(booking)}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="h-2 w-2 flex-shrink-0" />
                          <span className="truncate font-medium">
                            {booking.time ? booking.time.substring(0, 5) : 'TBD'}
                          </span>
                        </div>
                        <div className="truncate text-[9px] leading-tight">
                          {booking.service_name || 'Service'}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-4">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusBadgeClasses("available"))}>
                {t("drivers.availability.statuses.available")}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusBadgeClasses("unavailable"))}>
                {t("drivers.availability.statuses.unavailable")}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusBadgeClasses("leave"))}>
                {t("drivers.availability.statuses.leave")}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusBadgeClasses("training"))}>
                {t("drivers.availability.statuses.training")}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0.5 h-auto", getStatusBadgeClasses("booking"))}>Booking</Badge>
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

      {/* Booking Details Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5 text-purple-600" />
              Booking Details
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Service Information Group */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Service Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Service</span>
                    <p className="text-sm font-medium mt-1">{selectedBooking.service_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Date</span>
                      <p className="text-sm font-medium mt-1">{format(new Date(selectedBooking.date), "MMM d, yyyy")}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Time</span>
                      <p className="text-sm font-medium mt-1">{selectedBooking.time ? selectedBooking.time.substring(0, 5) : 'TBD'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Status</span>
                    <div className="mt-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200"
                      >
                        {selectedBooking.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Customer Information Group */}
              {selectedBooking.customer_name && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Customer Information
                  </h3>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Customer Name</span>
                    <p className="text-sm font-medium mt-1">{selectedBooking.customer_name}</p>
                  </div>
                </div>
              )}
              
              {/* Notes Group */}
              {selectedBooking.notes && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Additional Notes
                  </h3>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm leading-relaxed">{selectedBooking.notes}</p>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsBookingDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  size="sm"
                  onClick={() => {
                    setIsBookingDialogOpen(false);
                    window.open(`/bookings/${selectedBooking.id}`, '_blank');
                  }}
                >
                  View Full Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
} 