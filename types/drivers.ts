// Driver types

export type DriverAvailabilityStatus = 'available' | 'unavailable' | 'leave' | 'training';

export interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  line_id?: string;
  license_number?: string;
  license_expiry?: string;
  status: DriverAvailabilityStatus;
  availability_status?: DriverAvailabilityStatus;
  profile_image_url?: string;
  address?: string;
  emergency_contact?: string;
  notes?: string;
  user_id?: string;
  assigned_vehicles?: any[];
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  isBooking?: boolean;
  bookingNotes?: string;
}

export interface DriverAvailability {
  id: string;
  driver_id: string;
  start_date: string;
  end_date: string;
  status: DriverAvailabilityStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DriverWithAvailability extends Driver {
  availability?: DriverAvailability[];
} 