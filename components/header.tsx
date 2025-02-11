"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { MobileNav } from "./layout/mobile-nav"
import { ThemeToggle } from "./theme-toggle"
import { useLanguage } from "./providers/language-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function Header() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="https://staging.japandriver.com/wp-content/uploads/2024/04/driver-header-logo.png"
            alt="Driver Logo"
            width={120}
            height={40}
            className="dark:brightness-200"
          />
          <MobileNav />
        </div>
        <div className="flex items-center gap-2">
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
    </header>
  )
}

