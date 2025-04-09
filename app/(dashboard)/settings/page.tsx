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
  Wrench as WrenchIcon // Alias Wrench to avoid naming conflict
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
import { supabase } from "@/lib/supabase/client"
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
        try {
          const parsedSettings = JSON.parse(savedMenuSettings);
          // Merge saved settings with default settings to avoid errors if new keys are added
          setMenuSettings(prevSettings => ({ ...prevSettings, ...parsedSettings }));
        } catch (error) {
          console.error("Error parsing menu settings from localStorage:", error);
          // Optionally reset to default or clear invalid storage
          localStorage.removeItem('menuSettings');
        }
      }
    }
    getSession()
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        {/* Add global save button or individual save buttons per tab? */}
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            {t("settings.tabs.profile")}
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Palette className="mr-2 h-4 w-4" />
            {t("settings.tabs.preferences")}
          </TabsTrigger>
          <TabsTrigger value="menu">
            <LayoutList className="mr-2 h-4 w-4" />
            {t("settings.tabs.menu")}
          </TabsTrigger>
          <TabsTrigger value="templates">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            {t("settings.tabs.templates")}
          </TabsTrigger>
        </TabsList>

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
                        else if (key === 'maintenance') IconComponent = Wrench;
                        else if (key === 'inspections') IconComponent = ClipboardCheck;
                        else if (key === 'reporting') IconComponent = BarChart;

                        return (
                          <tr key={key} className="hover:bg-muted/50">
                            <td className="p-3 flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-primary flex-shrink-0" />
                              <span>{t(`navigation.${key as keyof typeof menuSettings}`)}</span>
                              {key === 'settings' && (
                                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  {t("settings.menu.alwaysVisible")}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center hidden sm:table-cell">
                              <Switch 
                                id={`menu-${key}-desktop`} 
                                checked={value.desktop}
                                onCheckedChange={() => handleMenuSettingChange(key as keyof typeof menuSettings, 'desktop')}
                                disabled={key === 'settings'}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <Switch 
                                id={`menu-${key}-mobile`} 
                                checked={value.mobile}
                                onCheckedChange={() => handleMenuSettingChange(key as keyof typeof menuSettings, 'mobile')}
                                disabled={key === 'settings'}
                              />
                            </td>
                          </tr>
                        )
                      })}
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
                    <>{t("common.saveChanges")}</> // Use a more specific label
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspection Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
           <Card>
            <CardHeader>
               <CardTitle>{t("settings.templates.title")}</CardTitle>
               <p className="text-sm text-muted-foreground">
                 {t("settings.templates.description")}
               </p>
             </CardHeader>
             <CardContent>
               <Tabs defaultValue="routine" className="space-y-4">
                 <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="routine">
                       <FileText className="mr-2 h-4 w-4" />
                       {t("inspections.type.routine")}
                    </TabsTrigger>
                    <TabsTrigger value="safety">
                       <ShieldCheck className="mr-2 h-4 w-4" />
                       {t("inspections.type.safety")}
                    </TabsTrigger>
                    <TabsTrigger value="maintenance">
                       <WrenchIcon className="mr-2 h-4 w-4" />
                       {t("inspections.type.maintenance")}
                    </TabsTrigger>
                 </TabsList>

                 <TabsContent value="routine">
                    <InspectionTemplateManager type="routine" />
                 </TabsContent>
                 <TabsContent value="safety">
                    <InspectionTemplateManager type="safety" />
                 </TabsContent>
                 <TabsContent value="maintenance">
                    <InspectionTemplateManager type="maintenance" />
                 </TabsContent>
               </Tabs>
             </CardContent>
           </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
} 