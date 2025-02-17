"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { LoadingState } from "@/components/ui/loading-state"
import { UserRole } from "@/types/next-auth"

interface RequireAuthProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return <LoadingState />
  }

  if (!session) {
    return null
  }

  if (!allowedRoles.includes(session.user.role)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          {"errors.unauthorized"}
        </p>
      </div>
    )
  }

  return <>{children}</>
} 