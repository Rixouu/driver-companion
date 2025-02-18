'use client'

import { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"
import { useSearchParams, useRouter } from 'next/navigation'

export const metadata: Metadata = {
  title: "Login - Fleet Manager",
  description: "Login to your account",
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const handleLoginSuccess = () => {
    const redirectTo = searchParams.get('redirectedFrom') || '/'
    router.push(redirectTo)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <LoginForm />
    </div>
  )
} 