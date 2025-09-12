"use client"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/index"
import { useRouter } from "next/navigation"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <Button onClick={handleLogout}>
      Logout
    </Button>
  )
} 