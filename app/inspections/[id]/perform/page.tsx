import { InspectionForm } from "@/components/inspections/form/inspection-form"

interface PerformInspectionPageProps {
  params: {
    id: string
  }
}

export default function PerformInspectionPage({ params }: PerformInspectionPageProps) {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Perform Inspection</h1>
      <InspectionForm inspectionId={params.id} />
    </div>
  )
} 