import { auth } from "@/lib/auth/utils"
import { redirect } from "next/navigation"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {children}
    </div>
  )
} 