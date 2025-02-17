import { notFound } from "next/navigation"
import { InspectionDetails } from "@/components/inspections/inspection-details"

interface InspectionPageProps {
  params: {
    id: string
  }
}

export default function InspectionPage({ params }: InspectionPageProps) {
  if (!params.id) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Inspection Details</h1>
      <InspectionDetails inspectionId={params.id} />
    </div>
  )
} 