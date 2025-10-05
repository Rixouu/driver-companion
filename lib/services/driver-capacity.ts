import { createClient } from '@/lib/supabase/index';

export interface DriverCapacitySetting {
  id: string;
  driver_id: string;
  first_name: string;
  last_name: string;
  email: string;
  max_hours_per_day: number;
  max_hours_per_week: number;
  max_hours_per_month: number;
  preferred_start_time: string;
  preferred_end_time: string;
  working_days: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDriverCapacityData {
  driver_id: string;
  max_hours_per_day?: number;
  max_hours_per_week?: number;
  max_hours_per_month?: number;
  preferred_start_time?: string;
  preferred_end_time?: string;
  working_days?: string[];
}

export interface UpdateDriverCapacityData {
  max_hours_per_day?: number;
  max_hours_per_week?: number;
  max_hours_per_month?: number;
  preferred_start_time?: string;
  preferred_end_time?: string;
  working_days?: string[];
  is_active?: boolean;
}

export async function getDriverCapacitySettings(): Promise<{
  capacitySettings: DriverCapacitySetting[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('driver_capacity_view')
      .select('*')
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching driver capacity settings:', error);
      return { capacitySettings: [], error: error.message };
    }

    return { capacitySettings: data || [] };
  } catch (error) {
    console.error('Error in getDriverCapacitySettings:', error);
    return { capacitySettings: [], error: 'Failed to fetch driver capacity settings' };
  }
}

export async function getDriverCapacitySetting(driverId: string): Promise<{
  capacitySetting: DriverCapacitySetting | null;
  error?: string;
}> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('driver_capacity_view')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (error) {
      console.error('Error fetching driver capacity setting:', error);
      return { capacitySetting: null, error: error.message };
    }

    return { capacitySetting: data };
  } catch (error) {
    console.error('Error in getDriverCapacitySetting:', error);
    return { capacitySetting: null, error: 'Failed to fetch driver capacity setting' };
  }
}

export async function createDriverCapacitySetting(data: CreateDriverCapacityData): Promise<{
  capacitySetting: DriverCapacitySetting | null;
  error?: string;
}> {
  try {
    const supabase = createClient();
    
    const { data: capacitySetting, error } = await supabase
      .from('driver_capacity_settings')
      .insert({
        driver_id: data.driver_id,
        max_hours_per_day: data.max_hours_per_day || 8,
        max_hours_per_week: data.max_hours_per_week || 40,
        max_hours_per_month: data.max_hours_per_month || 160,
        preferred_start_time: data.preferred_start_time || '09:00',
        preferred_end_time: data.preferred_end_time || '17:00',
        working_days: data.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating driver capacity setting:', error);
      return { capacitySetting: null, error: error.message };
    }

    return { capacitySetting };
  } catch (error) {
    console.error('Error in createDriverCapacitySetting:', error);
    return { capacitySetting: null, error: 'Failed to create driver capacity setting' };
  }
}

export async function updateDriverCapacitySetting(
  driverId: string, 
  data: UpdateDriverCapacityData
): Promise<{
  capacitySetting: DriverCapacitySetting | null;
  error?: string;
}> {
  try {
    const supabase = createClient();
    
    const { data: capacitySetting, error } = await supabase
      .from('driver_capacity_settings')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('driver_id', driverId)
      .select()
      .single();

    if (error) {
      console.error('Error updating driver capacity setting:', error);
      return { capacitySetting: null, error: error.message };
    }

    return { capacitySetting };
  } catch (error) {
    console.error('Error in updateDriverCapacitySetting:', error);
    return { capacitySetting: null, error: 'Failed to update driver capacity setting' };
  }
}

export async function deleteDriverCapacitySetting(driverId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('driver_capacity_settings')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('driver_id', driverId);

    if (error) {
      console.error('Error deleting driver capacity setting:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteDriverCapacitySetting:', error);
    return { success: false, error: 'Failed to delete driver capacity setting' };
  }
}

// Helper function to get capacity hours for a specific view mode
export function getCapacityHoursForViewMode(
  capacitySetting: DriverCapacitySetting | null,
  viewMode: 'day' | 'week' | 'month'
): number {
  if (!capacitySetting) {
    // Default fallback values
    switch (viewMode) {
      case 'day': return 8;
      case 'week': return 40;
      case 'month': return 160;
      default: return 8;
    }
  }

  switch (viewMode) {
    case 'day':
      return capacitySetting.max_hours_per_day;
    case 'week':
      return capacitySetting.max_hours_per_week;
    case 'month':
      return capacitySetting.max_hours_per_month;
    default:
      return capacitySetting.max_hours_per_day;
  }
}
