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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inspections</h1>
          <p className="text-muted-foreground">
            Schedule and track vehicle inspections
          </p>
        </div>
        <Link href="/inspections/perform">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Inspection
          </Button>
        </Link>
      </div>

      <InspectionList />
    </div>
  )
} 