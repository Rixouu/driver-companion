import { getSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  // Create server-side Supabase client with auth cookies
  const supabase = await getSupabaseServerClient();
  
  try {
    // Check authorization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const params = await paramsPromise;
  try {
    // Create the Supabase client
    const supabase = await getSupabaseServerClient();
    
    // Ensure user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    const body = await request.json();
    
    // Sanitize input data to prevent UUID conversion errors
    const sanitizedData: Record<string, any> = {};
    
    // Process each field, converting empty strings to null for UUID fields
    Object.entries(body).forEach(([key, value]) => {
      // UUID fields that need to be null instead of empty string
      const uuidFields = ['customer_id', 'service_type_id', 'merchant_id'];
      
      if (uuidFields.includes(key) && value === '') {
        sanitizedData[key] = null;
      } else {
        sanitizedData[key] = value;
      }
    });
    
    console.log('Updating quotation:', id);
    console.log('Sanitized update data:', sanitizedData);

    // Update the quotation with sanitized data
    const { data, error } = await supabase
      .from('quotations')
      .update(sanitizedData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating quotation:', error);
      return NextResponse.json(
        { error: 'Failed to update quotation', details: error },
        { status: 500 }
      );
    }
    
    // Log activity
    try {
      await supabase
        .from('quotation_activities')
        .insert({
          quotation_id: id,
          user_id: user.id,
          action: 'updated',
          details: JSON.stringify({ changes: sanitizedData })
        });
    } catch (activityError) {
      console.error('Failed to log activity:', activityError);
      // Continue anyway, this is non-critical
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error in PATCH handler:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error },
      { status: 500 }
    );
  }
} 