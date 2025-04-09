"use client"

import Link from "next/link"
import { Image } from "@/components/shared/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/layout/main-nav"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserNav } from "@/components/layout/user-nav"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Menu, X, Gauge, Truck, ClipboardCheck, FileCheck, Settings, LogOut, Moon, Globe, BarChart, Bell } from "lucide-react"
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

  // Function to get the current page title based on the pathname
  const getPageTitle = (path: string, t: any) => {
    if (path.startsWith('/dashboard')) return t('navigation.dashboard')
    if (path.startsWith('/vehicles')) return t('navigation.vehicles')
    if (path.startsWith('/maintenance')) return t('navigation.maintenance')
    if (path.startsWith('/inspections')) return t('navigation.inspections')
    if (path.startsWith('/reporting')) return t('navigation.reporting')
    if (path.startsWith('/settings')) return t('navigation.settings')
    return 'Driver'
  }

  if (pathname.startsWith("/auth")) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/img/driver-header-logo.png"
                alt="Driver Logo"
                width={140}
                height={45}
                priority
                unoptimized
              />
            </Link>
            {/* Hide MainNav on mobile, show on desktop */}
            <div className="hidden md:flex">
              <MainNav />
            </div>
          </div>
          
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