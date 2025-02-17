"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuth({ required = true } = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isLoading = status === "loading"
  const isAuthenticated = !!session

  useEffect(() => {
    if (!isLoading && required && !isAuthenticated) {
      router.push("/auth/signin")
    }
  }, [isLoading, required, isAuthenticated, router])

  return {
    session,
    isLoading,
    isAuthenticated,
  }
} 