"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"

export function MainNav() {
  const pathname = usePathname()
  const { t } = useI18n()
  
  const items = [
    {
      title: t("navigation.dashboard"),
      href: "/dashboard",
    },
    {
      title: t("navigation.vehicles"),
      href: "/vehicles",
    },
    {
      title: t("navigation.maintenance"),
      href: "/maintenance",
    },
    {
      title: t("navigation.inspections"),
      href: "/inspections",
    },
    {
      title: t("navigation.settings"),
      href: "/settings",
    },
  ]

  return (
    <nav className="flex md:items-center md:space-x-6">
      <div className="flex md:hidden flex-col space-y-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {item.title}
          </Link>
        ))}
      </div>
      <div className="hidden md:flex md:items-center md:space-x-6">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {item.title}
          </Link>
        ))}
      </div>
    </nav>
  )
} 