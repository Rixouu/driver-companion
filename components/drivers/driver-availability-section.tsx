"use client";

import { useEffect, useState } from "react";
import { format, parseISO, addDays } from "date-fns";
import { Clock, CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDriverAvailability } from "@/lib/services/driver-availability";
import { useI18n } from "@/lib/i18n/context";
import type { DriverAvailability as DriverAvailabilityType } from "@/types/drivers";

interface DriverAvailabilitySectionProps {
  driverId: string;
}

export function DriverAvailabilitySection({ driverId }: DriverAvailabilitySectionProps) {
  const { t } = useI18n();
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [currentStatusMessage, setCurrentStatusMessage] = useState<string>("");
  const [upcomingChanges, setUpcomingChanges] = useState<
    { date: string; status: string }[]
  >([]);
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

          // Take up to 3 upcoming changes
          const upcomingStatusChanges = futureAvailability.slice(0, 3).map((record) => {
            return {
              date: record.start_date,
              status: record.status
            };
          });

          setUpcomingChanges(upcomingStatusChanges);
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
    return t(`drivers.status.${status}`) || "Unknown";
  }

  // Helper to get status badge class
  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "unavailable":
        return "bg-red-100 text-red-800";
      case "leave":
        return "bg-amber-100 text-amber-800";
      case "training":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
        <h3 className="text-xl font-bold mb-3">{t("drivers.availability.title")}</h3>
        <div className="mb-4">
          <div className="mb-2">
            <Badge className={getStatusBadgeClass(currentStatus || "available")}>
              {getStatusLabel(currentStatus || "available")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{currentStatusMessage}</p>
        </div>

        {upcomingChanges.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">{t("drivers.availability.upcomingSchedule")}</h4>
            <div className="space-y-3">
              {upcomingChanges.map((change, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{format(parseISO(change.date), "MMMM d, yyyy")}</span>
                  </div>
                  <Badge className={getStatusBadgeClass(change.status)}>
                    {change.status === "leave" ? t("drivers.availability.returnsFromLeave") : getStatusLabel(change.status)}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button 
                className="w-full py-2 text-center border rounded-md hover:bg-accent transition-colors text-sm font-medium flex items-center justify-center"
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