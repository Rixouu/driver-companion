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
  Grid3x3,
  ClipboardList,
  FileText
} from "lucide-react"
import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Organization domain for access control
const ORGANIZATION_DOMAIN = 'japandriver.com'

// Type for menu item keys
type MenuItemKey = 'dashboard' | 'vehicles' | 'drivers' | 'bookings' | 'quotations' | 'dispatch' | 'maintenance' | 'inspections' | 'reporting' | 'settings'

// Interface for menu settings to ensure type safety
interface MenuSettings {
  dashboard: { desktop: boolean; mobile: boolean };
  vehicles: { desktop: boolean; mobile: boolean };
  drivers: { desktop: boolean; mobile: boolean };
  bookings: { desktop: boolean; mobile: boolean };
  quotations: { desktop: boolean; mobile: boolean };
  dispatch: { desktop: boolean; mobile: boolean };
  maintenance: { desktop: boolean; mobile: boolean };
  inspections: { desktop: boolean; mobile: boolean };
  reporting: { desktop: boolean; mobile: boolean };
  settings: { desktop: boolean; mobile: boolean };
}

// Default menu settings
const defaultMenuSettings: MenuSettings = {
  dashboard: { desktop: true, mobile: true },
  vehicles: { desktop: true, mobile: true },
  drivers: { desktop: true, mobile: true },
  bookings: { desktop: true, mobile: true },
  quotations: { desktop: true, mobile: true }, // Ensure Quotations is present
  dispatch: { desktop: true, mobile: true },
  maintenance: { desktop: true, mobile: true },
  inspections: { desktop: true, mobile: true },
  reporting: { desktop: true, mobile: true },
  settings: { desktop: true, mobile: true },
};

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(false)
  const [menuSettings, setMenuSettings] = useState<MenuSettings>(defaultMenuSettings)
  const [isOrganizationMember, setIsOrganizationMember] = useState(false)
  
  // Check if user is from the organization
  useEffect(() => {
    const checkOrganizationStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const isOrgMember = user?.email?.endsWith(`@${ORGANIZATION_DOMAIN}`) || false
      setIsOrganizationMember(isOrgMember)
    }
    
    checkOrganizationStatus()
  }, [])
  
  // Load menu settings from local storage
  useEffect(() => {
    const savedMenuSettings = localStorage.getItem('menuSettings')
    let currentSettings = { ...defaultMenuSettings } // Start with defaults

    if (savedMenuSettings) {
      try {
        const parsedSettings = JSON.parse(savedMenuSettings)
        // Merge saved settings with defaults to ensure all keys exist
        currentSettings = { ...defaultMenuSettings, ...parsedSettings }
        
        // Ensure specific items are always enabled if they exist in settings
        const requiredItems: MenuItemKey[] = ['bookings', 'dispatch', 'quotations']
        requiredItems.forEach(key => {
          if (!currentSettings[key]) {
            // If the key doesn't exist after merge, add it with default visible state
            currentSettings[key] = { desktop: true, mobile: true }
          } else {
            // If the key exists, ensure desktop and mobile are true
            currentSettings[key].desktop = true
            currentSettings[key].mobile = true
          }
        })
        
      } catch (error) {
        console.error("Error parsing menu settings:", error)
        // Fallback to default settings if parsing fails
        currentSettings = { ...defaultMenuSettings }
      }
    }
    
    // Update localStorage with potentially corrected settings
    localStorage.setItem('menuSettings', JSON.stringify(currentSettings))
    
    // Update state
    setMenuSettings(currentSettings)

    // Load sidebar collapsed state
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsedState) {
      setCollapsed(savedCollapsedState === 'true')
    }
  }, []) // Removed menuSettings from dependency array to avoid potential loops if localStorage update triggers re-render
  
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

  // Menu items with group structure (Corrected Order)
  const menuGroups = [
    {
      id: 'dashboard',
      items: [
        { icon: LayoutDashboard, label: t("navigation.dashboard"), href: "/dashboard" as const, key: "dashboard" as MenuItemKey }
      ]
    },
    {
      id: 'fleet', // Fleet comes before Sales
      label: 'Fleet',
      items: [
        { icon: Car, label: t("navigation.vehicles"), href: "/vehicles" as const, key: "vehicles" as MenuItemKey },
        { icon: User, label: t("navigation.drivers"), href: "/drivers" as const, key: "drivers" as MenuItemKey }
      ]
    },
    {
      id: 'sales', 
      label: 'Sales',
      items: [
        { icon: ClipboardList, label: t("navigation.quotations"), href: "/quotations" as const, key: "quotations" as MenuItemKey }
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      items: [
        { icon: Calendar, label: t("navigation.bookings"), href: "/bookings" as const, key: "bookings" as MenuItemKey },
        { icon: Grid3x3, label: t("navigation.dispatch"), href: "/dispatch" as const, key: "dispatch" as MenuItemKey },
        { icon: Wrench, label: t("navigation.maintenance"), href: "/maintenance" as const, key: "maintenance" as MenuItemKey },
        { icon: ClipboardCheck, label: t("navigation.inspections"), href: "/inspections" as const, key: "inspections" as MenuItemKey },
        { icon: BarChart, label: t("navigation.reporting"), href: "/reporting" as const, key: "reporting" as MenuItemKey }
      ]
    },
    {
      id: 'settings',
      items: [
        { icon: Settings, label: t("navigation.settings"), href: "/settings" as const, key: "settings" as MenuItemKey }
      ]
    }
  ]

  // For non-organization members, only show dashboard and quotations
  const filteredMenuGroups = isOrganizationMember 
    ? menuGroups 
    : [
        {
          id: 'sales',
          label: 'Sales',
          items: [
            { icon: ClipboardList, label: t("navigation.quotations"), href: "/quotations" as const, key: "quotations" as MenuItemKey }
          ]
        }
      ];

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
                className="w-auto h-8"
              />
            </div>
          ) : (
            // Placeholder to maintain alignment when collapsed
            <div className="w-8 h-8"></div> // Adjust size as needed
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
            {filteredMenuGroups.map((group) => {
              // Filter items based on menu settings
              const visibleItems = group.items.filter(item => {
                // Always show settings 
                if (item.key === 'settings') return true; 
                // Use type assertion for safety
                const setting = menuSettings[item.key as keyof MenuSettings]; 
                return setting && setting.desktop;
              });
              
              // Skip rendering the group if no items are visible
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
                          <Link href={item.href as any}>
                            {menuItem}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link key={item.href} href={item.href as any}>
                        {menuItem}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* Logout button at bottom */}
        <div className="border-t border-[hsl(var(--border))] p-4">
          <Button
            variant="ghost"
            className={cn(
              "w-full font-medium text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]",
              collapsed ? "justify-center px-2" : "justify-start"
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn("h-5 w-5", !collapsed && "mr-3")} />
            {!collapsed && t("navigation.logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}

