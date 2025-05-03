"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Clock, Calendar, CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDriverAvailability } from "@/lib/services/driver-availability";
import { useI18n } from "@/lib/i18n/context";
import type { DriverAvailability as DriverAvailabilityType } from "@/types/drivers";

interface DriverAvailabilitySectionProps {
  driverId: string;
  onViewFullSchedule?: () => void;
}

export function DriverAvailabilitySection({ driverId, onViewFullSchedule }: DriverAvailabilitySectionProps) {
  const { t } = useI18n();
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [currentStatusMessage, setCurrentStatusMessage] = useState<string>("");
  const [upcomingRecords, setUpcomingRecords] = useState<DriverAvailabilityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBookingAvailability, setCurrentBookingAvailability] = useState<DriverAvailabilityType | null>(null);
  const [allAvailabilityRecords, setAllAvailabilityRecords] = useState<DriverAvailabilityType[]>([]);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        setIsLoading(true);
        const availabilityRecords = await getDriverAvailability(driverId);
        setAllAvailabilityRecords(availabilityRecords);
        
        if (availabilityRecords.length > 0) {
          // Find current availability (where today is between start and end date)
          const today = format(new Date(), "yyyy-MM-dd");
          const now = new Date();
          
          // First look for booking-related unavailability (current ongoing booking)
          const bookingAvailability = availabilityRecords.find((record) => {
            const startDate = new Date(record.start_date);
            const endDate = new Date(record.end_date);
            const isNowBetweenDates = now >= startDate && now <= endDate;
            const isBookingRelated = record.notes?.includes('Assigned to booking');
            return isNowBetweenDates && isBookingRelated;
          });
          
          setCurrentBookingAvailability(bookingAvailability || null);
          
          // If there's an active booking, prioritize that status
          if (bookingAvailability) {
            // Mark as booking but store original status
            setCurrentStatus(bookingAvailability.status);
            
            // Set message indicating the driver is on a current booking
            const endTime = format(new Date(bookingAvailability.end_date), "h:mm a");
            setCurrentStatusMessage(t("drivers.availability.onBookingMessage", {
              endTime,
              defaultValue: `Currently on a booking until ${endTime}`
            }));
          } else {
            // Look for general availability (where today is within the date range)
            const currentAvailability = availabilityRecords.find((record) => {
              return record.start_date <= today && record.end_date >= today;
            });
            
            if (currentAvailability) {
              setCurrentStatus(currentAvailability.status);
              
              // Set status message based on current availability
              const endDate = parseISO(currentAvailability.end_date);
              
              if (currentAvailability.status === "available") {
                setCurrentStatusMessage(t("drivers.availability.availableMessage"));
              } else if (currentAvailability.status === "leave") {
                setCurrentStatusMessage(
                  t("drivers.availability.returnMessage", {
                    date: format(endDate, "MMMM d, yyyy")
                  })
                );
              } else {
                setCurrentStatusMessage(
                  t("drivers.availability.statusMessage", {
                    status: getStatusLabel(currentAvailability.status).toLowerCase(),
                    date: format(endDate, "MMMM d, yyyy")
                  })
                );
              }
            } else {
              // Default to available if no record found for today
              setCurrentStatus("available");
              setCurrentStatusMessage(t("drivers.availability.availableMessage"));
            }
          }
          
          // Find upcoming bookings and availability changes
          const futureRecords = availabilityRecords
            .filter((record) => {
              // For records starting in the future
              return record.start_date > today;
            })
            .sort((a, b) => {
              // Sort by start date ascending
              return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
            });
          
          // Store up to 3 upcoming records
          setUpcomingRecords(futureRecords.slice(0, 3));
        } else {
          // Default values if no availability records found
          setCurrentStatus("available");
          setCurrentStatusMessage(t("drivers.availability.availableMessage"));
        }
      } catch (error) {
        console.error("Error fetching driver availability:", error);
        setCurrentStatus("available");
        setCurrentStatusMessage(t("drivers.availability.availableMessage"));
      } finally {
        setIsLoading(false);
      }
    }

    // Fetch data when component mounts or driverId changes
    fetchAvailability();

    // Listen for booking unassignment events to refresh availability
    const handleBookingUnassigned = () => {
      console.log("[Driver Availability] Detected booking unassignment, refreshing availability data");
      fetchAvailability();
    };

    document.addEventListener('booking-unassigned', handleBookingUnassigned);
    document.addEventListener('refresh-driver-availability', handleBookingUnassigned);
    
    // Clean up event listeners when component unmounts
    return () => {
      document.removeEventListener('booking-unassigned', handleBookingUnassigned);
      document.removeEventListener('refresh-driver-availability', handleBookingUnassigned);
    };
  }, [driverId, t]);

  // Helper to get status badge class
  function getStatusBadgeClass(status: string, isBooking = false): string {
    // If it's a booking, use booking styling
    if (isBooking) {
      return "booking";
    }
    
    switch (status.toLowerCase()) { // Ensure lowercase comparison
      case "available":
        // Use Shadcn Badge variants for consistency
        return "success";
      case "unavailable":
        return "destructive";
      case "leave":
        return "warning";
      case "training":
        return "info";
      default:
        return "secondary";
    }
  }

  // Helper to get proper label for status
  function getStatusLabel(status: string, isBooking = false): string {
    // If it's a booking, return Booking text
    if (isBooking) {
      return t("common.booking", { defaultValue: "Booking" });
    }
    
    // Use availability statuses keys for translation
    return t(`drivers.availability.statuses.${status.toLowerCase()}`) || status;
  }

  // Helper to format date range
  function formatDateRange(startDate: string, endDate: string): string {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    // Include time if available (check if the ISO string has time component)
    const hasTime = startDate.includes('T') && endDate.includes('T');
    
    // Same day formatting
    if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
      if (hasTime) {
        return `${format(start, "MMM d, yyyy")} (${format(start, "h:mm a")} - ${format(end, "h:mm a")})`;
      }
      return format(start, "MMMM d, yyyy");
    }
    
    // Different days formatting
    if (hasTime) {
      return `${format(start, "MMM d")} (${format(start, "h:mm a")}) - ${format(end, "MMM d, yyyy")} (${format(end, "h:mm a")})`;
    }
    return `${format(start, "MMMM d")} - ${format(end, "d, yyyy")}`;
  }

  // Process and mark booking-related entries
  function isBookingRelated(record: DriverAvailabilityType): boolean {
    return record.notes?.includes('Assigned to booking') || false;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-xl font-bold mb-4">{t("drivers.availability.title")}</h3>
        
        {/* Current Status Section */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/20">
          <h4 className="text-sm font-medium mb-2">{t("drivers.availability.currentStatus")}</h4> 
          <div className="flex items-center justify-between mb-2">
            {/* Check if current status is from a booking */}
            <Badge 
              // For booking, we can add a custom class that matches your design system
              className={
                currentStatus && 
                allAvailabilityRecords?.find(r => 
                  r.status === currentStatus && 
                  r.notes?.includes('Assigned to booking') &&
                  new Date(r.start_date) <= new Date() && 
                  new Date(r.end_date) >= new Date()
                ) 
                  ? "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200 rounded px-2.5 py-1 text-xs font-medium"
                  : `rounded px-2.5 py-1 text-xs font-medium ${
                      currentStatus === "available" ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" :
                      currentStatus === "unavailable" ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-200" :
                      currentStatus === "leave" ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200" :
                      currentStatus === "training" ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200" :
                      "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
                    }`
              }
            >
              {allAvailabilityRecords?.find(r => 
                r.status === currentStatus && 
                r.notes?.includes('Assigned to booking') &&
                new Date(r.start_date) <= new Date() && 
                new Date(r.end_date) >= new Date()
              ) 
                ? t("common.booking", { defaultValue: "Booking" })
                : getStatusLabel(currentStatus || "available")
              }
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{currentStatusMessage}</p>
        </div>

        {/* Upcoming Schedule Section */}
        <div>
          <h4 className="text-sm font-medium mb-2">{t("drivers.availability.upcomingSchedule")}</h4>
          {upcomingRecords.length > 0 ? (
            <div className="space-y-2">
              {upcomingRecords.map((record) => {
                const isBooking = record.notes?.includes('Assigned to booking');
                return (
                  <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md gap-2">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{formatDateRange(record.start_date, record.end_date)}</span>
                    </div>
                    <Badge 
                      className={isBooking 
                        ? "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200 rounded px-2.5 py-1 text-xs font-medium self-start sm:self-auto" 
                        : `rounded px-2.5 py-1 text-xs font-medium self-start sm:self-auto ${
                            record.status === "available" ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" :
                            record.status === "unavailable" ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-200" :
                            record.status === "leave" ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200" :
                            record.status === "training" ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200" :
                            "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
                          }`
                      }
                    >
                      {isBooking 
                        ? t("common.booking", { defaultValue: "Booking" })
                        : getStatusLabel(record.status)
                      }
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 border rounded-md text-muted-foreground">
              <p className="text-sm">{t("drivers.availability.noUpcomingSchedule", { defaultValue: "No upcoming schedule changes." })}</p>
            </div>
          )}
          <div className="mt-4">
            <button 
              className="w-full py-2 text-center border rounded-md hover:bg-accent transition-colors text-sm font-medium flex items-center justify-center"
              onClick={onViewFullSchedule}
            >
              <Clock className="h-4 w-4 mr-1" />
              {t("drivers.availability.viewFullSchedule", { defaultValue: "View Full Schedule" })}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 