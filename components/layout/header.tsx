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
import { Menu, X, Gauge, Truck, ClipboardCheck, FileCheck, Settings, LogOut, Moon, Globe, BarChart } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n/context"

export function Header() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { theme, setTheme } = useTheme()
  const supabase = createClientComponentClient()
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
                {/* Single mobile menu for both authenticated and non-authenticated users */}
                <Sheet>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] p-0">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between p-6">
                        <span className="text-xl font-semibold">{t('common.menu')}</span>
                        <SheetClose asChild>
                          <Button variant="ghost" size="icon">
                            <X className="h-5 w-5" />
                          </Button>
                        </SheetClose>
                      </div>

                      <Separator />

                      <nav className="flex-1 px-6">
                        <div className="space-y-4 py-6">
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-3 text-base"
                          >
                            <Gauge className="h-5 w-5" />
                            {t('navigation.dashboard')}
                          </Link>
                          <Link
                            href="/vehicles"
                            className="flex items-center gap-3 text-base"
                          >
                            <Truck className="h-5 w-5" />
                            {t('navigation.vehicles')}
                          </Link>
                          <Link
                            href="/maintenance"
                            className="flex items-center gap-3 text-base"
                          >
                            <ClipboardCheck className="h-5 w-5" />
                            {t('navigation.maintenance')}
                          </Link>
                          <Link
                            href="/inspections"
                            className="flex items-center gap-3 text-base"
                          >
                            <FileCheck className="h-5 w-5" />
                            {t('navigation.inspections')}
                          </Link>
                          <Link
                            href="/reporting"
                            className="flex items-center gap-3 text-base"
                          >
                            <BarChart className="h-5 w-5" />
                            {t('navigation.reporting')}
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center gap-3 text-base"
                          >
                            <Settings className="h-5 w-5" />
                            {t('navigation.settings')}
                          </Link>
                        </div>
                      </nav>

                      <div className="border-t p-6">
                        <div className="flex flex-col gap-4">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-2"
                            onClick={() => setLanguage(language === "en" ? "ja" : "en")}
                          >
                            <Globe className="h-5 w-5" />
                            {language === "en" ? "日本語" : "English"}
                          </Button>
                          {user ? (
                            <Button 
                              variant="outline" 
                              className="w-full justify-start gap-2"
                              onClick={handleLogout}
                            >
                              <LogOut className="h-5 w-4" />
                              {t('common.logout')}
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="w-full justify-start gap-2"
                              asChild
                            >
                              <Link href="/auth/login">
                                <LogOut className="h-5 w-4" />
                                {t('common.login')}
                              </Link>
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-2"
                            onClick={handleThemeToggle}
                          >
                            <Moon className="h-5 w-4" />
                            {t('settings.preferences.theme.dark')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Show user nav on desktop when authenticated */}
                {user && (
                  <div className="hidden md:flex">
                    <UserNav user={user} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 