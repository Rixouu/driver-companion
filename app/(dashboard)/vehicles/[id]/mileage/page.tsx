import { notFound } from "next/navigation"

import { MileageLogsList } from "@/components/mileage/mileage-logs-list"
import { PageHeader } from "@/components/page-header"
import { getMileageLogs } from "@/lib/services/mileage"
import { getVehicle } from "@/lib/services/vehicles"
import { getDictionary } from "@/lib/i18n/server"

interface MileageLogsPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: MileageLogsPageProps) {
  const { t } = await getDictionary()

  return {
    title: t('mileage.title') || "Mileage Logs",
    description: t('mileage.description') || "View mileage logs",
  }
}

export default async function MileageLogsPage({ params }: MileageLogsPageProps) {
  const { id } = params
  const { t } = await getDictionary()
  const { vehicle } = await getVehicle(id)
  const { logs } = await getMileageLogs(id)

  if (!vehicle) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("mileage.title")}
        description={t("mileage.description")}
      />
      <MileageLogsList logs={logs} vehicleId={id} />
    </div>
  )
} 