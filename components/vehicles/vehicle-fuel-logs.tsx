"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFuelLogs } from "@/lib/services/fuel"
import { Plus } from "lucide-react"
import Link from "next/link"
import { columns } from "../fuel/columns"
import { VehicleLogsTable } from "./vehicle-logs-table"
import { getDictionary } from "@/lib/i18n/dictionaries"

interface VehicleFuelLogsProps {
  vehicleId: string
}

export async function VehicleFuelLogs({ vehicleId }: VehicleFuelLogsProps) {
  const { dictionary } = await getDictionary()
  const { logs } = await getFuelLogs(vehicleId)

  return (
    <VehicleFuelLogsContent 
      vehicleId={vehicleId}
      logs={logs}
      dictionary={dictionary}
    />
  )
}


interface VehicleFuelLogsContentProps {
  vehicleId: string
  logs: any[]
  dictionary: any
}

function VehicleFuelLogsContent({ vehicleId, logs, dictionary }: VehicleFuelLogsContentProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle>{dictionary.fuel.title}</CardTitle>
          <CardDescription>{dictionary.fuel.description}</CardDescription>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href={`/vehicles/${vehicleId}/fuel/new`} className="flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            <span>{dictionary.fuel.new.title}</span>
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