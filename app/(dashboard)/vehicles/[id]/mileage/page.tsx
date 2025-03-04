import { notFound } from "next/navigation"

import { MileageLogsList } from "@/components/mileage/mileage-logs-list"
import { PageHeader } from "@/components/page-header"
import { getMileageLogs } from "@/lib/services/mileage"
import { getVehicle } from "@/lib/services/vehicles"
import { getDictionary } from "@/lib/i18n/dictionaries"

interface MileageLogsPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: MileageLogsPageProps) {
  const { dictionary } = await getDictionary()

  return {
    title: dictionary.mileage.title,
    description: dictionary.mileage.description,
  }
}

export default async function MileageLogsPage({ params }: MileageLogsPageProps) {
  const { id } = params
  const { dictionary } = await getDictionary()
  const { vehicle } = await getVehicle(id)
  const { logs } = await getMileageLogs(id)

  if (!vehicle) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={dictionary.mileage.title}
        description={dictionary.mileage.description}
      />
      <MileageLogsList logs={logs} vehicleId={id} />
    </div>
  )
} 