"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils/styles"
import { Home, Car, Wrench, ClipboardCheck, BarChart, Settings,  User, Users, Calendar, ChevronUp, Clipboard, FileText, LayoutDashboard, Tag, Link as LinkIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/hooks/use-auth"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"

// Define interfaces for menu items
interface MenuGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  href?: string;
  hasSubmenu?: boolean;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  href: string;
}

// Type-safe wrapper for Link href
function SafeLink({ href, className, children, onClick }: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link 
      href={href as any}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export function MobileNav() {
  const pathname = usePathname() ?? ''
  const { t } = useI18n()
  const [activeGroup, setActiveGroup] = useState('operations')
  const [sheetOpen, setSheetOpen] = useState(false)
  const { user } = useAuth()
  const isOrganizationMember = !!user?.email?.endsWith('@japandriver.com')

  // Update active group based on pathname
  useEffect(() => {
    if (pathname.startsWith('/dashboard')) {
      setActiveGroup('operations')
    } else if (pathname.startsWith('/vehicles') || pathname.startsWith('/drivers') || pathname.startsWith('/maintenance') || pathname.startsWith('/inspections')) {
      setActiveGroup('fleet')
    } else if (pathname.startsWith('/quotations') || pathname.startsWith('/customers') || pathname.startsWith('/sales')) {
      setActiveGroup('sales')
    } else if (
      pathname.startsWith('/bookings') || 
      pathname.startsWith('/dispatch') || 
      pathname.startsWith('/assignments') ||
      pathname.startsWith('/reporting') ||
      pathname.startsWith('/templates') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/paylinks')
    ) {
      setActiveGroup('management')
    } else {
      setActiveGroup('operations')
    }
  }, [pathname])
  
  // Check if we're on a detail page to hide the navigation
  const isDetailPage = pathname.includes('/maintenance/') || 
                       pathname.includes('/inspections/') || 
                       pathname.includes('/vehicles/') ||
                       pathname.includes('/drivers/') ||
                       pathname.includes('/bookings/') ||
                       pathname.includes('/quotations/') ||
                       pathname.includes('/customers/') ||
                       pathname.includes('/dispatch/') ||
                       pathname.includes('/reporting/')
  
  if (isDetailPage) return null;
  
  // Main menu groups
  const mainGroups: MenuGroup[] = [
    {
      id: 'operations',
      title: t("navigation.operations"),
      icon: Clipboard,
      hasSubmenu: true,
      href: '#'
    },
    {
      id: 'fleet',
      title: t("navigation.fleet"),
      icon: Car,
      hasSubmenu: true,
      href: '#'
    },
    {
      id: 'sales',
      title: t("navigation.sales"),
      icon: Tag,
      hasSubmenu: true,
      href: '#'
    },
    {
      id: 'management',
      title: t("navigation.management"),
      icon: Settings,
      hasSubmenu: true,
      href: '#'
    }
  ]
  
  // Submenu items for the groups with submenus
  const submenuItems: Record<string, MenuItem[]> = {
    operations: [
      { id: 'dashboard', title: t("navigation.dashboard"), icon: LayoutDashboard, href: '/dashboard' },
      { id: 'dispatch', title: t("navigation.dispatchBoard"), icon: LayoutDashboard, href: '/dispatch' },
      { id: 'bookings', title: t("navigation.bookings"), icon: Calendar, href: '/bookings' },
      { id: 'shifts', title: t("navigation.shifts"), icon: Calendar, href: '/shifts' },
      { id: 'assignments', title: t("navigation.assignments"), icon: ClipboardCheck, href: '/assignments' }
    ],
    fleet: [
      { id: 'vehicles', title: t("navigation.vehicles"), icon: Car, href: '/vehicles' },
      { id: 'drivers', title: t("navigation.drivers"), icon: User, href: '/drivers' },
      { id: 'maintenance', title: t("navigation.maintenance"), icon: Wrench, href: '/maintenance' },
      { id: 'inspections', title: t("navigation.inspections"), icon: ClipboardCheck, href: '/inspections' }
    ],
    sales: [
      { id: 'quotations', title: t("navigation.quotations"), icon: FileText, href: '/quotations' },
      { id: 'customers', title: t("navigation.customers"), icon: Users, href: '/customers' },
      ...(isOrganizationMember ? ([{ id: 'sales-calendar', title: t("navigation.salesCalendar"), icon: Calendar, href: '/sales/calendar' }] as MenuItem[]) : [])
    ],
    management: [
      { id: 'reporting', title: t("navigation.reporting"), icon: BarChart, href: '/reporting' },
      { id: 'templates', title: t("navigation.templates"), icon: FileText, href: '/templates' },
      { id: 'paylinks', title: t("navigation.paylinks"), icon: LinkIcon, href: '/paylinks' },
      { id: 'pricing', title: t("navigation.pricing"), icon: Tag, href: '/admin/pricing' },
      { id: 'settings', title: t("navigation.settings"), icon: Settings, href: '/settings' }
    ]
  }
  
  // Get active submenu items based on current group
  const getActiveSubmenuItems = () => {
    if (activeGroup === 'operations') return submenuItems.operations;
    if (activeGroup === 'fleet') return submenuItems.fleet;
    if (activeGroup === 'sales') return submenuItems.sales;
    if (activeGroup === 'management') return submenuItems.management;
    return [];
  }

  // Function to get the title for the sheet based on active group
  const getSheetTitle = () => {
    switch (activeGroup) {
      case 'operations': return t("navigation.operations");
      case 'fleet': return t("navigation.fleet");
      case 'sales': return t("navigation.sales");
      case 'management': return t("navigation.management");
      default: return '';
    }
  }

  return (
    <>
      {/* Bottom navigation - visible on mobile/tablet, hidden on xl screens */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
        <div className="flex justify-around h-16 md:h-20">
          {mainGroups.map((group) => {
            const isActive = activeGroup === group.id;
            const Icon = group.icon;
            
            const handleClick = (e: React.MouseEvent<HTMLElement>) => {
              if (group.hasSubmenu) {
                setActiveGroup(group.id);
                e.preventDefault();
                setSheetOpen(true);
              } else if (group.href) {
                setActiveGroup(group.id);
              }
            };
            
            return (
              <div
                key={group.id}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full relative cursor-pointer",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                onMouseDown={handleClick}
              >
                {!group.hasSubmenu && group.href ? (
                  <SafeLink href={group.href} className="flex flex-col items-center">
                    <div className="relative">
                      <Icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className="text-[10px] md:text-xs mt-1">{group.title}</span>
                  </SafeLink>
                ) : (
                  <span className="flex flex-col items-center">
                    <div className="relative">
                      <Icon className="h-5 w-5 md:h-6 md:w-6" />
                      {group.hasSubmenu && (
                        <div className={cn(
                          "absolute -top-1 -right-1.5 w-2 h-2 rounded-full",
                          isActive ? "bg-primary" : "bg-muted-foreground/50"
                        )} />
                      )}
                    </div>
                    <span className="text-[10px] md:text-xs mt-1">{group.title}</span>
                  </span>
                )}
                
                {isActive && (
                  <motion.div
                    layoutId="activeDot"
                    className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {group.hasSubmenu && isActive && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground rounded-full p-0.5">
                    <ChevronUp className="h-3 w-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Sheet for displaying submenu items */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh] pt-4 pb-20 rounded-t-2xl">
          <SheetTitle className="sr-only">
            {getSheetTitle()}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Select from available {getSheetTitle().toLowerCase()} options
          </SheetDescription>
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-1 bg-muted-foreground/20 rounded-full" />
            </div>
            
            <h3 className="text-lg font-medium text-center">
              {getSheetTitle()}
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mt-6 px-4">
              {getActiveSubmenuItems().map((item) => {
                const isActive = pathname.startsWith(item.href);
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg transition-colors",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    )}
                  >
                    <SafeLink 
                      href={item.href} 
                      className="flex flex-col items-center" 
                      onClick={() => setSheetOpen(false)}
                    >
                      <item.icon className="h-6 w-6 mb-2" />
                      <span className="text-xs text-center">{item.title}</span>
                    </SafeLink>
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
} 