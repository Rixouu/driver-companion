"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils/styles"
import {
  Home,
  Car,
  Wrench,
  ClipboardCheck,
  BarChart,
  Settings,
  User,
  Calendar
} from "lucide-react"
import { useEffect, useState } from "react"

export function MobileNav() {
  const pathname = usePathname()
  const { t } = useI18n()
  const [menuSettings, setMenuSettings] = useState({
    dashboard: { desktop: true, mobile: true },
    vehicles: { desktop: true, mobile: true },
    drivers: { desktop: true, mobile: true },
    bookings: { desktop: true, mobile: true },
    maintenance: { desktop: true, mobile: true },
    inspections: { desktop: true, mobile: true },
    reporting: { desktop: true, mobile: true },
    settings: { desktop: true, mobile: true }
  })
  
  // Load menu settings from local storage
  useEffect(() => {
    const savedMenuSettings = localStorage.getItem('menuSettings')
    if (savedMenuSettings) {
      try {
        const parsedSettings = JSON.parse(savedMenuSettings)
        
        // Ensure bookings menu is enabled
        if (!parsedSettings.bookings) {
          parsedSettings.bookings = { desktop: true, mobile: true }
        }
        
        // Ensure existing bookings menu item is visible
        if (parsedSettings.bookings && 
            (!parsedSettings.bookings.desktop || !parsedSettings.bookings.mobile)) {
          parsedSettings.bookings.desktop = true
          parsedSettings.bookings.mobile = true
        }
        
        // Update localStorage with fixed settings
        localStorage.setItem('menuSettings', JSON.stringify(parsedSettings))
        
        // Update state
        setMenuSettings(parsedSettings)
      } catch (error) {
        console.error("Error parsing menu settings:", error)
        localStorage.setItem('menuSettings', JSON.stringify(menuSettings))
      }
    } else {
      // If no settings exist, save the defaults
      localStorage.setItem('menuSettings', JSON.stringify(menuSettings))
    }
  }, [])
  
  // Check if we're on a detail page to hide the navigation
  const isDetailPage = pathname.includes('/maintenance/') || 
                      pathname.includes('/inspections/') || 
                      pathname.includes('/vehicles/') ||
                      pathname.includes('/drivers/') ||
                      pathname.includes('/bookings/');
  
  if (isDetailPage) return null;
  
  // Navigation items with icons
  const allItems = [
    {
      title: t("navigation.dashboard"),
      href: "/dashboard",
      icon: Home,
      key: 'dashboard'
    },
    {
      title: t("navigation.vehicles"),
      href: "/vehicles",
      icon: Car,
      key: 'vehicles'
    },
    {
      title: t("navigation.drivers"),
      href: "/drivers",
      icon: User,
      key: 'drivers'
    },
    {
      title: t("navigation.bookings"),
      href: "/bookings",
      icon: Calendar,
      key: 'bookings'
    },
    {
      title: t("navigation.maintenance"),
      href: "/maintenance",
      icon: Wrench,
      key: 'maintenance'
    },
    {
      title: t("navigation.inspections"),
      href: "/inspections",
      icon: ClipboardCheck,
      key: 'inspections'
    },
    {
      title: t("navigation.reporting"),
      href: "/reporting",
      icon: BarChart,
      key: 'reporting'
    },
    {
      title: t("navigation.settings"),
      href: "/settings",
      icon: Settings,
      key: 'settings'
    }
  ]
  
  // Filter items based on menu settings - only show items visible on mobile
  const items = allItems.filter(item => {
    // Always show settings and bookings on mobile
    if (item.key === 'settings' || item.key === 'bookings') return true;
    
    const setting = menuSettings[item.key as keyof typeof menuSettings];
    return setting && setting.mobile;
  })
  
  // Find the active item
  const activeItem = items.find(item => 
    pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {isActive && (
                  <motion.div
                    layoutId="bubble"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
              <span className="text-xs mt-1">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
} 