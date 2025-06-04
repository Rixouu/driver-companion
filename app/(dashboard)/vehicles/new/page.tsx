import { Metadata } from "next"
// import dynamic from "next/dynamic" // No longer needed here
import { getDictionary } from "@/lib/i18n/server"
import { NewVehicleLoader } from "./new-vehicle-loader"; // Import the new client component
// import { Button } from "@/components/ui/button"
// import Link from "next/link"
// import { ArrowLeft } from "lucide-react"
// import { PageHeader } from "@/components/layout/page-header"

// Remove dynamic import of VehicleForm if NewVehiclePageContent handles it
// const VehicleForm = dynamic(() => 
//   import("@/components/vehicles/vehicle-form").then(mod => mod.VehicleForm),
//   { 
//     ssr: false,
//     loading: () => <p>Loading form...</p>
//   }
// );

// Dynamically import NewVehiclePageContent - this is the primary content for the page
// const NewVehiclePageContent = dynamic(() => 
//   import("@/components/vehicles/new-vehicle-page-content").then(mod => mod.NewVehiclePageContent),
//   {
//     ssr: false, 
//     loading: () => (
//       <div className=\"container mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center\">
//         <p>Loading...</p>
//       </div>
//     )
//   }
// );

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary()
  return {
    title: t('vehicles.addNewMetaTitle') || "Add New Vehicle",
    description: t('vehicles.addNewMetaDescription') || "Add a new vehicle to your fleet",
  }
}

export default async function NewVehiclePage() {
  return <NewVehicleLoader />;
} 