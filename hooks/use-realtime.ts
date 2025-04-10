"use client"

import { useEffect, useState } from "react"
import { 
  RealtimeTable, 
  RealtimeEvent, 
  subscribeToRecord, 
  subscribeToCollection,
  idFilter,
  SubscriptionConfig
} from "@/lib/services/realtime"
import { supabase } from "@/lib/supabase"
import { withErrorHandling } from "@/lib/utils/error-handler"

interface UseRealtimeOptions<T> {
  config: SubscriptionConfig
  initialFetch?: boolean
  onDataChange?: (newData: T, oldData: T | null, event: RealtimeEvent) => void
}

/**
 * Hook for subscribing to real-time updates for a single record
 */
export function useRealtimeRecord<T extends Record<string, any>>(
  options: UseRealtimeOptions<T>
) {
  const { config, initialFetch = true, onDataChange } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(initialFetch)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true
    let unsubscribe: () => void = () => {}

    async function fetchInitialData() {
      if (!initialFetch || !isMounted) return
      
      setIsLoading(true)
      
      try {
        // Use a type assertion for the table name
        const tableName = config.table as any
        
        // Initial data fetch
        const { data: result, error: fetchError } = await supabase
          .from(tableName)
          .select("*")
        
        // Apply filter if it exists
        if (config.filter) {
          const [column, operatorValue] = config.filter.split("=")
          const [operator, value] = operatorValue.split(".")
          
          if (column && operator && value) {
            const { data: filteredResult, error: filterError } = await supabase
              .from(tableName)
              .select("*")
              .filter(column, operator, value)
              .single()
              
            if (filterError) throw filterError
            if (isMounted) setData(filteredResult as unknown as T)
          }
        } else if (result && result.length > 0) {
          // If no filter, take the first item
          if (isMounted) setData(result[0] as unknown as T)
        }
      } catch (err) {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error(String(err))
          setError(error)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    // Set up subscription
    if (isMounted) {
      unsubscribe = subscribeToRecord<T>(config, (payload) => {
        if (!isMounted) return
        
        const { new: newData, old: oldData, eventType } = payload
        
        // Update local state based on event type
        if (eventType === "UPDATE" || eventType === "INSERT") {
          setData(newData)
        } else if (eventType === "DELETE") {
          setData(null)
        }
        
        // Call the optional callback
        if (onDataChange) {
          onDataChange(newData, oldData, eventType)
        }
      })
    }

    // Initial data fetch
    if (initialFetch) {
      fetchInitialData()
    }

    // Cleanup
    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [config, initialFetch, onDataChange])

  return { data, isLoading, error }
}

/**
 * Hook for subscribing to real-time updates for a collection of records
 */
export function useRealtimeCollection<T extends Record<string, any>>(
  options: UseRealtimeOptions<T> & {
    idField?: keyof T
  }
) {
  const { config, initialFetch = true, onDataChange, idField = "id" } = options
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(initialFetch)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true
    let unsubscribe: () => void = () => {}

    // Fetch initial data
    async function fetchInitialData() {
      if (!initialFetch || !isMounted) return
      
      setIsLoading(true)
      
      await withErrorHandling(async () => {
        // Use a type assertion for the table name
        const tableName = config.table as any
        
        // Build query
        const { data: result, error: fetchError } = await supabase
          .from(tableName)
          .select("*")
          
        // Apply filter if provided
        if (config.filter) {
          const [column, operatorValue] = config.filter.split("=")
          const [operator, value] = operatorValue.split(".")
          
          // If filter is provided, apply it
          if (column && operator && value) {
            const { data: filteredResult, error: filterError } = await supabase
              .from(tableName)
              .select("*")
              .filter(column, operator, value)
              
            if (filterError) throw filterError
            if (isMounted && filteredResult) setItems(filteredResult as unknown as T[])
            return
          }
        }
        
        // If no filter was applied or no filtered results
        if (fetchError) throw fetchError
        if (isMounted && result) setItems(result as unknown as T[])
      }, "Error fetching collection data")
      
      if (isMounted) setIsLoading(false)
    }

    // Set up subscription to handle collection updates
    unsubscribe = subscribeToCollection<T>(
      config,
      // Handle insert
      (newRecord) => {
        if (!isMounted) return
        setItems(current => [...current, newRecord])
        if (onDataChange) onDataChange(newRecord, null, "INSERT")
      },
      // Handle update
      (newRecord, oldRecord) => {
        if (!isMounted) return
        setItems(current => 
          current.map(item => 
            item[idField] === newRecord[idField] ? newRecord : item
          )
        )
        if (onDataChange) onDataChange(newRecord, oldRecord, "UPDATE")
      },
      // Handle delete
      (oldRecord) => {
        if (!isMounted) return
        setItems(current => 
          current.filter(item => item[idField] !== oldRecord[idField])
        )
        if (onDataChange) onDataChange(oldRecord, oldRecord, "DELETE")
      }
    )

    // Initial data fetch
    if (initialFetch) {
      fetchInitialData()
    }

    // Cleanup
    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [config, initialFetch, onDataChange, idField])

  return { items, isLoading, error }
}

/**
 * Type definitions for common entities
 */
export interface Inspection {
  id: string
  vehicle_id: string
  template_id?: string
  template_name?: string
  status: string
  created_at: string
  updated_at: string
  assigned_to?: string
  user_display_name?: string
  user_avatar_url?: string
  completed_at?: string
  vehicle_name?: string
  notes?: string
}

export interface InspectionItem {
  id: string
  inspection_id: string
  name: string
  description?: string
  status: string
  category?: string
  photo_url?: string
  severity?: string
  notes?: string
  created_at: string
  updated_at: string
}

/**
 * Helper hook for a specific inspection by ID
 */
export function useRealtimeInspection(inspectionId: string) {
  return useRealtimeRecord<Inspection>({
    config: {
      table: RealtimeTable.INSPECTIONS,
      filter: idFilter(inspectionId),
    },
    initialFetch: true,
  })
}

/**
 * Helper hook for inspection items by inspection ID
 */
export function useRealtimeInspectionItems(inspectionId: string) {
  return useRealtimeCollection<InspectionItem>({
    config: {
      table: RealtimeTable.INSPECTION_ITEMS,
      filter: createFilter("inspection_id", "eq", inspectionId),
    },
    initialFetch: true,
  })
}

/**
 * Create a filter string
 */
function createFilter(column: string, operator: string, value: string | number) {
  return `${column}=${operator}.${value}`
} 