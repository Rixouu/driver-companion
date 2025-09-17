import { useEffect, useState } from 'react'

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

export function useUIStyles(settings: UISettings | null) {
  const [isApplied, setIsApplied] = useState(false)

  // Helper function to convert hex to HSL
  const hexToHsl = (hex: string): string => {
    // Remove # if present
    hex = hex.replace('#', '')
    
    // Convert hex to RGB
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

  const generateUIStyles = (customSettings?: Partial<UISettings>) => {
    const currentSettings = customSettings || settings
    if (!currentSettings) return ''

    return `
      /* UI Customization Styles - Override actual CSS variables */
      :root {
        /* Override actual CSS variables from globals.css */
        --sidebar-background: ${hexToHsl(currentSettings.ui_sidebar_background_color)};
        --sidebar-foreground: ${hexToHsl(currentSettings.ui_sidebar_text_color)};
        --sidebar-accent: ${hexToHsl(currentSettings.ui_sidebar_hover_color)};
        --sidebar-primary: ${hexToHsl(currentSettings.ui_sidebar_active_color)};
        --sidebar-border: ${hexToHsl(currentSettings.ui_sidebar_border_color)};
        
        --background: ${hexToHsl(currentSettings.ui_page_background_color)};
        --foreground: ${hexToHsl(currentSettings.ui_header_text_color)};
        --card: ${hexToHsl(currentSettings.ui_card_background_color)};
        --card-foreground: ${hexToHsl(currentSettings.ui_header_text_color)};
        --border: ${hexToHsl(currentSettings.ui_card_border_color)};
        
        --primary: ${hexToHsl(currentSettings.ui_primary_button_color)};
        --primary-foreground: ${hexToHsl(currentSettings.ui_primary_button_text_color)};
        --secondary: ${hexToHsl(currentSettings.ui_secondary_button_color)};
        --secondary-foreground: ${hexToHsl(currentSettings.ui_secondary_button_text_color || currentSettings.ui_header_text_color)};
        
        --status-success: ${hexToHsl(currentSettings.ui_success_color)};
        --status-warning: ${hexToHsl(currentSettings.ui_warning_color)};
        --destructive: ${hexToHsl(currentSettings.ui_error_color)};
        --sidebar-ring: ${hexToHsl(currentSettings.ui_info_color)};
        
        --radius: ${currentSettings.ui_border_radius};
      }
      
      .dark {
        --sidebar-background: ${hexToHsl(currentSettings.ui_dark_sidebar_background)};
        --background: ${hexToHsl(currentSettings.ui_dark_page_background)};
        --card: ${hexToHsl(currentSettings.ui_dark_card_background)};
        --secondary: ${hexToHsl(currentSettings.ui_dark_secondary_button_color || currentSettings.ui_secondary_button_color)};
        --secondary-foreground: ${hexToHsl(currentSettings.ui_dark_secondary_button_text_color || currentSettings.ui_secondary_button_text_color || currentSettings.ui_dark_sidebar_text_color)};
      }

      /* Apply font family globally */
      body, html {
        font-family: ${currentSettings.ui_font_family}, 'Noto Sans Thai', 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
        font-size: ${currentSettings.ui_font_size_base} !important;
      }
      
      /* Apply to all elements */
      * {
        font-family: ${currentSettings.ui_font_family}, 'Noto Sans Thai', 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
      }

      /* Custom CSS */
      ${currentSettings.ui_custom_css}
    `
  }

  const applyStyles = (customSettings?: Partial<UISettings>) => {
    const styles = generateUIStyles(customSettings)
    
    // Remove existing UI customization styles
    const existingStyle = document.getElementById('ui-customization-styles')
    if (existingStyle) {
      existingStyle.remove()
    }

    // Create new style element
    const styleElement = document.createElement('style')
    styleElement.id = 'ui-customization-styles'
    styleElement.textContent = styles
    
    // Append to head
    document.head.appendChild(styleElement)
    setIsApplied(true)
  }

  const removeStyles = () => {
    const existingStyle = document.getElementById('ui-customization-styles')
    if (existingStyle) {
      existingStyle.remove()
    }
    setIsApplied(false)
  }

  // Apply styles when settings change
  useEffect(() => {
    if (settings) {
      applyStyles()
    }
  }, [settings])

  return {
    applyStyles,
    removeStyles,
    generateUIStyles,
    isApplied
  }
}
