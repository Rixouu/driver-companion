"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/styles"
import { useI18n } from "@/lib/i18n/context"
import { useEffect, useState } from "react"

export function MainNav() {
  const pathname = usePathname()
  const { t } = useI18n()
  const [menuSettings, setMenuSettings] = useState({
    dashboard: { desktop: true, mobile: true },
    vehicles: { desktop: true, mobile: true },
    drivers: { desktop: true, mobile: true },
    bookings: { desktop: true, mobile: true },
    maintenance: { desktop: true, mobile: true },
    inspections: { desktop: true, mobile: true },
    quotations: { desktop: true, mobile: true },
    reporting: { desktop: true, mobile: true },
    settings: { desktop: true, mobile: true }
  })
  
  // Load menu settings from local storage
  useEffect(() => {
    const savedMenuSettings = localStorage.getItem('menuSettings')
    if (savedMenuSettings) {
      setMenuSettings(JSON.parse(savedMenuSettings))
    }
  }, [])
  
  const allItems = [
    {
      title: t("navigation.dashboard"),
      href: "/dashboard",
      key: "dashboard"
    },
    {
      title: t("navigation.vehicles"),
      href: "/vehicles",
      key: "vehicles"
    },
    {
      title: t("navigation.drivers"),
      href: "/drivers",
      key: "drivers"
    },
    {
      title: t("navigation.bookings"),
      href: "/bookings",
      key: "bookings"
    },
    {
      title: t("navigation.quotations"),
      href: "/quotations",
      key: "quotations"
    },
    {
      title: t("navigation.maintenance"),
      href: "/maintenance",
      key: "maintenance"
    },
    {
      title: t("navigation.inspections"),
      href: "/inspections",
      key: "inspections"
    },
    {
      title: t("navigation.reporting"),
      href: "/reporting",
      key: "reporting"
    },
    {
      title: t("navigation.settings"),
      href: "/settings",
      key: "settings"
    },
  ]
  
  // Filter items based on menu settings - only show items visible on desktop
  const items = allItems.filter(item => {
    // Always show settings on desktop
    if (item.key === 'settings') return true;
    
    const setting = menuSettings[item.key as keyof typeof menuSettings];
    return setting && setting.desktop;
  })

  return (
    <nav className="hidden sm:flex sm:items-center sm:space-x-4 md:space-x-6">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href as any}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href
              ? "text-foreground"
              : "text-muted-foreground"
          )} >
          {item.title}
        </Link>
      ))}
    </nav>
  );
} 