"use client"

import Link from "next/link"
import { Image } from "@/components/shared/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/styles"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Car, 
  ClipboardCheck, 
  Settings, 
  LogOut, 
  Wrench, 
  User,
  Calendar,
  BarChart
} from "lucide-react"
import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const allMenuItems = [
    { icon: LayoutDashboard, label: t("navigation.dashboard"), href: "/dashboard", key: "dashboard" },
    { icon: Car, label: t("navigation.vehicles"), href: "/vehicles", key: "vehicles" },
    { icon: User, label: t("navigation.drivers"), href: "/drivers", key: "drivers" },
    { icon: Calendar, label: t("navigation.bookings"), href: "/bookings", key: "bookings" },
    { icon: ClipboardCheck, label: t("navigation.inspections"), href: "/inspections", key: "inspections" },
    { icon: Wrench, label: t("navigation.maintenance"), href: "/maintenance", key: "maintenance" },
    { icon: BarChart, label: t("navigation.reporting"), href: "/reporting", key: "reporting" },
    { icon: Settings, label: t("navigation.settings"), href: "/settings", key: "settings" },
  ]
  
  // Filter items based on menu settings, but always include bookings
  const menuItems = allMenuItems.filter(item => {
    // Always show settings and bookings
    if (item.key === 'settings' || item.key === 'bookings') return true;
    
    const setting = menuSettings[item.key as keyof typeof menuSettings];
    return setting && setting.desktop;
  })

  return (
    <div className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 bg-black text-white">
      <div className="flex h-full flex-col justify-between overflow-y-auto py-4">
        <div className="px-4 mb-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/img/driver-header-logo.png"
              alt="Driver Logo"
              width={140}
              height={45}
              priority
              unoptimized
            />
          </Link>
        </div>
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link key={item.href} href={item.href} className="block">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isActive 
                      ? "bg-zinc-800 text-white" 
                      : "text-gray-300 hover:bg-zinc-800 hover:text-white"
                  )}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="px-2 mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-400 hover:bg-zinc-800 hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            {t("auth.logout")}
          </Button>
        </div>
      </div>
    </div>
  )
}

