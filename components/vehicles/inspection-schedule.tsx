"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function InspectionSchedule() {
  const { t } = useLanguage()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("vehicles.details.inspections.title")}</CardTitle>
        <Button>
          {t("vehicles.details.inspections.schedule")}
        </Button>
      </CardHeader>
      <CardContent>
        <div>
          <h3>{t("vehicles.details.inspections.title")}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("vehicles.details.inspections.date")}</TableHead>
                <TableHead>{t("vehicles.details.inspections.time")}</TableHead>
                <TableHead>{t("vehicles.details.inspections.status")}</TableHead>
                <TableHead>{t("vehicles.details.inspections.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>February 12th, 2025</TableCell>
                <TableCell>10:00</TableCell>
                <TableCell>{t("status.scheduled")}</TableCell>
                <TableCell>
                  <Button variant="outline">{t("vehicles.details.inspections.reschedule")}</Button>
                  <Button variant="destructive">{t("vehicles.details.inspections.cancel")}</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 