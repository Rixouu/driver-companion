"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLanguage } from "../providers/language-provider"

const routes = [
  {
    href: "/dashboard",
    labelKey: "navigation.dashboard",
  },
  {
    href: "/vehicles",
    labelKey: "navigation.vehicles",
  },
  {
    href: "/inspections",
    labelKey: "navigation.inspections",
  },
  {
    href: "/settings",
    labelKey: "navigation.settings",
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <nav className="flex items-center space-x-6">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === route.href
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {t(route.labelKey)}
        </Link>
      ))}
    </nav>
  )
}

