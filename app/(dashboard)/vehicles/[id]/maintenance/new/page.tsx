import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getVehicleById } from "@/lib/services/vehicles"
import { MaintenanceForm } from "@/components/maintenance/maintenance-form"

interface NewMaintenancePageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: "New Maintenance Task",
  description: "Create a new maintenance task",
}

export default async function NewMaintenancePage({ params }: NewMaintenancePageProps) {
  const vehicle = await getVehicleById(params.id)

  if (!vehicle) {
    return notFound()
  }

  // Provide all required fields with default values
  const initialData = {
    vehicle_id: vehicle.id,
    title: "",
    description: "",
    priority: "medium" as const,
    due_date: "",
    estimated_duration: "",
    cost: "",
    notes: "",
    status: "pending" as const
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Maintenance Task</h1>
        <p className="text-muted-foreground">
          Create a new maintenance task for {vehicle.name}
        </p>
      </div>
      <MaintenanceForm initialData={initialData} />
    </div>
  )
} 