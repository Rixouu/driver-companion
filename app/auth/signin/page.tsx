import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SignInForm } from "@/components/auth/sign-in-form"

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  // Redirect to dashboard if already authenticated
  if (session) {
    redirect("/dashboard")
  }

  return <SignInForm />
} 