"use client"

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

export interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'push' | 'sms'
  category: string
  subject?: string
  html_content?: string
  text_content?: string
  variables: Record<string, any>
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export function useNotificationTemplates(type?: string, category?: string) {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (type) params.append('type', type)
      if (category) params.append('category', category)
      
      const response = await fetch(`/api/admin/notification-templates?${params}`)
      if (!response.ok) throw new Error('Failed to fetch templates')
      
      const data = await response.json()
      setTemplates(data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates'
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

  const createTemplate = async (templateData: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/admin/notification-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })
      
      if (!response.ok) throw new Error('Failed to create template')
      
      const newTemplate = await response.json()
      setTemplates(prev => [...prev, newTemplate])
      
      toast({
        title: 'Success',
        description: 'Template created successfully'
      })
      
      return newTemplate
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err
    }
  }

  const updateTemplate = async (id: string, updateData: Partial<NotificationTemplate>) => {
    try {
      const response = await fetch('/api/admin/notification-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updateData })
      })
      
      if (!response.ok) throw new Error('Failed to update template')
      
      const updatedTemplate = await response.json()
      setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t))
      
      toast({
        title: 'Success',
        description: 'Template updated successfully'
      })
      
      return updatedTemplate
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notification-templates?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete template')
      
      setTemplates(prev => prev.filter(t => t.id !== id))
      
      toast({
        title: 'Success',
        description: 'Template deleted successfully'
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err
    }
  }

  const toggleTemplateStatus = async (id: string, isActive: boolean) => {
    return updateTemplate(id, { is_active: isActive })
  }

  useEffect(() => {
    fetchTemplates()
  }, [type, category])

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateStatus,
    refetch: fetchTemplates
  }
}
