// Driver types

export type DriverAvailabilityStatus = 'available' | 'unavailable' | 'leave' | 'training';

export interface Driver {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  license_number?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
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