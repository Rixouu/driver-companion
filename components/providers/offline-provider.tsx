"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { offlineStorage } from "@/lib/offline-storage"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/providers/language-provider"

interface OfflineContextType {
  isOnline: boolean
  isPending: boolean
  saveOffline: (data: InspectionProgress) => Promise<void>
  syncPending: () => Promise<void>
}

interface InspectionProgress {
  vehicleId: string
  items: Record<string, InspectionItem[]>
  photos: string[]
  recordings: string[]
  timestamp: string
}

interface InspectionItem {
  id: string
  label: string
  status: "pass" | "fail" | null
  photos: string[]
  notes: string
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: t("common.online"),
        description: t("inspections.offline.syncAvailable"),
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: t("common.offline"),
        description: t("inspections.offline.offlineMode"),
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const saveOffline = async (data: InspectionProgress) => {
    try {
      await offlineStorage.saveProgress(data.vehicleId, data)
      setIsPending(true)
    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("inspections.offline.saveFailed"),
        variant: "destructive",
      })
    }
  }

  const syncPending = async () => {
    if (!isOnline) return

    try {
      setIsPending(false)
    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("inspections.offline.syncFailed"),
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (isOnline && isPending) {
      syncPending()
    }
  }, [isOnline, isPending])

  return (
    <OfflineContext.Provider value={{ isOnline, isPending, saveOffline, syncPending }}>
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
} 