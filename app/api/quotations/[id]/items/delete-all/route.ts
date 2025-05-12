import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Create the Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Ensure user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const quotationId = params.id;
    
    // Verify the quotation exists
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('id')
      .eq('id', quotationId)
      .single();
    
    if (quotationError || !quotation) {
      console.log('Quotation check failed:', quotationError);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Delete all items for this quotation
    const { error: deleteError } = await supabase
      .from('quotation_items')
      .delete()
      .eq('quotation_id', quotationId);
    
    if (deleteError) {
      console.error('Error deleting items:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete items', details: deleteError },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Deleted all items for quotation ${quotationId}`
    });
  } catch (error) {
    console.error('Unexpected error in deleting items:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error },
      { status: 500 }
    );
  }
} 