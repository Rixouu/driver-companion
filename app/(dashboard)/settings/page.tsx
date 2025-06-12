"use client"

export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { ClientThemeSelector } from "@/components/theme-selector"
import { LanguageSelector } from "@/components/language-selector"
import { useI18n } from "@/lib/i18n/context"
import type { Session } from '@supabase/supabase-js'
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Gauge,
  Truck,
  Wrench,
  ClipboardCheck,
  BarChart,
  Settings,
  Loader2,
  User,
  Palette,
  LayoutList,
  FileText,
  ShieldCheck,
  Calendar,
  Plus,
} from "lucide-react"
import { EnhancedInspectionTemplateManager } from "@/components/inspections/enhanced-inspection-template-manager"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null)
  const { t, locale, setLanguage } = useI18n()
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'account'
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
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function getSessionAndSettings() {
      const client = createClient();
      if (!client) {
        console.warn("[SettingsPage] Supabase client not available in getSessionAndSettings.");
        setIsLoading(false)
        return;
      }
      try {
        const { data: { session: currentSession }, error } = await client.auth.getSession()
        
        if (error) {
          console.error("Error getting session:", error.message)
          setIsLoading(false)
          return
        }
        
        setSession(currentSession)
        
        // Load menu settings from local storage if available
        if (typeof window !== 'undefined') {
          const savedMenuSettings = localStorage.getItem('menuSettings')
          if (savedMenuSettings) {
            try {
              const parsedSettings = JSON.parse(savedMenuSettings);
              
              // Ensure bookings menu is enabled
              if (!parsedSettings.bookings) {
                parsedSettings.bookings = { desktop: true, mobile: true };
              }
              
              // Ensure existing bookings menu item is visible
              if (parsedSettings.bookings && 
                  (!parsedSettings.bookings.desktop || !parsedSettings.bookings.mobile)) {
                parsedSettings.bookings.desktop = true;
                parsedSettings.bookings.mobile = true;
              }
              
              // Merge saved settings with default settings to avoid errors if new keys are added
              const mergedSettings = { ...menuSettings, ...parsedSettings };
              
              // Update localStorage with fixed settings
              localStorage.setItem('menuSettings', JSON.stringify(mergedSettings));
              
              // Update state
              setMenuSettings(mergedSettings);
            } catch (error) {
              console.error("Error parsing menu settings from localStorage:", error);
              // Reset to default and update localStorage
              localStorage.setItem('menuSettings', JSON.stringify(menuSettings));
            }
          } else {
            // If no settings exist yet, save the defaults
            localStorage.setItem('menuSettings', JSON.stringify(menuSettings));
          }
        }
      } catch (error) {
        console.error("Unexpected error getting session:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    getSessionAndSettings()
  }, [])

  // Function to handle menu settings changes
  const handleMenuSettingChange = (key: keyof typeof menuSettings, platform: 'desktop' | 'mobile') => {
    setMenuSettings(prevSettings => ({
      ...prevSettings,
      [key]: {
        ...prevSettings[key],
        [platform]: !prevSettings[key][platform]
      }
    }));
  }
  
  // Function to save menu settings
  const saveMenuSettings = () => {
    setIsSaving(true)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('menuSettings', JSON.stringify(menuSettings))
        toast({
          title: "Settings saved",
          description: "Menu settings have been saved successfully.",
        })
      }
    } catch (error) {
      console.error("Error saving menu settings to localStorage:", error);
      toast({
        title: "Error",
        description: "Failed to save menu settings.",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setIsSaving(false)
      }, 500)
    }
  }

  // Function to get the appropriate icon for each menu item
  const getIconForMenuItem = (key: keyof typeof menuSettings) => {
    switch (key) {
      case 'dashboard':
        return <Gauge className="h-4 w-4 text-primary" />;
      case 'vehicles':
        return <Truck className="h-4 w-4 text-primary" />;
      case 'drivers':
        return <User className="h-4 w-4 text-primary" />;
      case 'bookings':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-primary" />;
      case 'inspections':
        return <ClipboardCheck className="h-4 w-4 text-primary" />;
      case 'reporting':
        return <BarChart className="h-4 w-4 text-primary" />;
      case 'settings':
        return <Settings className="h-4 w-4 text-primary" />;
      default:
        return <Settings className="h-4 w-4 text-primary" />;
    }
  }

  const renderAccountTab = () => (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and set preferences.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">{t("settings.profile.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("settings.profile.description")}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:px-8 pb-6">
          <div className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base">
                {t("settings.profile.name")}
              </Label>
              <Input 
                id="name" 
                value={session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || ""} 
                disabled 
                className="h-10 sm:py-6"
              />
            </div>
            <div className="space-y-3 pt-2">
              <Label htmlFor="email" className="text-base">
                {t("settings.profile.email")}
              </Label>
              <Input 
                id="email" 
                type="email" 
                value={session?.user?.email || ""} 
                disabled 
                className="h-10 sm:py-6"
              />
              <p className="text-sm text-muted-foreground pt-2">
                {t("settings.profile.emailDescription")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">{t("settings.preferences.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("settings.preferences.description")}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:px-8 pb-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="theme" className="text-base">
                {t("settings.preferences.theme.title")}
              </Label>
              <div className="pt-1">
                <ClientThemeSelector />
              </div>
            </div>
            <div className="space-y-3 pt-1">
              <Label className="text-base">
                {t("settings.preferences.language.title")}
              </Label>
              <div className="pt-1">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderMenuTab = () => (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Navigation Settings</h1>
        <p className="text-muted-foreground">
          Customize which menu items appear on desktop and mobile.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">{t("settings.menu.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("settings.menu.description")}
          </p>
        </CardHeader>
        <CardContent className="px-4 sm:px-8 pb-6">
          <div className="space-y-4">
            <p className="text-sm text-amber-500 dark:text-amber-400 hidden md:block">
              {t("settings.menu.desktopSettingsHidden")}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50">
                    <tr>
                      <th scope="col" className="px-4 py-3 w-1/3">
                        {t("settings.menu.menuItem")}
                      </th>
                      <th scope="col" className="px-4 py-3 text-center">
                        {t("settings.menu.mobile")}
                      </th>
                      <th scope="col" className="px-4 py-3 text-center hidden md:table-cell">
                        {t("settings.menu.desktop")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(menuSettings).map(([key, value]) => (
                      <tr key={key} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 flex items-center gap-2">
                          {getIconForMenuItem(key as keyof typeof menuSettings)}
                          <span>{t(`settings.menu.${key}`)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            checked={value.mobile}
                            onCheckedChange={() => handleMenuSettingChange(key as keyof typeof menuSettings, 'mobile')}
                            disabled={key === 'bookings' || key === 'settings'}
                          />
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <Switch
                            checked={value.desktop}
                            onCheckedChange={() => handleMenuSettingChange(key as keyof typeof menuSettings, 'desktop')}
                            disabled={key === 'bookings' || key === 'settings'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                onClick={saveMenuSettings} 
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  t("settings.menu.save")
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTemplatesTab = () => (
    <div className="space-y-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Inspection Templates</h1>
        <p className="text-muted-foreground">
          Manage inspection templates and assign them to vehicles or groups.
        </p>
      </div>

      <EnhancedInspectionTemplateManager />
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="border-b border-border pb-4">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return renderAccountTab()
      case 'menu':
        return renderMenuTab()
      case 'templates':
        return renderTemplatesTab()
      case 'appearance':
        return (
          <div className="space-y-8">
            <div className="border-b border-border pb-4">
              <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
              <p className="text-muted-foreground">
                Customize the appearance and theme of the application.
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose how the application looks on your device.
                </p>
              </CardHeader>
              <CardContent>
                <ClientThemeSelector />
              </CardContent>
            </Card>
          </div>
        )
      case 'notifications':
        return (
          <div className="space-y-8">
            <div className="border-b border-border pb-4">
              <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">
                Manage your notification preferences.
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure when and how you receive notifications.
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Notification settings coming soon...</p>
              </CardContent>
            </Card>
          </div>
        )
      case 'security':
        return (
          <div className="space-y-8">
            <div className="border-b border-border pb-4">
              <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
              <p className="text-muted-foreground">
                Manage your security settings and authentication.
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure your security preferences.
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Security settings coming soon...</p>
              </CardContent>
            </Card>
          </div>
        )
      case 'localization':
        return (
          <div className="space-y-8">
            <div className="border-b border-border pb-4">
              <h1 className="text-2xl font-semibold tracking-tight">Language & Region</h1>
              <p className="text-muted-foreground">
                Configure your language and regional preferences.
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Language Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred language.
                </p>
              </CardHeader>
              <CardContent>
                <LanguageSelector />
              </CardContent>
            </Card>
          </div>
        )
      case 'data':
        return (
          <div className="space-y-8">
            <div className="border-b border-border pb-4">
              <h1 className="text-2xl font-semibold tracking-tight">Data Management</h1>
              <p className="text-muted-foreground">
                Manage your data, exports, and backups.
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Data Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure data management options.
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Data management settings coming soon...</p>
              </CardContent>
            </Card>
          </div>
        )
      default:
        return renderAccountTab()
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-2 md:py-4">
      {renderTabContent()}
    </div>
  )
}