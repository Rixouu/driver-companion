import { supabase } from "@/lib/supabase"
import { handleError } from "@/lib/utils/error-handler"
import type { RealtimeChannel } from "@supabase/supabase-js"

// Supported tables for realtime subscriptions
export enum RealtimeTable {
  INSPECTIONS = "inspections",
  INSPECTION_ITEMS = "inspection_items",
  VEHICLES = "vehicles",
  MAINTENANCE_TASKS = "maintenance_tasks",
  FUEL_LOGS = "fuel_logs",
  MILEAGE_LOGS = "mileage_logs",
  NOTIFICATIONS = "notifications",
}

// Realtime event types
export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*"

// Define payload interface to match Supabase's payload structure
interface RealtimePayload<T> {
  commit_timestamp: string
  eventType: RealtimeEvent
  new: T
  old: T | null
  schema: string
  table: string
  errors: any
}

// Callback type for realtime updates
export type RealtimeCallback<T> = (payload: {
  new: T
  old: T | null
  eventType: RealtimeEvent
}) => void

// Configuration interface for subscriptions
export interface SubscriptionConfig {
  table: RealtimeTable | string
  event?: RealtimeEvent
  filter?: string
  schema?: string
}

/**
 * Subscribe to realtime updates for a specific record
 */
export function subscribeToRecord<T extends Record<string, any>>(
  config: SubscriptionConfig,
  callback: RealtimeCallback<T>
): () => void {
  const { table, event = "*", filter, schema = "public" } = config

  try {
    // Create a unique channel name
    const channelName = filter 
      ? `${table}:${filter.replace(/=|\.|\s/g, "_")}` 
      : `${table}:all`

    // Set up subscription
    const channel = supabase.channel(channelName)
    
    const subscription: RealtimeChannel = channel
      .on<RealtimePayload<T>>(
        'postgres_changes',
        {
          event,
          schema,
          table,
          filter,
        },
        (payload) => {
          callback({
            new: payload.new as T,
            old: payload.old as T | null,
            eventType: payload.eventType as RealtimeEvent,
          })
        }
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe()
    }
  } catch (error) {
    handleError(error)
    return () => {}
  }
}

/**
 * Subscribe to realtime updates for a collection of records
 */
export function subscribeToCollection<T extends Record<string, any>>(
  config: SubscriptionConfig,
  onInsert?: (record: T) => void,
  onUpdate?: (record: T, oldRecord: T) => void,
  onDelete?: (record: T) => void
): () => void {
  const { table, event = "*", filter, schema = "public" } = config

  try {
    // Create a unique channel name
    const channelName = filter 
      ? `${table}_collection:${filter.replace(/=|\.|\s/g, "_")}` 
      : `${table}_collection:all`

    // Set up subscription
    const channel = supabase.channel(channelName)
    
    const subscription: RealtimeChannel = channel
      .on<RealtimePayload<T>>(
        'postgres_changes',
        {
          event,
          schema,
          table,
          filter,
        },
        (payload) => {
          const eventType = payload.eventType as RealtimeEvent
          const newRecord = payload.new as T
          const oldRecord = payload.old as T

          // Call the appropriate callback based on the event type
          if (eventType === "INSERT" && onInsert) {
            onInsert(newRecord)
          } else if (eventType === "UPDATE" && onUpdate) {
            onUpdate(newRecord, oldRecord)
          } else if (eventType === "DELETE" && onDelete) {
            onDelete(oldRecord)
          }
        }
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe()
    }
  } catch (error) {
    handleError(error)
    return () => {}
  }
}

/**
 * Create a filter string for Supabase realtime subscriptions
 */
export function createFilter(column: string, operator: string, value: string | number) {
  return `${column}=${operator}.${value}`
}

/**
 * Helper to create an id equals filter
 */
export function idFilter(id: string) {
  return createFilter("id", "eq", id)
} 