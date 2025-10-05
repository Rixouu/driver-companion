import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/index';

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Get all driver capacity settings with driver information
    const { data: capacitySettings, error } = await supabase
      .from('driver_capacity_view')
      .select('*')
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching driver capacity settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch driver capacity settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ capacitySettings });
  } catch (error) {
    console.error('Error in GET /api/driver-capacity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    
    const { driver_id, max_hours_per_day, max_hours_per_week, max_hours_per_month, preferred_start_time, preferred_end_time, working_days } = body;

    // Validate required fields
    if (!driver_id) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // Insert new capacity setting
    const { data, error } = await supabase
      .from('driver_capacity_settings')
      .insert({
        driver_id,
        max_hours_per_day: max_hours_per_day || 8,
        max_hours_per_week: max_hours_per_week || 40,
        max_hours_per_month: max_hours_per_month || 160,
        preferred_start_time: preferred_start_time || '09:00',
        preferred_end_time: preferred_end_time || '17:00',
        working_days: working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating driver capacity setting:', error);
      return NextResponse.json(
        { error: 'Failed to create driver capacity setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({ capacitySetting: data });
  } catch (error) {
    console.error('Error in POST /api/driver-capacity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
