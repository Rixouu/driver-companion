// Driver Shift Management Types

export type ShiftType = "regular" | "overtime" | "on-call" | "split" | "special";
export type ShiftStatus = "scheduled" | "active" | "completed" | "cancelled";
export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";

export interface DriverShift {
  id: string;
  driver_id: string;
  shift_date: string;
  shift_start_time: string;
  shift_end_time: string;
  shift_type: ShiftType;
  status: ShiftStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  driver?: DriverInfo;
}

export interface DriverInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profile_image_url?: string;
  line_id?: string;
}

export interface ShiftBooking {
  booking_id: string;
  wp_id: string;
  time: string;
  status: BookingStatus;
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

export interface DayShiftData {
  shifts: DriverShift[];
  bookings: ShiftBooking[];
  booking_count: number;
  total_hours: number;
  total_revenue: number;
}

export interface ShiftScheduleGrid {
  [driverId: string]: {
    [date: string]: DayShiftData;
  };
}

export interface ShiftSchedule {
  drivers: Array<{
    id: string;
    name: string;
  }>;
  dates: string[];
  grid: ShiftScheduleGrid;
}

export interface MonthlyShiftOverview {
  driver_id: string;
  driver_name: string;
  month: string;
  total_shifts: number;
  completed_shifts: number;
  total_bookings: number;
  completed_bookings: number;
  total_hours: number;
  total_revenue: number;
}

export interface DriverAvailability {
  is_available: boolean;
  conflict_reason?: string;
  conflicts: ShiftBooking[];
}

export interface CreateShiftInput {
  driver_id: string;
  shift_date: string;
  shift_start_time: string;
  shift_end_time: string;
  shift_type?: ShiftType;
  status?: ShiftStatus;
  notes?: string;
}

export interface UpdateShiftInput {
  shift_start_time?: string;
  shift_end_time?: string;
  shift_type?: ShiftType;
  status?: ShiftStatus;
  notes?: string;
}

export interface ShiftFilters {
  driver_ids?: string[];
  start_date: string;
  end_date: string;
  status?: ShiftStatus;
  shift_type?: ShiftType;
}

export interface ShiftStatistics {
  total_shifts: number;
  active_shifts: number;
  completed_shifts: number;
  total_bookings: number;
  assigned_bookings: number;
  unassigned_bookings: number;
  total_drivers: number;
  total_hours: number;
  total_revenue: number;
  utilization_rate: number;
  assignment_rate: number;
}

// UI Component Props Types

export interface ShiftCellProps {
  driverId: string;
  date: string;
  data: DayShiftData;
  onBookingClick?: (booking: ShiftBooking) => void;
  onCellClick?: (driverId: string, date: string) => void;
}

export interface ShiftRowProps {
  driver: {
    id: string;
    name: string;
  };
  dates: string[];
  grid: ShiftScheduleGrid;
  onBookingClick?: (booking: ShiftBooking) => void;
  onCellClick?: (driverId: string, date: string) => void;
}

export interface ShiftCalendarGridProps {
  schedule: ShiftSchedule;
  onBookingClick?: (booking: ShiftBooking) => void;
  onCellClick?: (driverId: string, date: string) => void;
  onDriverClick?: (driverId: string) => void;
}

export interface ShiftFiltersProps {
  filters: ShiftFilters;
  onFiltersChange: (filters: ShiftFilters) => void;
  drivers: DriverInfo[];
}

export interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking?: ShiftBooking;
  drivers: DriverInfo[];
  onAssign: (bookingId: string, driverId: string, vehicleId?: string) => Promise<void>;
}

export interface ShiftDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  date: string;
  data: DayShiftData;
  driver: DriverInfo;
}

