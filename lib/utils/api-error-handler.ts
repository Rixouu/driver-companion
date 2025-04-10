import { NextResponse } from "next/server";
import { ErrorType } from "./error-handler";

// Standard error response interface
interface ErrorResponse {
  error: {
    type: string;
    message: string;
    code?: number;
    details?: Record<string, unknown>;
  };
}

// Error status code mapping
const errorStatusCodes = {
  [ErrorType.AUTHENTICATION]: 401,
  [ErrorType.PERMISSION]: 403,
  [ErrorType.RESOURCE_NOT_FOUND]: 404,
  [ErrorType.VALIDATION]: 422,
  [ErrorType.DATABASE]: 500,
  [ErrorType.SERVICE_UNAVAILABLE]: 503,
  [ErrorType.NETWORK]: 500,
  [ErrorType.UNEXPECTED]: 500,
};

/**
 * Create a standardized API error response
 */
export function createApiErrorResponse(
  errorType: ErrorType,
  message: string,
  details?: Record<string, unknown>
): NextResponse<ErrorResponse> {
  const statusCode = errorStatusCodes[errorType] || 500;
  
  return NextResponse.json(
    {
      error: {
        type: errorType,
        message,
        code: statusCode,
        details,
      },
    },
    { status: statusCode }
  );
}

/**
 * Handle API errors with consistent response format
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);
  
  if (error instanceof Error) {
    // Handle specific error types if needed
    if (error.message.includes("not found")) {
      return createApiErrorResponse(
        ErrorType.RESOURCE_NOT_FOUND,
        "The requested resource could not be found"
      );
    }
    
    if (error.message.includes("permission") || error.message.includes("unauthorized")) {
      return createApiErrorResponse(
        ErrorType.PERMISSION,
        "You don't have permission to perform this action"
      );
    }
    
    if (error.message.includes("validation")) {
      return createApiErrorResponse(
        ErrorType.VALIDATION,
        "The provided data is invalid"
      );
    }
    
    // Default error response
    return createApiErrorResponse(
      ErrorType.UNEXPECTED,
      error.message || "An unexpected error occurred"
    );
  }
  
  // Fallback for unknown errors
  return createApiErrorResponse(
    ErrorType.UNEXPECTED,
    "An unexpected server error occurred"
  );
}

/**
 * Wrapper for API handlers with automatic error handling
 */
export function withApiErrorHandling<T>(handler: () => Promise<T>) {
  return async () => {
    try {
      return await handler();
    } catch (error) {
      return handleApiError(error);
    }
  };
} 