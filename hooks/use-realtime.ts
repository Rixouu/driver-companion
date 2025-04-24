"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
        handleDataChange(newData, oldData, eventType);
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
  }, [config, initialFetch, handleDataChange])

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
  const [authError, setAuthError] = useState<boolean>(false)
  
  // Store config in a ref to avoid dependency changes causing re-subscriptions
  const configRef = useRef(config);
  // Update ref when config changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Memoize callbacks to prevent unnecessary re-renders
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
          } catch (error) {
            console.error("Error in onDataChange callback:", error);
          }
        }
      }, 300)
    : () => {}, // Provide a no-op function instead of undefined
    [onDataChange]
  );

  useEffect(() => {
    // Don't attempt to fetch or subscribe if we already know auth has failed
    if (authError) return () => {};
    
    let isMounted = true
    let unsubscribe: () => void = () => {}

    // Fetch initial data
    async function fetchInitialData() {
      if (!initialFetch || !isMounted) return
      
      setIsLoading(true)
      
      try {
        // Use a type assertion for the table name
        const tableName = configRef.current.table as any
        
        try {
          // Apply filter if provided
          if (configRef.current.filter) {
            // Handle different filter formats correctly
            if (configRef.current.filter.includes('=eq.')) {
              // Handle format 'column=eq.value'
              const [column, opValue] = configRef.current.filter.split('=eq.')
              if (column && opValue) {
                const { data: filteredResult, error: filterError } = await supabase
                  .from(tableName)
                  .select("*")
                  .eq(column, opValue)
                  
                if (filterError) {
                  // Check for auth errors specifically
                  if (filterError.code === '401' || 
                      filterError.message?.includes('JWT') || 
                      filterError.message?.includes('auth')) {
                    console.error("Authentication error in useRealtimeCollection:", filterError)
                    if (isMounted) setAuthError(true)
                    return
                  }
                  throw filterError
                }
                if (isMounted && filteredResult) setItems(filteredResult as unknown as T[])
              }
            } else if (configRef.current.filter.includes('=')) {
              // Handle format 'column=operator.value'
              const [column, operatorValue] = configRef.current.filter.split("=")
              if (operatorValue && operatorValue.includes('.')) {
                const [operator, value] = operatorValue.split(".")
                
                // If filter is provided, apply it
                if (column && operator && value) {
                  const { data: filteredResult, error: filterError } = await supabase
                    .from(tableName)
                    .select("*")
                    .filter(column, operator, value)
                    
                  if (filterError) {
                    // Check for auth errors specifically
                    if (filterError.code === '401' || 
                        filterError.message?.includes('JWT') || 
                        filterError.message?.includes('auth')) {
                      console.error("Authentication error in useRealtimeCollection:", filterError)
                      if (isMounted) setAuthError(true)
                      return
                    }
                    throw filterError
                  }
                  if (isMounted && filteredResult) setItems(filteredResult as unknown as T[])
                  return
                }
              }
            }
          }
          
          // Fallback to getting all records if filter parse fails or no filter provided
          const { data: result, error: fetchError } = await supabase
            .from(tableName)
            .select("*")
            
          if (fetchError) {
            // Check for auth errors specifically
            if (fetchError.code === '401' || 
                fetchError.message?.includes('JWT') || 
                fetchError.message?.includes('auth')) {
              console.error("Authentication error in useRealtimeCollection:", fetchError)
              if (isMounted) setAuthError(true)
              return
            }
            throw fetchError
          }
          if (isMounted && result) setItems(result as unknown as T[])
        } catch (error) {
          if (isMounted) {
            setError(error instanceof Error ? error : new Error(String(error)))
          }
        }
      } catch (err) {
        console.error("Error fetching collection data:", err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    // Only set up subscription if we're not having auth errors
    if (!authError) {
      try {
        // Set up subscription to handle collection updates
        unsubscribe = subscribeToCollection<T>(
          configRef.current,
          // Handle insert
          (newRecord) => {
            if (!isMounted) return
            debouncedSetItems(current => [...current, newRecord])
            if (debouncedOnDataChange) debouncedOnDataChange(newRecord, null, "INSERT")
          },
          // Handle update
          (newRecord, oldRecord) => {
            if (!isMounted) return
            debouncedSetItems(current => 
              current.map(item => 
                item[idField] === newRecord[idField] ? newRecord : item
              )
            )
            if (debouncedOnDataChange) debouncedOnDataChange(newRecord, oldRecord, "UPDATE")
          },
          // Handle delete
          (oldRecord) => {
            if (!isMounted) return
            debouncedSetItems(current => 
              current.filter(item => item[idField] !== oldRecord[idField])
            )
            if (debouncedOnDataChange) debouncedOnDataChange(oldRecord, oldRecord, "DELETE")
          }
        )
      } catch (error) {
        console.error("Error setting up realtime subscription:", error)
      }
    }

    // Initial data fetch
    if (initialFetch && !authError) {
      fetchInitialData()
    }

    // Cleanup
    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [initialFetch, authError, debouncedSetItems, debouncedOnDataChange]);

  return { items, isLoading, error, authError }
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