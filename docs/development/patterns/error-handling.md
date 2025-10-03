# Error Handling System

## Overview

The error handling system provides a centralized, consistent approach to managing errors across the Vehicle Inspection application. It offers better error classification, user-friendly error messages, and simplified error handling patterns.

## Key Benefits

- **Centralized Error Management**: All errors are processed through a single system, ensuring consistent handling
- **Error Classification**: Errors are classified into specific types (database, network, authentication, etc.)
- **Improved User Experience**: User-friendly error messages with appropriate UI components
- **Reduced Boilerplate**: Simplified error handling with utility functions and hooks
- **TypeScript Support**: Full type safety for error handling operations
- **Real-time Error Handling**: Integrated with real-time subscriptions for immediate error recovery

## Core Components

### 1. Error Handler (`lib/utils/error-handler.ts`)

The main error handling utility that classifies and processes errors:

```typescript
import { handleError, ErrorType, withErrorHandling } from "@/lib/utils/error-handler"

// Handle an error directly
handleError(error)

// Wrap an async operation with automatic error handling
const result = await withErrorHandling(
  async () => {
    // Your async operation
    return await fetchData()
  },
  "Custom error message" // Optional
)
```

### 2. API Error Handling (`lib/utils/api-error-handler.ts`)

Utilities for handling errors in API routes:

```typescript
import { 
  handleApiError,
  withApiErrorHandling,
  createApiErrorResponse
} from "@/lib/utils/api-error-handler"
import { ErrorType } from "@/lib/utils/error-handler"

// Create a standardized error response
return createApiErrorResponse(
  ErrorType.VALIDATION,
  "Invalid input data"
)

// Wrap an API handler with automatic error handling
export async function GET() {
  return withApiErrorHandling(async () => {
    // Your API logic
    return NextResponse.json(data)
  })
}
```

### 3. Error Boundary Component (`components/ui/error-boundary.tsx`)

React components for handling and displaying errors in the UI:

```tsx
import { ErrorBoundary, ErrorMessage } from "@/components/ui/error-boundary"

// Wrap components that might throw errors
<ErrorBoundary>
  <ComponentThatMightError />
</ErrorBoundary>

// Display a specific error with retry option
<ErrorMessage 
  error={error}
  retry={() => retryOperation()}
/>
```

### 4. Async Hooks (`hooks/use-async.ts`)

React hooks for async operations with built-in error handling:

```tsx
import { useAsync, useSafeAsync } from "@/hooks/use-async"

// Full-featured async hook
const {
  data,
  isLoading,
  error,
  execute,
  reset
} = useAsync(fetchData)

// Simpler version with callbacks
const { 
  execute: submitForm,
  isLoading 
} = useSafeAsync(
  () => saveFormData(formValues),
  {
    onSuccess: () => showSuccessMessage(),
    onError: () => setFormError(true),
    customErrorMessage: "Failed to save form data"
  }
)
```

## Error Types

The system defines the following error types:

- `DATABASE`: Database-related errors (constraints, queries, connections)
- `NETWORK`: Network connectivity issues
- `VALIDATION`: Input validation failures
- `AUTHENTICATION`: Authentication and authorization errors
- `PERMISSION`: Permission and access control issues
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `SERVICE_UNAVAILABLE`: External service unavailability
- `UNEXPECTED`: Uncategorized errors

## Best Practices

1. **Use `withErrorHandling` for async operations**:
   ```typescript
   const data = await withErrorHandling(() => fetchData())
   ```

2. **Use `useAsync` for React component data fetching**:
   ```typescript
   const { data, isLoading, error } = useAsync(fetchData, true) // Auto-execute
   ```

3. **Wrap components with `ErrorBoundary`**:
   ```tsx
   <ErrorBoundary>
     <ComplexComponent />
   </ErrorBoundary>
   ```

4. **Use specific error types in API responses**:
   ```typescript
   if (!user) {
     return createApiErrorResponse(
       ErrorType.AUTHENTICATION,
       "User not authenticated"
     )
   }
   ```

5. **Add context to errors with custom messages**:
   ```typescript
   await withErrorHandling(
     () => processUserData(userData),
     "Failed to process user profile data"
   )
   ```

## Integration with Real-time Features

The error handling system is designed to work seamlessly with real-time features:

```typescript
import { useRealtimeInspection } from "@/hooks/use-realtime"

function InspectionComponent({ id }) {
  const { data, isLoading, error } = useRealtimeInspection(id)
  
  if (error) {
    return <ErrorMessage error={error} />
  }
  
  // Component implementation
}
```

## Further Documentation

For more detailed information and examples, refer to:

- [Integration Guide](integration-guide.md) - How to integrate the error handling system
- [API Reference](api-reference.md) - Detailed API documentation
- [Migration Guide](migration-guide.md) - How to migrate existing code 