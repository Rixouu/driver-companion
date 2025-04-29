"use client"

import Link from "next/link"
import { Car, FileText } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { InspectionStatusBadge } from "@/components/inspections/inspection-status-badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils/formatting"
import { Button } from "@/components/ui/button"

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
      <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/30 rounded-lg">
        <FileText className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium mb-1">{t("drivers.inspections.empty.title")}</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          {t("drivers.inspections.empty.description")}
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("inspections.fields.date")}</TableHead>
          <TableHead>{t("vehicles.vehicleInformation")}</TableHead>
          <TableHead>{t("inspections.fields.type")}</TableHead>
          <TableHead>{t("inspections.fields.status")}</TableHead>
          <TableHead className="text-right">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inspections.map((inspection) => (
          <TableRow key={inspection.id}>
            <TableCell>{formatDate(inspection.date)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <Link
                  href={`/vehicles/${inspection.vehicle.id}`}
                  className="hover:underline"
                  legacyBehavior>
                  <span>{inspection.vehicle.name} ({inspection.vehicle.plate_number})</span>
                </Link>
              </div>
            </TableCell>
            <TableCell>
              {t(`inspections.type.${inspection.type}`)}
            </TableCell>
            <TableCell>
              <InspectionStatusBadge status={inspection.status} />
            </TableCell>
            <TableCell className="text-right">
              <Link href={`/inspections/${inspection.id}`} legacyBehavior>
                <Button size="sm" variant="ghost">
                  {t("common.view")}
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 