"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Package, 
  Info, 
  Settings
} from "lucide-react"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"

interface VehicleInfoProps {
  vehicle: DbVehicle
}

export function VehicleInfo({ vehicle }: VehicleInfoProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      {/* Vehicle Information Grid - Just the two cards you want */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Brand</span>
              <span className="font-medium">{vehicle.brand || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Model</span>
              <span className="font-medium">{vehicle.model || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Year</span>
              <span className="font-medium">{vehicle.year || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Plate Number</span>
              <span className="font-medium font-mono">{vehicle.plate_number}</span>
            </div>
          </CardContent>
        </Card>
       
        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">VIN</span>
              <span className="font-medium font-mono text-sm">
                {vehicle.vin ? vehicle.vin.slice(-8) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Passenger Capacity
              </span>
              <span className="font-medium">
                {vehicle.passenger_capacity ? `${vehicle.passenger_capacity}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Luggage Capacity
              </span>
              <span className="font-medium">
                {vehicle.luggage_capacity ? `${vehicle.luggage_capacity}` : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 