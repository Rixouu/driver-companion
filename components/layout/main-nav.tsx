"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Vehicles",
    href: "/vehicles",
  },
  {
    title: "Maintenance",
    href: "/maintenance",
  },
  {
    title: "Inspections",
    href: "/inspections",
  },
  {
    title: "Settings",
    href: "/settings",
  },
]

export function MainNav() {
  const pathname = usePathname()

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