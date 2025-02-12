"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface Vehicle {
  id: string
  status: 'active' | 'inactive' | 'maintenance'
  model: string
  year: string
  vin: string
}

interface MaintenanceRecord {
  id: string
  type: string
  date: string
  status: string
}

interface VehicleDetailsProps {
  vehicleId: string
  vehicle: Vehicle
}

export function VehicleDetails({ vehicleId, vehicle }: VehicleDetailsProps) {
  const { t } = useLanguage()
  
  // TODO: Replace with actual API call
  const maintenanceHistory: MaintenanceRecord[] = [
    {
      id: "1",
      type: "oil_change",
      date: "2024-03-15",
      status: "completed"
    },
    {
      id: "2",
      type: "tire_rotation",
      date: "2024-02-01",
      status: "completed"
    },
    {
      id: "3",
      type: "inspection",
      date: "2024-01-15",
      status: "completed"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("vehicles.details.title")}</h1>
        <div className="flex justify-between items-center">
          <Button variant="outline" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("buttons.backToVehicles")}
            </Link>
          </Button>
          <Button>
            {t("buttons.startInspection")}
          </Button>
        </div>
      </div>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("vehicles.details.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <h2>{t("vehicles.details.title")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("vehicles.details.model")}</Label>
                <p>{vehicle.model}</p>
              </div>
              <div>
                <Label>{t("vehicles.details.year")}</Label>
                <p>{vehicle.year}</p>
              </div>
              <div>
                <Label>{t("vehicles.details.vin")}</Label>
                <p>{vehicle.vin}</p>
              </div>
              <div>
                <Label>{t("vehicles.details.status")}</Label>
                <Badge>
                  {t(`globalStatus.${vehicle.status}`)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle>{t("vehicles.details.maintenance.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {maintenanceHistory.map((record) => (
              <div key={record.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {t(`vehicles.details.maintenance.types.${record.type}`)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(record.date), "PPP")}
                  </p>
                </div>
                <Badge>
                  {t(`vehicles.details.maintenance.status.${record.status}`)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>{t("vehicles.details.maintenance.schedule")}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* ... maintenance schedule content ... */}
        </CardContent>
      </Card>
    </div>
  )
} 