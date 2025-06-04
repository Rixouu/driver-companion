import { NextRequest, NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // No longer needed
// import { createClient } from '@supabase/supabase-js'; // Unused import
// import { cookies } from 'next/headers'; // No longer needed
import { getSupabaseServerClient } from '@/lib/supabase/server'; // Correct import
import { Database } from '@/types/supabase';

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const activeOnly = searchParams.get('active_only') !== 'false';

  try {
    const supabase = await getSupabaseServerClient(); // Changed client creation
    
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
      .from('pricing_promotions')
      .select('*');

    // Apply filters
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Add ordering
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pricing promotions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling GET request for pricing promotions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient(); // Changed client creation
    
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
      return NextResponse.json({ error: 'Promotion name is required' }, { status: 400 });
    }

    if (!body.code) {
      return NextResponse.json({ error: 'Promotion code is required' }, { status: 400 });
    }

    if (!body.discount_type || !['percentage', 'fixed'].includes(body.discount_type)) {
      return NextResponse.json({ error: 'Valid discount type is required (percentage or fixed)' }, { status: 400 });
    }

    if (typeof body.discount_value !== 'number' || body.discount_value < 0) {
      return NextResponse.json({ error: 'Discount value must be a positive number' }, { status: 400 });
    }

    // Create the promotion
    const { data, error } = await supabase
      .from('pricing_promotions')
      .insert({
        name: body.name,
        description: body.description || null,
        code: body.code,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        is_active: body.is_active !== undefined ? body.is_active : true,
        applicable_services: body.applicable_services || [],
        applicable_vehicle_types: body.applicable_vehicle_types || [],
        times_used: body.times_used || 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing promotion:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error handling POST request for pricing promotion:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 