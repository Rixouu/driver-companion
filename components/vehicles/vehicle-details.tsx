"use client"

import { Image } from "@/components/shared/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DbVehicle } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { VehicleTabs } from "./vehicle-tabs"

interface VehicleDetailsProps {
  vehicle: DbVehicle
}

export function VehicleDetails({ vehicle }: VehicleDetailsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Vehicle Image and Status */}
      <Card>
        <CardContent className="p-6">
          <div className="aspect-video relative rounded-lg overflow-hidden mb-6">
            <Image
              src={vehicle.image_url || "/img/vehicle-placeholder.png"}
              alt={vehicle.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                {vehicle.brand} {vehicle.model}
              </h2>
              <p className="text-sm text-muted-foreground">
                {vehicle.year}
              </p>
            </div>
            <Badge
              variant={
                vehicle.status === "active"
                  ? "success"
                  : vehicle.status === "maintenance"
                  ? "warning"
                  : "secondary"
              }
              className="capitalize"
            >
              {vehicle.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex justify-between">
              <span className="font-medium">License Plate</span>
              <span>{vehicle.plate_number}</span>
            </div>
            {vehicle.vin && (
              <div className="flex justify-between">
                <span className="font-medium">VIN</span>
                <span>{vehicle.vin}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Tabs - Full Width */}
      <div className="md:col-span-2">
        <VehicleTabs vehicle={vehicle} />
      </div>
    </div>
  )
} 