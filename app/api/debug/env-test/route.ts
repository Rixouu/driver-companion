import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
      allSupabaseKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
    };

    // Try to create service client
    let serviceClientStatus = 'NOT_ATTEMPTED';
    try {
      const { createServiceClient } = await import('@/lib/supabase/service-client');
      const client = createServiceClient();
      serviceClientStatus = 'SUCCESS';
    } catch (error) {
      serviceClientStatus = `FAILED: ${error instanceof Error ? error.message : String(error)}`;
    }

    return NextResponse.json({
      success: true,
      environment: envVars,
      serviceClientStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
