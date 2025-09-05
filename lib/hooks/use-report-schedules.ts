"use client"

import { useState, useEffect } from 'react'

export interface ReportSchedule {
  id: string
  name: string
  description?: string
  report_type: string
  format: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  day_of_week?: number
  day_of_month?: number
  time_of_day: string
  is_active: boolean
  options?: Record<string, any>
  recipients?: string[]
  last_run?: string
  next_run?: string
  created_at: string
  updated_at: string
}

export function useReportSchedules() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/reporting/schedules')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch schedules')
      }
      
      setSchedules(data.schedules || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createSchedule = async (scheduleData: Partial<ReportSchedule>) => {
    try {
      const response = await fetch('/api/reporting/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create schedule')
      }
      
      // Refresh schedules
      await fetchSchedules()
      
      return data.schedule
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const updateSchedule = async (scheduleId: string, updates: Partial<ReportSchedule>) => {
    try {
      const response = await fetch(`/api/reporting/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update schedule')
      }
      
      // Refresh schedules
      await fetchSchedules()
      
      return data.schedule
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/reporting/schedules/${scheduleId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete schedule')
      }
      
      // Refresh schedules
      await fetchSchedules()
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const runScheduleNow = async (scheduleId: string) => {
    try {
      // This would trigger an immediate report generation
      // For now, we'll just update the last_run timestamp
      await updateSchedule(scheduleId, {
        last_run: new Date().toISOString()
      })
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    runScheduleNow,
  }
}
