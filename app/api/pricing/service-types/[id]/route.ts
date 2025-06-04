import { NextResponse } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // Old
// import { cookies } from 'next/headers'; // No longer needed directly
import { getSupabaseServerClient } from '@/lib/supabase/server'; // Corrected import
import { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic'; // Recommended for routes with auth or dynamic data

// Helper to validate UUID
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
}

export async function GET(
  request: Request,
  { params: paramsInput }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient(); // Corrected instantiation
    const { data: { user }, error: authError } = await supabase.auth.getUser(); // New auth
    if (authError || !user) {
      console.log('[GET /api/pricing/service-types/[id]] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await paramsInput;
    const id = params.id;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid service type ID format' }, { status: 400 });
    }

    console.log(`[GET /api/pricing/service-types/[id]] Fetching service type: ${id}`);

    const { data: serviceType, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[GET /api/pricing/service-types/[id]] Error fetching service type:', error);
      // If error is due to no rows found (PostgREST code P0002 for .single())
      if (error.code === 'PGRST116') { // PGRST116: JSON object requested, multiple (or no) rows returned
        return NextResponse.json({ error: 'Service type not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch service type', details: error.message }, { status: 500 });
    }

    if (!serviceType) {
      return NextResponse.json({ error: 'Service type not found' }, { status: 404 });
    }

    return NextResponse.json(serviceType);

  } catch (error) {
    console.error('[GET /api/pricing/service-types/[id]] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params: paramsInput }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient(); // Corrected instantiation
    const { data: { user: putUser }, error: putAuthError } = await supabase.auth.getUser(); // New auth
    if (putAuthError || !putUser) {
      console.log(`[PUT /api/pricing/service-types/[id]] Unauthorized attempt`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await paramsInput;
    const id = params.id;

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid service type ID format' }, { status: 400 });
    }

    const body = await request.json();
    console.log(`[PUT /api/pricing/service-types/[id]] Updating service type ${id} with body:`, body);

    const updateData: Partial<Database['public']['Tables']['service_types']['Update']> = {};

    if (body.name && typeof body.name === 'string' && body.name.trim() !== '') {
      updateData.name = body.name.trim();
    } else if (body.name !== undefined) { // Allow explicitly setting name to empty if desired, though DB constraint will prevent it
        return NextResponse.json({ error: 'Name is required and cannot be empty' }, { status: 400 });
    }

    if (body.description !== undefined) {
      updateData.description = body.description === '' ? null : body.description;
    }
    if (body.is_active !== undefined && typeof body.is_active === 'boolean') {
      updateData.is_active = body.is_active;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString(); // Manually set updated_at

    const { data: updatedServiceType, error } = await supabase
      .from('service_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PUT /api/pricing/service-types/[id]] Error updating service type:', error);
      if (error.code === '23505') { // unique_violation for name
        return NextResponse.json({ error: 'A service type with this name already exists', details: error.message }, { status: 409 });
      }
      if (error.code === 'PGRST116') { // No row found for update
        return NextResponse.json({ error: 'Service type not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update service type', details: error.message }, { status: 500 });
    }
    
    if (!updatedServiceType) {
      // Should be caught by PGRST116, but as a safeguard
      return NextResponse.json({ error: 'Service type not found after update attempt' }, { status: 404 });
    }

    console.log('[PUT /api/pricing/service-types/[id]] Service type updated successfully:', updatedServiceType);
    return NextResponse.json(updatedServiceType);

  } catch (error) {
    console.error('[PUT /api/pricing/service-types/[id]] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params: paramsInput }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient(); // Corrected instantiation
    const { data: { user: deleteUser }, error: deleteAuthError } = await supabase.auth.getUser(); // New auth
    if (deleteAuthError || !deleteUser) {
      console.log('[DELETE /api/pricing/service-types/[id]] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await paramsInput;
    const idToDelete = params.id;

    if (!isValidUUID(idToDelete)) {
      return NextResponse.json({ error: 'Invalid service type ID format' }, { status: 400 });
    }

    // The rest of the DELETE handler logic was removed in a previous incorrect edit.
    // Placeholder for the actual delete logic:
    // console.log(`[DELETE /api/pricing/service-types/[id]] Attempting to delete service type: ${idToDelete}`);
    // Perform deletion from 'service_types' and handle related tables (e.g., 'pricing_categories')

    // For now, return a placeholder response until the logic is restored.
    return NextResponse.json({ message: `DELETE operation for ${idToDelete} needs to be fully implemented.` });

  } catch (error) {
    console.error('[DELETE /api/pricing/service-types/[id]] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}