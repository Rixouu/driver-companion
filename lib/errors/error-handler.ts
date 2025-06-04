import { AppError, AuthenticationError, DatabaseError, ValidationError, NotFoundError, ExternalServiceError } from './app-error';
import { NextResponse } from 'next/server';
import * as Sentry from "@sentry/nextjs";

// Enum for log severity levels
export enum LogSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Interface for a generic error response, can be expanded
interface ErrorResponse {
  message: string;
  statusCode: number;
  error?: any; // Additional error details, e.g., validation errors
  isOperational?: boolean;
}

/**
 * Logs the error with a specified severity level.
 * This is a basic implementation. In a real app, integrate with a logging service.
 */
function logError(
  error: Error | AppError,
  severity: LogSeverity = LogSeverity.ERROR,
  additionalInfo?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error.message || 'Unknown error';
  const isAppError = error instanceof AppError;
  const operationalStatus = isAppError ? (error as AppError).isOperational : 'N/A';

  // Basic structured logging to console
  console.error(
    `[${timestamp}] [${severity.toUpperCase()}] ${errorMessage}`,
    {
      // ...(isAppError && { statusCode: (error as AppError).statusCode }), // Already in response
      isOperational: operationalStatus,
      ...(additionalInfo && { details: additionalInfo }),
      stack: process.env.NODE_ENV === 'development' || severity === LogSeverity.CRITICAL ? error.stack : 'Stack hidden in production for non-critical errors',
    }
  );

  // Report to Sentry
  if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DSN) { // Only report if SENTRY_DSN is available or in production
    const sentrySeverity = mapLogSeverityToSentry(severity);
    Sentry.captureException(error, {
      level: sentrySeverity,
      extra: {
        timestamp,
        isOperational: operationalStatus,
        ...(isAppError && { statusCode: (error as AppError).statusCode }),
        ...additionalInfo,
      },
    });
  }
  
  // Future integration: 
  // if (loggingService.isInitialized()) {
  //   loggingService.log(severity, errorMessage, { 
  //     stack: error.stack, 
  //     isOperational: operationalStatus,
  //     statusCode: isAppError ? (error as AppError).statusCode : undefined,
  //     ...additionalInfo 
  //   });
  // }
}

/**
 * Maps internal LogSeverity to Sentry's Severity levels.
 */
function mapLogSeverityToSentry(severity: LogSeverity): Sentry.SeverityLevel {
  switch (severity) {
    case LogSeverity.DEBUG:
      return "debug";
    case LogSeverity.INFO:
      return "info";
    case LogSeverity.WARNING:
      return "warning";
    case LogSeverity.ERROR:
      return "error";
    case LogSeverity.CRITICAL:
      return "fatal"; // Sentry uses 'fatal' for critical issues. 'critical' is also an option.
    default:
      return "error"; // Default to error
  }
}

/**
 * Handles errors and prepares an appropriate HTTP response for API routes.
 * @param error The error object.
 * @param additionalInfo Optional additional information to log with the error.
 * @returns A NextResponse object.
 */
export function handleApiError(error: unknown, additionalInfo?: Record<string, any>): NextResponse {
  let reportableError: AppError;
  let severity = LogSeverity.ERROR;

  if (error instanceof AppError) {
    reportableError = error;
    if (!reportableError.isOperational) severity = LogSeverity.CRITICAL;
  } else if (error instanceof Error) {
    reportableError = new AppError('An unexpected server error occurred.', 500, { cause: error, isOperational: false });
    severity = LogSeverity.CRITICAL;
  } else {
    reportableError = new AppError('An unknown error occurred.', 500, { isOperational: false });
    severity = LogSeverity.CRITICAL;
  }

  logError(reportableError, severity, additionalInfo);

  let responseMessage = reportableError.message;
  // For non-operational errors in production, return a generic message to the client
  if (process.env.NODE_ENV === 'production' && !reportableError.isOperational) {
    responseMessage = 'An unexpected server error occurred. Our team has been notified.';
  }

  // Adhere to the standard: { success: boolean, error?: { message: string, code?: string } }
  const errorPayload = {
    success: false,
    error: {
      message: responseMessage,
      code: reportableError.name, // Use the error class name as the code (e.g., "ValidationError")
      // If reportableError.details (from ValidationError) needs to be included,
      // it would require modifying the standard or incorporating it into the message.
      // For now, sticking to the defined standard.
      ...(reportableError instanceof ValidationError && reportableError.details && { validationDetails: reportableError.details }),
    },
  };

  return NextResponse.json(errorPayload, { status: reportableError.statusCode });
}

/**
 * A simple error handler for client-side errors or general purpose error logging.
 * @param error The error object.
 * @param context Additional context for the error (e.g., component name).
 * @param severity The severity of the error.
 */
export function handleClientError(
  error: unknown, 
  context?: string, 
  severity: LogSeverity = LogSeverity.ERROR
): void {
  const contextMessage = context ? `Context: ${context}` : 'Client-side error';
  if (error instanceof Error) {
    logError(error, severity, { context: contextMessage });
  } else {
    logError(new Error(`Unknown client error: ${String(error)}`), severity, { context: contextMessage, originalError: error });
  }
}

// Optional: Setup global error handlers for a Node.js server environment.
// In Next.js, API routes and server components have their own error handling boundaries.
// However, these can be useful for backend scripts or standalone Node services if any.

// function setupGlobalErrorHandlers(): void {
//   process.on('uncaughtException', (error: Error) => {
//     logError(error, { type: 'UncaughtException' });
//     // For critical errors, you might want to gracefully shut down the server
//     // Important: Do not resume normal operation after an uncaught exception
//     // if (! (error instanceof AppError && error.isOperational)) {
//     //   process.exit(1);
//     // }
//   });

//   process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
//     logError(new Error(`Unhandled Rejection: ${String(reason)}`), { type: 'UnhandledRejection' });
//     // Similar to uncaughtException, consider the severity
//   });
// }

// if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
//   // setupGlobalErrorHandlers();
//   // console.log('[ErrorHandler] Global error handlers set up.'); // To be enabled if used
// }

// Export specific error types for convenience if needed elsewhere for throwing
export { AppError, AuthenticationError, DatabaseError, ValidationError, NotFoundError, ExternalServiceError }; 