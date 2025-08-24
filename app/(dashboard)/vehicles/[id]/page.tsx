import { Metadata } from "next"
import { notFound } from "next/navigation"
import { VehicleDetails } from "@/components/vehicles/vehicle-details-new"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getDictionary } from "@/lib/i18n/server"
import { getVehicle } from "@/lib/services/vehicles"
import type { DbVehicle } from "@/types"

interface VehiclePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const vehicleId = resolvedParams.id;
  try {
    const { t } = await getDictionary()
    const { vehicle } = await getVehicle(vehicleId)
    
    return {
      title: vehicle ? `${vehicle.name} - ${t('vehicles.title')}` : t('vehicles.detailsPage.titleFallback'),
      description: t('vehicles.detailsPage.descriptionFallback'),
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    const { t } = await getDictionary(); 
    return {
      title: t('vehicles.detailsPage.titleFallback'),
      description: t('vehicles.detailsPage.descriptionFallback'),
    }
  }
}

export default async function VehiclePage({ params }: VehiclePageProps) {
  const resolvedParams = await params;
  const vehicleId = resolvedParams.id;
  const { vehicle, error } = await getVehicle(vehicleId);

  if (error || !vehicle) {
    console.error(`Error fetching vehicle ${vehicleId}:`, error);
    return notFound();
  }

  return (
    <div className="space-y-6">
      <VehicleDetails vehicle={vehicle as DbVehicle} />
    </div>
  )
} 