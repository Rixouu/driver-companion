"use client"

import Link from "next/link"
import { Image } from "@/components/shared/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/layout/main-nav"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserNav } from "@/components/layout/user-nav"

export function Header() {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  if (pathname.startsWith("/auth")) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center">
          <div className="flex items-center gap-6">
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
            <MainNav />
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <ThemeToggle />
            {!loading && (
              <>
                {user ? (
                  <UserNav user={user} />
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