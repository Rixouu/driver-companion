"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export function VehicleAssignment({ vehicleId }: { vehicleId: string }) {
  const { t } = useLanguage()

  const assignments = [
    {
      id: 1,
      driver: "John Doe",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      status: "active",
    },
    // ... more assignments
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("vehicles.details.assignment.title")}</CardTitle>
        <Button variant="outline" size="sm">
          {t("vehicles.details.assignment.assignTo")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">{assignment.driver}</p>
                <Badge variant={assignment.status === "active" ? "default" : "secondary"}>
                  {t(`vehicles.details.assignment.status.${assignment.status}`)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  {t("vehicles.details.assignment.startDate")}: {format(assignment.startDate, "PPP")}
                </p>
                <p>
                  {t("vehicles.details.assignment.endDate")}: {format(assignment.endDate, "PPP")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 