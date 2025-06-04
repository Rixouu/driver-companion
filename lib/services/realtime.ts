// import { supabase } from "@/lib/supabase"
import { handleError } from "@/lib/utils/error-handler"
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js"

// Supported tables for realtime subscriptions
export enum RealtimeTable {
  INSPECTIONS = "inspections",
  INSPECTION_ITEMS = "inspection_items",
  VEHICLES = "vehicles",
  MAINTENANCE_TASKS = "maintenance_tasks",
  FUEL_LOGS = "fuel_entries",
  MILEAGE_LOGS = "mileage_entries",
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

// Type for fixing TS issues with channel subscription
type ChannelCallback = (payload: any) => void
type SubscriptionCallback = (status: string) => void

/**
 * Subscribe to realtime updates for a specific record
 */
export function subscribeToRecord<T extends Record<string, any>>(
  config: SubscriptionConfig,
  callback: RealtimeCallback<T>,
  supabaseClient: SupabaseClient
): () => void {
  const { table, event = "*", filter, schema = "public" } = config

  try {
    // Skip if running on server-side
    if (typeof window === 'undefined') {
      console.warn('Attempted to create realtime subscription on server');
      return () => {};
    }

    // Create a unique channel name based on the table and filter
    const channelName = filter 
      ? `${table}:${filter.replace(/=|\.|\s/g, "_")}` 
      : `${table}:all`;
      
    // Adding a timestamp to make channel name unique 
    // This prevents conflicts and leaked channels
    const uniqueChannelName = `${channelName}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Set up subscription
    const channel = supabaseClient.channel(uniqueChannelName);
    
    // Use type assertion to avoid TypeScript errors with channel subscription
    const subscription = channel
      .on(
        'postgres_changes' as any,
        {
          event,
          schema,
          table,
          filter,
        },
        (payload: any) => {
          try {
            callback({
              new: payload.new as T,
              old: payload.old as T | null,
              eventType: payload.eventType as RealtimeEvent,
            })
          } catch (error) {
            console.error(`Error in realtime callback for ${table}:`, error);
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Channel error for ${uniqueChannelName}, stopping subscription`);
        } else if (status === 'TIMED_OUT') {
          console.error(`Channel timed out for ${uniqueChannelName}, stopping subscription`);
        } else if (status === 'SUBSCRIBED') {
          console.debug(`Successfully subscribed to channel ${uniqueChannelName}`);
        }
      });

    // Return unsubscribe function
    return () => {
      try {
        // Properly clean up subscription and channel
        channel.unsubscribe();
        // After unsubscribing, remove the channel from Supabase client
        supabaseClient.removeChannel(channel);
      } catch (error) {
        console.error(`Error unsubscribing from channel ${uniqueChannelName}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error creating realtime subscription for ${table}:`, error);
    handleError(error)
    return () => {}
  }
}

/**
 * Subscribe to realtime updates for a collection of records
 */
export function subscribeToCollection<T extends Record<string, any>>(
  config: SubscriptionConfig,
  onInsert: ((record: T) => void) | undefined,
  onUpdate: ((record: T, oldRecord: T) => void) | undefined,
  onDelete: ((record: T) => void) | undefined,
  supabaseClient: SupabaseClient
): () => void {
  const { table, event = "*", filter, schema = "public" } = config

  try {
    // Skip if running on server-side
    if (typeof window === 'undefined') {
      console.warn('Attempted to create realtime subscription on server');
      return () => {};
    }

    // Create a unique channel name with a timestamp to avoid conflicts
    const channelName = filter 
      ? `${table}_collection:${filter.replace(/=|\.|\s/g, "_")}` 
      : `${table}_collection:all`;
      
    // Adding a timestamp to make channel name unique
    // This prevents conflicts and leaked channels
    const uniqueChannelName = `${channelName}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Set up subscription
    const channel = supabaseClient.channel(uniqueChannelName);
    
    // Use type assertion to avoid TypeScript errors with channel subscription
    const subscription = channel
      .on(
        'postgres_changes' as any,
        {
          event,
          schema,
          table,
          filter,
        },
        (payload: any) => {
          try {
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
          } catch (error) {
            console.error(`Error in realtime callback for ${table}:`, error);
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Channel error for ${uniqueChannelName}, stopping subscription`);
        } else if (status === 'TIMED_OUT') {
          console.error(`Channel timed out for ${uniqueChannelName}, stopping subscription`);
        } else if (status === 'SUBSCRIBED') {
          console.debug(`Successfully subscribed to collection channel ${uniqueChannelName}`);
        }
      });

    // Return unsubscribe function
    return () => {
      try {
        // Properly clean up subscription and channel
        channel.unsubscribe();
        // After unsubscribing, remove the channel from Supabase client
        supabaseClient.removeChannel(channel);
      } catch (error) {
        console.error(`Error unsubscribing from channel ${uniqueChannelName}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error creating realtime subscription for ${table}:`, error);
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