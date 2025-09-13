import { useState, useEffect } from 'react'

interface UISettings {
  // Sidebar Colors
  ui_sidebar_background_color: string
  ui_sidebar_text_color: string
  ui_sidebar_hover_color: string
  ui_sidebar_active_color: string
  ui_sidebar_border_color: string
  
  // Typography
  ui_font_family: string
  ui_font_size_base: string
  ui_font_weight_normal: string
  ui_font_weight_medium: string
  ui_font_weight_semibold: string
  
  // Header/Navigation
  ui_header_background_color: string
  ui_header_text_color: string
  ui_header_border_color: string
  
  // Cards and Content
  ui_card_background_color: string
  ui_card_border_color: string
  ui_card_shadow: string
  
  // Buttons
  ui_primary_button_color: string
  ui_primary_button_hover_color: string
  ui_primary_button_text_color: string
  ui_secondary_button_color: string
  ui_secondary_button_hover_color: string
  
  // Status Colors
  ui_success_color: string
  ui_warning_color: string
  ui_error_color: string
  ui_info_color: string
  
  // Layout
  ui_page_background_color: string
  ui_content_background_color: string
  ui_border_radius: string
  ui_spacing_unit: string
  
  // Dark Mode
  ui_dark_mode_enabled: string
  ui_dark_sidebar_background: string
  ui_dark_page_background: string
  ui_dark_card_background: string
  
  // Custom CSS
  ui_custom_css: string
}

interface UITheme {
  id: string
  name: string
  display_name: string
  description: string
  settings: Record<string, string>
  is_default: boolean
  is_active: boolean
}

export function useUICustomization() {
  const [settings, setSettings] = useState<UISettings | null>(null)
  const [themes, setThemes] = useState<UITheme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/app-settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      
      const data = await response.json()
      const settingsMap = data.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value
        return acc
      }, {})
      
      setSettings(settingsMap as UISettings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    }
  }

  const loadThemes = async () => {
    try {
      const response = await fetch('/api/admin/ui-themes')
      if (!response.ok) throw new Error('Failed to fetch themes')
      
      const data = await response.json()
      setThemes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load themes')
    }
  }

  const saveSettings = async (newSettings: Partial<UISettings>) => {
    try {
      const settingsToSave = Object.entries(newSettings).map(([key, value]) => ({
        key,
        value: value?.toString() || '',
        description: `UI customization setting: ${key}`
      }))

      const response = await fetch('/api/admin/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsToSave })
      })

      if (!response.ok) throw new Error('Failed to save settings')
      
      // Update local state
      setSettings(prev => prev ? { ...prev, ...newSettings } : null)
      
      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to save settings' 
      }
    }
  }

  const applyTheme = async (themeId: string) => {
    const theme = themes.find(t => t.id === themeId)
    if (!theme) return { success: false, error: 'Theme not found' }

    return await saveSettings(theme.settings as Partial<UISettings>)
  }

  const generateCSS = (customSettings?: Partial<UISettings>) => {
    const currentSettings = customSettings || settings
    if (!currentSettings) return ''

    return `
      :root {
        --ui-sidebar-bg: ${currentSettings.ui_sidebar_background_color};
        --ui-sidebar-text: ${currentSettings.ui_sidebar_text_color};
        --ui-sidebar-hover: ${currentSettings.ui_sidebar_hover_color};
        --ui-sidebar-active: ${currentSettings.ui_sidebar_active_color};
        --ui-sidebar-border: ${currentSettings.ui_sidebar_border_color};
        
        --ui-font-family: ${currentSettings.ui_font_family};
        --ui-font-size-base: ${currentSettings.ui_font_size_base};
        --ui-font-weight-normal: ${currentSettings.ui_font_weight_normal};
        --ui-font-weight-medium: ${currentSettings.ui_font_weight_medium};
        --ui-font-weight-semibold: ${currentSettings.ui_font_weight_semibold};
        
        --ui-header-bg: ${currentSettings.ui_header_background_color};
        --ui-header-text: ${currentSettings.ui_header_text_color};
        --ui-header-border: ${currentSettings.ui_header_border_color};
        
        --ui-card-bg: ${currentSettings.ui_card_background_color};
        --ui-card-border: ${currentSettings.ui_card_border_color};
        --ui-card-shadow: ${currentSettings.ui_card_shadow};
        
        --ui-primary-btn: ${currentSettings.ui_primary_button_color};
        --ui-primary-btn-hover: ${currentSettings.ui_primary_button_hover_color};
        --ui-primary-btn-text: ${currentSettings.ui_primary_button_text_color};
        --ui-secondary-btn: ${currentSettings.ui_secondary_button_color};
        --ui-secondary-btn-hover: ${currentSettings.ui_secondary_button_hover_color};
        
        --ui-success: ${currentSettings.ui_success_color};
        --ui-warning: ${currentSettings.ui_warning_color};
        --ui-error: ${currentSettings.ui_error_color};
        --ui-info: ${currentSettings.ui_info_color};
        
        --ui-page-bg: ${currentSettings.ui_page_background_color};
        --ui-content-bg: ${currentSettings.ui_content_background_color};
        --ui-border-radius: ${currentSettings.ui_border_radius};
        --ui-spacing-unit: ${currentSettings.ui_spacing_unit};
        
        --ui-dark-sidebar-bg: ${currentSettings.ui_dark_sidebar_background};
        --ui-dark-page-bg: ${currentSettings.ui_dark_page_background};
        --ui-dark-card-bg: ${currentSettings.ui_dark_card_background};
      }
      
      /* Apply custom CSS */
      ${currentSettings.ui_custom_css}
    `
  }

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true)
      await Promise.all([loadSettings(), loadThemes()])
      setLoading(false)
    }
    
    initializeData()
  }, [])

  return {
    settings,
    themes,
    loading,
    error,
    loadSettings,
    loadThemes,
    saveSettings,
    applyTheme,
    generateCSS
  }
}
