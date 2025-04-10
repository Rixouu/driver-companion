import { notFound } from "next/navigation"

import { FuelForm } from "@/components/fuel/fuel-form"
import { PageHeader } from "@/components/page-header"
import { getVehicle } from "@/lib/services/vehicles"
import { getDictionary } from "@/lib/i18n/server"

interface NewFuelLogPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: NewFuelLogPageProps) {
  const { dictionary } = await getDictionary()

  return {
    title: dictionary.fuel.new.title,
    description: dictionary.fuel.new.description,
  }
}

export default async function NewFuelLogPage({ params }: NewFuelLogPageProps) {
  const { id } = params
  const { t } = await getDictionary()
  const { vehicle } = await getVehicle(id)

  if (!vehicle) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("fuel.new.title")}
        description={t("fuel.new.description")}
      />
      <FuelForm vehicleId={id} />
    </div>
  )
} 