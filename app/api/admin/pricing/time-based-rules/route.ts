import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// GET all time-based pricing rules
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const category_id = url.searchParams.get('category_id');
    const service_type_id = url.searchParams.get('service_type_id');
    const active_only = url.searchParams.get('active_only') === 'true';

    // Build query
    let query = supabase
      .from('pricing_time_based_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (service_type_id) {
      query = query.eq('service_type_id', service_type_id);
    }

    if (active_only) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching time-based pricing rules:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling GET request for time-based pricing rules:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST a new time-based pricing rule
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();

    // Validate the required fields
    if (!body.name || !body.start_time || !body.end_time || typeof body.adjustment_percentage !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: name, start_time, end_time, adjustment_percentage' },
        { status: 400 }
      );
    }

    // Create a new rule
    const newRule = {
      name: body.name,
      category_id: body.category_id || null,
      service_type_id: body.service_type_id || null,
      start_time: body.start_time,
      end_time: body.end_time,
      days_of_week: body.days_of_week || null,
      adjustment_percentage: body.adjustment_percentage,
      priority: body.priority || 1,
      is_active: body.is_active !== undefined ? body.is_active : true,
      description: body.description || null
    };

    const { data, error } = await supabase
      .from('pricing_time_based_rules')
      .insert([newRule])
      .select()
      .single();

    if (error) {
      console.error('Error creating time-based pricing rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error handling POST request for time-based pricing rule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 