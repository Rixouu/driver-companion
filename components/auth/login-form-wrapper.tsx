'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { LoginForm } from "./login-form"

export function LoginFormWrapper() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const handleLoginSuccess = () => {
    const redirectTo = searchParams.get('redirectedFrom') || '/'
    router.push(redirectTo)
  }

  return <LoginForm onLoginSuccess={handleLoginSuccess} />
} 