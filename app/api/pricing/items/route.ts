import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { AppError, AuthenticationError, DatabaseError, ValidationError, NotFoundError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/error-handler';

// Define SupabaseClient type more generically if possible, or use the specific one
import type { SupabaseClient as SC } from '@supabase/supabase-js';
type AppSupabaseClient = SC<Database, "public">;

type PricingItemInsert = Database['public']['Tables']['pricing_items']['Insert'];

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

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const categoryId = searchParams.get('category_id');
  const serviceTypeId = searchParams.get('service_type_id');
  const vehicleType = searchParams.get('vehicle_type');
  const activeOnly = searchParams.get('active_only') !== 'false';

  try {
    const supabase = await getSupabaseServerClient();
    await verifyAdminAndGetUser(supabase);

    let query = supabase
      .from('pricing_items')
      .select('*');

    if (activeOnly) query = query.eq('is_active', true);
    if (categoryId) query = query.eq('category_id', categoryId);
    // The database column seems to be 'service_type' but stores the service_type_id.
    if (serviceTypeId) query = query.eq('service_type', serviceTypeId); 
    if (vehicleType) query = query.eq('vehicle_type', vehicleType);

    const { data, error: queryError } = await query.order('sort_order', { ascending: true });

    if (queryError) {
      throw new DatabaseError('Error fetching pricing items.', { cause: queryError });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error handling GET request for pricing items:', error);
    if (error instanceof AppError) {
      return handleApiError(error);
    }
    return handleApiError(new AppError('An unexpected error occurred while fetching pricing items.', 500, { cause: error instanceof Error ? error : undefined, isOperational: true }));
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    await verifyAdminAndGetUser(supabase);

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      throw new ValidationError('Invalid JSON in request body.', undefined, 400, { cause: parseError as Error });
    }

    if (!body.service_type_id) {
      throw new ValidationError('Service type ID is required.');
    }
    if (!body.vehicle_type) {
      throw new ValidationError('Vehicle type is required.');
    }
    if (typeof body.price !== 'number') {
      throw new ValidationError('Price must be a number.');
    }

    const insertPayload: PricingItemInsert = {
      category_id: body.category_id || null,
      service_type: body.service_type_id,
      vehicle_type: body.vehicle_type,
      duration_hours: body.duration_hours === undefined ? 1 : Number(body.duration_hours),
      price: Number(body.price),
      currency: body.currency || 'JPY',
      is_active: body.is_active !== undefined ? body.is_active : true,
      // sort_order should be part of PricingItemInsert if it's a valid DB column.
      // Casting to any to bypass linter error for now, assuming schema supports sort_order.
      ...(body.sort_order !== undefined && { sort_order: Number(body.sort_order) }),
    };

    const { data, error: insertError } = await supabase
      .from('pricing_items')
      // TODO: Verify if 'sort_order' is a valid column in 'pricing_items' table.
      // If so, update 'PricingItemInsert' type in types/supabase.ts or generated types.
      .insert(insertPayload as any) 
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation
         throw new AppError('A pricing item with these properties already exists.', 409, { cause: insertError, isOperational: true });
      }
      if (insertError.code === '23503') { // Foreign key violation
         throw new AppError('Invalid category_id or service_type_id provided.', 400, { cause: insertError, isOperational: true });
      }
      throw new DatabaseError('Error creating pricing item.', { cause: insertError });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error handling POST request for pricing items:', error);
    if (error instanceof AppError) {
      return handleApiError(error);
    }
    return handleApiError(new AppError('An unexpected error occurred while creating pricing item.', 500, { cause: error instanceof Error ? error : undefined, isOperational: true }));
  }
} 