"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils/formatting"
import type { Inspection } from "@/types/inspections"

interface InspectionListDisplayProps {
  inspections: Inspection[]
}

export function InspectionListDisplay({ inspections }: InspectionListDisplayProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Inspector</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inspections.map((inspection) => (
            <TableRow key={inspection.id}>
              <TableCell>{inspection.vehicle.name}</TableCell>
              <TableCell>
                {inspection.inspector?.name || 'No inspector assigned'}
              </TableCell>
              <TableCell>{formatDate(inspection.created_at)}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(inspection.status)}>
                  {inspection.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function getStatusVariant(status: string) {
  switch (status) {
    case "passed":
      return "success"
    case "failed":
      return "destructive"
    case "in_progress":
      return "warning"
    default:
      return "secondary"
  }
} 