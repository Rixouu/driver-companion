'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import type { Driver } from '@/types/drivers'

interface UseDriversResult {
  drivers: Driver[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDrivers(): UseDriversResult {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDrivers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get the current user's session token
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No active session found')
      }

      // Use the API endpoint with proper authentication
      const response = await fetch('/api/drivers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch drivers: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Transform data to include full_name
      const transformedDrivers = data?.map(driver => ({
        ...driver,
        full_name: `${driver.first_name} ${driver.last_name}`
      })) as Driver[] || []
      
      setDrivers(transformedDrivers)
    } catch (err) {
      console.error('Error fetching drivers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch drivers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  return {
    drivers,
    isLoading,
    error,
    refetch: fetchDrivers
  }
}
