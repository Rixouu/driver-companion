/**
 * Base class for custom application errors.
 * Allows for consistent error handling and identification.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string, 
    statusCode: number = 500, 
    optionsOrIsOperational?: boolean | { cause?: Error; isOperational?: boolean },
    legacyStack?: string
  ) {
    let isOperational = true;
    let cause: Error | undefined = undefined;
    let stack = legacyStack;

    if (typeof optionsOrIsOperational === 'boolean') {
      isOperational = optionsOrIsOperational;
    } else if (optionsOrIsOperational) {
      isOperational = optionsOrIsOperational.isOperational !== undefined ? optionsOrIsOperational.isOperational : true;
      cause = optionsOrIsOperational.cause;
    }

    super(message, { cause });
    Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain

    this.statusCode = statusCode;
    this.isOperational = isOperational; 

    if (stack) {
      this.stack = stack;
    } else if (!cause) { // Avoid overriding stack if cause is present, as super(message, {cause}) handles it
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Represents an error originating from database operations.
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'A database error occurred', options?: { cause?: Error, stack?: string }) {
    super(message, 500, { cause: options?.cause, isOperational: true }, options?.stack);
  }
}

/**
 * Represents an authentication or authorization error.
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', statusCode: number = 401, options?: { cause?: Error, stack?: string }) {
    super(message, statusCode, { cause: options?.cause, isOperational: true }, options?.stack);
  }
}

/**
 * Represents a validation error for user input or data.
 */
export class ValidationError extends AppError {
  public readonly details?: Record<string, string>;

  constructor(message: string = 'Validation failed', details?: Record<string, string>, statusCode: number = 400, options?: { cause?: Error, stack?: string }) {
    super(message, statusCode, { cause: options?.cause, isOperational: true }, options?.stack);
    this.details = details;
  }
}

/**
 * Represents an error when a requested resource is not found.
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', options?: { cause?: Error, stack?: string }) {
    super(message, 404, { cause: options?.cause, isOperational: true }, options?.stack);
  }
}

/**
 * Represents an error from an external API or service.
 */
export class ExternalServiceError extends AppError {
  constructor(message: string = 'An error occurred with an external service', statusCode: number = 502, options?: { cause?: Error, stack?: string }) {
    super(message, statusCode, { cause: options?.cause, isOperational: true }, options?.stack);
  }
}

/**
 * Represents an error due to configuration issues.
 */
export class ConfigurationError extends AppError {
  constructor(message: string = 'A configuration error occurred', options?: { cause?: Error, stack?: string }) {
    super(message, 500, { cause: options?.cause, isOperational: false }, options?.stack); // Typically non-operational
  }
} 