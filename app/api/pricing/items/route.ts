import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const categoryId = searchParams.get('category_id');
  const serviceTypeId = searchParams.get('service_type_id');
  const vehicleType = searchParams.get('vehicle_type');
  const activeOnly = searchParams.get('active_only') !== 'false';

  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify user is authenticated and has admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Build the query
    let query = supabase
      .from('pricing_items')
      .select('*');

    // Apply filters
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    if (serviceTypeId) {
      query = query.eq('service_type', serviceTypeId);
    }
    
    if (vehicleType) {
      query = query.eq('vehicle_type', vehicleType);
    }

    const { data, error } = await query.order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching pricing items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling GET request for pricing items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify user is authenticated and has admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.service_type_id) {
      return NextResponse.json({ error: 'Service type is required' }, { status: 400 });
    }

    if (!body.vehicle_type) {
      return NextResponse.json({ error: 'Vehicle type is required' }, { status: 400 });
    }

    if (typeof body.price !== 'number') {
      return NextResponse.json({ error: 'Price must be a number' }, { status: 400 });
    }

    // Create the pricing item
    const { data, error } = await supabase
      .from('pricing_items')
      .insert({
        category_id: body.category_id || null,
        service_type: body.service_type_id,
        vehicle_type: body.vehicle_type,
        duration_hours: body.duration_hours || 1,
        price: body.price,
        currency: body.currency || 'JPY',
        is_active: body.is_active !== undefined ? body.is_active : true,
        sort_order: body.sort_order || 1
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error handling POST request for pricing items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 