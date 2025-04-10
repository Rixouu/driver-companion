"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { handleError } from "@/lib/utils/error-handler"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type Table = 
  | "inspections" 
  | "inspection_items" 
  | "vehicles" 
  | "maintenance_tasks" 
  | "fuel_logs" 
  | "mileage_logs" 
  | "notifications"

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*"

interface RealtimeOptions<T> {
  table: Table
  event?: RealtimeEvent
  filter?: string
  schema?: string
  onDataChange?: (newData: T, oldData: T | null, event: RealtimeEvent) => void
  initialFetch?: boolean
}

/**
 * Hook for real-time data subscriptions with Supabase
 */
export function useRealtimeData<T extends Record<string, any>>(
  options: RealtimeOptions<T>
) {
  const {
    table,
    event = "*",
    filter,
    schema = "public",
    onDataChange,
    initialFetch = true,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(initialFetch)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel>
    let isMounted = true

    async function setupRealtimeSubscription() {
      try {
        if (initialFetch) {
          setIsLoading(true)
          
          // Initial data fetch
          const query = supabase.from(table).select("*")
          
          // Apply filter if provided (e.g., "id=eq.123")
          if (filter) {
            const [column, operator, value] = filter.split(/=(.+)/)
            if (operator && value) {
              const [op, val] = operator.split(".")
              // @ts-ignore - Dynamic filtering
              query.filter(column, op, val)
            }
          }
          
          const { data: initialData, error: fetchError } = await query
          
          if (fetchError) throw fetchError
          
          if (isMounted) {
            setData(initialData as unknown as T)
            setIsLoading(false)
          }
        }
        
        // Set up real-time subscription - following pattern from use-realtime-inspection.ts
        subscription = supabase.channel(`${table}-changes`)
          .on(
            'postgres_changes',
            {
              event,
              schema,
              table,
              filter,
            },
            (payload) => {
              if (isMounted) {
                const eventType = payload.eventType as RealtimeEvent
                const newData = payload.new as T
                const oldData = payload.old as T | null
                
                // Update local state
                if (eventType === "UPDATE" || eventType === "INSERT") {
                  setData(newData)
                } else if (eventType === "DELETE") {
                  setData(null)
                }
                
                // Call the callback if provided
                if (onDataChange) {
                  onDataChange(newData, oldData, eventType)
                }
              }
            }
          )
          .subscribe()
          
      } catch (err) {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error(String(err))
          setError(error)
          handleError(error)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    setupRealtimeSubscription()
    
    // Cleanup on unmount
    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [table, event, filter, schema, initialFetch, onDataChange])
  
  return { data, isLoading, error }
}

/**
 * Hook for real-time list data with Supabase
 */
export function useRealtimeList<T extends Record<string, any>>(
  options: RealtimeOptions<T> & {
    idField?: keyof T
  }
) {
  const { idField = "id", ...restOptions } = options
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel>
    let isMounted = true
    
    async function setupRealtimeList() {
      try {
        setIsLoading(true)
        
        // Initial data fetch
        const { data: initialData, error: fetchError } = await supabase
          .from(options.table)
          .select("*")
        
        if (fetchError) throw fetchError
        
        if (isMounted) {
          setItems(initialData as unknown as T[])
        }
        
        // Set up real-time subscription - following pattern from use-realtime-inspection.ts
        subscription = supabase.channel(`${options.table}-list-changes`)
          .on(
            'postgres_changes',
            {
              event: options.event || "*",
              schema: options.schema || "public",
              table: options.table,
              filter: options.filter,
            },
            (payload) => {
              if (!isMounted) return
              
              const eventType = payload.eventType as RealtimeEvent
              const newRecord = payload.new as T
              const oldRecord = payload.old as T
              
              setItems(currentItems => {
                // Handle different event types
                if (eventType === "INSERT") {
                  return [...currentItems, newRecord]
                }
                
                if (eventType === "UPDATE") {
                  return currentItems.map(item => 
                    item[idField] === newRecord[idField] ? newRecord : item
                  )
                }
                
                if (eventType === "DELETE" && oldRecord) {
                  return currentItems.filter(
                    item => item[idField] !== oldRecord[idField]
                  )
                }
                
                return currentItems
              })
              
              // Call the callback if provided
              if (options.onDataChange) {
                options.onDataChange(newRecord, oldRecord, eventType)
              }
            }
          )
          .subscribe()
        
      } catch (err) {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error(String(err))
          setError(error)
          handleError(error)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    setupRealtimeList()
    
    // Cleanup on unmount
    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [options, idField])
  
  return { items, isLoading, error }
} 