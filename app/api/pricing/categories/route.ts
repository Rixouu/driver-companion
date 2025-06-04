import { NextRequest, NextResponse } from 'next/server';
// import { cookies } from 'next/headers'; // No longer needed if using getSupabaseServerClient directly
// import { createServerClient, type CookieOptions } from '@supabase/ssr'; // No longer needed
import { getSupabaseServerClient } from '@/lib/supabase/server'; // Use the centralized one
import { Database } from '@/types/supabase';
import { AppError, AuthenticationError, DatabaseError, ValidationError, NotFoundError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/error-handler';

// Helper function to create Supabase client for Route Handlers - REMOVED

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const activeOnly = searchParams.get('active_only') !== 'false';

  try {
    const supabase = await getSupabaseServerClient(); // Use the centralized helper
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthenticationError('User not authenticated.');
    }

    // Check if user has admin role
    const { data: adminUser, error: adminCheckError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminCheckError) {
      throw new DatabaseError('Failed to check admin status.', { cause: adminCheckError });
    }
    if (!adminUser) {
      throw new NotFoundError('Admin user record not found.');
    }
    if (adminUser.role !== 'admin') {
      throw new AuthenticationError('Forbidden: Admin access required.', 403);
    }

    // Build the query
    let query = supabase
      .from('pricing_categories')
      .select('id, name, description, service_type_ids, sort_order, is_active, created_at, updated_at');

    // Apply filters
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Add ordering
    query = query.order('sort_order', { ascending: true });

    const { data, error: queryError } = await query;

    if (queryError) {
      throw new DatabaseError('Error fetching pricing categories.', { cause: queryError });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling GET request for pricing categories:', error);
    if (error instanceof AppError) {
      return handleApiError(error);
    }
    return handleApiError(new AppError('An unexpected error occurred while fetching pricing categories.', 500, { cause: error instanceof Error ? error : undefined, isOperational: true }));
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient(); // Use the centralized helper
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthenticationError('User not authenticated.');
    }

    // Check if user has admin role
    const { data: adminUser, error: adminCheckError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminCheckError) {
      throw new DatabaseError('Failed to check admin status.', { cause: adminCheckError });
    }
    if (!adminUser) {
      throw new NotFoundError('Admin user record not found.');
    }
    if (adminUser.role !== 'admin') {
      throw new AuthenticationError('Forbidden: Admin access required.', 403);
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      throw new ValidationError('Invalid JSON in request body.', undefined, 400, { cause: parseError as Error });
    }
    

    // Validate required fields
    if (!body.name) {
      throw new ValidationError('Category name is required.');
    }

    // Type assertion for insert payload - ensure this matches your table definition
    type PricingCategoryInsert = Database['public']['Tables']['pricing_categories']['Insert'];
    
    const insertPayload: PricingCategoryInsert = {
      name: body.name,
      description: body.description || null,
      service_types: body.service_type_ids || [],
      service_type_ids: body.service_type_ids || [],
      sort_order: body.sort_order === undefined ? 1 : Number(body.sort_order),
      is_active: body.is_active !== undefined ? body.is_active : true,
      // merchant_id: user.id, // Assuming merchant_id should be linked to the admin user creating it. This needs to be in your DB schema.
    };


    // Create the category
    const { data, error: insertError } = await supabase
      .from('pricing_categories')
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      // Handle potential conflict (e.g., unique name constraint)
      if (insertError.code === '23505') { // PostgreSQL unique violation error code
        throw new AppError('A pricing category with this name already exists.', 409, { cause: insertError, isOperational: true });
      }
      throw new DatabaseError('Error creating pricing category.', { cause: insertError });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error handling POST request for pricing category:', error);
     if (error instanceof AppError) {
      return handleApiError(error);
    }
    return handleApiError(new AppError('An unexpected error occurred while creating pricing category.', 500, { cause: error instanceof Error ? error : undefined, isOperational: true }));
  }
} 