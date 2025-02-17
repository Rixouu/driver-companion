"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {

  useEffect(() => {
    console.error("Error:", error)
  }, [error])

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">{"error.title"}</h2>
      <p className="text-muted-foreground">{"error.description"}</p>
      <Button onClick={reset}>{"error.retry"}</Button>
    </div>
  )
} 