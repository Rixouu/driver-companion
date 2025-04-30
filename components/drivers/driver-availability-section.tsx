"use client";

import { useEffect, useState } from "react";
import { format, parseISO, addDays } from "date-fns";
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

  useEffect(() => {
    async function fetchAvailability() {
      try {
        setIsLoading(true);
        const availabilityRecords = await getDriverAvailability(driverId);
        
        if (availabilityRecords.length > 0) {
          // Find current availability (where today is between start and end date)
          const today = format(new Date(), "yyyy-MM-dd");
          const currentAvailability = availabilityRecords.find((record) => {
            return record.start_date <= today && record.end_date >= today;
          });

          if (currentAvailability) {
            setCurrentStatus(currentAvailability.status);
            
            // Set status message based on current availability
            const endDate = parseISO(currentAvailability.end_date);
            
            if (currentAvailability.status === "available") {
              setCurrentStatusMessage(t("drivers.availability.availableMessage"));
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

          // Find upcoming status changes (future availability periods sorted by start date)
          const futureAvailability = availabilityRecords
            .filter((record) => record.start_date > today)
            .sort((a, b) => {
              return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
            });

          // Store up to 3 upcoming records
          setUpcomingRecords(futureAvailability.slice(0, 3));
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

    fetchAvailability();
  }, [driverId, t]);

  // Helper to get proper label for status
  function getStatusLabel(status: string): string {
    // Use availability statuses keys for translation
    return t(`drivers.availability.statuses.${status.toLowerCase()}`) || status;
  }

  // Helper to get status badge class
  function getStatusBadgeClass(status: string): string {
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

  // Helper to format date range
  function formatDateRange(startDate: string, endDate: string): string {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    // Basic formatting, can be enhanced for same month/year etc.
    if (startDate === endDate) {
        return format(start, "MMMM d, yyyy");
    }
    return `${format(start, "MMMM d")} - ${format(end, "d, yyyy")}`;
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
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-4">{t("drivers.availability.title")}</h3>
        
        {/* Current Status Section */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/20">
          <h4 className="text-sm font-medium mb-2">Current Status</h4> 
          <div className="flex items-center justify-between mb-2">
             <Badge variant={getStatusBadgeClass(currentStatus || "available") as any}>
               {getStatusLabel(currentStatus || "available")}
             </Badge>
           </div>
           <p className="text-sm text-muted-foreground">{currentStatusMessage}</p>
        </div>

        {/* Upcoming Schedule Section */}
        {upcomingRecords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">{t("drivers.availability.upcomingSchedule")}</h4>
            <div className="space-y-2">
              {upcomingRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    {/* Display formatted date range */}
                    <span className="text-sm">{formatDateRange(record.start_date, record.end_date)}</span>
                  </div>
                  {/* Use consistent badge styling */}
                  <Badge variant={getStatusBadgeClass(record.status) as any}>
                    {record.status === "leave" 
                      ? t("drivers.availability.returnsFromLeave") 
                      : getStatusLabel(record.status)}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button 
                className="w-full py-2 text-center border rounded-md hover:bg-accent transition-colors text-sm font-medium flex items-center justify-center"
                onClick={onViewFullSchedule}
              >
                <Clock className="h-4 w-4 mr-1" />
                {t("drivers.availability.viewFullSchedule")}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 