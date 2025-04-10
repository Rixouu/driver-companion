"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { UserRole, usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/components/providers/auth-provider"

export interface RequireAuthProps {
  children: ReactNode
  requiredPermission?: keyof ReturnType<typeof usePermissions>["permissions"]
  allowedRoles?: UserRole[]
  redirectTo?: string
  fallback?: ReactNode
}

export function RequireAuth({ 
  children, 
  requiredPermission,
  allowedRoles = [], 
  redirectTo = "/login",
  fallback
}: RequireAuthProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { 
    role, 
    permissions, 
    hasPermission, 
    loading: permissionsLoading 
  } = usePermissions()
  
  const isLoading = authLoading || permissionsLoading
  
  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, router, redirectTo])

  // Loading state
  if (isLoading) {
    return fallback || (
      <div className="flex h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  // Check specific permission if provided
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          You don't have permission to access this resource
        </p>
      </div>
    )
  }

  // Check role-based access if no specific permission is provided
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          Access denied. You need {allowedRoles.join(" or ")} role to access this page.
        </p>
      </div>
    )
  }

  // Authenticated and authorized
  return <>{children}</>
} 