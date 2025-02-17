import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getVehicleById } from "@/lib/services/vehicles"
import { VehicleDetails } from "@/components/vehicles/vehicle-details"

interface VehiclePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const vehicle = await getVehicleById(params.id)
  
  if (!vehicle) {
    return {
      title: "Vehicle Not Found",
    }
  }

  return {
    title: vehicle.name,
    description: `Details for ${vehicle.name} (${vehicle.plate_number})`,
  }
}

export default async function VehiclePage({ params }: VehiclePageProps) {
  const vehicle = await getVehicleById(params.id)

  if (!vehicle) {
    notFound()
  }

  return <VehicleDetails vehicle={vehicle} />
} 