import { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Login - Fleet Manager",
  description: "Login to your account",
}

export default function LoginPage() {
  return <LoginForm />
} 