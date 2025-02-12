"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VinScannerDialog } from "@/components/vin/vin-scanner"
import { Edit2, Save } from "lucide-react"
import type { Vehicle } from "@/types"

interface VehicleFormData extends Vehicle {
  color?: string
  licensePlate?: string
}

export function VehicleInfo({ vehicle }: { vehicle: VehicleFormData }) {
  const [isEditing, setIsEditing] = useState(false)
  const [vehicleData, setVehicleData] = useState<VehicleFormData>(vehicle)

  const handleVinDetected = (vin: string) => {
    setVehicleData({ ...vehicleData, vin })
  }

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-md p-6">
      <div className="flex items-start space-x-6">
        <Image
          src={vehicle.imageUrl || "/placeholder.svg"}
          alt={vehicle.name}
          width={200}
          height={150}
          className="rounded-md object-cover"
        />
        <div className="flex-grow space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{vehicle.name}</h2>
            <div className="flex space-x-2">
              <VinScannerDialog onVinDetected={handleVinDetected} />
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
                {isEditing ? "Save" : "Edit"}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                value={vehicleData.vin}
                onChange={(e) => setVehicleData({ ...vehicleData, vin: e.target.value })}
                readOnly={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={vehicleData.model}
                onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                readOnly={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={vehicleData.year}
                onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                readOnly={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={vehicleData.color}
                onChange={(e) => setVehicleData({ ...vehicleData, color: e.target.value })}
                readOnly={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input
                id="licensePlate"
                value={vehicleData.licensePlate}
                onChange={(e) => setVehicleData({ ...vehicleData, licensePlate: e.target.value })}
                readOnly={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

