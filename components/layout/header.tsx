"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserNav } from "@/components/layout/user-nav"
import { Gauge, LogOut, Moon, Globe, Bell } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n/context"
import { NotificationBell } from "@/components/notifications/notification-bell"

export function Header() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { t, language, setLanguage } = useI18n()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  if (pathname.startsWith("/auth")) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-8 sm:px-10 md:px-12 max-w-[1600px]">
        <div className="flex h-14 items-center justify-end">
          <div className="flex items-center gap-4">
            {/* Show theme toggle and login only on desktop */}
            <div className="hidden md:flex items-center gap-4">
              {user && <NotificationBell />}
              <LanguageSwitcher />
              <ThemeToggle />
              {!loading && !user && (
                <Button asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
              )}
            </div>

            {!loading && (
              <>
                {/* Mobile Actions */}
                <div className="flex md:hidden items-center gap-2">
                  {user && <NotificationBell />}
                  {user && <UserNav user={user} />}
                </div>
                
                {/* Desktop User Nav */}
                <div className="hidden md:flex">
                  {user && <UserNav user={user} />}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 