import { NextRequest, NextResponse } from 'next/server';
import { updateCharterServiceType } from '@/lib/api/quotations-service';

export async function POST(request: NextRequest) {
  try {
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