"use client"

import { Image } from "@/components/shared/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DbVehicle } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"

interface VehicleDetailsProps {
  vehicle: DbVehicle
}

export function VehicleDetails({ vehicle }: VehicleDetailsProps) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{vehicle.name}</h1>
          <p className="text-muted-foreground">{vehicle.plate_number}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/vehicles">Back to Vehicles</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative aspect-video overflow-hidden rounded-lg">
              {vehicle.image_url ? (
                <Image
                  src={vehicle.image_url || "/placeholder.jpg"}
                  alt={`${vehicle.name} image`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized={vehicle.image_url?.startsWith('data:')}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted">
                  <Icons.car className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="font-medium">Status</span>
                <Badge 
                  variant={
                    vehicle.status === 'active' 
                      ? 'success' 
                      : vehicle.status === 'maintenance'
                      ? 'warning'
                      : 'secondary'
                  }
                >
                  {vehicle.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Brand</span>
                <span>{vehicle.brand}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Model</span>
                <span>{vehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Year</span>
                <span>{vehicle.year}</span>
              </div>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No recent inspections found.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No maintenance history found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 