import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/index';
import { handleApiError } from '@/lib/errors/error-handler';
import { AppError } from '@/lib/errors/app-error';

/**
 * Creates a typed Supabase client for use in API routes (Route Handlers)
 */
export async function createAPIClient() {
  const cookieStore = await cookies();
  return createServerClient(cookieStore);
}

/**
 * Type-safe utility for handling database pagination
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Apply pagination to a Supabase query
 */
export function applyPagination(query: any, params: PaginationParams) {
  const { page = 1, pageSize = 10 } = params;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;
  
  return query.range(start, end);
}

/**
 * Type-safe utility for handling database sorting
 */
export interface SortingParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Apply sorting to a Supabase query
 */
export function applySorting(query: any, params: SortingParams) {
  const { sortBy, sortOrder = 'asc' } = params;
  
  if (sortBy) {
    return query.order(sortBy, { ascending: sortOrder === 'asc' });
  }
  
  return query;
}

/**
 * A wrapper around a database operation that handles errors consistently
 * 
 * @param operation - The async database operation to perform
 * @param errorMessage - A user-friendly error message
 * @returns A Promise resolving to a NextResponse
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorMessage: string = "An error occurred while processing your request"
): Promise<NextResponse> {
  try {
    const result = await operation();
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    let additionalInfo: Record<string, any> | undefined;
    if (errorMessage !== "An error occurred while processing your request") {
      additionalInfo = { defaultUserMessage: errorMessage };
    }
    
    if (error && typeof error === 'object' && 'code' in error && 'message' in error && !(error instanceof AppError)) {
        // Potentially create a DatabaseError or a generic AppError here
        // For now, let handleApiError manage this, it will create a generic AppError
    }

    return handleApiError(error, additionalInfo);
  }
}

// Removed problematic getCookieStore function
// Callers in server contexts should use 'await cookies()' from 'next/headers' directly
// or ensure they are in a context where the cookies function reference is passed (e.g. to createRouteHandlerClient). 