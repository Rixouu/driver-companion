import { notFound } from "next/navigation"

import { FuelLogsList } from "@/components/fuel/fuel-logs-list"
import { PageHeader } from "@/components/page-header"
import { getFuelLogs } from "@/lib/services/fuel"
import { getVehicle } from "@/lib/services/vehicles"
import { getDictionary } from "@/lib/i18n/dictionaries"

interface FuelLogsPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: FuelLogsPageProps) {
  const { dictionary } = await getDictionary()

  return {
    title: dictionary.fuel.title,
    description: dictionary.fuel.description,
  }
}

export default async function FuelLogsPage({ params }: FuelLogsPageProps) {
  const { id } = params
  const { dictionary } = await getDictionary()
  const { vehicle } = await getVehicle(id)
  const { logs } = await getFuelLogs(id)

  if (!vehicle) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={dictionary.fuel.title}
        description={dictionary.fuel.description}
      />
      <FuelLogsList logs={logs} vehicleId={id} />
    </div>
  )
} 