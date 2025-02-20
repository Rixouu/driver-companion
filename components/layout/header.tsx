"use client"

import Link from "next/link"
import { Image } from "@/components/shared/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/layout/main-nav"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserNav } from "@/components/layout/user-nav"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

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
                width={100}
                height={25}
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
            <ThemeToggle />
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    {/* Show mobile menu on mobile */}
                    <Sheet>
                      <SheetTrigger asChild className="md:hidden">
                        <Button variant="ghost" size="icon">
                          <Menu className="h-5 w-5" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-64">
                        <div className="py-4">
                          <MainNav />
                        </div>
                      </SheetContent>
                    </Sheet>
                    <UserNav user={user} />
                  </div>
                ) : (
                  <Button asChild>
                    <Link href="/auth/login">Login</Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 