import { Database } from "./supabase";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];

export type NotificationType = 
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed"
  | "quotation_created"
  | "quotation_sent"
  | "quotation_approved"
  | "quotation_rejected"
  | "quotation_expired"
  | "quotation_converted"
  | "payment_received"
  | "payment_failed"
  | "dispatch_assigned"
  | "dispatch_completed"
  | "maintenance_due"
  | "inspection_due"
  | "inspection_completed";

export interface NotificationWithDetails extends Notification {
  // Related entity details for display
  related_entity?: {
    id: string;
    type: 'booking' | 'quotation' | 'dispatch' | 'maintenance' | 'inspection';
    title: string;
    status?: string;
    url?: string;
  };
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  booking_notifications: boolean;
  quotation_notifications: boolean;
  payment_notifications: boolean;
  dispatch_notifications: boolean;
  maintenance_notifications: boolean;
  inspection_notifications: boolean;
}

export interface NotificationCounts {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
}
