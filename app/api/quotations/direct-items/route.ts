import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error in direct-items:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quotationId = searchParams.get('id');

    if (!quotationId) {
      return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching quotation items (direct-items):', error);
      return NextResponse.json({ error: 'Failed to fetch quotation items' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in direct-items API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 