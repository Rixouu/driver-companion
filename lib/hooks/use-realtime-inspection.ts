"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type Inspection = Database["public"]["Tables"]["inspections"]["Row"]

export function useRealtimeInspection(inspectionId: string) {
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel>

    async function setupSubscription() {
      try {
        // Initial fetch
        const { data, error } = await supabase
          .from("inspections")
          .select("*")
          .eq("id", inspectionId)
          .single()

        if (error) throw error
        setInspection(data)

        // Set up real-time subscription
        subscription = supabase.channel(`inspection:${inspectionId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'inspections',
              filter: `id=eq.${inspectionId}`,
            },
            (payload) => {
              setInspection(payload.new as Inspection)
            }
          )
          .subscribe()

      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    setupSubscription()

    return () => {
      subscription?.unsubscribe()
    }
  }, [inspectionId])

  return { inspection, isLoading, error }
} 