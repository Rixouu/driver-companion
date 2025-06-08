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
  FileText,
  DollarSign
} from "lucide-react"
import { useEffect, useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/lib/hooks/use-auth"

// Organization domain for access control
const ORGANIZATION_DOMAIN = 'japandriver.com'

// Type for menu item keys
type MenuItemKey = 'dashboard' | 'vehicles' | 'drivers' | 'bookings' | 'quotations' | 'pricing' | 'dispatch' | 'assignments' | 'maintenance' | 'inspections' | 'reporting' | 'settings'

// Interface for menu items
interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  key: MenuItemKey;
  adminOnly?: boolean;
}

// Interface for menu settings to ensure type safety
interface MenuSettings {
  dashboard: { desktop: boolean; mobile: boolean };
  vehicles: { desktop: boolean; mobile: boolean };
  drivers: { desktop: boolean; mobile: boolean };
  bookings: { desktop: boolean; mobile: boolean };
  quotations: { desktop: boolean; mobile: boolean };
  pricing: { desktop: boolean; mobile: boolean };
  dispatch: { desktop: boolean; mobile: boolean };
  assignments: { desktop: boolean; mobile: boolean };
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
  quotations: { desktop: true, mobile: true },
  pricing: { desktop: true, mobile: true },
  dispatch: { desktop: true, mobile: true },
  assignments: { desktop: true, mobile: true },
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
  const { user } = useAuth()
  
  // Check if user is from the organization
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) {
        console.warn("[Sidebar] Supabase client not available in useEffect for org check.");
        setIsOrganizationMember(false); // Sensible default
        return;
    }
    const checkOrganizationStatus = async () => {
      const isOrgMember = user?.email?.endsWith(`@${ORGANIZATION_DOMAIN}`) || false
      setIsOrganizationMember(isOrgMember)
    }
    
    checkOrganizationStatus()
  }, [user])
  
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
    const supabase = createClient()
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
        { icon: LayoutDashboard, label: t("navigation.dashboard"), href: "/dashboard", key: "dashboard" } as MenuItem
      ]
    },
    {
      id: 'fleet', // Fleet comes before Sales
      label: t("navigation.fleet"),
      items: [
        { icon: Car, label: t("navigation.vehicles"), href: "/vehicles", key: "vehicles" } as MenuItem,
        { icon: User, label: t("navigation.drivers"), href: "/drivers", key: "drivers" } as MenuItem
      ]
    },
    {
      id: 'sales', 
      label: t("navigation.sales"),
      items: [
        { icon: ClipboardList, label: t("navigation.quotations"), href: "/quotations", key: "quotations" } as MenuItem,
        { icon: DollarSign, label: t("navigation.pricing"), href: "/admin/pricing", key: "pricing", adminOnly: true } as MenuItem
      ]
    },
    {
      id: 'operations',
      label: t("navigation.operations"),
      items: [
        { icon: Calendar, label: t("navigation.bookings"), href: "/bookings", key: "bookings" } as MenuItem,
        { icon: Grid3x3, label: t("navigation.dispatch"), href: "/dispatch", key: "dispatch" } as MenuItem,
        { icon: ClipboardCheck, label: "Assignments", href: "/dispatch/assignments", key: "assignments" } as MenuItem,
        { icon: Wrench, label: t("navigation.maintenance"), href: "/maintenance", key: "maintenance" } as MenuItem,
        { icon: ClipboardCheck, label: t("navigation.inspections"), href: "/inspections", key: "inspections" } as MenuItem,
        { icon: BarChart, label: t("navigation.reporting"), href: "/reporting", key: "reporting" } as MenuItem
      ]
    },
    {
      id: 'settings',
      items: [
        { icon: Settings, label: t("navigation.settings"), href: "/settings", key: "settings" } as MenuItem
      ]
    }
  ]

  // For non-organization members, only show quotations
  const filteredMenuGroups = isOrganizationMember 
    ? menuGroups.map(group => {
        // If user is org member, filter out adminOnly items if they don't have admin rights
        return {
          ...group,
          items: group.items.filter(item => !item.adminOnly || isOrganizationMember)
        };
      })
    : [
        {
          id: 'sales',
          label: 'Sales',
          items: [
            { icon: ClipboardList, label: t("navigation.quotations"), href: "/quotations", key: "quotations" } as MenuItem
          ]
        }
      ];

  return (
    <div className={cn(
      "fixed left-0 top-0 h-screen bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] transition-width duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-full flex-col justify-between">
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
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
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
                    const isActive = pathname ? (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))) : false;
                    
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

