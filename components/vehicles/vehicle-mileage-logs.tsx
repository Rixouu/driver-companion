"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { columns } from "../mileage/columns"
import { VehicleLogsTable } from "./vehicle-logs-table"
import { useI18n } from "@/lib/i18n/context"
import { useState, useEffect } from "react"

interface VehicleMileageLogsProps {
  vehicleId: string
}

export function VehicleMileageLogs({ vehicleId }: VehicleMileageLogsProps) {
  const { t } = useI18n()
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vehicles/${vehicleId}/mileage`)
        const data = await response.json()
        setLogs(data.logs || [])
      } catch (error) {
        console.error("Failed to fetch mileage logs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [vehicleId])
  
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle>{t("mileage.title")}</CardTitle>
          <CardDescription>{t("mileage.description")}</CardDescription>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href={`/vehicles/${vehicleId}/mileage/new`} className="flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            <span>{t("mileage.new.title")}</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <VehicleLogsTable
            columns={columns}
            data={logs}
            searchKey="date"
          />
        )}
      </CardContent>
    </Card>
  )
} 