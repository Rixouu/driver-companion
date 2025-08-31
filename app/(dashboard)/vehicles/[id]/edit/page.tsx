import { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/server"
import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { getVehicle } from "@/lib/services/vehicles"
import type { DbVehicle } from "@/types"
import { notFound } from "next/navigation"

interface EditVehiclePageProps {
  params: Promise<{
    id: string
  }>
}

// Transform DbVehicle to match VehicleForm expected type
function transformVehicle(vehicle: DbVehicle) {
  return {
    id: vehicle.id,
    name: vehicle.name,
    plate_number: vehicle.plate_number,
    brand: vehicle.brand || undefined,
    model: vehicle.model || undefined,
    year: vehicle.year ? parseInt(vehicle.year) : undefined,
    vin: vehicle.vin || undefined,
    image_url: vehicle.image_url || undefined,
    passenger_capacity: vehicle.passenger_capacity || undefined,
    luggage_capacity: vehicle.luggage_capacity || undefined,
    status: (vehicle.status as "active" | "maintenance" | "inactive") || undefined,
  }
}

export async function generateMetadata({ params }: EditVehiclePageProps): Promise<Metadata> {
  const { t } = await getDictionary()
  const resolvedParams = await params
  
  return {
    title: t('vehicles.edit.title') || "Edit Vehicle",
    description: t('vehicles.edit.description') || "Edit vehicle details",
  }
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { t } = await getDictionary()
  const resolvedParams = await params
  const { vehicle: dbVehicle } = await getVehicle(resolvedParams.id)

  if (!dbVehicle) {
    notFound()
  }

  const vehicle = transformVehicle(dbVehicle as DbVehicle)

  return (
    <div className="container mx-auto py-4 px-4 sm:py-6 sm:px-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("vehicles.edit.title")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("vehicles.edit.description")}
        </p>
      </div>

      {/* Vehicle Form */}
      <VehicleForm vehicle={vehicle} />
    </div>
  );
} 