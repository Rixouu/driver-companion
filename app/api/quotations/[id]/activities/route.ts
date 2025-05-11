import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-client';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get quotation ID from params properly in Next.js 15 - must await params
    const { id: quotationId } = await params;
    console.log('Activities GET - Quotation ID:', quotationId);
    
    // Use service client only - no cookie dependency
    const serviceClient = createServiceClient();
    
    // Fetch activities directly without authentication check
    const { data, error } = await serviceClient
      .from('quotation_activities')
      .select('id, quotation_id, user_id, action, details, created_at')
      .eq('quotation_id', quotationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('Activities found:', data?.length || 0);
    
    // Return raw data without user_name processing
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error in activities API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 