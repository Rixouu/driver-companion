import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
// import { PricingCategory } from '@/types/quotations'; // This type might not be exactly what's needed for DB operations.
import { Database } from '@/types/supabase';
import { AppError, AuthenticationError, DatabaseError, ValidationError, NotFoundError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/error-handler';

export const dynamic = "force-dynamic";

// Define SupabaseClient type more generically if possible, or use the specific one
import type { SupabaseClient } from '@supabase/supabase-js';

type AppSupabaseClient = SupabaseClient<Database, "public">;

type PricingCategoryRow = Database['public']['Tables']['pricing_categories']['Row'];
type PricingCategoryUpdate = Database['public']['Tables']['pricing_categories']['Update'];

async function verifyAdminAndGetUser(supabase: AppSupabaseClient) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new AuthenticationError('User not authenticated.');
  }

  const { data: adminUser, error: adminCheckError } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (adminCheckError) {
    throw new DatabaseError('Failed to verify admin status.', { cause: adminCheckError });
  }
  if (!adminUser) {
    throw new NotFoundError('Admin user record not found for the authenticated user.');
  }
  if (adminUser.role !== 'admin') {
    throw new AuthenticationError('Forbidden: Admin access required.', 403);
  }
  return user;
}

// GET handler for fetching a specific pricing category
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient();
  const categoryId = params.id;

  if (!categoryId) {
    return handleApiError(new ValidationError('Pricing category ID is required.'));
  }

  try {
    await verifyAdminAndGetUser(supabase);

    const { data, error } = await supabase
      .from('pricing_categories')
      .select('*')
      .eq('id', categoryId)
      .single<PricingCategoryRow>();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error for "Searched for one row, but found 0"
        throw new NotFoundError(`Pricing category with ID ${categoryId} not found.`);
      }
      throw new DatabaseError('Failed to fetch pricing category.', { cause: error });
    }
    
    if (!data) {
       throw new NotFoundError(`Pricing category with ID ${categoryId} not found.`);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error fetching pricing category ${categoryId} (GET):`, err);
    if (err instanceof AppError) {
      return handleApiError(err);
    }
    return handleApiError(new AppError('An unexpected error occurred while fetching the pricing category.', 500, { cause: err instanceof Error ? err : undefined, isOperational: true }));
  }
}

// PATCH handler for updating a pricing category
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient();
  const categoryId = params.id;

  if (!categoryId) {
    return handleApiError(new ValidationError('Pricing category ID is required for update.'));
  }

  try {
    const user = await verifyAdminAndGetUser(supabase);

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      throw new ValidationError('Invalid JSON in request body.', undefined, 400, { cause: parseError as Error });
    }
    
    const updateData: PricingCategoryUpdate = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.sort_order !== undefined) updateData.sort_order = Number(body.sort_order);
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    
    // Handling service_type_ids and service_types (array of names)
    // This logic was present in the original code. Ensure 'service_types' column exists or adjust.
    if (body.service_type_ids !== undefined) {
      updateData.service_type_ids = body.service_type_ids;
      let serviceTypeNames: string[] = [];
      if (Array.isArray(body.service_type_ids) && body.service_type_ids.length > 0) {
        const { data: serviceTypesResults, error: stError } = await supabase
          .from('service_types')
          .select('id, name')
          .in('id', body.service_type_ids);
        
        if (stError) {
            console.warn('Error fetching service type names during category update:', stError.message);
            // Decide if this is critical. For now, proceed with IDs only if names fail.
        }

        const serviceTypeMap = new Map<string, string>();
        if (serviceTypesResults) {
          serviceTypesResults.forEach(st => serviceTypeMap.set(st.id, st.name));
        }
        // Default to a generic name if a specific service type ID isn't found (e.g., it was deleted)
        serviceTypeNames = body.service_type_ids.map((id: string) => serviceTypeMap.get(id) || `Service ID: ${id.substring(0, 8)}`);
      }
      // Ensure 'service_types' column exists in your 'pricing_categories' table
      // If not, this line will cause an error or be ignored by Supabase.
      // This is based on original code's attempt to update 'service_types'.
      if (updateData.service_types !== undefined) { // Check if schema supports this
         updateData.service_types = serviceTypeNames;
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No update data provided. At least one field must be specified for update.');
    }
    updateData.updated_at = new Date().toISOString(); // Let Supabase handle this with default now() or trigger

    const { data, error } = await supabase
      .from('pricing_categories')
      .update(updateData)
      .eq('id', categoryId)
      .select()
      .single<PricingCategoryRow>();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Pricing category with ID ${categoryId} not found for update.`);
      }
      throw new DatabaseError('Failed to update pricing category.', { cause: error });
    }
    if (!data) { // Should be redundant if single() and PGRST116 is handled, but good for safety.
        throw new NotFoundError(`Pricing category with ID ${categoryId} not found after attempting update.`);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error(`Error updating pricing category ${categoryId} (PATCH):`, err);
    if (err instanceof AppError) {
      return handleApiError(err);
    }
    return handleApiError(new AppError('An unexpected error occurred while updating the pricing category.', 500, { cause: err instanceof Error ? err : undefined, isOperational: true }));
  }
}

// DELETE handler for deleting a pricing category
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient();
  const categoryId = params.id;

  if (!categoryId) {
    return handleApiError(new ValidationError('Pricing category ID is required for deletion.'));
  }

  try {
    await verifyAdminAndGetUser(supabase);

    const { error, count } = await supabase
      .from('pricing_categories')
      .delete({ count: 'exact' }) // Request count to see if a row was deleted
      .eq('id', categoryId);

    if (error) {
      throw new DatabaseError('Failed to delete pricing category.', { cause: error });
    }
    
    if (count === 0) {
      throw new NotFoundError(`Pricing category with ID ${categoryId} not found or already deleted.`);
    }

    return new NextResponse(null, { status: 204 }); // No content
  } catch (err) {
    console.error(`Error deleting pricing category ${categoryId} (DELETE):`, err);
    if (err instanceof AppError) {
      return handleApiError(err);
    }
    return handleApiError(new AppError('An unexpected error occurred while deleting the pricing category.', 500, { cause: err instanceof Error ? err : undefined, isOperational: true }));
  }
} 