import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { NextResponse } from 'next/server';

/**
 * Creates a typed Supabase client for use in API routes
 */
export function createAPIClient() {
  return createRouteHandlerClient<Database>({ cookies });
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
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`API Error: ${errorMessage}`, error);
    
    // Handle Supabase errors specifically
    if (error?.code && error?.message) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    
    // Handle generic errors
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 