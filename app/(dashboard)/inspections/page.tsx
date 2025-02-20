import { Metadata } from "next"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { InspectionList } from "@/components/inspections/inspection-list"

export const metadata: Metadata = {
  title: "Inspections",
  description: "Schedule and track vehicle inspections",
}

export default function InspectionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inspections</h1>
          <p className="text-muted-foreground">
            Schedule and track vehicle inspections
          </p>
        </div>
        <Button asChild className="sm:flex-shrink-0">
          <Link href="/inspections/perform">
            <Plus className="mr-2 h-4 w-4" />
            New Inspection
          </Link>
        </Button>
      </div>

      <InspectionList />
    </div>
  )
} 