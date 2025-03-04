import { notFound } from "next/navigation"

import { MileageForm } from "@/components/mileage/mileage-form"
import { PageHeader } from "@/components/page-header"
import { getVehicle } from "@/lib/services/vehicles"
import { getDictionary } from "@/lib/i18n/dictionaries"

interface NewMileageLogPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: NewMileageLogPageProps) {
  const { dictionary } = await getDictionary()

  return {
    title: dictionary.mileage.new.title,
    description: dictionary.mileage.new.description,
  }
}

export default async function NewMileageLogPage({ params }: NewMileageLogPageProps) {
  const { id } = params
  const { dictionary } = await getDictionary()
  const { vehicle } = await getVehicle(id)

  if (!vehicle) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={dictionary.mileage.new.title}
        description={dictionary.mileage.new.description}
      />
      <MileageForm vehicleId={id} />
    </div>
  )
} 