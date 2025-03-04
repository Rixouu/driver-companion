"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getMileageLogs } from "@/lib/services/mileage"
import { Plus } from "lucide-react"
import Link from "next/link"
import { columns } from "../mileage/columns"
import { VehicleLogsTable } from "./vehicle-logs-table"
import { getDictionary } from "@/lib/i18n/dictionaries"

interface VehicleMileageLogsProps {
  vehicleId: string
}

export async function VehicleMileageLogs({ vehicleId }: VehicleMileageLogsProps) {
  const { dictionary } = await getDictionary()
  const { logs } = await getMileageLogs(vehicleId)

  return (
    <VehicleMileageLogsContent 
      vehicleId={vehicleId}
      logs={logs}
      dictionary={dictionary}
    />
  )
}

interface VehicleMileageLogsContentProps {
  vehicleId: string
  logs: any[]
  dictionary: any
}

function VehicleMileageLogsContent({ vehicleId, logs, dictionary }: VehicleMileageLogsContentProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle>{dictionary.mileage.title}</CardTitle>
          <CardDescription>{dictionary.mileage.description}</CardDescription>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href={`/vehicles/${vehicleId}/mileage/new`} className="flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            <span>{dictionary.mileage.new.title}</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <VehicleLogsTable
          columns={columns}
          data={logs}
          searchKey="date"
        />
      </CardContent>
    </Card>
  )
} 