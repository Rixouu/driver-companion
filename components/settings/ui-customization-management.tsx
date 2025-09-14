"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Save, RefreshCw, Eye, Palette, Moon, Type, Layout, Tag, Code, Upload, Image } from 'lucide-react'

interface AppSetting {
  key: string
  value: string
}

export function UICustomizationManagement() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('colors')
  const [dataLoaded, setDataLoaded] = useState(false)
  
  const [formData, setFormData] = useState({
    // Sidebar Colors
    ui_sidebar_background_color: '#d9d9d9',
    ui_sidebar_text_color: '#262626',
    ui_sidebar_hover_color: '#cccccc',
    ui_sidebar_active_color: '#171717',
    ui_sidebar_border_color: '#bfbfbf',
    ui_menu_active_color: '#171717',
    ui_menu_hover_color: '#f5f5f5',
    ui_content_background: '#FAFAFA',
    
    // Typography
    ui_font_family: 'Noto Sans Thai',
    ui_font_size_base: '14px',
    
    // Buttons
    ui_primary_button_color: '#171717',
    ui_primary_button_text_color: '#fafafa',
    ui_secondary_button_color: '#f5f5f5',
    
    // Status Colors
    ui_success_color: '#16a34a',
    ui_warning_color: '#eab308',
    ui_error_color: '#dc2626',
    ui_info_color: '#3b82f6',
    
    // Layout
    ui_page_background_color: '#ffffff',
    ui_main_layout_background: '#ffffff',
    ui_card_background_color: '#ffffff',
    ui_card_border_color: '#e5e5e5',
    ui_border_radius: '0.5rem',
    
    // Dark Mode Colors
    ui_dark_sidebar_background: '#080808',
    ui_dark_sidebar_text_color: '#f2f2f2',
    ui_dark_sidebar_hover_color: '#0f0f0f',
    ui_dark_sidebar_active_color: '#1a1a1a',
    ui_dark_sidebar_border_color: '#0f0f0f',
    ui_dark_menu_active_color: '#1a1a1a',
    ui_dark_menu_hover_color: '#0f0f0f',
    ui_dark_content_background: '#111111',
    ui_dark_page_background: '#050505',
    ui_dark_main_layout_background: '#050505',
    ui_dark_card_background: '#0a0a0a',
    ui_dark_card_border_color: '#0f0f0f',
    ui_dark_primary_button_color: '#f2f2f2',
    ui_dark_primary_button_text_color: '#050505',
    
    // Sidebar Logo
    ui_sidebar_logo_text: 'DRIVER',
    ui_sidebar_logo_color: '#dc2626',
    ui_sidebar_logo_image: 'http://localhost:3000/img/driver-header-logo.png',
    
    // Custom CSS
    ui_custom_css: ''
  })

  useEffect(() => {
    loadSettings()
  }, [])


  // Debug: Log formData changes
  useEffect(() => {
    console.log('formData changed:', formData)
  }, [formData])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/app-settings')
      if (response.ok) {
        const data = await response.json()
        console.log('Raw API response:', data)
        
        const settingsMap = data.reduce((acc: any, setting: AppSetting) => {
          if (setting.key.startsWith('ui_')) {
            acc[setting.key] = setting.value
          }
          return acc
        }, {})
        
        console.log('Loaded settings from database:', settingsMap)
        console.log('Current formData before update:', formData)
        
        // Only update formData if we have settings from database
        if (Object.keys(settingsMap).length > 0) {
          console.log('Updated formData with database values:', settingsMap)
          setFormData(prev => ({
            ...prev,
            ...settingsMap
          }))
          setDataLoaded(true)
        } else {
          console.log('No UI settings found in database, using defaults')
          setDataLoaded(true)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const settingsCount = Object.keys(formData).length
      console.log(`Saving ${settingsCount} settings to database using batch operation`)
      
      const response = await fetch('/api/admin/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to save settings')
      }

      const result = await response.json()
      console.log('Batch save result:', result)

      // Save to localStorage for global provider
      localStorage.setItem('ui-customization-settings', JSON.stringify(formData))
      
      console.log(`Successfully saved ${result.updatedCount || settingsCount} UI settings to database`)

      toast({
        title: 'Success',
        description: `Successfully saved ${result.updatedCount || settingsCount} UI customization settings!`
      })

      // Apply styles immediately
      applyStyles()
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: `Failed to save settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const applyStyles = () => {
    // Remove existing UI customization styles
    const existingStyle = document.getElementById('ui-customization-styles')
    if (existingStyle) {
      existingStyle.remove()
    }

    // Create new style element
    const style = document.createElement('style')
    style.id = 'ui-customization-styles'
    
    // Convert hex to HSL helper
    const hexToHsl = (hex: string): string => {
      hex = hex.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16) / 255
      const g = parseInt(hex.substr(2, 2), 16) / 255
      const b = parseInt(hex.substr(4, 2), 16) / 255
      
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h = 0
      let s = 0
      const l = (max + min) / 2
      
      if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break
          case g: h = (b - r) / d + 2; break
          case b: h = (r - g) / d + 4; break
        }
        h /= 6
      }
      
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
    }

    const css = `
      :root {
        --sidebar-background: ${hexToHsl(formData.ui_sidebar_background_color)};
        --sidebar-foreground: ${hexToHsl(formData.ui_sidebar_text_color)};
        --sidebar-accent: ${hexToHsl(formData.ui_menu_hover_color)};
        --sidebar-accent-foreground: ${hexToHsl(formData.ui_sidebar_text_color)};
        --sidebar-primary: ${hexToHsl(formData.ui_sidebar_active_color)};
        --sidebar-border: ${hexToHsl(formData.ui_sidebar_border_color)};
        --menu-active-bg: ${hexToHsl(formData.ui_menu_active_color)};
        --menu-hover-bg: ${hexToHsl(formData.ui_menu_hover_color)};
        --content-background: ${hexToHsl(formData.ui_content_background)};
        
        --background: ${hexToHsl(formData.ui_main_layout_background)};
        --foreground: ${hexToHsl(formData.ui_sidebar_text_color)};
        --card: ${hexToHsl(formData.ui_card_background_color)};
        --card-foreground: ${hexToHsl(formData.ui_sidebar_text_color)};
        --border: ${hexToHsl(formData.ui_card_border_color)};
        
        --primary: ${hexToHsl(formData.ui_primary_button_color)};
        --primary-foreground: ${hexToHsl(formData.ui_primary_button_text_color)};
        --secondary: ${hexToHsl(formData.ui_secondary_button_color)};
        
        --status-success: ${hexToHsl(formData.ui_success_color)};
        --status-warning: ${hexToHsl(formData.ui_warning_color)};
        --destructive: ${hexToHsl(formData.ui_error_color)};
        --sidebar-ring: ${hexToHsl(formData.ui_info_color)};
        
        --radius: ${formData.ui_border_radius};
      }
      
      .dark {
        --sidebar-background: ${hexToHsl(formData.ui_dark_sidebar_background)};
        --sidebar-foreground: ${hexToHsl(formData.ui_dark_sidebar_text_color)};
        --sidebar-accent: ${hexToHsl(formData.ui_dark_menu_hover_color)};
        --sidebar-accent-foreground: ${hexToHsl(formData.ui_dark_sidebar_text_color)};
        --sidebar-primary: ${hexToHsl(formData.ui_dark_sidebar_active_color)};
        --sidebar-border: ${hexToHsl(formData.ui_dark_sidebar_border_color)};
        --menu-active-bg: ${hexToHsl(formData.ui_dark_menu_active_color)};
        --menu-hover-bg: ${hexToHsl(formData.ui_dark_menu_hover_color)};
        --content-background: ${hexToHsl(formData.ui_dark_content_background)};
        
        --background: ${hexToHsl(formData.ui_dark_main_layout_background)};
        --foreground: ${hexToHsl(formData.ui_dark_sidebar_text_color)};
        --card: ${hexToHsl(formData.ui_dark_card_background)};
        --card-foreground: ${hexToHsl(formData.ui_dark_sidebar_text_color)};
        --border: ${hexToHsl(formData.ui_dark_card_border_color)};
        
        --primary: ${hexToHsl(formData.ui_dark_primary_button_color)};
        --primary-foreground: ${hexToHsl(formData.ui_dark_primary_button_text_color)};
      }

      /* Apply font family more carefully to avoid breaking layout */
      body {
        font-family: ${formData.ui_font_family}, 'Noto Sans Thai', 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
        font-size: ${formData.ui_font_size_base} !important;
      }

      /* Sidebar logo customization */
      .sidebar-logo {
        color: ${formData.ui_sidebar_logo_color} !important;
        font-weight: 700 !important;
        font-size: 1.25rem !important;
      }
      
      .sidebar-logo img {
        height: 2rem !important;
        width: auto !important;
        object-fit: contain !important;
      }

      /* MENU ACTIVE BACKGROUND - Override the sidebar accent for active items */
      /* Target the actual sidebar button active state */
      .sidebar button.bg-\\[hsl\\(var\\(--sidebar-accent\\)\\)\\] {
        background-color: hsl(var(--menu-active-bg)) !important;
      }

      /* Override any active button in sidebar */
      .sidebar button:has([data-active="true"]),
      .sidebar button[data-active="true"],
      .sidebar a:has([data-active="true"]),
      .sidebar a[data-active="true"] {
        background-color: hsl(var(--menu-active-bg)) !important;
      }

      /* Sidebar navigation active items */
      .sidebar-nav .nav-item[data-active="true"],
      .sidebar-nav .nav-item[aria-current="page"],
      .sidebar-nav .nav-item.active,
      .sidebar-nav a[data-active="true"],
      .sidebar-nav a[aria-current="page"],
      .sidebar-nav a.active {
        background-color: hsl(var(--menu-active-bg)) !important;
      }

      /* General menu active items */
      .menu-item[data-active="true"],
      .menu-item[aria-current="page"],
      .menu-item.active,
      .menu-item a[data-active="true"],
      .menu-item a[aria-current="page"],
      .menu-item a.active {
        background-color: hsl(var(--menu-active-bg)) !important;
      }

      /* Sidebar button active states */
      .sidebar button[data-active="true"],
      .sidebar button[aria-current="page"],
      .sidebar button.active {
        background-color: hsl(var(--menu-active-bg)) !important;
      }

      /* Override any existing background colors for active items */
      [data-sidebar] *[data-active="true"],
      [data-sidebar] *[aria-current="page"],
      [data-sidebar] *.active {
        background-color: hsl(var(--menu-active-bg)) !important;
      }

      /* Force active background on any element that looks like a menu item */
      [data-sidebar] div[role="button"]:has([data-active="true"]),
      [data-sidebar] div[role="button"]:has([aria-current="page"]),
      [data-sidebar] div[role="button"]:has(.active) {
        background-color: hsl(var(--menu-active-bg)) !important;
      }

      /* Override Tailwind classes for active items */
      [data-sidebar] .bg-sidebar-accent[data-active="true"],
      [data-sidebar] .bg-sidebar-accent[aria-current="page"],
      [data-sidebar] .bg-sidebar-accent.active,
      [data-sidebar] .bg-muted[data-active="true"],
      [data-sidebar] .bg-muted[aria-current="page"],
      [data-sidebar] .bg-muted.active {
        background-color: hsl(var(--menu-active-bg)) !important;
      }

      /* Force active background on preview elements */
      .preview-active-item {
        background-color: hsl(var(--menu-active-bg)) !important;
      }

      /* Override any background color for active menu items */
      *[data-active="true"] {
        background-color: hsl(var(--menu-active-bg)) !important;
      }

      /* Add card borders/strokes to match production */
      .card,
      [data-card],
      .bg-card,
      .rounded-lg.border {
        border: 1px solid hsl(var(--border)) !important;
        border-width: 1px !important;
      }

      /* Ensure all elements with border class have visible borders */
      .border {
        border-width: 1px !important;
        border-style: solid !important;
        border-color: hsl(var(--border)) !important;
      }



      /* Force override the sidebar accent variable for active items */
      .sidebar button[class*="bg-[hsl(var(--sidebar-accent))]"] {
        background-color: hsl(var(--menu-active-bg)) !important;
      }

      /* Override the specific Tailwind class used in sidebar */
      .bg-\\[hsl\\(var\\(--sidebar-accent\\)\\)\\] {
        background-color: hsl(var(--menu-active-bg)) !important;
      }

      /* Apply content background for light mode */
      main {
        background-color: hsl(var(--content-background)) !important;
      }

      .bg-\\[#FAFAFA\\] {
        background-color: hsl(var(--content-background)) !important;
      }

      /* Apply content background for dark mode */
      .dark main {
        background-color: hsl(var(--content-background)) !important;
      }

      .dark .bg-\\[#111111\\] {
        background-color: hsl(var(--content-background)) !important;
      }

      /* MENU HOVER BACKGROUND - for HOVER states only */
      [data-sidebar] [data-menu-item]:hover:not([data-active="true"]):not([aria-current="page"]):not(.active) {
        background-color: hsl(var(--menu-hover-bg)) !important;
      }

      .sidebar-nav .nav-item:hover:not([data-active="true"]):not([aria-current="page"]):not(.active) {
        background-color: hsl(var(--menu-hover-bg)) !important;
      }

      .menu-item:hover:not([data-active="true"]):not([aria-current="page"]):not(.active) {
        background-color: hsl(var(--menu-hover-bg)) !important;
      }

      .sidebar button:hover:not([data-active="true"]):not([aria-current="page"]):not(.active) {
        background-color: hsl(var(--menu-hover-bg)) !important;
      }

      /* Override Tailwind sidebar hover classes for non-active items */
      .hover\\:bg-sidebar-accent:hover:not([data-active="true"]):not([aria-current="page"]):not(.active) {
        background-color: hsl(var(--menu-hover-bg)) !important;
      }

      /* Sidebar button and link hover states for non-active items */
      .sidebar a:hover:not([data-active="true"]):not([aria-current="page"]):not(.active),
      .sidebar [role="button"]:hover:not([data-active="true"]):not([aria-current="page"]):not(.active) {
        background-color: hsl(var(--menu-hover-bg)) !important;
      }

      ${formData.ui_custom_css}
    `

    style.textContent = css
    document.head.appendChild(style)
  }

  const handleFormDataChange = (key: keyof typeof formData, value: string) => {
    console.log(`handleFormDataChange called: ${key} = ${value}`)
    
    const newFormData = { ...formData, [key]: value }
    console.log(`Updated formData:`, newFormData)
    setFormData(newFormData)
    
    // Save to localStorage for global provider
    localStorage.setItem('ui-customization-settings', JSON.stringify(newFormData))
    
    // Apply styles immediately for live preview
    applyStyles()
  }

  const handleColorInputChange = (key: keyof typeof formData, value: string) => {
    // Simple direct update for color inputs - let the user type freely
    handleFormDataChange(key, value)
  }

  const handleReset = () => {
    const resetData = {
      ui_sidebar_background_color: '#d9d9d9',
      ui_sidebar_text_color: '#262626',
      ui_sidebar_hover_color: '#cccccc',
      ui_sidebar_active_color: '#171717',
      ui_sidebar_border_color: '#bfbfbf',
      ui_menu_active_color: '#171717',
      ui_menu_hover_color: '#f5f5f5',
      ui_font_family: 'Noto Sans Thai',
      ui_font_size_base: '14px',
      ui_primary_button_color: '#171717',
      ui_primary_button_text_color: '#fafafa',
      ui_secondary_button_color: '#f5f5f5',
      ui_success_color: '#16a34a',
      ui_warning_color: '#eab308',
      ui_error_color: '#dc2626',
      ui_info_color: '#3b82f6',
      ui_page_background_color: '#ffffff',
      ui_main_layout_background: '#ffffff',
      ui_card_background_color: '#ffffff',
      ui_card_border_color: '#e5e5e5',
      ui_border_radius: '0.5rem',
      ui_dark_sidebar_background: '#080808',
      ui_dark_sidebar_text_color: '#f2f2f2',
      ui_dark_sidebar_hover_color: '#0f0f0f',
      ui_dark_sidebar_active_color: '#1a1a1a',
      ui_dark_sidebar_border_color: '#0f0f0f',
      ui_dark_menu_active_color: '#1a1a1a',
      ui_dark_menu_hover_color: '#0f0f0f',
      ui_dark_page_background: '#050505',
      ui_dark_main_layout_background: '#050505',
      ui_dark_card_background: '#0a0a0a',
      ui_dark_card_border_color: '#0f0f0f',
      ui_dark_primary_button_color: '#f2f2f2',
      ui_dark_primary_button_text_color: '#050505',
      ui_sidebar_logo_text: 'DRIVER',
      ui_sidebar_logo_color: '#dc2626',
      ui_sidebar_logo_image: 'http://localhost:3000/img/driver-header-logo.png',
      ui_custom_css: ''
    }
    
    setFormData(resetData)
    
    // Save to localStorage for global provider
    localStorage.setItem('ui-customization-settings', JSON.stringify(resetData))
    
    // Apply styles immediately
    applyStyles()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading UI customization settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div className="border-b border-border pb-3 sm:pb-4 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight">UI Customization</h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
            Customize the appearance of your fleet management interface
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 ml-6">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Mobile Action Buttons */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        <Button variant="outline" onClick={handleReset} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Responsive Tab Navigation */}
      <div className="space-y-4">
        {/* Mobile Dropdown */}
        <div className="sm:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="colors">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Light Mode
                </div>
              </SelectItem>
              <SelectItem value="dark-mode">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Dark Mode
                </div>
              </SelectItem>
              <SelectItem value="typography">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Typography
                </div>
              </SelectItem>
              <SelectItem value="layout">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Layout
                </div>
              </SelectItem>
              <SelectItem value="logo">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Logo
                </div>
              </SelectItem>
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Custom CSS
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Button Tabs */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-1 p-1 bg-muted rounded-lg">
            {[
              { id: 'colors', label: 'Light Mode', icon: Palette },
              { id: 'dark-mode', label: 'Dark Mode', icon: Moon },
              { id: 'typography', label: 'Typography', icon: Type },
              { id: 'layout', label: 'Layout', icon: Layout },
              { id: 'logo', label: 'Logo', icon: Tag },
              { id: 'custom', label: 'Custom CSS', icon: Code }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'colors' && (
            <Card>
              <CardHeader>
                <CardTitle>Light Mode Colors</CardTitle>
                <CardDescription>Customize the color scheme for light mode</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sidebar_bg">Sidebar Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="sidebar_bg"
                        value={formData.ui_sidebar_background_color}
                        onChange={(e) => handleFormDataChange('ui_sidebar_background_color', e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={formData.ui_sidebar_background_color}
                        onChange={(e) => handleColorInputChange('ui_sidebar_background_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sidebar_text">Sidebar Text</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="sidebar_text"
                        value={formData.ui_sidebar_text_color}
                        onChange={(e) => handleFormDataChange('ui_sidebar_text_color', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_sidebar_text_color}
                        onChange={(e) => handleColorInputChange('ui_sidebar_text_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primary_btn">Primary Button</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="primary_btn"
                        value={formData.ui_primary_button_color}
                        onChange={(e) => handleFormDataChange('ui_primary_button_color', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_primary_button_color}
                        onChange={(e) => handleColorInputChange('ui_primary_button_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="success_color">Success Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="success_color"
                        value={formData.ui_success_color}
                        onChange={(e) => handleFormDataChange('ui_success_color', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_success_color}
                        onChange={(e) => handleColorInputChange('ui_success_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="main_layout_bg">Main Layout Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="main_layout_bg"
                        value={formData.ui_main_layout_background}
                        onChange={(e) => handleFormDataChange('ui_main_layout_background', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_main_layout_background}
                        onChange={(e) => handleColorInputChange('ui_main_layout_background', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="menu_active">Menu Active Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="menu_active"
                        value={formData.ui_menu_active_color}
                        onChange={(e) => handleFormDataChange('ui_menu_active_color', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_menu_active_color}
                        onChange={(e) => handleColorInputChange('ui_menu_active_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="menu_hover">Menu Hover Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="menu_hover"
                        value={formData.ui_menu_hover_color}
                        onChange={(e) => handleFormDataChange('ui_menu_hover_color', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_menu_hover_color}
                        onChange={(e) => handleColorInputChange('ui_menu_hover_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="content_background">Content Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="content_background"
                        value={formData.ui_content_background || '#FAFAFA'}
                        onChange={(e) => handleFormDataChange('ui_content_background', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_content_background || '#FAFAFA'}
                        onChange={(e) => handleColorInputChange('ui_content_background', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#FAFAFA"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="card_border_color">Card Border Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="card_border_color"
                        value={formData.ui_card_border_color || '#e5e5e5'}
                        onChange={(e) => handleFormDataChange('ui_card_border_color', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_card_border_color || '#e5e5e5'}
                        onChange={(e) => handleColorInputChange('ui_card_border_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#e5e5e5"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'dark-mode' && (
            <Card>
              <CardHeader>
                <CardTitle>Dark Mode Colors</CardTitle>
                <CardDescription>Customize colors for dark mode theme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dark_sidebar_bg">Dark Sidebar Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="dark_sidebar_bg"
                        value={formData.ui_dark_sidebar_background}
                        onChange={(e) => handleFormDataChange('ui_dark_sidebar_background', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_dark_sidebar_background}
                        onChange={(e) => handleColorInputChange('ui_dark_sidebar_background', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dark_sidebar_text">Dark Sidebar Text</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="dark_sidebar_text"
                        value={formData.ui_dark_sidebar_text_color}
                        onChange={(e) => handleFormDataChange('ui_dark_sidebar_text_color', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_dark_sidebar_text_color}
                        onChange={(e) => handleColorInputChange('ui_dark_sidebar_text_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dark_page_bg">Dark Page Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="dark_page_bg"
                        value={formData.ui_dark_page_background}
                        onChange={(e) => handleFormDataChange('ui_dark_page_background', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_dark_page_background}
                        onChange={(e) => handleColorInputChange('ui_dark_page_background', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dark_main_layout_bg">Dark Main Layout Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="dark_main_layout_bg"
                        value={formData.ui_dark_main_layout_background}
                        onChange={(e) => handleFormDataChange('ui_dark_main_layout_background', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_dark_main_layout_background}
                        onChange={(e) => handleColorInputChange('ui_dark_main_layout_background', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dark_card_bg">Dark Card Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="dark_card_bg"
                        value={formData.ui_dark_card_background}
                        onChange={(e) => handleFormDataChange('ui_dark_card_background', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_dark_card_background}
                        onChange={(e) => handleColorInputChange('ui_dark_card_background', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dark_primary_btn">Dark Primary Button</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="dark_primary_btn"
                        value={formData.ui_dark_primary_button_color}
                        onChange={(e) => handleFormDataChange('ui_dark_primary_button_color', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_dark_primary_button_color}
                        onChange={(e) => handleColorInputChange('ui_dark_primary_button_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dark_primary_btn_text">Dark Primary Button Text</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="dark_primary_btn_text"
                        value={formData.ui_dark_primary_button_text_color}
                        onChange={(e) => handleFormDataChange('ui_dark_primary_button_text_color', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_dark_primary_button_text_color}
                        onChange={(e) => handleColorInputChange('ui_dark_primary_button_text_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dark_menu_active">Dark Menu Active Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="dark_menu_active"
                        value={formData.ui_dark_menu_active_color}
                        onChange={(e) => handleFormDataChange('ui_dark_menu_active_color', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_dark_menu_active_color}
                        onChange={(e) => handleColorInputChange('ui_dark_menu_active_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dark_menu_hover">Dark Menu Hover Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="dark_menu_hover"
                        value={formData.ui_dark_menu_hover_color}
                        onChange={(e) => handleFormDataChange('ui_dark_menu_hover_color', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_dark_menu_hover_color}
                        onChange={(e) => handleColorInputChange('ui_dark_menu_hover_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dark_content_background">Dark Content Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="dark_content_background"
                        value={formData.ui_dark_content_background || '#111111'}
                        onChange={(e) => handleFormDataChange('ui_dark_content_background', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_dark_content_background || '#111111'}
                        onChange={(e) => handleColorInputChange('ui_dark_content_background', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#111111"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dark_card_border_color">Dark Card Border Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id="dark_card_border_color"
                        value={formData.ui_dark_card_border_color || '#0f0f0f'}
                        onChange={(e) => handleFormDataChange('ui_dark_card_border_color', e.target.value)}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={formData.ui_dark_card_border_color || '#0f0f0f'}
                        onChange={(e) => handleColorInputChange('ui_dark_card_border_color', e.target.value)}
                        className="flex-1 font-mono text-sm"
                        placeholder="#0f0f0f"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'typography' && (
            <Card>
              <CardHeader>
                <CardTitle>Typography Settings</CardTitle>
                <CardDescription>Customize fonts and text appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="font_family">Font Family</Label>
                  <Select value={formData.ui_font_family} onValueChange={(value) => handleFormDataChange('ui_font_family', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Noto Sans Thai">Noto Sans Thai</SelectItem>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="font_size">Font Size</Label>
                  <Input
                    id="font_size"
                    value={formData.ui_font_size_base}
                    onChange={(e) => handleFormDataChange('ui_font_size_base', e.target.value)}
                    placeholder="14px"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'layout' && (
            <Card>
              <CardHeader>
                <CardTitle>Layout Settings</CardTitle>
                <CardDescription>Customize spacing and layout elements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="border_radius">Border Radius</Label>
                  <Input
                    id="border_radius"
                    value={formData.ui_border_radius}
                    onChange={(e) => handleFormDataChange('ui_border_radius', e.target.value)}
                    placeholder="0.5rem"
                  />
                </div>
                
              </CardContent>
            </Card>
          )}

          {activeTab === 'logo' && (
            <Card>
              <CardHeader>
                <CardTitle>Sidebar Logo Settings</CardTitle>
                <CardDescription>Customize the sidebar logo image, text and color</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_image">Logo Image</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      id="logo_image"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (e) => {
                            handleFormDataChange('ui_sidebar_logo_image', e.target?.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  {formData.ui_sidebar_logo_image && (
                    <div className="mt-2">
                      <img 
                        src={formData.ui_sidebar_logo_image} 
                        alt="Logo preview" 
                        className="h-12 w-auto object-contain"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo_text">Logo Text (fallback)</Label>
                  <Input
                    id="logo_text"
                    value={formData.ui_sidebar_logo_text}
                    onChange={(e) => handleFormDataChange('ui_sidebar_logo_text', e.target.value)}
                    placeholder="DRIVER"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo_color">Logo Color (for text fallback)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="logo_color"
                      value={formData.ui_sidebar_logo_color}
                      onChange={(e) => handleFormDataChange('ui_sidebar_logo_color', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.ui_sidebar_logo_color}
                      onChange={(e) => handleColorInputChange('ui_sidebar_logo_color', e.target.value)}
                      className="flex-1 font-mono text-sm"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'custom' && (
            <Card>
              <CardHeader>
                <CardTitle>Custom CSS</CardTitle>
                <CardDescription>Add custom CSS to override styles</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={formData.ui_custom_css}
                  onChange={(e) => handleFormDataChange('ui_custom_css', e.target.value)}
                  className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                  placeholder="/* Add your custom CSS here */"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Live Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                {activeTab === 'dark-mode' 
                  ? 'See how your dark mode changes affect the interface'
                  : activeTab === 'logo'
                  ? 'See how your logo changes affect the interface'
                  : 'See how your changes affect the interface'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Light Mode Preview */}
                {activeTab === 'colors' && (
                  <>
                    <div 
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: formData.ui_sidebar_background_color,
                        color: formData.ui_sidebar_text_color,
                        borderColor: formData.ui_sidebar_border_color,
                        borderRadius: formData.ui_border_radius
                      }}
                    >
                      <h4 className="font-medium mb-3">Light Mode Sidebar</h4>
                      <div className="space-y-1">
                        <div 
                          className="px-3 py-2 rounded text-sm cursor-pointer"
                          style={{ backgroundColor: formData.ui_sidebar_hover_color }}
                        >
                          Dashboard
                        </div>
                        <div 
                          className="px-3 py-2 rounded text-sm cursor-pointer preview-active-item"
                          style={{ backgroundColor: formData.ui_menu_active_color }}
                        >
                          Fleet Management
                        </div>
                        <div 
                          className="px-3 py-2 rounded text-sm cursor-pointer"
                          style={{ backgroundColor: formData.ui_sidebar_hover_color }}
                        >
                          Bookings
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <button 
                        className="px-4 py-2 rounded text-sm font-medium"
                        style={{
                          backgroundColor: formData.ui_primary_button_color,
                          color: formData.ui_primary_button_text_color,
                          borderRadius: formData.ui_border_radius
                        }}
                      >
                        Primary Button
                      </button>
                      <div className="flex gap-2">
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{ 
                            color: formData.ui_success_color,
                            backgroundColor: `${formData.ui_success_color}20`
                          }}
                        >
                          Success
                        </span>
                        <span 
                          className="text-xs px-2 py-1 rounded"
                          style={{ 
                            color: formData.ui_error_color,
                            backgroundColor: `${formData.ui_error_color}20`
                          }}
                        >
                          Error
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Dark Mode Preview */}
                {activeTab === 'dark-mode' && (
                  <>
                    <div 
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: formData.ui_dark_sidebar_background,
                        color: formData.ui_dark_sidebar_text_color,
                        borderColor: formData.ui_dark_sidebar_border_color,
                        borderRadius: formData.ui_border_radius
                      }}
                    >
                      <h4 className="font-medium mb-3">Dark Mode Sidebar</h4>
                      <div className="space-y-1">
                        <div 
                          className="px-3 py-2 rounded text-sm cursor-pointer"
                          style={{ backgroundColor: formData.ui_dark_sidebar_hover_color }}
                        >
                          Dashboard
                        </div>
                        <div 
                          className="px-3 py-2 rounded text-sm cursor-pointer"
                          style={{ backgroundColor: formData.ui_dark_sidebar_active_color }}
                        >
                          Fleet Management
                        </div>
                        <div 
                          className="px-3 py-2 rounded text-sm cursor-pointer"
                          style={{ backgroundColor: formData.ui_dark_sidebar_hover_color }}
                        >
                          Bookings
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: formData.ui_dark_card_background,
                        color: formData.ui_dark_sidebar_text_color,
                        borderColor: formData.ui_dark_card_border_color,
                        borderRadius: formData.ui_border_radius
                      }}
                    >
                      <h4 className="font-medium mb-2">Dark Mode Card</h4>
                      <p className="text-sm mb-3">This is how cards will look in dark mode</p>
                      <button 
                        className="px-4 py-2 rounded text-sm font-medium"
                        style={{
                          backgroundColor: formData.ui_dark_primary_button_color,
                          color: formData.ui_dark_primary_button_text_color,
                          borderRadius: formData.ui_border_radius
                        }}
                      >
                        Dark Primary Button
                      </button>
                    </div>
                  </>
                )}

                {/* Logo Preview */}
                {activeTab === 'logo' && (
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-medium mb-3">Logo Preview</h4>
                    {formData.ui_sidebar_logo_image ? (
                      <div className="mb-4">
                        <img 
                          src={formData.ui_sidebar_logo_image} 
                          alt="Logo preview" 
                          className="h-16 w-auto object-contain"
                        />
                      </div>
                    ) : (
                      <div 
                        className="text-2xl font-bold mb-4"
                        style={{ color: formData.ui_sidebar_logo_color }}
                      >
                        {formData.ui_sidebar_logo_text}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      This is how your logo will appear in the sidebar
                    </p>
                  </div>
                )}

                {/* Typography Preview */}
                {activeTab === 'typography' && (
                  <div 
                    className="p-4 rounded-lg border"
                    style={{
                      fontFamily: formData.ui_font_family,
                      fontSize: formData.ui_font_size_base
                    }}
                  >
                    <h4 className="font-medium mb-3">Typography Preview</h4>
                    <h1 className="text-2xl font-bold mb-2">Heading 1</h1>
                    <h2 className="text-xl font-semibold mb-2">Heading 2</h2>
                    <p className="text-base mb-2">This is how your text will appear with the selected font family and size.</p>
                    <p className="text-sm text-muted-foreground">Small text example</p>
                  </div>
                )}

                {/* Layout Preview */}
                {activeTab === 'layout' && (
                  <div className="space-y-4">
                    <div 
                      className="p-4 border rounded-lg"
                      style={{
                        borderRadius: formData.ui_border_radius
                      }}
                    >
                      <h4 className="font-medium mb-2">Border Radius Preview</h4>
                      <p className="text-sm">This card shows your border radius setting</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Default Border Radius</h4>
                      <p className="text-sm">This card uses the default border radius for comparison</p>
                    </div>
                  </div>
                )}

                {/* Custom CSS Preview */}
                {activeTab === 'custom' && (
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-medium mb-3">Custom CSS Preview</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your custom CSS will be applied to the entire interface when you save.
                    </p>
                    <div className="text-xs font-mono bg-background p-2 rounded border">
                      {formData.ui_custom_css || '/* No custom CSS yet */'}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}