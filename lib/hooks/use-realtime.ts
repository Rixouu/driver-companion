"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { 
  RealtimeTable, 
  RealtimeEvent, 
  subscribeToRecord, 
  subscribeToCollection,
  idFilter,
  SubscriptionConfig
} from "@/lib/services/realtime"
import { createClient } from "@/lib/supabase/index"
import type { SupabaseClient } from "@supabase/supabase-js"
import { withErrorHandling } from "@/lib/utils/error-handler"

// Debounce helper
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface UseRealtimeOptions<T> {
  config: SubscriptionConfig
  initialFetch?: boolean
  onDataChange?: (newData: T, oldData: T | null, event: RealtimeEvent) => void
  supabaseClient: SupabaseClient
}

/**
 * Hook for subscribing to real-time updates for a single record
 */
export function useRealtimeRecord<T extends Record<string, any>>(
  options: UseRealtimeOptions<T>
) {
  const { config, initialFetch = true, onDataChange, supabaseClient } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(initialFetch)
  const [error, setError] = useState<Error | null>(null)

  // Memoize the data change callback to avoid unnecessary re-renders
  const handleDataChange = useCallback((newData: T, oldData: T | null, eventType: RealtimeEvent) => {
    if (onDataChange) {
      try {
        onDataChange(newData, oldData, eventType);
      } catch (err) {
        console.error("Error in onDataChange callback:", err);
      }
    }
  }, [onDataChange]);

  useEffect(() => {
    let isMounted = true
    let unsubscribe: () => void = () => {}

    async function fetchInitialData() {
      if (!initialFetch || !isMounted) return
      
      setIsLoading(true)
      
      try {
        const tableName = config.table as any
        
        let query = supabaseClient.from(tableName).select("*")
        
        if (config.filter) {
          const [column, operatorValue] = config.filter.split("=")
          const [operator, value] = operatorValue.split(".")
          
          if (column && operator && value) {
            const { data: filteredResult, error: filterError } = await supabaseClient
              .from(tableName)
              .select("*")
              .filter(column, operator, value)
              .single()
              
            if (filterError) throw filterError
            if (isMounted) setData(filteredResult as unknown as T)
            return
          }
        }
        const { data: result, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (result && result.length > 0 && isMounted) {
          setData(result[0] as unknown as T)
        } else if (isMounted) {
          setData(null);
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
        
        if (eventType === "UPDATE" || eventType === "INSERT") {
          setData(newData)
        } else if (eventType === "DELETE") {
          setData(null)
        }
        
        handleDataChange(newData, oldData, eventType);
      }, supabaseClient)
    }

    if (initialFetch) {
      fetchInitialData()
    }

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [config, initialFetch, handleDataChange, supabaseClient])

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
  const { config, initialFetch = true, onDataChange, idField = "id", supabaseClient } = options
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(initialFetch)
  const [error, setError] = useState<Error | null>(null)
  const [authError, setAuthError] = useState<boolean>(false)
  
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const debouncedSetItems = useCallback(
    debounce((updateFn: (current: T[]) => T[]) => {
      setItems(updateFn);
    }, 300),
    []
  );

  const debouncedOnDataChange = useCallback(
    onDataChange 
    ? debounce((newData: T, oldData: T | null, event: RealtimeEvent) => {
        if (onDataChange) {
          try {
            onDataChange(newData, oldData, event);
          } catch (err) {
            console.error("Error in onDataChange callback:", err);
          }
        }
      }, 300)
    : () => {},
    [onDataChange]
  );

  useEffect(() => {
    if (authError) return () => {};
    
    let isMounted = true
    let unsubscribe: () => void = () => {}

    async function fetchInitialData() {
      if (!initialFetch || !isMounted) return
      
      setIsLoading(true)
      
      try {
        const tableName = configRef.current.table as any
        let query = supabaseClient.from(tableName).select("*");

        if (configRef.current.filter) {
          if (configRef.current.filter.includes('=eq.')) {
            const [column, opValue] = configRef.current.filter.split('=eq.')
            if (column && opValue) {
              query = query.eq(column, opValue)
            }
          } else if (configRef.current.filter.includes('=')) {
             const [column, operatorValue] = configRef.current.filter.split("=")
             if (operatorValue && operatorValue.includes('.')) {
                const [operator, value] = operatorValue.split(".")
                if (column && operator && value) {
                    query = query.filter(column, operator, value)
                }
             }
          }
        }
          
        const { data: result, error: fetchError } = await query;
            
        if (fetchError) {
          if (fetchError.code === '401' || fetchError.message?.includes('JWT') || fetchError.message?.includes('auth')) {
            console.error("Authentication error in useRealtimeCollection:", fetchError)
            if (isMounted) setAuthError(true)
            return
          }
          throw fetchError
        }
        if (isMounted && result) setItems(result as unknown as T[])

      } catch (err) {
        console.error("Error fetching collection data:", err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    if (!authError) {
      try {
        unsubscribe = subscribeToCollection<T>(
          configRef.current,
          (newRecord) => {
            if (!isMounted) return
            debouncedSetItems(current => [...current, newRecord])
            if (debouncedOnDataChange) debouncedOnDataChange(newRecord, null, "INSERT")
          },
          (newRecord, oldRecord) => {
            if (!isMounted) return
            debouncedSetItems(current => 
              current.map(item => 
                item[idField] === newRecord[idField] ? newRecord : item
              )
            )
            if (debouncedOnDataChange) debouncedOnDataChange(newRecord, oldRecord, "UPDATE")
          },
          (oldRecord) => {
            if (!isMounted) return
            debouncedSetItems(current => 
              current.filter(item => item[idField] !== oldRecord[idField])
            )
            if (debouncedOnDataChange) debouncedOnDataChange(oldRecord, null, "DELETE")
          },
          supabaseClient
        )
      } catch (err) {
        const supabaseError = err as any;
        if (supabaseError.code === '401' || supabaseError.message?.includes('JWT')) {
          console.error("Authentication error on subscription in useRealtimeCollection:", err);
          if (isMounted) setAuthError(true);
        } else {
          console.error("Error subscribing to collection:", err);
          if (isMounted) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      }
    }

    if (initialFetch) {
      fetchInitialData()
    }

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [initialFetch, idField, debouncedSetItems, debouncedOnDataChange, supabaseClient, authError])

  return { items, isLoading, error, authError }
}

// TypeScript interfaces for inspection-related data
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

// Default Supabase client (browser client)
const supabase = createClient()

// Example usage for a specific table (e.g., 'inspections')
export function useInspectionRealtime(inspectionId: string) {
  return useRealtimeRecord<Inspection>({
    config: { 
      table: RealtimeTable.INSPECTIONS,
      filter: idFilter(inspectionId) 
    },
    supabaseClient: supabase
  })
}

export function useInspectionsListRealtime(filter?: string) {
  return useRealtimeCollection<Inspection>({
    config: { 
      table: RealtimeTable.INSPECTIONS, 
      filter 
    },
    supabaseClient: supabase
  })
}

// Helper for creating a filter string easily
function createFilter(column: string, operator: string, value: string | number) {
  return `${column}=${operator}.${value}`
} 