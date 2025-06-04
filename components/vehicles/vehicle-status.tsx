"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { useI18n } from "@/lib/i18n/context"
import { createBrowserClient } from "@supabase/ssr"
import { Database } from "@/types/supabase" // Assuming you have this type

interface Alert {
  id: string | number
  type: "maintenance" | "inspection" | "document" | "other"
  messageKey: string // This will be an i18n key
  priority: "high" | "medium" | "low"
  // Add any other relevant alert properties, e.g., dueDate
}

interface VehicleStatusData {
  currentStatus: "active" | "maintenance" | "inactive" | "unknown"
  lastInspectionDate: string | null // ISO date string
  nextInspectionDate: string | null // ISO date string
  mileage: number | null
  alerts: Alert[]
}

interface VehicleStatusProps {
  vehicleId: string
}

// Placeholder function for fetching - replace with actual Supabase query
async function fetchVehicleStatus(
  supabase: ReturnType<typeof createBrowserClient<Database>>,
  vehicleId: string
): Promise<VehicleStatusData | null> {
  console.log(`[VehicleStatus] Fetching status for vehicleId: ${vehicleId}`)
  // const { data, error } = await supabase
  //   .from('vehicle_summary_status') // Replace with your actual table/view
  //   .select('*')
  //   .eq('vehicle_id', vehicleId)
  //   .single()

  // if (error) {
  //   console.error("[VehicleStatus] Error fetching status:", error)
  //   return null
  // }
  // return data as VehicleStatusData

  // Mock data until backend is ready
  await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
  if (vehicleId === "error") return null
  return {
    currentStatus: "active",
    lastInspectionDate: new Date("2024-01-15").toISOString(),
    nextInspectionDate: new Date("2024-07-30").toISOString(),
    mileage: 52030,
    alerts: [
      {
        id: 1,
        type: "maintenance",
        messageKey: "alerts.maintenanceDue",
        priority: "high",
      },
      {
        id: 2,
        type: "inspection",
        messageKey: "alerts.inspectionUpcoming",
        priority: "medium",
      },
    ],
  }
}

export function VehicleStatus({ vehicleId }: VehicleStatusProps) {
  const { t } = useI18n()
  const [statusData, setStatusData] = useState<VehicleStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(
    () =>
      createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  )

  useEffect(() => {
    if (!vehicleId) {
      setIsLoading(false)
      setError(t("errors.missingVehicleId"))
      return
    }

    async function loadData() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchVehicleStatus(supabase, vehicleId)
        if (data) {
          setStatusData(data)
        } else {
          setError(t("errors.failedToLoadVehicleStatus"))
          setStatusData(null) // Ensure data is cleared on error
        }
      } catch (err) {
        console.error("[VehicleStatus] Exception fetching status:", err)
        setError(t("errors.unexpectedError"))
        setStatusData(null)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [vehicleId, supabase, t])

  const getStatusBadgeVariant = (
    status: VehicleStatusData["currentStatus"] | undefined
  ): "default" | "outline" | "secondary" | "destructive" | "success" | "warning" => {
    switch (status) {
      case "active":
        return "success"
      case "maintenance":
        return "warning"
      case "inactive":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getAlertPriorityColor = (
    priority: Alert["priority"]
  ): string => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      case "low":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400"
    }
  }

  if (isLoading) {
    return <VehicleStatusSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("vehicles.details.statusTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!statusData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("vehicles.details.statusTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t("vehicles.details.noStatusData")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("vehicles.details.statusTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {t("vehicles.fields.status")}
            </span>
            <Badge variant={getStatusBadgeVariant(statusData.currentStatus)}>
              {t(`vehicles.statusValue.${statusData.currentStatus}`, { defaultValue: statusData.currentStatus })}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("vehicles.details.lastInspection")}
              </p>
              <p className="font-medium">
                {statusData.lastInspectionDate
                  ? format(new Date(statusData.lastInspectionDate), "PPP")
                  : t("common.notAvailableAbbr")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("vehicles.details.nextInspection")}
              </p>
              <p className="font-medium">
                {statusData.nextInspectionDate
                  ? format(new Date(statusData.nextInspectionDate), "PPP")
                  : t("common.notAvailableAbbr")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("vehicles.fields.mileage")}
              </p>
              <p className="font-medium">
                {statusData.mileage !== null
                  ? `${statusData.mileage.toLocaleString()} km`
                  : t("common.notAvailableAbbr")}
              </p>
            </div>
          </div>

          {statusData.alerts.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-medium text-sm">{t("common.alerts")}</h4>
              {statusData.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg text-sm ${getAlertPriorityColor(alert.priority)}`}
                >
                  {t(alert.messageKey, { defaultValue: alert.messageKey })}
                </div>
              ))}
            </div>
          )}
           {statusData.alerts.length === 0 && (
             <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center py-2">{t("common.noAlerts")}</p>
             </div>
           )}
        </div>
      </CardContent>
    </Card>
  )
}

function VehicleStatusSkeleton() {
  // const { t } = useI18n(); // t is not used in skeleton, can be removed if not planned for future use
  return (
    <Card>
      <CardHeader>
        <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          ))}
        </div>
        <div className="space-y-2 pt-4 border-t">
          <Skeleton className="h-5 w-20 mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  )
} 