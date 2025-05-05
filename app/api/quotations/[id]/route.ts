import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Create server-side Supabase client with auth cookies
  const supabase = await createServerSupabaseClient();
  
  try {
    // Check authorization
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the quotation ID from URL params
    const { id } = params;
    
    // Fetch quotation with items for PDF generation
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*, quotation_items (*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching quotation:', error);
      return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
    }
    
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    
    return NextResponse.json(quotation);
  } catch (error) {
    console.error('Unhandled error in quotation API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 