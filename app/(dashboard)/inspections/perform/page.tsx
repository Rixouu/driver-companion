import { Metadata } from "next"
import { InspectionForm } from "@/components/inspections/form/inspection-form"

export const metadata: Metadata = {
  title: "New Inspection",
  description: "Create a new vehicle inspection",
}

export default function PerformInspectionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Inspection</h1>
        <p className="text-muted-foreground">
          Create a new inspection
        </p>
      </div>
      <InspectionForm />
    </div>
  )
} 