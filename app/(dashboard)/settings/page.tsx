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
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { SettingsTabsList } from "@/components/settings/settings-tabs-list"
import { EnhancedGroupManagement } from "@/components/settings/enhanced-group-management"
import { UserManagement } from "@/components/settings/user-management"
import { BrandingManagement } from "@/components/settings/branding-management"
import { UICustomizationManagement } from "@/components/settings/ui-customization-management"
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb"
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
  Users,
  Shield,
} from "lucide-react"

import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null)
  const { t, locale, setLanguage } = useI18n()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'profile')
  const [permissionsSubTab, setPermissionsSubTab] = useState('groups')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [menuSettings, setMenuSettings] = useState({
    dashboard: { desktop: true, mobile: true },
    vehicles: { desktop: true, mobile: true },
    drivers: { desktop: true, mobile: true },
    bookings: { desktop: true, mobile: true },
    maintenance: { desktop: true, mobile: true },
    inspections: { desktop: true, mobile: true },
    templates: { desktop: true, mobile: true },
    reporting: { desktop: true, mobile: true },
    settings: { desktop: true, mobile: true },
  })

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
      case 'templates':
        return <FileText className="h-4 w-4 text-primary" />;
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
    <div className="space-y-6 sm:space-y-8">
      <div className="border-b border-border pb-3 sm:pb-4">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Navigation Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Customize which menu items appear on desktop and mobile.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">{t("settings.menu.title")}</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("settings.menu.description")}
          </p>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 lg:px-8 pb-4 sm:pb-6">
          <div className="space-y-4 sm:space-y-6">
            <p className="text-xs sm:text-sm text-amber-500 dark:text-amber-400 hidden md:block">
              {t("settings.menu.desktopSettingsHidden")}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
              <div className="relative overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50">
                    <tr>
                      <th scope="col" className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 w-1/3">
                        {t("settings.menu.menuItem")}
                      </th>
                      <th scope="col" className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-center">
                        {t("settings.menu.mobile")}
                      </th>
                      <th scope="col" className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-center hidden md:table-cell">
                        {t("settings.menu.desktop")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(menuSettings).map(([key, value]) => (
                      <tr key={key} className="border-b border-border last:border-0">
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 flex items-center gap-2">
                          {getIconForMenuItem(key as keyof typeof menuSettings)}
                          <span className="truncate">{t(`settings.menu.${key}`)}</span>
                        </td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-center">
                          <Switch
                            checked={value.mobile}
                            onCheckedChange={() => handleMenuSettingChange(key as keyof typeof menuSettings, 'mobile')}
                            disabled={key === 'bookings' || key === 'settings'}
                          />
                        </td>
                        <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-center hidden md:table-cell">
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

            <div className="pt-3 sm:pt-4 flex justify-end">
              <Button 
                onClick={saveMenuSettings} 
                disabled={isSaving}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
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

  const renderProfileTab = () => (
    <div className="space-y-6 sm:space-y-8">
      <div className="border-b border-border pb-3 sm:pb-4">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage your profile information and account settings.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">{t("settings.profile.title")}</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("settings.profile.description")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-8 pb-4 sm:pb-6">
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="name" className="text-sm sm:text-base">
                {t("settings.profile.name")}
              </Label>
              <Input 
                id="name" 
                value={session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || ""} 
                disabled 
                className="h-9 sm:h-10"
              />
            </div>
            <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
              <Label htmlFor="email" className="text-sm sm:text-base">
                {t("settings.profile.email")}
              </Label>
              <Input 
                id="email" 
                type="email" 
                value={session?.user?.email || ""} 
                disabled 
                className="h-9 sm:h-10"
              />
              <p className="text-xs sm:text-sm text-muted-foreground pt-1 sm:pt-2">
                {t("settings.profile.emailDescription")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">{t("settings.preferences.title")}</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("settings.preferences.description")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-8 pb-4 sm:pb-6">
          <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="space-y-1">
                <Label className="text-sm sm:text-base">{t("settings.preferences.theme.title")}</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("settings.preferences.themeDescription")}
                </p>
              </div>
              <div className="flex-shrink-0">
                <ClientThemeSelector />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderLanguageTab = () => (
    <div className="space-y-6 sm:space-y-8">
      <div className="border-b border-border pb-3 sm:pb-4">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Language</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Choose your preferred language for the application.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-3 sm:pb-4 lg:pb-6">
          <CardTitle className="text-base sm:text-lg lg:text-xl">Language Settings</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Select your preferred language from the available options.
          </p>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 lg:px-8 pb-4 sm:pb-6">
          <LanguageSelector />
        </CardContent>
      </Card>
    </div>
  )

  const renderPermissionsTab = () => (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div className="border-b border-border pb-3 sm:pb-4 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight">
            {t('settings.permissions.title', { default: 'Permissions & Access Control' })}
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
            {t('settings.permissions.description', { default: 'Manage user groups, permissions, and access control' })}
          </p>
        </div>
        <div className="hidden sm:flex space-x-1 bg-muted/30 p-1 rounded-lg ml-6">
          <button
            onClick={() => setPermissionsSubTab('groups')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              permissionsSubTab === 'groups'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t('settings.permissions.groups', { default: 'Groups' })}
            </div>
          </button>
          <button
            onClick={() => setPermissionsSubTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              permissionsSubTab === 'users'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('settings.permissions.users', { default: 'Users' })}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Sub-tabs for permissions */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        <button
          onClick={() => setPermissionsSubTab('groups')}
          className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            permissionsSubTab === 'groups'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground bg-muted/30'
          }`}
        >
          <Users className="w-4 h-4" />
          {t('settings.permissions.groups', { default: 'Groups' })}
        </button>
        <button
          onClick={() => setPermissionsSubTab('users')}
          className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            permissionsSubTab === 'users'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground bg-muted/30'
          }`}
        >
          <User className="w-4 h-4" />
          {t('settings.permissions.users', { default: 'Users' })}
        </button>
      </div>

      {/* Sub-tab content */}
      {permissionsSubTab === 'groups' && <EnhancedGroupManagement />}
      {permissionsSubTab === 'users' && <UserManagement />}
    </div>
  )

  return (
    <div className="space-y-6">
      <PageBreadcrumb />
      <div className="border-b border-border/40 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              Manage your profile, menu settings, and language preferences.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <SettingsTabsList value={activeTab} onValueChange={setActiveTab} />
        
        <div className="mt-6 sm:mt-8">
          <TabsContent value="profile">
            {renderProfileTab()}
          </TabsContent>
          
          <TabsContent value="menu">
            {renderMenuTab()}
          </TabsContent>
          
          <TabsContent value="language">
            {renderLanguageTab()}
          </TabsContent>
          
          <TabsContent value="permissions">
            {renderPermissionsTab()}
          </TabsContent>
          
          
          <TabsContent value="branding">
            <BrandingManagement />
          </TabsContent>
          
          <TabsContent value="ui-customization">
            <UICustomizationManagement />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}