"use client"

import { useEffect } from "react"
import { Button } from "./button"
import { AlertTriangle } from "lucide-react"

interface ErrorBoundaryProps {
  error: Error
  reset: () => void
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <h2 className="text-2xl font-bold tracking-tight">
          Something went wrong!
        </h2>
        <p className="text-muted-foreground">
          {error.message || "An unexpected error occurred"}
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
} 