import { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/server"
import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { getVehicles } from "@/lib/services/vehicles"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { DbVehicle } from "@/types"

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
  const { dictionary } = await getDictionary()
  
  return {
    title: dictionary.vehicles.edit.title,
    description: dictionary.vehicles.edit.description,
  }
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const { t, dictionary } = await getDictionary()
  const { vehicles } = await getVehicles()
  const dbVehicle = vehicles.find(v => v.id === params.id)

  if (!dbVehicle) {
    return null
  }

  const vehicle = transformVehicle(dbVehicle)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button
            variant="link"
            className="pl-0 text-muted-foreground"
            asChild
          >
            <Link href="/vehicles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {dictionary.common.backTo} {dictionary.vehicles.title}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {dictionary.vehicles.edit.title}
          </h1>
          <p className="text-muted-foreground">
            {dictionary.vehicles.edit.description}
          </p>
        </div>
      </div>
      <VehicleForm vehicle={vehicle} />
    </div>
  )
} 