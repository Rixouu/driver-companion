import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { Database } from '@/types/supabase';

// Helper function to create Supabase client for Route Handlers
async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', options);
        },
      },
    }
  );
}

// GET a specific time-based pricing rule
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseClient();
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the time-based pricing rule
    const { data, error } = await supabase
      .from('pricing_time_based_rules')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling GET request for time-based pricing rule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PATCH a specific time-based pricing rule (partial update)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseClient();
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();

    // Prepare update data
    const updateData = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.category_id !== undefined && { category_id: body.category_id }),
      ...(body.service_type_id !== undefined && { service_type_id: body.service_type_id }),
      ...(body.start_time !== undefined && { start_time: body.start_time }),
      ...(body.end_time !== undefined && { end_time: body.end_time }),
      ...(body.days_of_week !== undefined && { days_of_week: body.days_of_week }),
      ...(body.adjustment_percentage !== undefined && { adjustment_percentage: body.adjustment_percentage }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
      ...(body.description !== undefined && { description: body.description })
    };

    // Update the rule
    const { data, error } = await supabase
      .from('pricing_time_based_rules')
      .update(updateData)
      .eq('id', params.id)
      .select();

    if (error) {
      console.error('Error updating time-based pricing rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Make sure we have data and it's an array with at least one item
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Failed to update time-based pricing rule' }, { status: 500 });
    }

    // Return the first item from the array
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error handling PATCH request for time-based pricing rule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE a specific time-based pricing rule
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseClient();
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the rule
    const { error } = await supabase
      .from('pricing_time_based_rules')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting time-based pricing rule:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error handling DELETE request for time-based pricing rule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 