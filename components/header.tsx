"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { ThemeToggle } from "./theme-toggle"
import { useLanguage } from "./providers/language-provider"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu, LogOut } from "lucide-react"

const menuItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/inspections", label: "Inspections" },
  { href: "/settings", label: "Settings" },
]

export function Header() {
  const { language, setLanguage, t } = useLanguage()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Desktop Header */}
      <div className="container max-w-5xl mx-auto px-4 hidden md:flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="https://staging.japandriver.com/wp-content/uploads/2024/04/driver-header-logo.png"
            alt="Driver Logo"
            width={120}
            height={40}
            className="dark:brightness-200"
            priority
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={(value: "en" | "ja") => setLanguage(value)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
          <ThemeToggle />
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            {t("common.logout")}
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-[80vw] max-w-sm p-0 flex flex-col h-full"
            >
              <SheetHeader className="border-b p-4">
                <Image
                  src="https://staging.japandriver.com/wp-content/uploads/2024/04/driver-header-logo.png"
                  alt="Driver Logo"
                  width={100}
                  height={33}
                  className="dark:brightness-200"
                  priority
                />
              </SheetHeader>

              {/* Navigation Links */}
              <nav className="flex-1 p-4">
                <ul className="space-y-3">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`block w-full px-4 py-3 rounded-md text-base font-medium transition-colors
                            ${isActive 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-muted"
                            }`}
                        >
                          {t(`nav.${item.label.toLowerCase()}`)}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {/* Bottom Section */}
              <div className="border-t p-4 bg-background space-y-4">
                <div className="flex items-center gap-2">
                  <Select 
                    value={language} 
                    onValueChange={(value: "en" | "ja") => setLanguage(value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                  <ThemeToggle />
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("common.logout")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Image
            src="https://staging.japandriver.com/wp-content/uploads/2024/04/driver-header-logo.png"
            alt="Driver Logo"
            width={100}
            height={33}
            className="dark:brightness-200"
            priority
          />

          <div className="w-10" /> {/* Spacer for centering logo */}
        </div>
      </div>
    </header>
  )
}

