"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { CreateCrewTaskRequest } from "@/types/crew-tasks";

interface Booking {
  id: string;
  wp_id: string;
  status: string;
  date: string;
  time: string;
  customer_name: string;
  driver_id: string;
  driver_name?: string;
  service_type?: string;
  duration?: number;
  location?: string;
  notes?: string;
}

interface UseBookingToTaskConversionReturn {
  convertBookingsToTasks: (startDate: string, endDate: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useBookingToTaskConversion(): UseBookingToTaskConversionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertBookingsToTasks = useCallback(async (startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Fetch bookings with assigned drivers in the date range
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          wp_id,
          status,
          date,
          time,
          customer_name,
          driver_id,
          service_type,
          duration,
          location,
          notes,
          drivers!bookings_driver_id_fkey (
            first_name,
            last_name
          )
        `)
        .not("driver_id", "is", null)
        .gte("date", startDate)
        .lte("date", endDate)
        .in("status", ["confirmed", "in_progress", "scheduled"]);

      if (bookingsError) {
        throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
      }

      if (!bookings || bookings.length === 0) {
        console.log("No bookings found to convert");
        return;
      }

      // Check which bookings already have tasks
      const bookingIds = bookings.map(b => b.id);
      const { data: existingTasks } = await supabase
        .from("crew_tasks")
        .select("booking_id")
        .in("booking_id", bookingIds);

      const existingBookingIds = new Set(existingTasks?.map(t => t.booking_id) || []);

      // Filter out bookings that already have tasks
      const bookingsToConvert = bookings.filter(b => !existingBookingIds.has(b.id));

      if (bookingsToConvert.length === 0) {
        console.log("All bookings already have tasks");
        return;
      }

      // Convert bookings to tasks
      const tasks: CreateCrewTaskRequest[] = bookingsToConvert.map((booking, index) => {
        const driverName = booking.drivers 
          ? `${booking.drivers.first_name} ${booking.drivers.last_name}`
          : "Unknown Driver";

        // Calculate duration in hours (default to 4 if not specified)
        const durationHours = booking.duration ? Math.max(1, booking.duration / 60) : 4;
        
        // Calculate end time
        const [startHour, startMinute] = booking.time.split(":").map(Number);
        const endHour = startHour + Math.floor(durationHours);
        const endMinute = startMinute + ((durationHours % 1) * 60);
        const endTime = `${endHour.toString().padStart(2, "0")}:${Math.floor(endMinute).toString().padStart(2, "0")}`;

        return {
          task_number: (index % 10) + 1, // Cycle through task numbers 1-10
          task_type: "regular" as const,
          task_status: "scheduled" as const,
          driver_id: booking.driver_id,
          start_date: booking.date,
          end_date: booking.date, // Single day task
          start_time: booking.time,
          end_time: endTime,
          hours_per_day: durationHours,
          title: `${booking.service_type || "Service"} - ${booking.wp_id}`,
          description: `Booking ${booking.wp_id} - ${booking.service_type || "Regular service"}`,
          location: booking.location || "",
          customer_name: booking.customer_name || "Unknown Customer",
          customer_phone: "", // Not available in bookings table
          priority: 0,
          notes: booking.notes || `Converted from booking ${booking.wp_id}`,
          booking_id: booking.id,
        };
      });

      // Create tasks via API
      const response = await fetch("/api/crew-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tasks[0]), // Create one task at a time for now
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create task: ${errorData.error}`);
      }

      console.log(`Successfully converted ${tasks.length} booking(s) to task(s)`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error converting bookings to tasks:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    convertBookingsToTasks,
    isLoading,
    error,
  };
}
