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
  BarChart,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  Grid3x3
} from "lucide-react"
import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(false)
  const [menuSettings, setMenuSettings] = useState({
    dashboard: { desktop: true, mobile: true },
    vehicles: { desktop: true, mobile: true },
    drivers: { desktop: true, mobile: true },
    bookings: { desktop: true, mobile: true },
    maintenance: { desktop: true, mobile: true },
    inspections: { desktop: true, mobile: true },
    reporting: { desktop: true, mobile: true },
    settings: { desktop: true, mobile: true },
    dispatch: { desktop: true, mobile: true }
  })
  
  // Load menu settings from local storage
  useEffect(() => {
    const savedMenuSettings = localStorage.getItem('menuSettings')
    if (savedMenuSettings) {
      try {
        const parsedSettings = JSON.parse(savedMenuSettings)
        
        // Ensure specific items are always enabled if they exist in settings
        const requiredItems = ['bookings', 'dispatch']; // Add 'dispatch' here
        requiredItems.forEach(key => {
          if (!parsedSettings[key]) {
            // If the key doesn't exist, add it with default visible state
            parsedSettings[key] = { desktop: true, mobile: true };
          } else {
            // If the key exists, ensure desktop and mobile are true
            parsedSettings[key].desktop = true;
            parsedSettings[key].mobile = true;
          }
        });
        
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

    // Load sidebar collapsed state
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsedState) {
      setCollapsed(savedCollapsedState === 'true')
    }
  }, [])
  
  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed))
  }, [collapsed])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  // Menu items with group structure
  const menuGroups = [
    {
      id: 'dashboard',
      items: [
        { icon: LayoutDashboard, label: t("navigation.dashboard"), href: "/dashboard", key: "dashboard" }
      ]
    },
    {
      id: 'fleet',
      label: 'Fleet',
      items: [
        { icon: Car, label: t("navigation.vehicles"), href: "/vehicles", key: "vehicles" },
        { icon: User, label: t("navigation.drivers"), href: "/drivers", key: "drivers" }
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      items: [
        { icon: Calendar, label: t("navigation.bookings"), href: "/bookings", key: "bookings" },
        { icon: Grid3x3, label: t("navigation.dispatch"), href: "/dispatch", key: "dispatch" },
        { icon: Wrench, label: t("navigation.maintenance"), href: "/maintenance", key: "maintenance" },
        { icon: ClipboardCheck, label: t("navigation.inspections"), href: "/inspections", key: "inspections" }
      ]
    },
    {
      id: 'reporting',
      items: [
        { icon: BarChart, label: t("navigation.reporting"), href: "/reporting", key: "reporting" }
      ]
    },
    {
      id: 'settings',
      items: [
        { icon: Settings, label: t("navigation.settings"), href: "/settings", key: "settings" }
      ]
    }
  ]

  return (
    <div className={cn(
      "fixed left-0 top-0 h-screen bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] transition-width duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col justify-between overflow-y-auto">
        {/* Header with logo and collapse button aligned horizontally */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))] h-14">
          {!collapsed ? (
            <div className="flex items-center">
              <Image
                src="/img/driver-header-logo.png"
                alt="Driver Logo"
                width={120}
                height={30}
                priority
                unoptimized
              />
            </div>
          ) : (
            <div></div>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-md hover:bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className={cn("h-5 w-5", collapsed && "rotate-180")} />
          </Button>
        </div>
        
        {/* Main navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <TooltipProvider delayDuration={300}>
            {menuGroups.map((group) => {
              // Filter items based on menu settings
              const visibleItems = group.items.filter(item => {
                if (item.key === 'settings' || item.key === 'bookings') return true;
                const setting = menuSettings[item.key as keyof typeof menuSettings];
                return setting && setting.desktop;
              });
              
              // Skip empty groups
              if (visibleItems.length === 0) return null;
              
              return (
                <div key={group.id} className="space-y-1 px-3 py-2">
                  {group.label && !collapsed && (
                    <div className="px-3 mb-2">
                      <h2 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        {group.label}
                      </h2>
                    </div>
                  )}
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    
                    const menuItem = (
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full font-medium",
                          collapsed ? "justify-center px-2" : "justify-start",
                          isActive 
                            ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]" 
                            : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                        {!collapsed && item.label}
                      </Button>
                    );
                    
                    return collapsed ? (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          <Link href={item.href}>
                            {menuItem}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link key={item.href} href={item.href}>
                        {menuItem}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </TooltipProvider>
        </nav>
        
        {/* Logout button - positioned at the bottom */}
        <div className="px-3 pb-6 pt-2 border-t border-[hsl(var(--border))]">
          <TooltipProvider delayDuration={300}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="w-full justify-center text-red-400 hover:bg-[hsl(var(--sidebar-accent))] hover:text-red-400"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t("auth.logout")}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-400 hover:bg-[hsl(var(--sidebar-accent))] hover:text-red-400"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                {t("auth.logout")}
              </Button>
            )}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

