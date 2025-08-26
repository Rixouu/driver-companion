import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';
import { AppError, AuthenticationError, DatabaseError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/error-handler';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Verify user is authenticated (but don't require admin role)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthenticationError('User not authenticated.');
    }

    // Build the query - only fetch essential fields for display
    const query = supabase
      .from('pricing_categories')
      .select('id, name, description, service_type_ids, is_active')
      .eq('is_active', true) // Only show active categories
      .order('sort_order', { ascending: true });

    const { data, error: queryError } = await query;

    if (queryError) {
      throw new DatabaseError('Error fetching pricing categories.', { cause: queryError });
    }

    // Add caching headers for better performance
    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return response;
  } catch (error) {
    console.error('Error handling GET request for pricing categories display:', error);
    if (error instanceof AppError) {
      return handleApiError(error);
    }
    return handleApiError(new AppError('An unexpected error occurred while fetching pricing categories.', 500, { cause: error instanceof Error ? error : undefined, isOperational: true }));
  }
}
