import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data, error } = await supabase
      .from('pricing_items')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling GET request for pricing item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if pricing item exists
    const { data: existingItem, error: fetchError } = await supabase
      .from('pricing_items')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Pricing item not found' }, { status: 404 });
    }

    // Prepare update data, only including fields that were provided
    const updateData = {
      ...(body.price !== undefined && { price: body.price }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.duration_hours !== undefined && { duration_hours: body.duration_hours }),
    };

    // Update the pricing item
    const { data, error } = await supabase
      .from('pricing_items')
      .update(updateData)
      .eq('id', params.id)
      .select();

    if (error) {
      console.error('Error updating pricing item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Make sure we have data and it's an array with at least one item
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Failed to update pricing item' }, { status: 500 });
    }

    // Return the first item from the array
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error handling PATCH request for pricing item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if pricing item exists
    const { data: existingItem, error: fetchError } = await supabase
      .from('pricing_items')
      .select('id')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Pricing item not found' }, { status: 404 });
    }

    // Prepare update data, mapping service_type_id from request to service_type in DB
    const updateData = {
      ...(body.category_id !== undefined && { category_id: body.category_id }),
      ...(body.service_type_id !== undefined && { service_type: body.service_type_id }),
      ...(body.vehicle_type !== undefined && { vehicle_type: body.vehicle_type }),
      ...(body.duration_hours !== undefined && { duration_hours: body.duration_hours }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
      ...(body.sort_order !== undefined && { sort_order: body.sort_order })
    };

    // Update the pricing item
    const { data, error } = await supabase
      .from('pricing_items')
      .update(updateData)
      .eq('id', params.id)
      .select();

    if (error) {
      console.error('Error updating pricing item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Make sure we have data and it's an array with at least one item
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Failed to update pricing item' }, { status: 500 });
    }

    // Return the first item from the array
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error handling PUT request for pricing item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete the pricing item
    const { error } = await supabase
      .from('pricing_items')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting pricing item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error handling DELETE request for pricing item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 