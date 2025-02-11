import { PageContainer } from "@/components/layouts/page-container"
import { InspectionScheduler } from "@/components/inspections/inspection-scheduler"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface InspectionSchedulePageProps {
  params: {
    vehicleId: string
  }
}

export default function InspectionSchedulePage({ params }: InspectionSchedulePageProps) {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="outline">
            <Link href={`/vehicles/${params.vehicleId}`} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Vehicle
            </Link>
          </Button>
        </div>

        <InspectionScheduler vehicleId={params.vehicleId} />
      </div>
    </PageContainer>
  )
}