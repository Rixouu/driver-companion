'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { LoginForm } from "./login-form"

export function LoginFormWrapper() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const handleLoginSuccess = () => {
    const redirectedFrom = searchParams.get('redirectedFrom')
    // If the redirectedFrom is the callback URL, redirect to dashboard
    if (redirectedFrom?.includes('/auth/callback')) {
      router.push('/')
    } else {
      router.push(redirectedFrom || '/')
    }
  }

  return <LoginForm onLoginSuccess={handleLoginSuccess} />
} 