"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { ClientThemeSelector } from "@/components/theme-selector"
import { LanguageSelector } from "@/components/language-selector"
import { useI18n } from "@/lib/i18n/context"
import type { Session } from '@supabase/auth-helpers-nextjs'
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Gauge, Truck, Wrench, ClipboardCheck, BarChart, Settings, Loader2 } from "lucide-react"

export default function SettingsPage() {
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<Session | null>(null)
  const { t, language, setLanguage } = useI18n()
  const [menuSettings, setMenuSettings] = useState({
    dashboard: { desktop: true, mobile: true },
    vehicles: { desktop: true, mobile: true },
    maintenance: { desktop: true, mobile: true },
    inspections: { desktop: true, mobile: true },
    reporting: { desktop: true, mobile: true },
    settings: { desktop: true, mobile: true }
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      // Load menu settings from local storage if available
      const savedMenuSettings = localStorage.getItem('menuSettings')
      if (savedMenuSettings) {
        setMenuSettings(JSON.parse(savedMenuSettings))
      }
    }
    getSession()
  }, [supabase])

  // Function to handle menu settings changes
  const handleMenuSettingChange = (key: keyof typeof menuSettings, platform: 'desktop' | 'mobile') => {
    const newSettings = { 
      ...menuSettings, 
      [key]: { 
        ...menuSettings[key],
        [platform]: !menuSettings[key][platform] 
      } 
    }
    setMenuSettings(newSettings)
  }
  
  // Function to save menu settings
  const saveMenuSettings = () => {
    setIsSaving(true)
    // Save to local storage
    localStorage.setItem('menuSettings', JSON.stringify(menuSettings))
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
    }, 500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.description")}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.profile.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("settings.profile.description")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("settings.profile.name")}</Label>
              <Input 
                id="name" 
                value={session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || ""} 
                disabled 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("settings.profile.email")}</Label>
              <Input 
                id="email" 
                type="email" 
                value={session?.user?.email || ""} 
                disabled 
              />
              <p className="text-sm text-muted-foreground">
                {t("settings.profile.emailDescription")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.preferences.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("settings.preferences.description")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">{t("settings.preferences.theme.title")}</Label>
              <ClientThemeSelector />
            </div>
            
            <div className="space-y-2">
              <Label>{t("settings.preferences.language.title")}</Label>
              <LanguageSelector />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.menu.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("settings.menu.description")}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="overflow-hidden rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium">{t("settings.menu.menuItem")}</th>
                      <th className="text-center p-3 font-medium hidden sm:table-cell">{t("settings.menu.desktop")}</th>
                      <th className="text-center p-3 font-medium">{t("settings.menu.mobile")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-muted/50">
                      <td className="p-3 flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-primary" />
                        <span>{t("navigation.dashboard")}</span>
                      </td>
                      <td className="p-3 text-center hidden sm:table-cell">
                        <Switch 
                          id="menu-dashboard-desktop" 
                          checked={menuSettings.dashboard.desktop}
                          onCheckedChange={() => handleMenuSettingChange('dashboard', 'desktop')}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Switch 
                          id="menu-dashboard-mobile" 
                          checked={menuSettings.dashboard.mobile}
                          onCheckedChange={() => handleMenuSettingChange('dashboard', 'mobile')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="p-3 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <span>{t("navigation.vehicles")}</span>
                      </td>
                      <td className="p-3 text-center hidden sm:table-cell">
                        <Switch 
                          id="menu-vehicles-desktop" 
                          checked={menuSettings.vehicles.desktop}
                          onCheckedChange={() => handleMenuSettingChange('vehicles', 'desktop')}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Switch 
                          id="menu-vehicles-mobile" 
                          checked={menuSettings.vehicles.mobile}
                          onCheckedChange={() => handleMenuSettingChange('vehicles', 'mobile')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="p-3 flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-primary" />
                        <span>{t("navigation.maintenance")}</span>
                      </td>
                      <td className="p-3 text-center hidden sm:table-cell">
                        <Switch 
                          id="menu-maintenance-desktop" 
                          checked={menuSettings.maintenance.desktop}
                          onCheckedChange={() => handleMenuSettingChange('maintenance', 'desktop')}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Switch 
                          id="menu-maintenance-mobile" 
                          checked={menuSettings.maintenance.mobile}
                          onCheckedChange={() => handleMenuSettingChange('maintenance', 'mobile')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="p-3 flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                        <span>{t("navigation.inspections")}</span>
                      </td>
                      <td className="p-3 text-center hidden sm:table-cell">
                        <Switch 
                          id="menu-inspections-desktop" 
                          checked={menuSettings.inspections.desktop}
                          onCheckedChange={() => handleMenuSettingChange('inspections', 'desktop')}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Switch 
                          id="menu-inspections-mobile" 
                          checked={menuSettings.inspections.mobile}
                          onCheckedChange={() => handleMenuSettingChange('inspections', 'mobile')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="p-3 flex items-center gap-2">
                        <BarChart className="h-4 w-4 text-primary" />
                        <span>{t("navigation.reporting")}</span>
                      </td>
                      <td className="p-3 text-center hidden sm:table-cell">
                        <Switch 
                          id="menu-reporting-desktop" 
                          checked={menuSettings.reporting.desktop}
                          onCheckedChange={() => handleMenuSettingChange('reporting', 'desktop')}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Switch 
                          id="menu-reporting-mobile" 
                          checked={menuSettings.reporting.mobile}
                          onCheckedChange={() => handleMenuSettingChange('reporting', 'mobile')}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="p-3 flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        <span>{t("navigation.settings")}</span>
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {t("settings.menu.alwaysVisible")}
                        </span>
                      </td>
                      <td className="p-3 text-center hidden sm:table-cell">
                        <Switch 
                          id="menu-settings-desktop" 
                          checked={true}
                          disabled={true}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <Switch 
                          id="menu-settings-mobile" 
                          checked={true}
                          disabled={true}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="sm:hidden text-sm text-muted-foreground mb-4">
                <p>{t("settings.menu.desktopSettingsHidden")}</p>
              </div>
              
              <Button 
                onClick={saveMenuSettings} 
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 