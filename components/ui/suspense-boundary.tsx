import { Suspense } from "react"
import { LoadingState } from "./loading-state"

interface SuspenseBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SuspenseBoundary({ children, fallback }: SuspenseBoundaryProps) {
  return (
    <Suspense fallback={fallback || <LoadingState />}>
      {children}
    </Suspense>
  )
} 