import { auth } from "@/lib/auth/utils"
import { redirect } from "next/navigation"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {children}
      </div>
    </div>
  )
} 