"use client"

import { useSession } from "next-auth/react"
import { UserRole } from "@/types/next-auth"
import { useLanguage } from "@/components/providers/language-provider"

interface RequireAuthProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { data: session } = useSession()
  const { t } = useLanguage()

  if (!session?.user) {
    return null
  }

  if (!allowedRoles.includes(session.user.role)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          {t("errors.unauthorized")}
        </p>
      </div>
    )
  }

  return <>{children}</>
} 