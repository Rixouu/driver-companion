"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useI18n } from "@/lib/i18n/context"
import {
  User,
  LayoutList,
  ClipboardCheck,
  Palette,
  Settings,
  Shield,
  Bell,
  Globe,
  Database,
  Users,
  Car
} from "lucide-react"

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  badge?: string
  children?: SidebarItem[]
}

export function Sidebar() {
  const { t } = useI18n()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing client-side APIs
  useEffect(() => {
    setMounted(true)
  }, [])

  const sidebarItems: SidebarItem[] = [
    {
      id: "profile",
      label: t("settings.tabs.profile") || "Profile",
      icon: User,
      href: "/settings?tab=profile"
    },
    {
      id: "account",
      label: t("settings.tabs.account") || "Account",
      icon: User,
      href: "/settings?tab=account"
    },
    {
      id: "preferences",
      label: t("settings.tabs.preferences") || "Preferences",
      icon: Palette,
      href: "/settings?tab=preferences"
    },
    {
      id: "menu",
      label: t("settings.tabs.menu") || "Menu",
      icon: LayoutList,
      href: "/settings?tab=menu"
    },
    {
      id: "templates",
      label: t("settings.tabs.templates") || "Templates",
      icon: ClipboardCheck,
      href: "/settings?tab=templates"
    },
    {
      id: "notifications",
      label: t("settings.tabs.notifications") || "Notifications",
      icon: Bell,
      href: "/settings?tab=notifications"
    },
    {
      id: "security",
      label: t("settings.tabs.security") || "Security",
      icon: Shield,
      href: "/settings?tab=security"
    },
    {
      id: "localization",
      label: t("settings.tabs.localization") || "Language & Region",
      icon: Globe,
      href: "/settings?tab=localization"
    },
    {
      id: "data",
      label: t("settings.tabs.data") || "Data Management",
      icon: Database,
      href: "/settings?tab=data"
    }
  ]

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const isActive = (item: SidebarItem) => {
    if (!mounted || !item.href) return false
    
    try {
      const url = new URL(item.href, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      const tabParam = url.searchParams.get('tab')
      const currentTab = searchParams.get('tab') || 'account'
      return tabParam === currentTab
    } catch (error) {
      console.error('Error checking active state:', error)
      return false
    }
  }

  const handleItemClick = (item: SidebarItem) => {
    if (item.href) {
      router.push(item.href as any)
    } else if (item.children) {
      toggleExpanded(item.id)
    }
  }

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const Icon = item.icon
    const active = isActive(item)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)

    return (
      <div key={item.id} className={cn("space-y-1", level > 0 && "ml-4")}>
        <Button
          variant={active ? "secondary" : "ghost"}
          className={cn(
            "md:w-full w-auto px-3 justify-start gap-2 h-9",
            active && "bg-secondary font-medium",
            !active && "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => handleItemClick(item)}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              {item.badge}
            </span>
          )}
        </Button>
        
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="w-full md:w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <div className="space-y-2">
            {/* Loading skeleton */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Settings className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
        
        {/* Desktop Sidebar */}
        <ScrollArea className="hidden md:block h-[calc(100vh-8rem)]">
          <nav className="space-y-1">
            {sidebarItems.map(item => renderSidebarItem(item))}
          </nav>
        </ScrollArea>
        {/* Mobile/Tablet Horizontal Nav */}
        <ScrollArea className="md:hidden overflow-x-auto">
          <nav className="flex gap-2 pb-2">
            {sidebarItems.map(item => renderSidebarItem(item))}
          </nav>
        </ScrollArea>
      </div>
    </div>
  )
} 