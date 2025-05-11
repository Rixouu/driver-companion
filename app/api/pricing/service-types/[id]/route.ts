import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // Assuming Database types are generated

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
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session: sessionGet }, error: sessionErrorGet } = await supabase.auth.getSession();
    if (sessionErrorGet || !sessionGet) {
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
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session: sessionPut }, error: sessionErrorPut } = await supabase.auth.getSession();
    if (sessionErrorPut || !sessionPut) {
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
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session: sessionDelete }, error: sessionErrorDelete } = await supabase.auth.getSession();
    if (sessionErrorDelete || !sessionDelete) {
      console.log('[DELETE /api/pricing/service-types/[id]] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await paramsInput;
    const idToDelete = params.id;

    if (!isValidUUID(idToDelete)) {
      return NextResponse.json({ error: 'Invalid service type ID format' }, { status: 400 });
    }

    console.log(`[DELETE /api/pricing/service-types/[id]] Attempting to delete service type: ${idToDelete}`);

    // Step 1: Remove the service type ID from any pricing_categories.service_type_ids arrays
    // This needs to be done carefully. We fetch categories containing the ID, then update them.
    const { data: categoriesToUpdate, error: fetchCategoriesError } = await supabase
      .from('pricing_categories')
      .select('id, service_type_ids')
      .contains('service_type_ids', [idToDelete]); // Check if array contains the UUID

    if (fetchCategoriesError) {
      console.error('[DELETE] Error fetching pricing categories for update:', fetchCategoriesError);
      return NextResponse.json({ error: 'Failed to prepare categories for service type deletion', details: fetchCategoriesError.message }, { status: 500 });
    }

    if (categoriesToUpdate && categoriesToUpdate.length > 0) {
      for (const category of categoriesToUpdate) {
        const updatedIdArray = (category.service_type_ids || []).filter(uuid => uuid !== idToDelete);
        const { error: updateCategoryError } = await supabase
          .from('pricing_categories')
          .update({ service_type_ids: updatedIdArray })
          .eq('id', category.id);
        if (updateCategoryError) {
          console.error(`[DELETE] Error updating category ${category.id} to remove service type ${idToDelete}:`, updateCategoryError);
          // Decide if this is a fatal error or if we should proceed with service_type deletion
          return NextResponse.json({ error: `Failed to update category ${category.id} during service type deletion`, details: updateCategoryError.message }, { status: 500 });
        }
      }
      console.log(`[DELETE] Successfully removed service type ${idToDelete} from ${categoriesToUpdate.length} pricing categories.`);
    }

    // Step 2: Attempt to delete the service type from service_types table
    // The FK ON DELETE RESTRICT on pricing_items will prevent this if it's linked to active items.
    const { error: deleteServiceTypeError } = await supabase
      .from('service_types')
      .delete()
      .eq('id', idToDelete);

    if (deleteServiceTypeError) {
      console.error('[DELETE /api/pricing/service-types/[id]] Error deleting service type:', deleteServiceTypeError);
      if (deleteServiceTypeError.code === '23503') { // foreign_key_violation
         return NextResponse.json({ error: 'Cannot delete service type: It is currently referenced by one or more pricing items. Please remove those associations first.', details: deleteServiceTypeError.message }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to delete service type', details: deleteServiceTypeError.message }, { status: 500 });
    }

    console.log(`[DELETE /api/pricing/service-types/[id]] Service type ${idToDelete} deleted successfully (or was not found).`);
    // A 204 No Content is often suitable for a successful DELETE if no body is returned.
    // However, to match previous patterns, returning a success JSON.
    return NextResponse.json({ success: true, message: `Service type ${idToDelete} deleted successfully.` });

  } catch (error) {
    console.error('[DELETE /api/pricing/service-types/[id]] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
} 