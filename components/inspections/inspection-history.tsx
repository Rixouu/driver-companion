"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/components/providers/language-provider"
import { format } from "date-fns"
import Link from "next/link"
import { Download, Search } from "lucide-react"

interface Inspection {
  id: string
  date: Date
  inspector: string
  status: 'completed' | 'failed' | 'pending'
  notes?: string
  reportUrl?: string
}

interface InspectionHistoryProps {
  vehicleId: string
}

export function InspectionHistory({ vehicleId }: InspectionHistoryProps) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // TODO: Replace with actual API call
  const inspections: Inspection[] = [
    {
      id: '1',
      date: new Date(),
      inspector: 'John Doe',
      status: 'completed',
      notes: 'Regular inspection completed',
      reportUrl: '/reports/1.pdf'
    },
    {
      id: '2',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      inspector: 'Jane Smith',
      status: 'failed',
      notes: 'Brake system needs attention',
      reportUrl: '/reports/2.pdf'
    },
  ]

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("inspections.history.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("inspections.history.filterByStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("inspections.history.allStatuses")}</SelectItem>
              <SelectItem value="completed">{t("status.completed")}</SelectItem>
              <SelectItem value="failed">{t("status.failed")}</SelectItem>
              <SelectItem value="pending">{t("status.pending")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("inspections.date")}</TableHead>
              <TableHead>{t("inspections.inspector")}</TableHead>
              <TableHead>{t("status.status")}</TableHead>
              <TableHead>{t("inspections.notes")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInspections.map((inspection) => (
              <TableRow key={inspection.id}>
                <TableCell>
                  {format(inspection.date, "PPP")}
                </TableCell>
                <TableCell>{inspection.inspector}</TableCell>
                <TableCell>
                  <span className={`status-badge ${
                    inspection.status === 'completed' 
                      ? 'status-badge-success' 
                      : inspection.status === 'failed'
                      ? 'status-badge-destructive'
                      : 'status-badge-warning'
                  }`}>
                    {t(`status.${inspection.status}`)}
                  </span>
                </TableCell>
                <TableCell>{inspection.notes}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/inspection-details/${inspection.id}`}>
                        {t("vehicles.viewDetails")}
                      </Link>
                    </Button>
                    {inspection.reportUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(inspection.reportUrl, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 