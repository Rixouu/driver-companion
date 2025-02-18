import { Metadata } from "next"
import { LoginFormWrapper } from "@/components/auth/login-form-wrapper"

export const metadata: Metadata = {
  title: "Login - Fleet Manager",
  description: "Login to your account",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <LoginFormWrapper />
    </div>
  )
} 