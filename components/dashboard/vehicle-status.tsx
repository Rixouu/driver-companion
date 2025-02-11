"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Car, AlertTriangle, CheckCircle, Clock, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"

const MOCK_VEHICLES = [
  { id: 1, name: "Toyota Alphard", status: "active", lastInspection: "2024-02-01", nextService: "2024-03-15" },
  { id: 2, name: "Mercedes V-Class", status: "maintenance", lastInspection: "2024-01-15", alerts: 2 },
  { id: 3, name: "Toyota Hiace", status: "active", lastInspection: "2024-02-10", nextService: "2024-04-01" },
  { id: 4, name: "BMW 7 Series", status: "inspection_due", lastInspection: "2023-12-20", alerts: 1 },
]

export function VehicleStatus() {
  const { t } = useLanguage()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "maintenance":
        return <Wrench className="h-4 w-4 text-orange-500" />
      case "inspection_due":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("vehicles.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("vehicles.list.active")}: {MOCK_VEHICLES.length}
          </p>
        </div>
        <Button asChild>
          <Link href="/vehicles/new">
            <Car className="mr-2 h-4 w-4" />
            {t("vehicles.addVehicle")}
          </Link>
        </Button>
      </div>

      <div className="divide-y">
        {MOCK_VEHICLES.map((vehicle) => (
          <div
            key={vehicle.id}
            className="flex items-center justify-between py-4"
          >
            <div className="flex items-center space-x-4">
              {getStatusIcon(vehicle.status)}
              <div>
                <p className="font-medium">{vehicle.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t("inspections.details.lastInspection")}: {vehicle.lastInspection}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {vehicle.alerts && (
                <Badge variant="destructive">
                  {vehicle.alerts} {t("dashboard.alerts.title")}
                </Badge>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/vehicles/${vehicle.id}`}>
                  {t("common.view")}
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 