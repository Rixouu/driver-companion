import { Database } from "./supabase";
import { Driver } from "./drivers";
import { Vehicle } from "./vehicles";
import { Booking } from "./bookings";

export type DispatchStatus = 
  | "pending" 
  | "assigned" 
  | "in_transit" 
  | "completed" 
  | "cancelled"
  | "confirmed";

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

export interface DispatchFilter {
  status?: DispatchStatus;
  date?: string;
  driver_id?: string;
  vehicle_id?: string;
}

export interface DispatchBoard {
  entries: DispatchEntryWithRelations[];
  drivers: Driver[];
  vehicles: Vehicle[];
}

export type DispatchTableRow = Database["public"]["Tables"]["dispatch_entries"]["Row"];
export type DispatchTableInsert = Database["public"]["Tables"]["dispatch_entries"]["Insert"];
export type DispatchTableUpdate = Database["public"]["Tables"]["dispatch_entries"]["Update"]; 