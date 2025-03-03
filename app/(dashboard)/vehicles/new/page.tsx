import { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/server"
import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getDictionary()
  
  return {
    title: dictionary.vehicles.newVehicle,
    description: dictionary.vehicles.description,
  }
}

export default async function NewVehiclePage() {
  const { t, dictionary } = await getDictionary()

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
            {dictionary.vehicles.newVehicle}
          </h1>
          <p className="text-muted-foreground">
            {dictionary.vehicles.description}
          </p>
        </div>
      </div>
      <VehicleForm />
    </div>
  )
} 