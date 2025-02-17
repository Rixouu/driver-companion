import { Metadata } from "next"
import { MaintenanceForm } from "@/components/maintenance/maintenance-form"

export const metadata: Metadata = {
  title: "New Maintenance Task",
  description: "Create a new maintenance task",
}

export default function NewMaintenancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Maintenance Task</h1>
        <p className="text-muted-foreground">
          Create a new maintenance task for a vehicle
        </p>
      </div>
      <MaintenanceForm />
    </div>
  )
} 