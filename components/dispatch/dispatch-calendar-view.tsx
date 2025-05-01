"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, User, Calendar as CalendarComponent, ChevronLeft, ChevronRight, Car } from "lucide-react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, addDays, startOfWeek, endOfWeek, isSameMonth, addHours, startOfDay, isBefore, isEqual, isAfter } from "date-fns";
import { useI18n } from "@/lib/i18n/context";
import { Calendar } from "@/components/ui/calendar";
import { DispatchEntry, DispatchEntryWithRelations } from "@/types/dispatch";

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
  
  // Create a function to get badge color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "assigned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
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

  // Get entries happening in the current time range for the timeline view
  const getTimelineEntries = () => {
    if (viewMode === "day") {
      return entriesForSelectedDate;
    }

    // For week view, get all entries within the current week
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    
    return entries.filter(entry => {
      const entryDate = parseISO(entry.start_time);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });
  };

  const renderTimelineEvents = (timelineEntries: DispatchEntryWithRelations[]) => {
    // For day view, render in hourly slots
    if (viewMode === "day") {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      
      return (
        <div className="w-full">
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
            
            return (
              <div key={hour} className={`flex border-b ${hour >= 8 && hour <= 18 ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}>
                <div className="w-20 p-2 border-r bg-muted/20 text-sm flex items-center justify-center">
                  {format(hourStart, "h:mm a")}
                </div>
                <div className="flex-1 min-h-[70px] p-1 relative">
                  {hourEntries.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                      {hour >= 8 && hour <= 18 ? "" : "Off hours"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1 p-1">
                      {hourEntries.map(entry => (
                        <div 
                          key={entry.id}
                          className={`p-2 text-xs rounded shadow-sm border ${
                            entry.status === 'completed' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' :
                            entry.status === 'cancelled' ? 'border-red-200 bg-red-50 dark:bg-red-950/20' :
                            entry.status === 'in_transit' ? 'border-purple-200 bg-purple-50 dark:bg-purple-950/20' :
                            entry.status === 'assigned' ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20' :
                            'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
                          }`}
                        >
                          <div className="font-medium">{format(parseISO(entry.start_time), "h:mm")} - Booking #{entry.booking?.wp_id}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3" />
                            <span className="truncate">{entry.booking?.customer_name || "Unknown customer"}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{entry.booking?.pickup_location || "No location"}</span>
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
      );
    }
    
    // For week view, group by day
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    
    return (
      <div className="w-full grid grid-cols-7 border rounded-md overflow-hidden">
        {weekDays.map(day => {
          const dayEntries = timelineEntries.filter(entry => {
            const entryDate = parseISO(entry.start_time);
            return isSameDay(entryDate, day);
          });
          
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={day.toString()} 
              className={`border-r last:border-r-0 min-h-[120px] ${
                isToday ? 'bg-blue-50/70 dark:bg-blue-950/30' : 
                !isCurrentMonth ? 'bg-muted/20' : ''
              }`}
            >
              <div 
                className={`p-2 text-center border-b ${
                  isToday ? 'bg-primary text-primary-foreground font-medium' : 
                  'bg-muted/50'
                }`}
              >
                {format(day, "EEE d")}
              </div>
              <div className="p-1">
                {dayEntries.length === 0 ? (
                  <div className="h-full min-h-[100px] flex items-center justify-center text-muted-foreground text-xs p-4">
                    No bookings
                  </div>
                ) : (
                  <div className="space-y-1">
                    {dayEntries.slice(0, 5).map(entry => (
                      <div 
                        key={entry.id}
                        className={`p-2 text-xs rounded shadow-sm border ${
                          entry.status === 'completed' ? 'border-green-200 bg-green-50/70 dark:bg-green-950/30' :
                          entry.status === 'cancelled' ? 'border-red-200 bg-red-50/70 dark:bg-red-950/30' :
                          entry.status === 'in_transit' ? 'border-purple-200 bg-purple-50/70 dark:bg-purple-950/30' :
                          entry.status === 'assigned' ? 'border-blue-200 bg-blue-50/70 dark:bg-blue-950/30' :
                          'border-yellow-200 bg-yellow-50/70 dark:bg-yellow-950/30'
                        }`}
                      >
                        <div className="font-medium truncate">{format(parseISO(entry.start_time), "h:mm")} - #{entry.booking?.wp_id}</div>
                        <div className="truncate text-[10px] mt-1">{entry.booking?.customer_name}</div>
                      </div>
                    ))}
                    {dayEntries.length > 5 && (
                      <div className="text-xs text-center py-1 font-medium text-primary">
                        +{dayEntries.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center mb-6">
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={navigateToday}>
            Today
          </Button>
          <h2 className="text-xl font-semibold">
            {viewMode === "month" ? format(currentDate, "MMMM yyyy") : 
             viewMode === "week" ? `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}` :
             format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h2>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button 
            variant={viewMode === "month" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setViewMode("month")}
            className="flex-1 sm:flex-none"
          >
            Month
          </Button>
          <Button 
            variant={viewMode === "week" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setViewMode("week")}
            className="flex-1 sm:flex-none"
          >
            Week
          </Button>
          <Button 
            variant={viewMode === "day" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setViewMode("day")}
            className="flex-1 sm:flex-none"
          >
            Day
          </Button>
        </div>
      </div>

      {viewMode === "month" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full flex-1">
          <div className="col-span-1 lg:col-span-5 xl:col-span-4">
            <Card className="h-full">
              <CardContent className="p-4 flex justify-center items-start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="border-none p-0 w-auto"
                  modifiers={{
                    booked: datesWithEntries,
                  }}
                  modifiersStyles={{
                    booked: { 
                      fontWeight: 'bold',
                      color: 'var(--primary)',
                    },
                  }}
                  month={currentDate}
                  onMonthChange={setCurrentDate}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="col-span-1 lg:col-span-7 xl:col-span-8">
            <Card className="h-full min-h-[400px]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {format(selectedDate, "EEEE, MMMM d, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {Object.keys(groupedEntries).length === 0 ? (
                  <div className="h-48 flex flex-col gap-2 items-center justify-center text-muted-foreground">
                    <CalendarComponent className="h-8 w-8" />
                    <p>No bookings scheduled for this date</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedEntries).map(([status, statusEntries]) => (
                      <div key={status}>
                        <h3 className="text-sm font-semibold mb-2 flex items-center">
                          <Badge className={getStatusColor(status)}>
                            {t(`dispatch.status.${status}`)} ({statusEntries.length})
                          </Badge>
                        </h3>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                          {statusEntries.map((entry) => (
                            <Card key={entry.id} className="overflow-hidden">
                              <CardContent className="p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium">Booking #{entry.booking?.wp_id || entry.booking_id}</h4>
                                    <div className="text-sm text-muted-foreground">
                                      {entry.booking?.service_name || "Vehicle Service"}
                                    </div>
                                  </div>
                                  <Badge className={getStatusColor(entry.status)}>
                                    {t(`dispatch.status.${entry.status}`)}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm">
                                  <div className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                      <div>{format(parseISO(entry.start_time), "h:mm a")}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Duration: {entry.booking?.duration || "60"} min
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-start gap-2">
                                    <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                      <div>{entry.booking?.customer_name || "Unknown customer"}</div>
                                      {entry.booking?.customer_phone && (
                                        <div className="text-xs text-muted-foreground">
                                          {entry.booking.customer_phone}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {entry.driver && (
                                    <div className="flex items-start gap-2">
                                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <div>Driver: {entry.driver.first_name} {entry.driver.last_name}</div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {entry.vehicle && (
                                    <div className="flex items-start gap-2">
                                      <Car className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <div>Vehicle: {entry.vehicle.make} {entry.vehicle.model}</div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {entry.booking?.pickup_location && (
                                    <div className="flex items-start gap-2 col-span-1 sm:col-span-2">
                                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      <div>
                                        <div className="text-xs font-medium text-muted-foreground">Pickup:</div>
                                        <div className="text-sm">{entry.booking.pickup_location}</div>
                                        
                                        {entry.booking.dropoff_location && (
                                          <>
                                            <div className="text-xs font-medium text-muted-foreground mt-1">Dropoff:</div>
                                            <div className="text-sm">{entry.booking.dropoff_location}</div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="w-full overflow-hidden">
          <CardContent className="p-0">
            {renderTimelineEvents(getTimelineEntries())}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 