"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DbVehicle } from "@/types"

interface VehicleRemindersProps {
  vehicle: DbVehicle
}

export function VehicleReminders({ vehicle }: VehicleRemindersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          Upcoming Reminders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">No reminders set.</p>
      </CardContent>
    </Card>
  )
} 