import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Assuming Database types are generated

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session: sessionGet }, error: sessionErrorGet } = await supabase.auth.getSession();
    if (sessionErrorGet || !sessionGet) {
      console.log('[GET /api/pricing/service-types] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[GET /api/pricing/service-types] Fetching service types from service_types table');
    
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    const { data: serviceTypes, error } = await supabase
      .from('service_types')
      .select('*') // Select all columns: id, name, description, is_active, created_at, updated_at
      .order('name', { ascending: true });
    
    if (error) {
      console.error('[GET /api/pricing/service-types] Error fetching service types:', error);
      return NextResponse.json({ error: 'Failed to fetch service types', details: error.message }, { status: 500 });
    }
    
    console.log(`[GET /api/pricing/service-types] Returning ${serviceTypes?.length || 0} service types`);
    return NextResponse.json(serviceTypes || [], { headers });

  } catch (error) {
    console.error('[GET /api/pricing/service-types] Unexpected error:', error);
    // Ensure error is an instance of Error for proper message handling
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session: sessionPost }, error: sessionErrorPost } = await supabase.auth.getSession();
    if (sessionErrorPost || !sessionPost) {
      console.log('[POST /api/pricing/service-types] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const serviceTypeData = {
      name: body.name.trim(),
      description: body.description || null, // Ensure description is null if not provided or empty
      is_active: body.is_active !== undefined ? body.is_active : true,
    };

    console.log('[POST /api/pricing/service-types] Creating new service type:', serviceTypeData);
    
    // Insert into the new service_types table
    // Supabase will automatically fill id, created_at, updated_at
    const { data: newServiceType, error } = await supabase
      .from('service_types')
      .insert(serviceTypeData)
      .select() // Return the inserted row
      .single(); // Expect a single row to be returned
    
    if (error) {
      console.error('[POST /api/pricing/service-types] Error creating service type:', error);
      // Handle unique constraint violation for name specifically
      if (error.code === '23505') { // PostgreSQL unique_violation error code
        return NextResponse.json({ error: 'A service type with this name already exists', details: error.message }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create service type', details: error.message }, { status: 500 });
    }
    
    console.log('[POST /api/pricing/service-types] Service type created successfully:', newServiceType);
    return NextResponse.json(newServiceType, { status: 201 });

  } catch (error) {
    console.error('[POST /api/pricing/service-types] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
} 