import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { AppError, AuthenticationError, DatabaseError, ValidationError, NotFoundError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/error-handler';

import type { SupabaseClient as SC } from '@supabase/supabase-js';
type AppSupabaseClient = SC<Database, "public">;

type PricingItemRow = Database['public']['Tables']['pricing_items']['Row'];
type PricingItemUpdate = Database['public']['Tables']['pricing_items']['Update'];

async function verifyAdminAndGetUser(supabase: AppSupabaseClient) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new AuthenticationError('User not authenticated.');
  }
  const { data: adminUser, error: adminCheckError } = await supabase
    .from('admin_users').select('role').eq('id', user.id).single();
  if (adminCheckError) {
    throw new DatabaseError('Failed to verify admin status.', { cause: adminCheckError });
  }
  if (!adminUser) {
    throw new NotFoundError('Admin user record not found.');
  }
  if (adminUser.role !== 'admin') {
    throw new AuthenticationError('Forbidden: Admin access required.', 403);
  }
  return user;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const itemId = params.id;
  if (!itemId) {
    return handleApiError(new ValidationError('Pricing item ID is required.'));
  }
  try {
    const supabase = await getSupabaseServerClient();
    await verifyAdminAndGetUser(supabase);
    const { data, error } = await supabase.from('pricing_items').select('*').eq('id', itemId).single<PricingItemRow>();
    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundError(`Pricing item with ID ${itemId} not found.`);
      throw new DatabaseError('Failed to fetch pricing item.', { cause: error });
    }
    if (!data) throw new NotFoundError(`Pricing item with ID ${itemId} not found.`);
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error fetching pricing item ${itemId} (GET):`, err);
    if (err instanceof AppError) return handleApiError(err);
    return handleApiError(new AppError('Unexpected error fetching pricing item.', 500, { cause: err instanceof Error ? err : undefined, isOperational: true }));
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const itemId = params.id;
  if (!itemId) {
    return handleApiError(new ValidationError('Pricing item ID is required for update.'));
  }
  try {
    const supabase = await getSupabaseServerClient();
    await verifyAdminAndGetUser(supabase);
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      throw new ValidationError('Invalid JSON in request body.', undefined, 400, { cause: parseError as Error });
    }

    const updateData: Partial<PricingItemUpdate> = {};
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.duration_hours !== undefined) updateData.duration_hours = Number(body.duration_hours);
    if (body.category_id !== undefined) updateData.category_id = body.category_id;
    if (body.service_type_id !== undefined) updateData.service_type = body.service_type_id;
    if (body.vehicle_type !== undefined) updateData.vehicle_type = body.vehicle_type;
    if (body.sort_order !== undefined) (updateData as any).sort_order = Number(body.sort_order);

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No update data provided. At least one field must be specified.');
    }
    // updateData.updated_at = new Date().toISOString(); // Let DB handle default timestamp

    const { data, error } = await supabase.from('pricing_items').update(updateData as any).eq('id', itemId).select().single<PricingItemRow>();
    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundError(`Pricing item with ID ${itemId} not found for update.`);
      if (error.code === '23503') throw new AppError('Invalid category_id or service_type_id provided for update.', 400, { cause: error, isOperational: true });
      if (error.code === '23505') throw new AppError('Update would cause a unique constraint violation.', 409, { cause: error, isOperational: true });
      throw new DatabaseError('Failed to update pricing item.', { cause: error });
    }
    if (!data) throw new NotFoundError(`Pricing item with ID ${itemId} not found after update.`); // Should be caught by PGRST116
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error updating pricing item ${itemId} (PATCH):`, err);
    if (err instanceof AppError) return handleApiError(err);
    return handleApiError(new AppError('Unexpected error updating pricing item.', 500, { cause: err instanceof Error ? err : undefined, isOperational: true }));
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const itemId = params.id;
  if (!itemId) {
    return handleApiError(new ValidationError('Pricing item ID is required for replacement.'));
  }
  try {
    const supabase = await getSupabaseServerClient();
    await verifyAdminAndGetUser(supabase);
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      throw new ValidationError('Invalid JSON in request body.', undefined, 400, { cause: parseError as Error });
    }

    // For PUT, all required fields for an insert should ideally be present, or have clear defaults.
    // Assuming 'service_type' (stores ID), 'vehicle_type', 'price' are minimally required for a valid item.
    if (body.service_type_id === undefined || body.vehicle_type === undefined || typeof body.price !== 'number') {
      throw new ValidationError('Missing required fields for pricing item replacement: service_type_id, vehicle_type, price.');
    }

    const updateDataForPut: PricingItemUpdate = {
      category_id: body.category_id || null,
      service_type: body.service_type_id,
      vehicle_type: body.vehicle_type,
      duration_hours: body.duration_hours === undefined ? 1 : Number(body.duration_hours),
      price: Number(body.price),
      currency: body.currency || 'JPY',
      is_active: body.is_active !== undefined ? body.is_active : true,
    };
    if (body.sort_order !== undefined) (updateDataForPut as any).sort_order = Number(body.sort_order);

    const { data, error } = await supabase.from('pricing_items').update(updateDataForPut as any).eq('id', itemId).select().single<PricingItemRow>();
    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundError(`Pricing item with ID ${itemId} not found for replacement.`);
      if (error.code === '23503') throw new AppError('Invalid category_id or service_type_id provided for replacement.', 400, { cause: error, isOperational: true });
      if (error.code === '23505') throw new AppError('Replacement would cause a unique constraint violation.', 409, { cause: error, isOperational: true });
      throw new DatabaseError('Failed to replace pricing item.', { cause: error });
    }
    if (!data) throw new NotFoundError(`Pricing item with ID ${itemId} not found after replacement.`);
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error replacing pricing item ${itemId} (PUT):`, err);
    if (err instanceof AppError) return handleApiError(err);
    return handleApiError(new AppError('Unexpected error replacing pricing item.', 500, { cause: err instanceof Error ? err : undefined, isOperational: true }));
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const itemId = params.id;
  if (!itemId) {
    return handleApiError(new ValidationError('Pricing item ID is required for deletion.'));
  }
  try {
    const supabase = await getSupabaseServerClient();
    await verifyAdminAndGetUser(supabase);
    const { error, count } = await supabase.from('pricing_items').delete({ count: 'exact' }).eq('id', itemId);
    if (error) {
      throw new DatabaseError('Failed to delete pricing item.', { cause: error });
    }
    if (count === 0) {
      throw new NotFoundError(`Pricing item with ID ${itemId} not found or already deleted.`);
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(`Error deleting pricing item ${itemId} (DELETE):`, err);
    if (err instanceof AppError) return handleApiError(err);
    return handleApiError(new AppError('Unexpected error deleting pricing item.', 500, { cause: err instanceof Error ? err : undefined, isOperational: true }));
  }
} 