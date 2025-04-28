"use client"

import Link from "next/link"
import Image from "next/image"
import { Car, ChevronRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface DriverVehiclesProps {
  driverId: string
  assignedVehicles?: {
    id: string
    name: string
    plate_number: string
    image_url?: string
    brand?: string
    model?: string
  }[]
}

export function DriverVehicles({ driverId, assignedVehicles = [] }: DriverVehiclesProps) {
  const { t } = useI18n()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{t("drivers.vehicles.title")}</CardTitle>
          <CardDescription>{t("drivers.vehicles.description")}</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/drivers/${driverId}/assign-vehicle`} legacyBehavior>
            <Car className="mr-2 h-4 w-4" />
            {t("drivers.actions.assignVehicle")}
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {assignedVehicles.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t("drivers.vehicles.noVehicles")}
            </p>
            <Button className="mt-4" asChild>
              <Link href={`/drivers/${driverId}/assign-vehicle`} legacyBehavior>
                <Car className="mr-2 h-4 w-4" />
                {t("drivers.actions.assignVehicle")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {assignedVehicles.map((vehicle) => (
              <Link
                key={vehicle.id}
                href={`/vehicles/${vehicle.id}`}
                className="flex items-center py-3 px-1 space-x-4 hover:bg-muted/50 rounded-md -mx-1 transition-colors"
                legacyBehavior>
                <div className="h-12 w-12 relative flex-shrink-0 rounded-md overflow-hidden bg-muted">
                  {vehicle.image_url ? (
                    <Image
                      src={vehicle.image_url}
                      alt={vehicle.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-muted">
                      <Car className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{vehicle.name}</h4>
                  <div className="text-sm text-muted-foreground">
                    {vehicle.plate_number}
                    {vehicle.brand && vehicle.model && (
                      <span className="mx-1">•</span>
                    )}
                    {vehicle.brand && vehicle.model && (
                      <span>{vehicle.brand} {vehicle.model}</span>
                    )}
                  </div>
                </div>
                
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 