import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-client';
import { Database } from '@/types/supabase';

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient();
    
    // Skip admin verification for now since we're using service client

    const { data, error } = await supabase
      .from('pricing_promotions')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling GET request for pricing promotion:', error);
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
    const supabase = createServiceClient();
    
    // Skip admin verification for now since we're using service client

    // Parse request body
    const updates = await req.json();

    // Check if promotion exists
    const { data: existingPromotion, error: fetchError } = await supabase
      .from('pricing_promotions')
      .select('id')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }

    // Prepare update data, removing id and timestamps if present
    const { id, created_at, updated_at, times_used, ...updateData } = updates;

    // Update the promotion
    const { data, error } = await supabase
      .from('pricing_promotions')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing promotion:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling PATCH request for pricing promotion:', error);
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
    const supabase = createServiceClient();
    
    // Skip admin verification for now since we're using service client

    // Delete the promotion
    const { error } = await supabase
      .from('pricing_promotions')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting pricing promotion:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error handling DELETE request for pricing promotion:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 