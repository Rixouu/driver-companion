"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/index'

interface UICustomizationSettings {
  [key: string]: string
}

interface UICustomizationContextType {
  settings: UICustomizationSettings | null
  loading: boolean
}

const UICustomizationContext = createContext<UICustomizationContextType>({
  settings: null,
  loading: true
})

export function useUICustomization() {
  return useContext(UICustomizationContext)
}

export function UICustomizationProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UICustomizationSettings | null>(null)
  const [loading, setLoading] = useState(true)

  // Convert hex to HSL
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

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

  // Apply styles to the document
  const applyStyles = (settings: UICustomizationSettings) => {
    // Remove existing UI customization styles
    const existingStyle = document.getElementById('ui-customization-styles')
    if (existingStyle) {
      existingStyle.remove()
    }

    const style = document.createElement('style')
    style.id = 'ui-customization-styles'

    const css = `
      :root {
        --sidebar-background: ${hexToHsl(settings.ui_sidebar_background_color || '#d9d9d9')};
        --sidebar-foreground: ${hexToHsl(settings.ui_sidebar_text_color || '#262626')};
        --sidebar-accent: ${hexToHsl(settings.ui_sidebar_hover_color || '#cccccc')};
        --sidebar-primary: ${hexToHsl(settings.ui_sidebar_active_color || '#171717')};
        --sidebar-border: ${hexToHsl(settings.ui_sidebar_border_color || '#bfbfbf')};
        
        --menu-active: ${hexToHsl(settings.ui_menu_active_color || '#171717')};
        --menu-hover: ${hexToHsl(settings.ui_menu_hover_color || '#f5f5f5')};
        
        --background: ${hexToHsl(settings.ui_main_layout_background || '#ffffff')};
        --foreground: ${hexToHsl(settings.ui_sidebar_text_color || '#1f2937')};
        --card: ${hexToHsl(settings.ui_card_background_color || '#ffffff')};
        --card-foreground: ${hexToHsl(settings.ui_sidebar_text_color || '#1f2937')};
        --border: ${hexToHsl(settings.ui_card_border_color || '#e5e7eb')};
        
        --primary: ${hexToHsl(settings.ui_primary_button_color || '#3b82f6')};
        --primary-foreground: ${hexToHsl(settings.ui_primary_button_text_color || '#ffffff')};
        --secondary: ${hexToHsl(settings.ui_secondary_button_color || '#f3f4f6')};
        
        --status-success: ${hexToHsl(settings.ui_success_color || '#10b981')};
        --status-warning: ${hexToHsl(settings.ui_warning_color || '#f59e0b')};
        --destructive: ${hexToHsl(settings.ui_error_color || '#ef4444')};
        --sidebar-ring: ${hexToHsl(settings.ui_info_color || '#3b82f6')};
        
        --radius: ${settings.ui_border_radius || '0.5rem'};
      }
      
      .dark {
        --sidebar-background: ${hexToHsl(settings.ui_dark_sidebar_background || '#080808')};
        --sidebar-foreground: ${hexToHsl(settings.ui_dark_sidebar_text_color || '#f2f2f2')};
        --sidebar-accent: ${hexToHsl(settings.ui_dark_sidebar_hover_color || '#0f0f0f')};
        --sidebar-primary: ${hexToHsl(settings.ui_dark_sidebar_active_color || '#1a1a1a')};
        --sidebar-border: ${hexToHsl(settings.ui_dark_sidebar_border_color || '#0f0f0f')};
        
        --menu-active: ${hexToHsl(settings.ui_dark_menu_active_color || '#1a1a1a')};
        --menu-hover: ${hexToHsl(settings.ui_dark_menu_hover_color || '#0f0f0f')};
        
        --background: ${hexToHsl(settings.ui_dark_main_layout_background || '#050505')};
        --foreground: ${hexToHsl(settings.ui_dark_sidebar_text_color || '#f2f2f2')};
        --card: ${hexToHsl(settings.ui_dark_card_background || '#0a0a0a')};
        --card-foreground: ${hexToHsl(settings.ui_dark_sidebar_text_color || '#f2f2f2')};
        --border: ${hexToHsl(settings.ui_dark_card_border_color || '#0f0f0f')};
        
        --primary: ${hexToHsl(settings.ui_dark_primary_button_color || '#f2f2f2')};
        --primary-foreground: ${hexToHsl(settings.ui_dark_primary_button_text_color || '#050505')};
      }

      /* Apply font family */
      body {
        font-family: ${settings.ui_font_family || 'Inter'}, 'Noto Sans Thai', 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
        font-size: ${settings.ui_font_size_base || '14px'} !important;
      }

      /* Sidebar logo customization */
      .sidebar-logo {
        color: ${settings.ui_sidebar_logo_color || '#dc2626'} !important;
        font-weight: 700 !important;
        font-size: 1.25rem !important;
      }
      
      .sidebar-logo img {
        height: 2rem !important;
        width: auto !important;
        object-fit: contain !important;
      }

      /* Apply menu colors */
      .sidebar-item[data-active="true"],
      .sidebar-item.active,
      [data-sidebar-item][data-active="true"] {
        background-color: hsl(var(--menu-active)) !important;
        color: hsl(var(--sidebar-foreground)) !important;
      }
      
      .sidebar-item:hover:not([data-active="true"]):not(.active),
      [data-sidebar-item]:hover:not([data-active="true"]) {
        background-color: hsl(var(--menu-hover)) !important;
      }

      ${settings.ui_custom_css || ''}
    `

    style.textContent = css
    document.head.appendChild(style)
  }

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const supabase = createClient()
        
        // Get all UI customization settings
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value')
          .like('key', 'ui_%')

        if (error) {
          console.error('Error loading UI settings:', error)
          setLoading(false)
          return
        }

        // Convert array to object
        const settingsObj: UICustomizationSettings = {}
        data?.forEach(item => {
          settingsObj[item.key] = item.value
        })

        console.log('Loaded UI settings from database:', settingsObj)
        setSettings(settingsObj)
        applyStyles(settingsObj)
        setLoading(false)
      } catch (error) {
        console.error('Error loading UI settings:', error)
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Watch for changes in localStorage (when settings are updated)
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedSettings = localStorage.getItem('ui-customization-settings')
      if (updatedSettings) {
        try {
          const parsed = JSON.parse(updatedSettings)
          setSettings(parsed)
          applyStyles(parsed)
        } catch (error) {
          console.error('Error parsing updated UI settings:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically for changes
    const interval = setInterval(() => {
      const updatedSettings = localStorage.getItem('ui-customization-settings')
      if (updatedSettings) {
        try {
          const parsed = JSON.parse(updatedSettings)
          if (JSON.stringify(parsed) !== JSON.stringify(settings)) {
            setSettings(parsed)
            applyStyles(parsed)
          }
        } catch (error) {
          console.error('Error parsing updated UI settings:', error)
        }
      }
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [settings])

  return (
    <UICustomizationContext.Provider value={{ settings, loading }}>
      {children}
    </UICustomizationContext.Provider>
  )
}
