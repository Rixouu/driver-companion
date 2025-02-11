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
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/providers/language-provider"
import { format } from "date-fns"
import { Search } from "lucide-react"

interface MaintenanceRecord {
  id: string
  type: string
  date: Date
  cost: number
  notes: string
  performedBy: string
}

interface MaintenanceHistoryProps {
  vehicleId: string
}

export function MaintenanceHistory({ vehicleId }: MaintenanceHistoryProps) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")

  // TODO: Replace with actual API call
  const maintenanceRecords: MaintenanceRecord[] = [
    {
      id: "1",
      type: "oil",
      date: new Date(),
      cost: 150,
      notes: "Regular oil change",
      performedBy: "John Doe"
    },
    // Add more records...
  ]

  const filteredRecords = maintenanceRecords.filter(record =>
    record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.performedBy.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("vehicles.management.maintenance.history")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-6">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("vehicles.management.maintenance.serviceDate")}</TableHead>
              <TableHead>{t("vehicles.management.maintenance.serviceType")}</TableHead>
              <TableHead>{t("vehicles.management.maintenance.costs.amount")}</TableHead>
              <TableHead>{t("vehicles.management.maintenance.notes")}</TableHead>
              <TableHead>{t("vehicles.management.maintenance.performedBy")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{format(record.date, "PPP")}</TableCell>
                <TableCell>
                  {t(`vehicles.management.maintenance.types.${record.type}`)}
                </TableCell>
                <TableCell>${record.cost.toFixed(2)}</TableCell>
                <TableCell>{record.notes}</TableCell>
                <TableCell>{record.performedBy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 