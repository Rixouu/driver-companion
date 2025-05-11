import { Metadata } from "next"
import { notFound } from "next/navigation"
import { VehicleDetails } from "@/components/vehicles/vehicle-details"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getDictionary } from "@/lib/i18n/server"
import { getVehicles } from "@/lib/services/vehicles"
import type { DbVehicle } from "@/types"

interface VehiclePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  try {
    const { t } = await getDictionary()
    const { vehicles } = await getVehicles()
    const awaitedParams = await params;
    const vehicleId = Array.isArray(awaitedParams.id) ? awaitedParams.id[0] : awaitedParams.id;
    const vehicle = vehicles.find(v => v.id === vehicleId)
    
    return {
      title: vehicle ? `${vehicle.name} - ${t('vehicles.title') || "Vehicles"}` : (t('vehicles.title') || "Vehicle Details"),
      description: t('vehicles.description') || "View vehicle details",
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Vehicle Details",
      description: "View vehicle details",
    }
  }
}

export default async function VehiclePage({ params }: VehiclePageProps) {
  const { t } = await getDictionary()
  const { vehicles } = await getVehicles()
  const awaitedParams = await params;
  const vehicleId = Array.isArray(awaitedParams.id) ? awaitedParams.id[0] : awaitedParams.id;
  const vehicle = vehicles.find(v => v.id === vehicleId)

  if (!vehicle) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <VehicleDetails vehicle={vehicle as DbVehicle} />
    </div>
  )
} 