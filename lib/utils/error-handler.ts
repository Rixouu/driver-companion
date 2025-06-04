import { toast } from "@/components/ui/use-toast"
import { PostgrestError } from "@supabase/supabase-js"

// Define specific error types for better error classification
export enum ErrorType {
  DATABASE = "Database Error",
  NETWORK = "Network Error",
  VALIDATION = "Validation Error",
  AUTHENTICATION = "Authentication Error",
  PERMISSION = "Permission Error",
  RESOURCE_NOT_FOUND = "Not Found",
  SERVICE_UNAVAILABLE = "Service Unavailable",
  UNEXPECTED = "Unexpected Error"
}

// Error interface for consistent error structure
interface AppError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  details?: Record<string, unknown>;
}

// Create specific error for each type
export function createError(
  type: ErrorType,
  message: string,
  originalError?: unknown,
  details?: Record<string, unknown>
): AppError {
  return {
    type,
    message,
    originalError,
    details
  };
}

// Function to classify errors based on their type
function classifyError(error: unknown): AppError {
  if (error instanceof PostgrestError) {
    const { code, message, details } = error;
    
    // Classify PostgreSQL errors based on their code
    if (code?.startsWith("23")) {
      return createError(ErrorType.VALIDATION, 
        message || "Database constraint violation", 
        error, 
        { postgresCode: code, details });
    }
    
    if (code?.startsWith("28")) {
      return createError(ErrorType.PERMISSION, 
        message || "Insufficient permissions to perform this action", 
        error, 
        { postgresCode: code, details });
    }
    
    if (code?.startsWith("42")) {
      return createError(ErrorType.DATABASE, 
        message || "Database query error", 
        error, 
        { postgresCode: code, details });
    }
    
    // Default database error
    return createError(ErrorType.DATABASE, 
      message || "A database error occurred", 
      error, 
      { postgresCode: code, details });
  }
  
  if (error instanceof Error) {
    // Handle network errors
    if (error.name === "NetworkError" || error.message.includes("network")) {
      return createError(ErrorType.NETWORK, 
        "Unable to connect to the server. Please check your internet connection.", 
        error);
    }
    
    // Handle authentication errors
    if (error.message.includes("auth") || error.message.includes("token") || error.message.includes("login")) {
      return createError(ErrorType.AUTHENTICATION, 
        "Authentication error. Please log in again.", 
        error);
    }
    
    // Handle not found errors
    if (error.message.includes("not found") || error.message.includes("404")) {
      return createError(ErrorType.RESOURCE_NOT_FOUND, 
        "The requested resource could not be found.", 
        error);
    }
    
    // Default for general errors
    return createError(ErrorType.UNEXPECTED, 
      error.message || "An error occurred", 
      error);
  }
  
  // Fallback for unknown errors
  return createError(ErrorType.UNEXPECTED, 
    "An unexpected error occurred", 
    error);
}

// Log error to console with structured format
function logError(appError: AppError) {
  console.error("Error:", {
    type: appError.type,
    message: appError.message,
    details: appError.details,
    originalError: appError.originalError
  });
  
  // Here you could also send to error tracking service like Sentry
}

// The main error handler function
export function handleError(error: unknown) {
  const appError = classifyError(error);
  
  // Log error
  logError(appError);
  
  // Display toast notification
  if (typeof window !== "undefined") {
    toast({
      title: appError.type,
      description: appError.message,
      variant: "destructive",
    });
  }
  
  return appError;
}

// Utility function for async operations with automatic error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  customErrorMessage?: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(customErrorMessage ? 
      new Error(customErrorMessage, { cause: error }) : 
      error);
    return null;
  }
} 