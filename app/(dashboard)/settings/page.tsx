"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { ClientThemeSelector } from "@/components/theme-selector"
import { LanguageSelector } from "@/components/language-selector"
import { useI18n } from "@/lib/i18n/context"
import type { Session } from '@supabase/auth-helpers-nextjs'
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
  Wrench as WrenchIcon, // Alias Wrench to avoid naming conflict
  Calendar,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InspectionTemplateManager } from "@/components/inspections"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null)
  const { t, language, setLanguage } = useI18n()
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

  useEffect(() => {
    async function getSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Error getting session:", error.message)
          return
        }
        
        setSession(session)
        
        // Load menu settings from local storage if available
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
      } catch (error) {
        console.error("Unexpected error getting session:", error)
      }
    }
    
    if (typeof window !== 'undefined') {
      getSession()
    }
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
      localStorage.setItem('menuSettings', JSON.stringify(menuSettings))
      // Simulate API call/show toast
      setTimeout(() => {
        setIsSaving(false)
        // Optionally add a success toast here
      }, 500)
    } catch (error) {
      console.error("Error saving menu settings to localStorage:", error);
      setIsSaving(false);
      // Optionally add an error toast here
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="text-muted-foreground">
            {t("settings.description") || "Manage your profile, preferences, and application settings"}
          </p>
        </div>
        {/* Add global save button or individual save buttons per tab? */}
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <div className="relative">
          <TabsList className="flex w-full overflow-x-auto scrollbar-hide py-2 no-scrollbar">
            <TabsTrigger 
              value="profile" 
              className="flex-1 min-w-[120px] h-12 data-[state=active]:bg-primary/10"
            >
              <User className="mr-2 h-5 w-5" />
              <span>{t("settings.tabs.profile")}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="flex-1 min-w-[120px] h-12 data-[state=active]:bg-primary/10"
            >
              <Palette className="mr-2 h-5 w-5" />
              <span>{t("settings.tabs.preferences")}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="menu" 
              className="flex-1 min-w-[120px] h-12 data-[state=active]:bg-primary/10"
            >
              <LayoutList className="mr-2 h-5 w-5" />
              <span>{t("settings.tabs.menu")}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="flex-1 min-w-[120px] h-12 data-[state=active]:bg-primary/10"
            >
              <ClipboardCheck className="mr-2 h-5 w-5" />
              <span>{t("settings.tabs.templates")}</span>
            </TabsTrigger>
          </TabsList>
          <style jsx global>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile">
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
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
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
        </TabsContent>

        {/* Menu Customization Tab */}
        <TabsContent value="menu">
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
                      {/* Menu items mapping - Consider refactoring this into a component or mapping over an array */} 
                      {Object.entries(menuSettings).map(([key, value]) => {
                        // Determine icon based on key
                        let IconComponent = Settings; // Default icon
                        if (key === 'dashboard') IconComponent = Gauge;
                        else if (key === 'vehicles') IconComponent = Truck;
                        else if (key === 'drivers') IconComponent = User;
                        else if (key === 'bookings') IconComponent = Calendar;
                        else if (key === 'maintenance') IconComponent = Wrench;
                        else if (key === 'inspections') IconComponent = ClipboardCheck;
                        else if (key === 'reporting') IconComponent = BarChart;

                        return (
                          <tr key={key} className="hover:bg-muted/50">
                            <td className="p-3 flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-primary flex-shrink-0" />
                              <span>{t(`settings.menu.${key}`)}</span>
                            </td>
                            <td className="text-center p-3">
                              <Switch
                                checked={value.desktop}
                                onCheckedChange={(checked) => handleMenuSettingChange(key as keyof typeof menuSettings, 'desktop')}
                              />
                            </td>
                            <td className="text-center p-3">
                              <Switch
                                checked={value.mobile}
                                onCheckedChange={(checked) => handleMenuSettingChange(key as keyof typeof menuSettings, 'mobile')}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <Button onClick={saveMenuSettings}>{t("settings.menu.save")}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.templates.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("settings.templates.description")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Responsive Template Tabs - Works for both mobile and desktop */}
                <Tabs defaultValue="routine" className="w-full">
                  {/* Mobile template selector */}
                  <div className="sm:hidden mb-4">
                    <Select defaultValue="routine" onValueChange={(value) => {
                      // Set the tab value programmatically by finding the TabsList element
                      const tabsList = document.querySelector('[role="tablist"]') as HTMLElement;
                      if (tabsList) {
                        const tab = tabsList.querySelector(`[data-value="${value}"]`) as HTMLElement;
                        tab?.click();
                      }
                    }}>
                      <SelectTrigger className="w-full py-3">
                        <SelectValue placeholder={t("inspections.selectTemplate") || "Select template type"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{t("inspections.type.routine")}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="safety">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span>{t("inspections.type.safety")}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="maintenance">
                          <div className="flex items-center gap-2">
                            <WrenchIcon className="h-4 w-4" />
                            <span>{t("inspections.type.maintenance")}</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* TabsList - Hidden on mobile, visible on desktop */}
                  <TabsList className="hidden sm:flex w-full mb-4">
                    <TabsTrigger value="routine" className="flex-1 py-3" data-value="routine">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>{t("inspections.type.routine")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="safety" className="flex-1 py-3" data-value="safety">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>{t("inspections.type.safety")}</span>
                    </TabsTrigger>
                    <TabsTrigger value="maintenance" className="flex-1 py-3" data-value="maintenance">
                      <WrenchIcon className="mr-2 h-4 w-4" />
                      <span>{t("inspections.type.maintenance")}</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Tab contents - Used for both mobile and desktop */}
                  <TabsContent value="routine" className="mt-0">
                    <div className="sm:hidden py-2 px-3 mb-4 border rounded-md bg-muted/30">
                      <h3 className="text-sm font-medium flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        {t("inspections.type.routine")}
                      </h3>
                    </div>
                    <InspectionTemplateManager type="routine" />
                  </TabsContent>
                  <TabsContent value="safety" className="mt-0">
                    <div className="sm:hidden py-2 px-3 mb-4 border rounded-md bg-muted/30">
                      <h3 className="text-sm font-medium flex items-center">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {t("inspections.type.safety")}
                      </h3>
                    </div>
                    <InspectionTemplateManager type="safety" />
                  </TabsContent>
                  <TabsContent value="maintenance" className="mt-0">
                    <div className="sm:hidden py-2 px-3 mb-4 border rounded-md bg-muted/30">
                      <h3 className="text-sm font-medium flex items-center">
                        <WrenchIcon className="mr-2 h-4 w-4" />
                        {t("inspections.type.maintenance")}
                      </h3>
                    </div>
                    <InspectionTemplateManager type="maintenance" />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}