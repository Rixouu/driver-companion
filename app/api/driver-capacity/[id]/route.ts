import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/index';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const driverId = params.id;

    // Get capacity setting for specific driver
    const { data: capacitySetting, error } = await supabase
      .from('driver_capacity_view')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (error) {
      console.error('Error fetching driver capacity setting:', error);
      return NextResponse.json(
        { error: 'Failed to fetch driver capacity setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({ capacitySetting });
  } catch (error) {
    console.error('Error in GET /api/driver-capacity/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { params: { id: string } } }
) {
  try {
    const supabase = await createServerClient();
    const driverId = params.id;
    const body = await request.json();
    
    const { max_hours_per_day, max_hours_per_week, max_hours_per_month, preferred_start_time, preferred_end_time, working_days, is_active } = body;

    // Update capacity setting
    const { data, error } = await supabase
      .from('driver_capacity_settings')
      .update({
        max_hours_per_day,
        max_hours_per_week,
        max_hours_per_month,
        preferred_start_time,
        preferred_end_time,
        working_days,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('driver_id', driverId)
      .select()
      .single();

    if (error) {
      console.error('Error updating driver capacity setting:', error);
      return NextResponse.json(
        { error: 'Failed to update driver capacity setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({ capacitySetting: data });
  } catch (error) {
    console.error('Error in PUT /api/driver-capacity/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const driverId = params.id;

    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from('driver_capacity_settings')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('driver_id', driverId)
      .select()
      .single();

    if (error) {
      console.error('Error deleting driver capacity setting:', error);
      return NextResponse.json(
        { error: 'Failed to delete driver capacity setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Driver capacity setting deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/driver-capacity/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
