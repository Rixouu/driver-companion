import { NextResponse } from 'next/server';

/**
 * Standardized error response utility
 * Ensures all API routes return consistent error formats
 */

export interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
  details?: any;
}

export function createErrorResponse(
  message: string,
  code: string,
  status: number = 500,
  details?: any
): NextResponse<ErrorResponse> {
  const errorResponse: ErrorResponse = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };

  console.error(`❌ API Error [${code}]:`, message, details ? { details } : '');

  return NextResponse.json(errorResponse, { status });
}

export function createTimeoutResponse(operation: string): NextResponse<ErrorResponse> {
  return createErrorResponse(
    `Operation timeout: ${operation} took too long to complete`,
    'OPERATION_TIMEOUT',
    504
  );
}

export function createValidationResponse(message: string, details?: any): NextResponse<ErrorResponse> {
  return createErrorResponse(
    message,
    'VALIDATION_ERROR',
    400,
    details
  );
}

export function createNotFoundResponse(resource: string): NextResponse<ErrorResponse> {
  return createErrorResponse(
    `${resource} not found`,
    'RESOURCE_NOT_FOUND',
    404
  );
}

export function createUnauthorizedResponse(): NextResponse<ErrorResponse> {
  return createErrorResponse(
    'Unauthorized access',
    'UNAUTHORIZED',
    401
  );
}

export function createServiceUnavailableResponse(service: string): NextResponse<ErrorResponse> {
  return createErrorResponse(
    `${service} is currently unavailable`,
    'SERVICE_UNAVAILABLE',
    503
  );
}
