"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils/styles"

interface LoadingSpinnerProps {
  className?: string
  size?: number
  fullHeight?: boolean
}

export function LoadingSpinner({ className, size = 24, fullHeight }: LoadingSpinnerProps) {
  if (fullHeight) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <Loader2 
      className={cn("animate-spin text-muted-foreground", className)} 
      size={size}
    />
  )
} 