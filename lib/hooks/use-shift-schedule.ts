import { useState, useEffect, useCallback } from "react";

export interface Driver {
  id: string;
  name: string;
}

export interface Shift {
  shift_id: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  notes?: string;
}

export interface Booking {
  booking_id: string;
  wp_id: string;
  time: string;
  status: string;
  customer_name: string;
  service_name: string;
  service_type?: string;
  pickup_location?: string;
  dropoff_location?: string;
  duration_hours?: number;
  price_amount?: number;
  price_formatted?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  assignment_status?: string;
}

export interface DayData {
  shifts: Shift[];
  bookings: Booking[];
  booking_count: number;
  total_hours: number;
  total_revenue: number;
}

export interface ShiftGrid {
  [driverId: string]: {
    [date: string]: DayData;
  };
}

export interface ShiftScheduleData {
  drivers: Driver[];
  dates: string[];
  grid: ShiftGrid;
}

export interface ShiftScheduleMeta {
  start_date: string;
  end_date: string;
  driver_count: number;
  date_count: number;
}

export interface ShiftScheduleResponse {
  success: boolean;
  data: ShiftScheduleData;
  meta: ShiftScheduleMeta;
}

export interface UseShiftScheduleOptions {
  startDate: string;
  endDate: string;
  driverIds?: string[];
  autoRefetch?: boolean;
  refetchInterval?: number;
}

export interface UseShiftScheduleReturn {
  data: ShiftScheduleData | null;
  meta: ShiftScheduleMeta | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useShiftSchedule(
  options: UseShiftScheduleOptions
): UseShiftScheduleReturn {
  const { startDate, endDate, driverIds, autoRefetch = false, refetchInterval = 60000 } = options;

  const [data, setData] = useState<ShiftScheduleData | null>(null);
  const [meta, setMeta] = useState<ShiftScheduleMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      // Add driver IDs if provided
      if (driverIds && driverIds.length > 0) {
        driverIds.forEach((id) => {
          params.append("driver_ids[]", id);
        });
      }

      const response = await fetch(`/api/shifts/schedule?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch shift schedule: ${response.statusText}`);
      }

      const result: ShiftScheduleResponse = await response.json();

      if (!result.success) {
        throw new Error("Failed to fetch shift schedule");
      }

      setData(result.data);
      setMeta(result.meta);
    } catch (err) {
      console.error("Error fetching shift schedule:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, driverIds]);

  // Initial fetch
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Auto refetch if enabled
  useEffect(() => {
    if (!autoRefetch) return;

    const interval = setInterval(() => {
      fetchSchedule();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [autoRefetch, refetchInterval, fetchSchedule]);

  return {
    data,
    meta,
    isLoading,
    error,
    refetch: fetchSchedule,
  };
}

// Hook for checking driver availability
export interface UseDriverAvailabilityOptions {
  driverId: string;
  date: string;
  startTime: string;
  duration: number;
}

export interface DriverAvailabilityResult {
  is_available: boolean;
  conflict_reason?: string;
  conflicts: Booking[];
}

export interface UseDriverAvailabilityReturn {
  availability: DriverAvailabilityResult | null;
  isLoading: boolean;
  error: Error | null;
  checkAvailability: () => Promise<void>;
}

export function useDriverAvailability(
  options: UseDriverAvailabilityOptions | null
): UseDriverAvailabilityReturn {
  const [availability, setAvailability] = useState<DriverAvailabilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkAvailability = useCallback(async () => {
    if (!options) {
      setAvailability(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        driver_id: options.driverId,
        date: options.date,
        start_time: options.startTime,
        duration: options.duration.toString(),
      });

      const response = await fetch(`/api/shifts/availability?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to check availability: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error("Failed to check availability");
      }

      setAvailability({
        is_available: result.is_available,
        conflict_reason: result.conflict_reason,
        conflicts: result.conflicts || [],
      });
    } catch (err) {
      console.error("Error checking driver availability:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  useEffect(() => {
    if (options) {
      checkAvailability();
    }
  }, [options, checkAvailability]);

  return {
    availability,
    isLoading,
    error,
    checkAvailability,
  };
}

