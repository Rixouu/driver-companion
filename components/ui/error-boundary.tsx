"use client"

import { useEffect, useState } from "react"
import { ErrorType, handleError } from "@/lib/utils/error-handler"
import { Button } from "./button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "./alert"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorState {
  hasError: boolean
  error: Error | null
}

export function ErrorBoundary({
  children,
  fallback,
  onError,
}: ErrorBoundaryProps) {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
  })

  useEffect(() => {
    // Error handling logic
    const errorHandler = (error: ErrorEvent) => {
      setErrorState({
        hasError: true,
        error: error.error || new Error("An unexpected error occurred"),
      })

      // Call the custom error handler if provided
      if (onError && error.error instanceof Error) {
        onError(error.error, { componentStack: "" } as React.ErrorInfo)
      }

      // Use our error handling system
      handleError(error.error)
    }

    // Add global error event listener
    window.addEventListener("error", errorHandler)

    return () => {
      window.removeEventListener("error", errorHandler)
    }
  }, [onError])

  // Reset the error state
  const resetError = () => {
    setErrorState({
      hasError: false,
      error: null,
    })
  }

  // If there's an error, show the fallback or default error UI
  if (errorState.hasError) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex h-full w-full flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorState.error?.message || "An unexpected error occurred."}
          </AlertDescription>
        </Alert>
        <Button
          onClick={resetError}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  // Otherwise, render children normally
  return <>{children}</>
}

/**
 * Error message component for displaying specific error types
 */
export function ErrorMessage({
  error,
  retry,
}: {
  error: unknown
  retry?: () => void
}) {
  // Use our error handling system to get a classified error
  const appError = handleError(error)

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Alert
        variant={
          appError.type === ErrorType.UNEXPECTED
            ? "destructive"
            : appError.type === ErrorType.VALIDATION
            ? "default"
            : "destructive"
        }
        className="mb-4 max-w-md"
      >
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{appError.type}</AlertTitle>
        <AlertDescription>{appError.message}</AlertDescription>
      </Alert>
      {retry && (
        <Button
          onClick={retry}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  )
} 