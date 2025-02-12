"use client"

import Link from "next/link"
import { useLanguage } from "./providers/language-provider"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"
import { LogOut, Menu } from "lucide-react"
import { signOut } from "next-auth/react"
import Image from "next/image"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Header() {
  const { t } = useLanguage()

  return (
    <header className="border-b">
      <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="https://staging.japandriver.com/wp-content/uploads/2024/04/driver-header-logo.png"
            alt="Driver"
            width={120}
            height={40}
            className="dark:brightness-200"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            href="/dashboard" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {t("nav.dashboard")}
          </Link>
          <Link 
            href="/vehicles" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {t("nav.vehicles")}
          </Link>
          <Link 
            href="/inspections" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {t("nav.inspections")}
          </Link>
          <Link 
            href="/settings" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {t("nav.settings")}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 mt-6">
                <Link 
                  href="/dashboard" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {t("nav.dashboard")}
                </Link>
                <Link 
                  href="/vehicles" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {t("nav.vehicles")}
                </Link>
                <Link 
                  href="/inspections" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {t("nav.inspections")}
                </Link>
                <Link 
                  href="/settings" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {t("nav.settings")}
                </Link>

                <div className="pt-4 border-t">
                  <div className="space-y-4">
                    <LanguageToggle />
                    <ThemeToggle />
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      {t("auth.signOut")}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

