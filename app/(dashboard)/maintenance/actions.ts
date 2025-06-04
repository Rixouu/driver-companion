'use server';

import { createServiceClient } from "@/lib/supabase/service-client"; // Adjusted path
import type { Database } from "@/types/supabase";

export type MaintenanceScheduleInsert = Omit<Database['public']['Tables']['maintenance_schedules']['Row'], 'id' | 'created_at' | 'updated_at'>;
export type MaintenanceSchedule = Database['public']['Tables']['maintenance_schedules']['Row'];

interface ActionResult {
  schedule?: MaintenanceSchedule | null;
  error?: string | null;
}

export async function createMaintenanceScheduleAction(
  scheduleData: MaintenanceScheduleInsert
): Promise<ActionResult> {
  const supabase = createServiceClient(); // Call inside the action

  try {
    const { data, error } = await supabase
      .from('maintenance_schedules')
      .insert(scheduleData)
      .select()
      .single();

    if (error) {
      console.error('Error creating maintenance schedule (action):', error);
      return { error: error.message };
    }
    return { schedule: data, error: null };
  } catch (e: any) {
    console.error('Unexpected error creating maintenance schedule (action):', e);
    return { error: e.message || "An unexpected error occurred." };
  }
}

// You can add other maintenance-related server actions here, for example:
// - updateMaintenanceScheduleAction
// - deleteMaintenanceScheduleAction
// - createMaintenanceTaskAction (if the one-time task creation also needs service role or complex logic) 