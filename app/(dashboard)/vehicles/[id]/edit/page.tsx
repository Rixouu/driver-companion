import { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/server"
import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { getVehicle } from "@/lib/services/vehicles"
import type { DbVehicle } from "@/types"
import { notFound } from "next/navigation"

interface EditVehiclePageProps {
  params: {
    id: string
  }
}

// Transform DbVehicle to match VehicleForm expected type
function transformVehicle(vehicle: DbVehicle) {
  return {
    ...vehicle,
    year: vehicle.year ? parseInt(vehicle.year) : undefined
  }
}

export async function generateMetadata({ params }: EditVehiclePageProps): Promise<Metadata> {
  const { t } = await getDictionary()
  
  return {
    title: t('vehicles.edit.title') || "Edit Vehicle",
    description: t('vehicles.edit.description') || "Edit vehicle details",
  }
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { t } = await getDictionary()
  const { vehicle: dbVehicle } = await getVehicle(params.id)

  if (!dbVehicle) {
    notFound()
  }

  const vehicle = transformVehicle(dbVehicle as DbVehicle)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("vehicles.edit.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("vehicles.edit.description")}
        </p>
      </div>
      <VehicleForm vehicle={vehicle} />
    </div>
  );
} 