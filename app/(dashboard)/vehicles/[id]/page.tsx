import { Metadata } from "next"
import { notFound } from "next/navigation"
import { VehicleDetails } from "@/components/vehicles/vehicle-details"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getDictionary } from "@/lib/i18n/server"
import { getVehicles } from "@/lib/services/vehicles"

interface VehiclePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const { dictionary } = await getDictionary()
  const { vehicles } = await getVehicles()
  const vehicle = vehicles.find(v => v.id === params.id)
  
  return {
    title: vehicle ? `${vehicle.name} - ${dictionary.vehicles.title}` : dictionary.vehicles.title,
    description: dictionary.vehicles.description,
  }
}

export default async function VehiclePage({ params }: VehiclePageProps) {
  const { t, dictionary } = await getDictionary()
  const { vehicles } = await getVehicles()
  const vehicle = vehicles.find(v => v.id === params.id)

  if (!vehicle) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        size="sm"
        className="mb-2"
        asChild
      >
        <Link href="/vehicles" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {dictionary.common.backTo} {dictionary.navigation.vehicles}
        </Link>
      </Button>

      <VehicleDetails vehicle={vehicle} />
    </div>
  )
} 