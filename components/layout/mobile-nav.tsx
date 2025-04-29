"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
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
  Calendar,
  ChevronUp,
  Package,
  Clipboard
} from "lucide-react"
import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
  const [activeGroup, setActiveGroup] = useState('dashboard')
  const [sheetOpen, setSheetOpen] = useState(false)

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

  // Update active group based on pathname
  useEffect(() => {
    if (pathname.startsWith('/dashboard')) {
      setActiveGroup('dashboard')
    } else if (pathname.startsWith('/vehicles') || pathname.startsWith('/drivers')) {
      setActiveGroup('fleet')
    } else if (pathname.startsWith('/bookings') || pathname.startsWith('/maintenance') || pathname.startsWith('/inspections')) {
      setActiveGroup('operations')
    } else if (pathname.startsWith('/reporting')) {
      setActiveGroup('reporting')
    } else if (pathname.startsWith('/settings')) {
      setActiveGroup('settings')
    }
  }, [pathname])
  
  // Check if we're on a detail page to hide the navigation
  const isDetailPage = pathname.includes('/maintenance/') || 
                       pathname.includes('/inspections/') || 
                       pathname.includes('/vehicles/') ||
                       pathname.includes('/drivers/') ||
                       pathname.includes('/bookings/');
  
  if (isDetailPage) return null;
  
  // Main menu groups
  const mainGroups = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: Home,
      href: '/dashboard'
    },
    {
      id: 'fleet',
      title: 'Fleet',
      icon: Car,
      hasSubmenu: true
    },
    {
      id: 'operations',
      title: 'Operations',
      icon: Clipboard,
      hasSubmenu: true
    },
    {
      id: 'reporting',
      title: 'Reporting',
      icon: BarChart,
      href: '/reporting'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      href: '/settings'
    }
  ]
  
  // Submenu items for the groups with submenus
  const submenuItems = {
    fleet: [
      { id: 'vehicles', title: t("navigation.vehicles"), icon: Car, href: '/vehicles' },
      { id: 'drivers', title: t("navigation.drivers"), icon: User, href: '/drivers' }
    ],
    operations: [
      { id: 'bookings', title: t("navigation.bookings"), icon: Calendar, href: '/bookings' },
      { id: 'maintenance', title: t("navigation.maintenance"), icon: Wrench, href: '/maintenance' },
      { id: 'inspections', title: t("navigation.inspections"), icon: ClipboardCheck, href: '/inspections' }
    ]
  }
  
  // Get active submenu items based on current group
  const getActiveSubmenuItems = () => {
    if (activeGroup === 'fleet') return submenuItems.fleet;
    if (activeGroup === 'operations') return submenuItems.operations;
    return [];
  }

  return (
    <>
      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
        <div className="flex justify-around h-16">
          {mainGroups.map((group) => {
            const isActive = activeGroup === group.id;
            const Icon = group.icon;
            
            // For items with submenus, open the sheet when clicked if active
            const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              if (group.hasSubmenu) {
                if (isActive) {
                  e.preventDefault();
                  setSheetOpen(true);
                } else {
                  setActiveGroup(group.id);
                }
              }
            };
            
            return (
              <Link
                key={group.id}
                href={group.href || '#'}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                onClick={handleClick}
                legacyBehavior>
                <span className="flex flex-col items-center">
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] mt-1">{group.title}</span>
                  
                  {/* Indicator dot for active tab */}
                  {isActive && (
                    <motion.div
                      layoutId="activeDot"
                      className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  
                  {/* Up arrow for items with submenus when active */}
                  {group.hasSubmenu && isActive && (
                    <div className="absolute -top-1.5 right-1/2 transform translate-x-4">
                      <ChevronUp className="h-3 w-3 text-primary" />
                    </div>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Sheet for displaying submenu items */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh] pt-4 pb-20 rounded-t-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-1 bg-muted-foreground/20 rounded-full" />
            </div>
            
            <h3 className="text-lg font-medium text-center">
              {activeGroup === 'fleet' ? 'Fleet Management' : 
               activeGroup === 'operations' ? 'Operations' : ''}
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mt-6 px-4">
              {getActiveSubmenuItems().map((item) => {
                const isActive = pathname.startsWith(item.href);
                
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    )}
                    legacyBehavior>
                    <span className="flex flex-col items-center">
                      <item.icon className="h-6 w-6 mb-2" />
                      <span className="text-xs text-center">{item.title}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
} 