"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { useI18n } from "@/lib/i18n/context";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { DispatchEntry, DispatchEntryWithRelations } from "@/types/dispatch";

interface DispatchCalendarViewProps {
  entries: DispatchEntryWithRelations[];
}

export default function DispatchCalendarView({ entries }: DispatchCalendarViewProps) {
  const { t } = useI18n();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Get all dates with entries
  const datesWithEntries = entries.map(entry => {
    const date = parseISO(entry.start_time);
    return date;
  });
  
  // Filter entries for the selected date
  const entriesForSelectedDate = selectedDate 
    ? entries.filter(entry => {
        const entryDate = parseISO(entry.start_time);
        return isSameDay(entryDate, selectedDate);
      })
    : [];
  
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="col-span-1">
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="border-none"
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              modifiers={{
                booked: datesWithEntries,
              }}
              modifiersStyles={{
                booked: { 
                  fontWeight: 'bold',
                  color: 'var(--primary)',
                },
              }}
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="col-span-1 md:col-span-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
              </h3>
            </div>
            
            {entriesForSelectedDate.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                {selectedDate ? "No dispatch entries for this date" : "Select a date to view dispatches"}
              </div>
            ) : (
              <div className="space-y-3">
                {entriesForSelectedDate.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="border rounded-md p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Booking #{entry.booking?.wp_id || entry.booking_id}</h4>
                      <Badge className={getStatusColor(entry.status)}>
                        {t(`dispatch.status.${entry.status}`)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <div className="flex items-center">
                        <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span>{format(parseISO(entry.start_time), "h:mm a")}</span>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-muted-foreground">
                          Driver: {entry.driver?.first_name} {entry.driver?.last_name || "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 