import { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/server"
import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export async function generateMetadata(): Promise<Metadata> {
  try {
  const { dictionary } = await getDictionary()
  
  return {
      title: dictionary?.vehicles?.newVehicle || "New Vehicle",
      description: dictionary?.vehicles?.description || "Add a new vehicle to your fleet",
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "New Vehicle",
      description: "Add a new vehicle to your fleet",
    }
  }
}

export default async function NewVehiclePage() {
  const { t } = await getDictionary()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button
            variant="link"
            className="pl-0 text-muted-foreground"
            asChild
          >
            <Link href="/vehicles" >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.backTo")} {t("vehicles.title")}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("vehicles.newVehicle")}
          </h1>
          <p className="text-muted-foreground">
            {t("vehicles.description")}
          </p>
        </div>
      </div>
      <VehicleForm />
    </div>
  );
} 