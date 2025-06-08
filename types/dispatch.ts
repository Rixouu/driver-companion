import { Database } from "./supabase";
import { Driver } from "./drivers";
import { Vehicle } from "./vehicles";
import { Booking } from "./bookings";

export type DispatchStatus = 
  | 'pending'
  | 'assigned' 
  | 'confirmed'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface DispatchEntry {
  id: string;
  booking_id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  status: DispatchStatus;
  notes: string | null;
  start_time: string;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface DispatchEntryWithRelations extends DispatchEntry {
  booking: Booking;
  driver?: Partial<Driver> | null;
  vehicle?: Partial<Vehicle> | null;
}

export interface DispatchBoard {
  entries: DispatchEntryWithRelations[];
  drivers: Driver[];
  vehicles: Vehicle[];
}

export type DispatchTableRow = Database["public"]["Tables"]["dispatch_entries"]["Row"];
export type DispatchTableInsert = Database["public"]["Tables"]["dispatch_entries"]["Insert"];
export type DispatchTableUpdate = Database["public"]["Tables"]["dispatch_entries"]["Update"];

// Dispatch system types for real-time tracking and assignment management

export interface TrackingDevice {
  id: string;
  device_id: string;
  device_name?: string;
  vehicle_id?: string;
  driver_id?: string;
  is_active: boolean;
  last_seen?: string;
  battery_level?: number;
  created_at: string;
  updated_at: string;
}

export interface VehicleLocation {
  id: string;
  device_id: string;
  vehicle_id?: string;
  driver_id?: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  bearing?: number;
  timestamp: string;
  battery_level?: number;
  is_moving: boolean;
  address?: string;
  created_at: string;
}

export interface DispatchAssignment {
  id: string;
  booking_id: string;
  driver_id?: string;
  vehicle_id?: string;
  status: DispatchStatus;
  assigned_by?: string;
  assigned_at?: string;
  started_at?: string;
  arrived_at?: string;
  completed_at?: string;
  estimated_arrival?: string;
  actual_arrival?: string;
  pickup_location?: LocationData;
  dropoff_location?: LocationData;
  route_data?: RouteData;
  distance_km?: number;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  notes?: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface DispatchAssignmentWithRelations extends DispatchAssignment {
  booking?: {
    id: string;
    wp_id?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    pickup_location?: string;
    dropoff_location?: string;
    service_name?: string;
    date: string;
    time: string;
    status: string;
    duration?: string;
    notes?: string;
  };
  driver?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    profile_image_url?: string;
    status: string;
  };
  vehicle?: {
    id: string;
    name?: string;
    plate_number: string;
    brand?: string;
    model?: string;
    image_url?: string;
    status: string;
  };
  current_location?: VehicleLocation;
  tracking_device?: TrackingDevice;
}

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  place_id?: string;
}

export interface RouteData {
  overview_polyline: string;
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  steps?: Array<{
    html_instructions: string;
    distance: { text: string; value: number };
    duration: { text: string; value: number };
    start_location: { lat: number; lng: number };
    end_location: { lat: number; lng: number };
  }>;
}

export interface DispatchNotification {
  id: string;
  assignment_id: string;
  type: string;
  title?: string;
  message?: string;
  is_read: boolean;
  created_for?: string;
  created_at: string;
}

export interface DispatchFilter {
  status?: DispatchStatus;
  driver_id?: string;
  vehicle_id?: string;
  date_from?: string;
  date_to?: string;
  priority?: number;
  location?: string;
  zone?: string;
}

export interface DispatchStats {
  total_assignments: number;
  pending_assignments: number;
  active_assignments: number;
  completed_today: number;
  average_completion_time: number;
  online_vehicles: number;
  available_drivers: number;
}

export interface VehicleTracking {
  vehicle_id: string;
  device_id?: string;
  current_location?: VehicleLocation;
  last_update?: string;
  is_online: boolean;
  battery_level?: number;
  speed?: number;
  heading?: number;
  is_moving: boolean;
  assignment?: DispatchAssignment;
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface MapSettings {
  map_type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  show_traffic: boolean;
  show_vehicle_icons: boolean;
  show_routes: boolean;
  auto_center: boolean;
  refresh_interval: number;
}

// OwnTracks webhook payload interface
export interface OwnTracksPayload {
  _type: 'location' | 'transition' | 'waypoint';
  acc?: number;  // accuracy
  alt?: number;  // altitude 
  batt?: number; // battery level
  bs?: number;   // battery status
  conn?: string; // connection type
  created_at?: number;
  lat: number;   // latitude
  lon: number;   // longitude
  t?: string;    // trigger
  tid: string;   // tracker ID
  tst: number;   // timestamp
  vac?: number;  // vertical accuracy
  vel?: number;  // velocity
  topic?: string;
  inregions?: string[];
  inrids?: string[];
}

export interface AssignmentCreateInput {
  booking_id: string;
  driver_id?: string;
  vehicle_id?: string;
  priority?: number;
  notes?: string;
  estimated_duration_minutes?: number;
}

export interface AssignmentUpdateInput {
  driver_id?: string;
  vehicle_id?: string;
  status?: DispatchStatus;
  notes?: string;
  priority?: number;
  estimated_arrival?: string;
  actual_arrival?: string;
}

export interface QuickAssignmentPayload {
  booking_ids: string[];
  auto_assign: boolean;
  criteria?: {
    prefer_nearby: boolean;
    prefer_experience: boolean;
    prefer_availability: boolean;
  };
}

export interface BulkAssignmentPayload {
  assignments: Array<{
    booking_id: string;
    driver_id?: string;
    vehicle_id?: string;
    priority?: number;
  }>;
}

export interface EmergencyAlert {
  id: string;
  assignment_id: string;
  vehicle_id?: string;
  driver_id?: string;
  type: 'panic' | 'breakdown' | 'accident' | 'medical' | 'other';
  location: LocationData;
  message?: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface GeofenceArea {
  id: string;
  name: string;
  description?: string;
  type: 'pickup_zone' | 'dropoff_zone' | 'service_area' | 'restricted';
  coordinates: Array<{ lat: number; lng: number }>;
  is_active: boolean;
  created_at: string;
}

export interface PerformanceMetrics {
  assignment_id: string;
  planned_duration: number;
  actual_duration: number;
  planned_distance: number;
  actual_distance: number;
  customer_rating?: number;
  delays: Array<{
    reason: string;
    duration_minutes: number;
    location?: LocationData;
  }>;
  fuel_consumption?: number;
  route_efficiency: number;
} 