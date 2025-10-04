// =====================================================
// CREW TASKS TYPES
// Task-based crew allocation system types
// =====================================================

export type TaskType = 
  | 'charter' 
  | 'regular' 
  | 'training' 
  | 'day_off' 
  | 'maintenance' 
  | 'meeting' 
  | 'standby' 
  | 'special';

export type TaskStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export interface CrewTask {
  id: string;
  task_number: number;
  task_type: TaskType;
  task_status: TaskStatus;
  driver_id: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  start_time?: string; // HH:MM format
  end_time?: string; // HH:MM format
  total_days: number;
  current_day?: number; // For expanded multi-day tasks
  hours_per_day?: number;
  total_hours?: number;
  booking_id?: string;
  title?: string;
  description?: string;
  location?: string;
  customer_name?: string;
  customer_phone?: string;
  color_override?: string;
  priority?: number;
  notes?: string;
  // Booking details (if linked)
  booking_wp_id?: string;
  booking_service_name?: string;
  booking_price?: string;
  // Multi-day flags
  is_multi_day: boolean;
  is_first_day: boolean;
  is_last_day: boolean;
  // Metadata
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface DayTaskData {
  tasks: CrewTask[];
  task_count: number;
}

export interface DriverTaskSchedule {
  driver_id: string;
  driver_name: string;
  dates: Record<string, DayTaskData>; // date string -> tasks
}

export interface CrewTaskScheduleResponse {
  success: boolean;
  data: DriverTaskSchedule[];
  meta: {
    start_date: string;
    end_date: string;
    driver_count: number;
  };
}

export interface CreateCrewTaskRequest {
  task_number: number;
  task_type: TaskType;
  driver_id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  hours_per_day?: number;
  total_hours?: number;
  booking_id?: string;
  title?: string;
  description?: string;
  location?: string;
  customer_name?: string;
  customer_phone?: string;
  color_override?: string;
  priority?: number;
  notes?: string;
}

export interface UpdateCrewTaskRequest extends Partial<CreateCrewTaskRequest> {
  task_status?: TaskStatus;
}

export interface TaskConflict {
  conflict_id: string;
  task_number: number;
  title: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
}

