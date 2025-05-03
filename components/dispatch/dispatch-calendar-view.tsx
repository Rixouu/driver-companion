"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, User, Calendar as CalendarComponent, ChevronLeft, ChevronRight, Car, XIcon, LayoutGrid } from "lucide-react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, addDays, startOfWeek, endOfWeek, isSameMonth, addHours, startOfDay, isBefore, isEqual, isAfter } from "date-fns";
import { useI18n } from "@/lib/i18n/context";
import { Calendar } from "@/components/ui/calendar";
import { DispatchEntry, DispatchEntryWithRelations } from "@/types/dispatch";
import { cn } from "@/lib/utils/styles";

interface DispatchCalendarViewProps {
  entries: DispatchEntryWithRelations[];
  currentDate?: Date;
  setCurrentDate?: React.Dispatch<React.SetStateAction<Date>>;
}

type CalendarViewMode = "month" | "week" | "day";

export default function DispatchCalendarView({ entries, currentDate: externalCurrentDate, setCurrentDate: externalSetCurrentDate }: DispatchCalendarViewProps) {
  const { t } = useI18n();
  const [internalCurrentDate, setInternalCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(externalCurrentDate || new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [showDetailsPanel, setShowDetailsPanel] = useState<boolean>(false);
  
  // Use external or internal state for current date
  const currentDate = externalCurrentDate || internalCurrentDate;
  const setCurrentDate = externalSetCurrentDate || setInternalCurrentDate;
  
  // Update selected date when external current date changes
  useEffect(() => {
    if (externalCurrentDate) {
      setSelectedDate(externalCurrentDate);
    }
  }, [externalCurrentDate]);
  
  // Get all dates with entries
  const datesWithEntries = entries.map(entry => {
    return parseISO(entry.start_time);
  });
  
  // Create a Set of date strings for more efficient lookup
  const datesWithEntriesSet = new Set(
    datesWithEntries.map(date => date.toISOString().split('T')[0])
  );
  
  // Custom day render function for the calendar
  const renderCalendarDay = (props: any) => {
    const { date, selected, disabled, today, onClick } = props;
    const dateString = date.toISOString().split('T')[0];
    const hasBookings = datesWithEntriesSet.has(dateString);
    const isCurrentMonth = isSameMonth(date, currentDate);
    
    return (
      <button
        onClick={() => {
          onClick?.();
          setSelectedDate(date);
        }}
        disabled={disabled}
        type="button"
        className={cn(
          "h-full w-full rounded-none flex items-center justify-center relative p-0",
          !isCurrentMonth && "text-muted-foreground/50",
          selected && "bg-primary/90 text-primary-foreground font-medium",
          today && !selected && "border-primary/50 border",
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
        )}
      >
        <time dateTime={format(date, 'yyyy-MM-dd')} className="text-base">
          {date.getDate()}
        </time>
        {hasBookings && !selected && (
          <div 
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" 
            aria-hidden="true"
          />
        )}
      </button>
    );
  };
  
  // Filter entries for the selected date
  const entriesForSelectedDate = entries.filter(entry => {
    const entryDate = parseISO(entry.start_time);
    return isSameDay(entryDate, selectedDate);
  });

  // Group entries by status
  const groupedEntries = entriesForSelectedDate.reduce((groups, entry) => {
    const status = entry.status;
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(entry);
    return groups;
  }, {} as Record<string, DispatchEntryWithRelations[]>);
  
  // Get status badge color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "assigned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_transit":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  // Navigation functions
  const navigatePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, -1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const navigateNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Filter entries happening in the current time range for the timeline view
  const getTimelineEntries = () => {
    if (viewMode === "day") {
      return entriesForSelectedDate;
    }

    // For week view, get all entries within the current week
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    
    const timelineEntries = entries.filter(entry => {
      const entryDate = parseISO(entry.start_time);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
    
    // Sort entries by time
    return timelineEntries.sort((a, b) => {
      return parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime();
    });
  };

  const renderTimelineEvents = (timelineEntries: DispatchEntryWithRelations[]) => {
    // For day view, render in hourly slots
    if (viewMode === "day") {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      
      return (
        <div className="w-full h-full flex flex-col">
          {/* Day header */}
          <div className="p-3 border-b sticky top-0 z-10 bg-background flex items-center justify-between">
            <div className="font-medium flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <Badge variant="outline" className="font-normal">
              {timelineEntries.length} bookings
            </Badge>
          </div>
          
          {/* Time slots */}
          <div className="flex-1 overflow-y-auto">
            {hours.map(hour => {
              const hourStart = addHours(startOfDay(selectedDate), hour);
              const hourEnd = addHours(startOfDay(selectedDate), hour + 1);
              
              const hourEntries = timelineEntries.filter(entry => {
                const entryTime = parseISO(entry.start_time);
                return (
                  (isEqual(entryTime, hourStart) || isAfter(entryTime, hourStart)) && 
                  isBefore(entryTime, hourEnd)
                );
              });
              
              const isBusinessHour = hour >= 8 && hour <= 18;
              
              return (
                <div 
                  key={hour} 
                  className={`flex border-b ${
                    isBusinessHour ? 'bg-blue-50/30 dark:bg-blue-950/10' : 
                    'bg-muted/10'
                  }`}
                >
                  <div className="w-20 p-2 border-r bg-muted/20 text-sm flex items-center justify-center sticky left-0">
                    {format(hourStart, "h:mm a")}
                  </div>
                  <div className="flex-1 min-h-[80px] p-1 relative">
                    {hourEntries.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                        {isBusinessHour ? "" : "Off hours"}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-1">
                        {hourEntries.map(entry => (
                          <div 
                            key={entry.id}
                            className={`p-2 text-xs rounded-md shadow-sm border hover:shadow-md transition-shadow ${
                              entry.status === 'completed' ? 'border-green-200 bg-green-50/90 dark:bg-green-950/40' :
                              entry.status === 'cancelled' ? 'border-red-200 bg-red-50/90 dark:bg-red-950/40' :
                              entry.status === 'in_transit' ? 'border-purple-200 bg-purple-50/90 dark:bg-purple-950/40' :
                              entry.status === 'confirmed' ? 'border-green-200 bg-green-50/90 dark:bg-green-950/40' :
                              entry.status === 'assigned' ? 'border-blue-200 bg-blue-50/90 dark:bg-blue-950/40' :
                              'border-yellow-200 bg-yellow-50/90 dark:bg-yellow-950/40'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="font-medium">{format(parseISO(entry.start_time), "h:mm a")}</div>
                              <Badge variant="outline" className="text-[10px] h-4">
                                #{entry.booking?.wp_id || entry.booking_id.substring(0, 8)}
                              </Badge>
                            </div>
                            
                            {/* Simplified booking entry */}
                            <div className="flex items-center gap-1 mt-1.5">
                              <Badge className={`text-[10px] h-4 ${getStatusColor(entry.status)}`}>
                                {entry.status}
                              </Badge>
                              <span className="truncate text-xs">{entry.booking?.customer_name || "Customer"}</span>
                            </div>
                            
                            <div className="flex items-center justify-end mt-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 rounded-sm px-2 text-[10px]"
                                onClick={() => window.location.href = `/bookings/${entry.booking_id}`}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    // For week view, group by day
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    return (
      <div className="w-full h-full grid grid-cols-7 overflow-hidden">
        {/* Day header row */}
        <div className="col-span-7 grid grid-cols-7 border-b sticky top-0 z-10 bg-background">
          {weekDays.map(day => {
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={`header-${day.toString()}`} 
                className={`p-2 text-center border-r last:border-r-0 ${
                  isToday ? 'bg-primary text-primary-foreground font-medium' : 
                  'bg-muted/30'
                }`}
              >
                <div className="font-medium">{format(day, "EEE")}</div>
                <div className={`text-xl ${isToday ? 'text-primary-foreground' : ''}`}>{format(day, "d")}</div>
              </div>
            );
          })}
        </div>
        
        {/* Timeline content */}
        <div className="col-span-7 grid grid-cols-7 overflow-y-auto h-[calc(100%-3rem)]">
          {weekDays.map((day, index) => {
            const dayEntries = timelineEntries.filter(entry => {
              const entryDate = parseISO(entry.start_time);
              return isSameDay(entryDate, day);
            });
            
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isWeekend = index === 0 || index === 6;
            
            return (
              <div 
                key={day.toString()} 
                className={`border-r last:border-r-0 min-h-[600px] ${
                  isToday ? 'bg-blue-50/50 dark:bg-blue-950/20' : 
                  isWeekend ? 'bg-muted/20' :
                  !isCurrentMonth ? 'bg-muted/10' : ''
                }`}
              >
                <div className="p-2 space-y-2 h-full">
                  {dayEntries.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-xs p-4">
                      No bookings
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayEntries.map(entry => {
                        const entryTime = parseISO(entry.start_time);
                        const hour = entryTime.getHours();
                        // Calculate position based on time (approximate)
                        const topPosition = (hour / 24) * 100;
                        
                        return (
                          <div 
                            key={entry.id}
                            className={`p-2 text-xs rounded-md shadow-sm border hover:shadow-md transition-shadow ${
                              entry.status === 'completed' ? 'border-green-200 bg-green-50/90 dark:bg-green-950/40' :
                              entry.status === 'cancelled' ? 'border-red-200 bg-red-50/90 dark:bg-red-950/40' :
                              entry.status === 'in_transit' ? 'border-purple-200 bg-purple-50/90 dark:bg-purple-950/40' :
                              entry.status === 'confirmed' ? 'border-green-200 bg-green-50/90 dark:bg-green-950/40' :
                              entry.status === 'assigned' ? 'border-blue-200 bg-blue-50/90 dark:bg-blue-950/40' :
                              'border-yellow-200 bg-yellow-50/90 dark:bg-yellow-950/40'
                            }`}
                            style={{
                              marginTop: `${topPosition}%`,
                            }}
                          >
                            <div className="font-medium truncate">{format(entryTime, "h:mm a")} - #{entry.booking?.wp_id}</div>
                            <div className="truncate mt-1">{entry.booking?.customer_name}</div>
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{entry.booking?.pickup_location || "No location"}</span>
                            </div>
                            {entry.driver && (
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>Driver: {entry.driver.first_name}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center space-x-2 mb-4 bg-card rounded-md p-2 border">
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as CalendarViewMode)}
          className="bg-background border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="View mode"
        >
          <option value="month">Month</option>
          <option value="week">Week</option>
          <option value="day">Day</option>
        </select>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={navigatePrevious} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={navigateToday} className="h-8 px-2 text-xs sm:text-sm">Today</Button>
          <Button variant="outline" size="icon" onClick={navigateNext} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h2 className="text-sm sm:text-base font-medium flex items-center gap-1 whitespace-nowrap ml-1">
          <CalendarIcon className="h-4 w-4" />
          <span>{format(currentDate, "MMM yyyy")}</span>
        </h2>
        
        <div className="flex-1"></div>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => setShowDetailsPanel(!showDetailsPanel)}
        >
          <span className="sr-only">Toggle details panel</span>
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full flex-1 h-[calc(100vh-13rem)]">
        {/* Left column - Calendar */}
        <div className={cn(
          "h-full overflow-hidden",
          showDetailsPanel ? "lg:col-span-7" : "lg:col-span-12"
        )}>
          <Card className="h-full overflow-hidden border">
            {viewMode === "month" ? (
              <div className="h-full flex flex-col">
                <div className="grid grid-cols-7 text-rose-500 dark:text-rose-400 text-xs sm:text-sm border-b">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                    <div key={day} className="py-2 text-center font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y">
                  {(() => {
                    const monthStart = startOfMonth(currentDate);
                    const monthEnd = endOfMonth(currentDate);
                    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
                    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                    
                    const days = eachDayOfInterval({
                      start: startDate,
                      end: endDate
                    });
                    
                    return days.map((day) => {
                      const isSelected = isSameDay(day, selectedDate);
                      const isToday = isSameDay(day, new Date());
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const dayEntries = entries.filter(entry => {
                        const entryDate = parseISO(entry.start_time);
                        return isSameDay(entryDate, day);
                      });
                      
                      return (
                        <div 
                          key={day.toString()}
                          className={cn(
                            "min-h-[80px] sm:min-h-[90px] relative border-border",
                            isCurrentMonth ? "bg-background" : "bg-muted/20",
                            isSelected && "bg-primary/10"
                          )}
                          onClick={() => setSelectedDate(day)}
                        >
                          <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex items-center justify-center">
                              <span
                                className={cn(
                                  "h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-full text-xs sm:text-sm",
                                  isToday && !isSelected && "border border-primary",
                                  isSelected && "bg-primary text-primary-foreground font-medium",
                                  !isCurrentMonth && "text-muted-foreground"
                                )}
                              >
                                {format(day, "d")}
                              </span>
                              {dayEntries.length > 0 && (
                                <span className="ml-1 text-xs font-medium text-muted-foreground">
                                  ({dayEntries.length})
                                </span>
                              )}
                            </div>
                            
                            {dayEntries.length > 0 && (
                              <div className="absolute top-8 sm:top-11 left-1 sm:left-2 right-1 sm:right-2 bottom-1 overflow-y-auto">
                                <div className="space-y-1">
                                  {dayEntries.slice(0, 3).map((entry) => (
                                    <div 
                                      key={entry.id}
                                      className={cn(
                                        "text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md truncate cursor-pointer border shadow-sm hover:shadow transition-shadow",
                                        entry.status === 'completed' ? 'bg-green-500/10 border-green-200 text-green-700 dark:border-green-800 dark:text-green-300' :
                                        entry.status === 'cancelled' ? 'bg-red-500/10 border-red-200 text-red-700 dark:border-red-800 dark:text-red-300' :
                                        entry.status === 'in_transit' ? 'bg-purple-500/10 border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300' :
                                        entry.status === 'confirmed' ? 'bg-green-500/10 border-green-200 text-green-700 dark:border-green-800 dark:text-green-300' :
                                        'bg-yellow-500/10 border-yellow-200 text-yellow-700 dark:border-yellow-800 dark:text-yellow-300'
                                      )}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDate(day);
                                        setShowDetailsPanel(true);
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-[10px] sm:text-xs">{format(parseISO(entry.start_time), "HH:mm")}</span>
                                        <span className="ml-1 truncate text-[10px] sm:text-xs">{entry.booking?.customer_name || "Booking"}</span>
                                      </div>
                                    </div>
                                  ))}
                                  {dayEntries.length > 3 && (
                                    <div className="text-[10px] sm:text-xs text-muted-foreground px-1.5 pt-1 font-medium">
                                      +{dayEntries.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : viewMode === "week" ? (
              <CardContent className="p-0 h-full overflow-auto">
                {renderTimelineEvents(getTimelineEntries())}
              </CardContent>
            ) : (
              <CardContent className="p-0 h-full overflow-auto">
                {renderTimelineEvents(getTimelineEntries())}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right column - Details panel - Now this works as a modal on mobile */}
        {showDetailsPanel && (
          <div className={cn(
            "lg:col-span-5 h-full overflow-hidden",
            "lg:static lg:z-auto lg:bg-transparent lg:block lg:h-full",
            "fixed inset-0 z-50 bg-background/95 md:relative md:inset-auto md:z-auto md:bg-transparent"
          )}>
            <Card className="h-full overflow-hidden border mx-auto max-w-md lg:max-w-none lg:mx-0">
              <CardHeader className="p-4 pb-3 flex flex-row justify-between items-start sticky top-0 z-10 bg-background border-b">
                <div>
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <CalendarIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {format(selectedDate, "EEE, MMM d, yyyy")}
                  </CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 md:flex lg:flex"
                  onClick={() => setShowDetailsPanel(false)}>
                  <XIcon className="h-4 w-4" />
                  <span className="sr-only">Close panel</span>
                </Button>
              </CardHeader>
              <CardContent className="px-2 pb-4 pt-2 h-[calc(100%-60px)] overflow-auto">
                {entriesForSelectedDate.length === 0 ? (
                  <div className="h-40 flex flex-col gap-2 items-center justify-center text-muted-foreground">
                    <CalendarComponent className="h-8 w-8" />
                    <p>No bookings scheduled for this date</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedEntries).map(([status, statusEntries]) => (
                      <div key={status} className="space-y-3">
                        <div className="pl-2">
                          <Badge className={cn(getStatusColor(status), "py-0.5")}>
                            {t(`dispatch.status.${status}`)} ({statusEntries.length})
                          </Badge>
                        </div>
                        
                        {statusEntries.map((entry) => (
                          <div 
                            key={entry.id} 
                            className={cn(
                              "rounded-md border p-3 hover:shadow-sm transition-shadow",
                              entry.status === 'completed' ? 'border-green-200 dark:border-green-700/50' :
                              entry.status === 'cancelled' ? 'border-red-200 dark:border-red-700/50' :
                              entry.status === 'in_transit' ? 'border-purple-200 dark:border-purple-700/50' :
                              entry.status === 'confirmed' ? 'border-green-200 dark:border-green-700/50' :
                              'border-yellow-200 dark:border-yellow-700/50'
                            )}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium flex items-center">
                                    <span>#{entry.booking?.wp_id || ""}</span>
                                    <span className="ml-2 flex items-center">
                                      <Clock className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                                      <span className="text-sm">{format(parseISO(entry.start_time), "HH:mm")}</span>
                                    </span>
                                  </h4>
                                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                    {entry.booking?.service_name || "Vehicle Service"}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 pt-1 border-t border-muted">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                  {entry.booking?.customer_name?.charAt(0).toUpperCase() || "C"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {entry.booking?.customer_name || "Unknown customer"}
                                  </p>
                                  {entry.booking?.customer_phone && (
                                    <p className="text-xs text-muted-foreground truncate flex items-center">
                                      <a href={`tel:${entry.booking.customer_phone}`} className="flex items-center hover:underline">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a1 1 0 0 1-.88 1 10.97 10.97 0 0 1-2.41-.29 10.97 10.97 0 0 1-3.8-2.4 10.97 10.97 0 0 1-2.4-3.8 10.97 10.97 0 0 1-.29-2.41 1 1 0 0 1 .88-1.02h3a1 1 0 0 1 .98.8 11 11 0 0 0 .6 2.5c.11.28.08.59-.1.83l-1.14 1.14a16 16 0 0 0 3.67 3.67l1.14-1.14c.22-.22.53-.25.82-.14.29.11.97.4 2.5.6a1 1 0 0 1 .8.97z"></path>
                                        </svg>
                                        {entry.booking.customer_phone}
                                      </a>
                                    </p>
                                  )}
                                </div>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Open booking details page
                                    window.location.href = `/bookings/${entry.booking_id}`;
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                  </svg>
                                  Details
                                </Button>
                              </div>
                              
                              {(entry.booking?.pickup_location || entry.booking?.dropoff_location) && (
                                <div className="pt-1 space-y-2 border-t border-muted">
                                  {entry.booking?.pickup_location && (
                                    <div className="flex items-start gap-2 text-sm">
                                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Pickup:</p>
                                        <p className="line-clamp-1">{entry.booking.pickup_location}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {entry.booking?.dropoff_location && (
                                    <div className="flex items-start gap-2 mt-1 text-sm">
                                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                      <div>
                                        <p className="text-xs text-muted-foreground">Dropoff:</p>
                                        <p className="line-clamp-1">{entry.booking.dropoff_location}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="pt-1 border-t border-muted">
                                {entry.status === 'pending' && (
                                  <Button 
                                    size="sm" 
                                    variant="default" 
                                    className="h-9 w-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Navigate to the driver assignment page
                                      window.location.href = `/dispatch/assign-driver?booking_id=${entry.booking_id}`;
                                    }}
                                  >
                                    Assign Driver
                                  </Button>
                                )}
                                
                                {entry.status === 'confirmed' && (
                                  <Button 
                                    size="sm" 
                                    variant="default" 
                                    className="h-9 w-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Logic to start the trip
                                      // Add your implementation here
                                    }}
                                  >
                                    Start Trip
                                  </Button>
                                )}
                                
                                {entry.status === 'in_transit' && (
                                  <Button 
                                    size="sm" 
                                    variant="default" 
                                    className="h-9 w-full"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Logic to complete the trip
                                      // Add your implementation here
                                    }}
                                  >
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 