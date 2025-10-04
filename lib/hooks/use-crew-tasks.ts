import { useState, useEffect, useCallback } from "react";
import type { CrewTaskScheduleResponse, DriverTaskSchedule, CreateCrewTaskRequest, UpdateCrewTaskRequest } from "@/types/crew-tasks";

interface UseCrewTasksOptions {
  startDate: string;
  endDate: string;
  driverIds?: string[];
  taskNumbers?: number[];
  autoRefetch?: boolean;
  refetchInterval?: number; // milliseconds
}

interface UseCrewTasksReturn {
  data: DriverTaskSchedule[] | null;
  meta: CrewTaskScheduleResponse["meta"] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createTask: (task: CreateCrewTaskRequest) => Promise<any>;
  updateTask: (id: string, updates: UpdateCrewTaskRequest) => Promise<any>;
  deleteTask: (id: string) => Promise<void>;
}

export function useCrewTasks(options: UseCrewTasksOptions): UseCrewTasksReturn {
  const { startDate, endDate, driverIds, taskNumbers, autoRefetch = false, refetchInterval = 60000 } = options;

  const [data, setData] = useState<DriverTaskSchedule[] | null>(null);
  const [meta, setMeta] = useState<CrewTaskScheduleResponse["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch crew task schedule
  const fetchSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      if (driverIds && driverIds.length > 0) {
        params.append("driver_ids", driverIds.join(","));
      }

      if (taskNumbers && taskNumbers.length > 0) {
        params.append("task_numbers", taskNumbers.join(","));
      }

      const response = await fetch(`/api/crew-tasks?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch crew task schedule");
      }

      const result: CrewTaskScheduleResponse = await response.json();
      setData(result.data);
      setMeta(result.meta);
    } catch (err) {
      console.error("Error fetching crew task schedule:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, driverIds, taskNumbers]);

  // Initial fetch
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Auto-refetch
  useEffect(() => {
    if (!autoRefetch) return;

    const interval = setInterval(() => {
      fetchSchedule();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [autoRefetch, refetchInterval, fetchSchedule]);

  // Create a new task
  const createTask = useCallback(async (task: CreateCrewTaskRequest) => {
    try {
      const response = await fetch("/api/crew-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      const result = await response.json();
      
      // Refetch schedule after creating
      await fetchSchedule();
      
      return result.data;
    } catch (err) {
      console.error("Error creating crew task:", err);
      throw err;
    }
  }, [fetchSchedule]);

  // Update an existing task
  const updateTask = useCallback(async (id: string, updates: UpdateCrewTaskRequest) => {
    try {
      const response = await fetch(`/api/crew-tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task");
      }

      const result = await response.json();
      
      // Refetch schedule after updating
      await fetchSchedule();
      
      return result.data;
    } catch (err) {
      console.error("Error updating crew task:", err);
      throw err;
    }
  }, [fetchSchedule]);

  // Delete a task
  const deleteTask = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/crew-tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete task");
      }

      // Refetch schedule after deleting
      await fetchSchedule();
    } catch (err) {
      console.error("Error deleting crew task:", err);
      throw err;
    }
  }, [fetchSchedule]);

  return {
    data,
    meta,
    isLoading,
    error,
    refetch: fetchSchedule,
    createTask,
    updateTask,
    deleteTask,
  };
}

