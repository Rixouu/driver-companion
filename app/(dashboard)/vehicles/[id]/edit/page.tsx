import { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/server"
import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { getVehicle } from "@/lib/services/vehicles"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
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
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/vehicles" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <Button
              variant="link"
              className="pl-0 pr-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.backTo")} {t("vehicles.title")}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("vehicles.edit.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("vehicles.edit.description")}
          </p>
        </div>
      </div>
      <VehicleForm vehicle={vehicle} />
    </div>
  );
} 