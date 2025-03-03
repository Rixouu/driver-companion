import { Metadata } from "next"
import { NewVehiclePageContent } from "@/components/vehicles/new-vehicle-page-content"
import { getDictionary } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary()
  
  return {
    title: dictionary.vehicles.addNewTitle,
    description: dictionary.vehicles.addNewDescription,
  }
}

export default async function NewVehiclePage() {
  return <NewVehiclePageContent />
} 