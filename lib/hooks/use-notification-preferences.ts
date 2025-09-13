"use client"

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

export interface NotificationPreference {
  id: string
  user_id: string
  notification_type: 'email' | 'push' | 'sms'
  category: string
  is_enabled: boolean
  frequency: 'immediate' | 'daily' | 'weekly' | 'never'
  quiet_hours_start: string
  quiet_hours_end: string
  timezone: string
  created_at: string
  updated_at: string
}

export function useNotificationPreferences(userId: string) {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/notification-preferences?user_id=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch preferences')
      
      const data = await response.json()
      setPreferences(data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch preferences'
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

  const updatePreference = async (preferenceData: Partial<NotificationPreference>) => {
    try {
      const response = await fetch('/api/admin/notification-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...preferenceData })
      })
      
      if (!response.ok) throw new Error('Failed to update preference')
      
      const updatedPreferences = await response.json()
      
      // Update local state
      setPreferences(prev => {
        const existingIndex = prev.findIndex(p => 
          p.notification_type === preferenceData.notification_type && 
          p.category === preferenceData.category
        )
        
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = { ...updated[existingIndex], ...preferenceData }
          return updated
        } else {
          return [...prev, updatedPreferences[0]]
        }
      })
      
      toast({
        title: 'Success',
        description: 'Preference updated successfully'
      })
      
      return updatedPreferences
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preference'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err
    }
  }

  const updateBulkPreferences = async (preferences: Partial<NotificationPreference>[]) => {
    try {
      const promises = preferences.map(pref => updatePreference(pref))
      await Promise.all(promises)
      
      toast({
        title: 'Success',
        description: 'All preferences updated successfully'
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
      throw err
    }
  }

  const getPreference = (notificationType: string, category: string) => {
    return preferences.find(p => 
      p.notification_type === notificationType && p.category === category
    )
  }

  const isEnabled = (notificationType: string, category: string) => {
    const preference = getPreference(notificationType, category)
    return preference?.is_enabled ?? true // Default to enabled
  }

  const getFrequency = (notificationType: string, category: string) => {
    const preference = getPreference(notificationType, category)
    return preference?.frequency ?? 'immediate'
  }

  const setEnabled = async (notificationType: string, category: string, enabled: boolean) => {
    return updatePreference({
      notification_type: notificationType as any,
      category,
      is_enabled: enabled
    })
  }

  const setFrequency = async (notificationType: string, category: string, frequency: string) => {
    return updatePreference({
      notification_type: notificationType as any,
      category,
      frequency: frequency as any
    })
  }

  const setQuietHours = async (notificationType: string, category: string, start: string, end: string) => {
    return updatePreference({
      notification_type: notificationType as any,
      category,
      quiet_hours_start: start,
      quiet_hours_end: end
    })
  }

  useEffect(() => {
    if (userId) {
      fetchPreferences()
    }
  }, [userId])

  return {
    preferences,
    loading,
    error,
    updatePreference,
    updateBulkPreferences,
    getPreference,
    isEnabled,
    getFrequency,
    setEnabled,
    setFrequency,
    setQuietHours,
    refetch: fetchPreferences
  }
}
