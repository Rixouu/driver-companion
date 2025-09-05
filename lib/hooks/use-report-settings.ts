"use client"

import { useState, useEffect } from 'react'

export interface ReportSettings {
  id?: string
  user_id?: string
  default_format: 'pdf' | 'excel' | 'csv'
  default_sections: {
    financial: boolean
    vehicles: boolean
    drivers: boolean
    inspections: boolean
    maintenance: boolean
    bookings: boolean
  }
  email_notifications: boolean
  auto_generate: boolean
  retention_days: number
  created_at?: string
  updated_at?: string
}

export function useReportSettings() {
  const [settings, setSettings] = useState<ReportSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/reporting/settings')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch settings')
      }
      
      setSettings(data.settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (updates: Partial<ReportSettings>) => {
    try {
      const response = await fetch('/api/reporting/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings')
      }
      
      setSettings(data.settings)
      return data.settings
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const resetToDefaults = async () => {
    const defaultSettings: ReportSettings = {
      default_format: 'pdf',
      default_sections: {
        financial: true,
        vehicles: true,
        drivers: true,
        inspections: true,
        maintenance: true,
        bookings: true
      },
      email_notifications: true,
      auto_generate: false,
      retention_days: 90
    }

    return await updateSettings(defaultSettings)
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    resetToDefaults,
  }
}
