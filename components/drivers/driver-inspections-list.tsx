"use client"

import Link from "next/link"
import { Car, FileText, ChevronRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { InspectionStatusBadge } from "@/components/inspections/inspection-status-badge"
import { formatDate } from "@/lib/utils/formatting"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/styles"

interface DriverInspectionsListProps {
  inspections: Array<{
    id: string
    vehicle: {
      id: string
      name: string
      plate_number: string
      image_url?: string
    }
    date: string
    status: string
    type: string
  }>
}

export function DriverInspectionsList({ inspections }: DriverInspectionsListProps) {
  const { t } = useI18n()

  if (inspections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-muted/30 rounded-lg min-h-[150px]">
        <FileText className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium mb-1">{t("drivers.inspections.empty.title")}</h3>
        <p className="text-muted-foreground text-sm mb-4 max-w-md">
          {t("drivers.inspections.empty.description")}
        </p>
      </div>
    )
  }

  // Mobile card view (for smaller screens)
  const mobileView = (
    <div className="sm:hidden space-y-3">
      {inspections.map((inspection) => (
        <Link key={inspection.id} href={`/inspections/${inspection.id}`} className="block">
          <div className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-sm">{formatDate(inspection.date)}</div>
              <InspectionStatusBadge status={inspection.status} />
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-3">
              <Car className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {inspection.vehicle.name} ({inspection.vehicle.plate_number})
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs">
                {t(`inspections.type.${inspection.type}`)}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  // Desktop list view - styled similar to activity feed
  const desktopView = (
    <div className="hidden sm:block">
      <div className="space-y-3">
        {inspections.map((inspection) => (
          <Link key={inspection.id} href={`/inspections/${inspection.id}`} className="block">
            <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start sm:gap-3 justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground text-base">{formatDate(inspection.date)}</h4>
                      <InspectionStatusBadge status={inspection.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">
                        {inspection.vehicle.name} ({inspection.vehicle.plate_number})
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {t(`inspections.type.${inspection.type}`)}
                    </span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  );
} 