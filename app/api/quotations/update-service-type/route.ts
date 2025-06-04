import { NextRequest, NextResponse } from 'next/server';
import { updateCharterServiceType } from '@/lib/api/quotations-service';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await updateCharterServiceType();
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to update service types' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${result.updatedCount} quotations with service type 'charter' to 'Charter Services (Hourly)'`,
      updatedQuotations: result.data
    });
    
  } catch (error) {
    console.error('Error handling update service type request:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 