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
  Wrench as WrenchIcon, // Alias Wrench to avoid naming conflict
  Calendar,
  Plus,
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
import { createClient } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Save,
} from "lucide-react"

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null)
  const { t, locale, setLanguage } = useI18n()
  const [activeTab, setActiveTab] = useState('account')
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
  
  // State for new template type
  const [newTemplateNameEn, setNewTemplateNameEn] = useState("")
  const [newTemplateNameJa, setNewTemplateNameJa] = useState("")
  const [newTemplateSlug, setNewTemplateSlug] = useState("")
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [isNewTemplateDialogOpen, setIsNewTemplateDialogOpen] = useState(false)
  const [customTemplateTypes, setCustomTemplateTypes] = useState<Array<{slug: string, name: Record<string, string>}>>([])
  const [activeTemplateTab, setActiveTemplateTab] = useState("routine")

  // Define tab options for both mobile select and desktop tabs
  const tabOptions = [
    { value: 'account', label: t("settings.tabs.account") || "Account", icon: User },
    { value: 'menu', label: t("settings.tabs.menu"), icon: LayoutList },
    { value: 'templates', label: t("settings.tabs.templates"), icon: ClipboardCheck },
  ]

  useEffect(() => {
    async function getSessionAndSettings() {
      const client = createClient();
      if (!client) {
        console.warn("[SettingsPage] Supabase client not available in getSessionAndSettings.");
        return;
      }
      try {
        const { data: { session: currentSession }, error } = await client.auth.getSession()
        
        if (error) {
          console.error("Error getting session:", error.message)
          return
        }
        
        setSession(currentSession)
        
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
      getSessionAndSettings()
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

  // Handle tab changes from both select dropdown and tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  }
  
  // Handle template tab change
  const handleTemplateTabChange = (value: string) => {
    setActiveTemplateTab(value);
  }
  
  // Handle creating a new template type
  const handleCreateTemplateSubmit = async () => {
    const supabase = createClient();
    if (!supabase) {
      console.warn("[SettingsPage] Supabase client not available for handleCreateTemplateSubmit.");
      toast({
        title: t("common.error"),
        description: "Action failed: Connection issue. Please try again.",
        variant: "destructive"
      });
      setIsSavingTemplate(false);
      return;
    }
    // Validate inputs
    if (!newTemplateNameEn.trim() && !newTemplateNameJa.trim()) {
      toast({
        title: t("common.error"),
        description: t("settings.templates.nameRequired"),
        variant: "destructive"
      });
      return;
    }
    
    if (!newTemplateSlug.trim()) {
      toast({
        title: t("common.error"),
        description: t("settings.templates.slugRequired"),
        variant: "destructive"
      });
      return;
    }
    
    // Check if slug follows pattern: lowercase letters, numbers, and hyphens only
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(newTemplateSlug)) {
      toast({
        title: t("common.error"),
        description: t("settings.templates.invalidSlug"),
        variant: "destructive"
      });
      return;
    }
    
    // Check for duplicate slug
    if (customTemplateTypes.some(template => template.slug === newTemplateSlug) ||
        ["routine", "safety", "maintenance"].includes(newTemplateSlug)) {
      toast({
        title: t("common.error"),
        description: t("settings.templates.slugExists"),
        variant: "destructive"
      });
      return;
    }
    
    setIsSavingTemplate(true);
    
    try {
      // Create translations object
      const nameTranslations: Record<string, string> = {};
      if (newTemplateNameEn.trim()) nameTranslations.en = newTemplateNameEn.trim();
      if (newTemplateNameJa.trim()) nameTranslations.ja = newTemplateNameJa.trim();
      
      // In a real app, we would make an API call to create the template type
      // For now, we'll just add it to local state
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add to custom template types
      const newTemplateType = {
        slug: newTemplateSlug,
        name: nameTranslations
      };
      
      setCustomTemplateTypes(prev => [...prev, newTemplateType]);
      
      // Save to localStorage for persistence
      const existingTypes = JSON.parse(localStorage.getItem('customTemplateTypes') || '[]');
      localStorage.setItem('customTemplateTypes', JSON.stringify([...existingTypes, newTemplateType]));
      
      // Show success toast
      toast({
        title: t("common.success"),
        description: t("settings.templates.createSuccess")
      });
      
      // Reset form and close dialog
      setNewTemplateNameEn("");
      setNewTemplateNameJa("");
      setNewTemplateSlug("");
      setIsNewTemplateDialogOpen(false);
      
      // Set the active tab to the new template
      setActiveTemplateTab(newTemplateSlug);
    } catch (error) {
      console.error("Error creating template type:", error);
      toast({
        title: t("common.error"),
        description: t("settings.templates.createError"),
        variant: "destructive"
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };
  
  // Load custom template types from localStorage on mount
  useEffect(() => {
    const loadCustomTemplateTypes = () => {
      try {
        const savedTypes = localStorage.getItem('customTemplateTypes');
        if (savedTypes) {
          setCustomTemplateTypes(JSON.parse(savedTypes));
        }
      } catch (error) {
        console.error("Error loading custom template types:", error);
      }
    };
    
    if (typeof window !== 'undefined') {
      loadCustomTemplateTypes();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="text-muted-foreground">
            {t("settings.description") || "Manage your profile, preferences, and application settings"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        {/* Mobile Select Dropdown */}
        <div className="sm:hidden mb-4">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="w-full py-3">
              <SelectValue placeholder={t("common.menu") || "Select settings tab"} />
            </SelectTrigger>
            <SelectContent>
              {tabOptions.map(tab => (
                <SelectItem key={tab.value} value={tab.value}>
                  <div className="flex items-center gap-2">
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop TabsList - Hidden on mobile */}
        <div className="hidden sm:block">
          <TabsList className="grid grid-cols-3 h-auto">
            {tabOptions.map(tab => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="flex-1 h-12 data-[state=active]:bg-primary/10"
              >
                <tab.icon className="mr-2 h-5 w-5" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Mobile Tab Title Indicator - Only shown when using the mobile select */}
        {activeTab && (
          <div className="sm:hidden py-2 px-3 mb-4 border rounded-md bg-muted/30">
            {tabOptions.map(tab => {
              if (tab.value === activeTab) {
                const Icon = tab.icon;
                return (
                  <h3 key={tab.value} className="text-sm font-medium flex items-center">
                    <Icon className="mr-2 h-4 w-4" />
                    {tab.label}
                  </h3>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Account Tab (Combined Profile & Preferences) */}
        <TabsContent value="account">
          <div className="space-y-8">
            <Card>
              <CardHeader className="pb-6">
                <CardTitle>{t("settings.profile.title")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("settings.profile.description")}
                </p>
              </CardHeader>
              <CardContent className="space-y-8 px-8 sm:px-10 pb-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="name" className="text-base">
                      {t("settings.profile.name")}
                    </Label>
                    <Input 
                      id="name" 
                      value={session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || ""} 
                      disabled 
                      className="py-6"
                    />
                  </div>
                  <div className="space-y-4 pt-2">
                    <Label htmlFor="email" className="text-base">
                      {t("settings.profile.email")}
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={session?.user?.email || ""} 
                      disabled 
                      className="py-6"
                    />
                    <p className="text-sm text-muted-foreground pt-2">
                      {t("settings.profile.emailDescription")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-6">
                <CardTitle>{t("settings.preferences.title")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("settings.preferences.description")}
                </p>
              </CardHeader>
              <CardContent className="space-y-8 px-8 sm:px-10 pb-8">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label htmlFor="theme" className="text-base">
                      {t("settings.preferences.theme.title")}
                    </Label>
                    <div className="pt-2">
                      <ClientThemeSelector />
                    </div>
                  </div>
                  <div className="space-y-4 pt-2">
                    <Label className="text-base">
                      {t("settings.preferences.language.title")}
                    </Label>
                    <div className="pt-2">
                      <LanguageSelector />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Menu Customization Tab */}
        <TabsContent value="menu">
          <Card>
            <CardHeader className="pb-6">
              <CardTitle>{t("settings.menu.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("settings.menu.description")}
              </p>
            </CardHeader>
            <CardContent className="px-8 sm:px-10 pb-8">
              <div className="space-y-8">
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-4 font-medium">{t("settings.menu.menuItem")}</th>
                        <th className="text-center p-4 font-medium hidden sm:table-cell">{t("settings.menu.desktop")}</th>
                        <th className="text-center p-4 font-medium">{t("settings.menu.mobile")}</th>
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
                            <td className="p-4 flex items-center gap-3">
                              <IconComponent className="h-5 w-5 text-primary flex-shrink-0" />
                              <span className="text-base">{t(`settings.menu.${key}`)}</span>
                            </td>
                            <td className="text-center p-4">
                              <Switch
                                checked={value.desktop}
                                onCheckedChange={(checked) => handleMenuSettingChange(key as keyof typeof menuSettings, 'desktop')}
                              />
                            </td>
                            <td className="text-center p-4">
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
                <Button onClick={saveMenuSettings} disabled={isSaving} className="py-6 px-8 text-base">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      {t("common.saving")}
                    </>
                  ) : (
                    t("settings.menu.save")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader className="pb-6">
              <CardTitle>{t("settings.templates.title")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("settings.templates.description")}
              </p>
            </CardHeader>
            <CardContent className="px-8 sm:px-10 pb-8">
              <div className="space-y-6">
                {/* Responsive Template Tabs - Works for both mobile and desktop */}
                <Tabs value={activeTemplateTab} onValueChange={handleTemplateTabChange} className="w-full">
                  {/* Mobile template selector */}
                  <div className="sm:hidden mb-4">
                    <Select value={activeTemplateTab} onValueChange={handleTemplateTabChange}>
                      <SelectTrigger className="w-full py-3">
                        <SelectValue placeholder={t("common.type") || "Select template type"} />
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
                        {customTemplateTypes.map(template => (
                          <SelectItem key={template.slug} value={template.slug}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{template.name[locale] || template.name.en || template.slug}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* TabsList - Hidden on mobile, visible on desktop */}
                  <div className="hidden sm:flex w-full mb-4 items-center">
                    <TabsList className="flex-grow">
                      <TabsTrigger value="routine" className="flex-1 py-3">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>{t("inspections.type.routine")}</span>
                      </TabsTrigger>
                      <TabsTrigger value="safety" className="flex-1 py-3">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>{t("inspections.type.safety")}</span>
                      </TabsTrigger>
                      <TabsTrigger value="maintenance" className="flex-1 py-3">
                        <WrenchIcon className="mr-2 h-4 w-4" />
                        <span>{t("inspections.type.maintenance")}</span>
                      </TabsTrigger>
                      {customTemplateTypes.map(template => (
                        <TabsTrigger key={template.slug} value={template.slug} className="flex-1 py-3">
                          <FileText className="mr-2 h-4 w-4" />
                          <span>{template.name[locale] || template.name.en || template.slug}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {/* Add new template type button */}
                    <Dialog open={isNewTemplateDialogOpen} onOpenChange={setIsNewTemplateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="ml-2 h-10 w-10" title={t("settings.templates.add")}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>{t("settings.templates.addTemplate")}</DialogTitle>
                          <DialogDescription>
                            {t("settings.templates.addTemplateDescription")}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-12 items-center gap-2">
                            <Label htmlFor="template-name-en" className="col-span-12 xs:col-span-4 xs:text-right">
                              {t("settings.templates.templateName")} (EN)
                            </Label>
                            <Input 
                              id="template-name-en" 
                              value={newTemplateNameEn}
                              onChange={(e) => setNewTemplateNameEn(e.target.value)}
                              className="col-span-12 xs:col-span-8" 
                              placeholder={t("settings.templates.templateNamePlaceholder")} 
                            />
                          </div>
                          <div className="grid grid-cols-12 items-center gap-2">
                            <Label htmlFor="template-name-ja" className="col-span-12 xs:col-span-4 xs:text-right">
                              {t("settings.templates.templateName")} (JA)
                            </Label>
                            <Input 
                              id="template-name-ja" 
                              value={newTemplateNameJa}
                              onChange={(e) => setNewTemplateNameJa(e.target.value)}
                              className="col-span-12 xs:col-span-8" 
                              placeholder={t("settings.templates.templateNamePlaceholderJa")} 
                            />
                          </div>
                          <div className="grid grid-cols-12 items-center gap-2">
                            <Label htmlFor="template-slug" className="col-span-12 xs:col-span-4 xs:text-right">
                              {t("settings.templates.templateSlug")}
                            </Label>
                            <Input 
                              id="template-slug" 
                              value={newTemplateSlug}
                              onChange={(e) => setNewTemplateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                              className="col-span-12 xs:col-span-8" 
                              placeholder={t("settings.templates.templateSlugPlaceholder")} 
                            />
                            <p className="col-span-12 xs:col-start-5 xs:col-span-8 text-sm text-muted-foreground">
                              {t("settings.templates.templateSlugDescription")}
                            </p>
                          </div>
                        </div>
                        <DialogFooter className="flex-col xs:flex-row gap-2">
                          <DialogClose asChild>
                            <Button type="button" variant="outline" className="w-full xs:w-auto">{t("common.cancel")}</Button>
                          </DialogClose>
                          <Button 
                            type="button" 
                            className="w-full xs:w-auto"
                            onClick={handleCreateTemplateSubmit}
                            disabled={isSavingTemplate}
                          >
                            {isSavingTemplate ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("common.saving")}
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                {t("common.save")}
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
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
                  
                  {/* Dynamic tabs for custom template types */}
                  {customTemplateTypes.map(template => (
                    <TabsContent key={template.slug} value={template.slug} className="mt-0">
                      <div className="sm:hidden py-2 px-3 mb-4 border rounded-md bg-muted/30">
                        <h3 className="text-sm font-medium flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          {template.name[locale] || template.name.en || template.slug}
                        </h3>
                      </div>
                      <InspectionTemplateManager type={template.slug as any} />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}