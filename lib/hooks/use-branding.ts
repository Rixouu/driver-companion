"use client"

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

export interface CompanyBranding {
  id: string
  company_name: string
  logo_url?: string
  logo_dark_url?: string
  favicon_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  font_family: string
  font_size_base: number
  border_radius: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailBranding {
  id: string
  header_html?: string
  footer_html?: string
  email_signature?: string
  social_links: Record<string, any>
  contact_info: Record<string, any>
  unsubscribe_text: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DocumentBranding {
  id: string
  header_html?: string
  footer_html?: string
  watermark_text?: string
  watermark_opacity: number
  page_margins: Record<string, any>
  font_family: string
  font_size: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ClientPortalBranding {
  id: string
  welcome_message?: string
  custom_css?: string
  custom_js?: string
  footer_text?: string
  terms_of_service_url?: string
  privacy_policy_url?: string
  support_email?: string
  support_phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AllBranding {
  company: CompanyBranding | null
  email: EmailBranding | null
  document: DocumentBranding | null
  client_portal: ClientPortalBranding | null
}

export function useBranding(type?: 'company' | 'email' | 'document' | 'client_portal') {
  const [branding, setBranding] = useState<AllBranding | any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchBranding = async () => {
    try {
      setLoading(true)
      const params = type ? `?type=${type}` : ''
      const response = await fetch(`/api/admin/branding${params}`)
      
      if (!response.ok) throw new Error('Failed to fetch branding')
      
      const data = await response.json()
      setBranding(data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch branding'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateBranding = async (
    brandingType: 'company' | 'email' | 'document' | 'client_portal',
    updateData: any,
    id?: string
  ) => {
    try {
      const response = await fetch('/api/admin/branding', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: brandingType, id, ...updateData })
      })
      
      if (!response.ok) throw new Error('Failed to update branding')
      
      const updatedBranding = await response.json()
      
      if (type) {
        setBranding(updatedBranding)
      } else {
        setBranding((prev: AllBranding) => ({
          ...prev,
          [brandingType]: updatedBranding
        }))
      }
      
      toast({
        title: 'Success',
        description: 'Branding updated successfully'
      })
      
      return updatedBranding
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update branding'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err
    }
  }

  const uploadLogo = async (file: File, type: 'logo' | 'logo_dark' | 'favicon') => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      
      const response = await fetch('/api/admin/branding/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) throw new Error('Failed to upload logo')
      
      const { url } = await response.json()
      
      toast({
        title: 'Success',
        description: 'Logo uploaded successfully'
      })
      
      return url
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload logo'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err
    }
  }

  const previewBranding = (brandingData: any) => {
    // Apply branding to current page for preview
    const root = document.documentElement
    
    if (brandingData.primary_color) {
      root.style.setProperty('--primary', brandingData.primary_color)
    }
    if (brandingData.secondary_color) {
      root.style.setProperty('--secondary', brandingData.secondary_color)
    }
    if (brandingData.accent_color) {
      root.style.setProperty('--accent', brandingData.accent_color)
    }
    if (brandingData.font_family) {
      root.style.setProperty('--font-family', brandingData.font_family)
    }
    if (brandingData.border_radius) {
      root.style.setProperty('--radius', brandingData.border_radius)
    }
  }

  const resetPreview = () => {
    // Reset to original branding
    if (branding?.company) {
      previewBranding(branding.company)
    }
  }

  useEffect(() => {
    fetchBranding()
  }, [type])

  return {
    branding,
    loading,
    error,
    updateBranding,
    uploadLogo,
    previewBranding,
    resetPreview,
    refetch: fetchBranding
  }
}
