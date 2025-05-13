import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
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
      .from('pricing_categories')
      .select('id, name, description, service_type_ids, sort_order, is_active, created_at, updated_at');

    // Apply filters
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Add ordering
    query = query.order('sort_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pricing categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling GET request for pricing categories:', error);
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
    if (!body.name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Create the category
    const { data, error } = await supabase
      .from('pricing_categories')
      .insert({
        name: body.name,
        description: body.description || null,
        service_types: body.service_type_ids || [],
        service_type_ids: body.service_type_ids || [],
        sort_order: body.sort_order || 1,
        is_active: body.is_active !== undefined ? body.is_active : true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing category:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error handling POST request for pricing category:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 