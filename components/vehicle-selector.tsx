"use client"

import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import type { Vehicle } from "@/types"

const vehicles: Vehicle[] = [
  {
    id: "majesta",
    name: "Toyota Crown Majesta",
    model: "Crown Majesta",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-crown-majesta-300x200.jpg",
  },
  {
    id: "alphard",
    name: "Toyota Alphard Executive",
    model: "Alphard Executive",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg",
  },
  {
    id: "vellfire",
    name: "Toyota Vellfire",
    model: "Vellfire",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg",
  },
  {
    id: "vito",
    name: "Mercedes-Benz Vito",
    model: "Vito",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/10/mercedes-benz-vito-1-300x200.png",
  },
]

export function VehicleSelector({ onSelect }: { onSelect: (vehicle: Vehicle) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {vehicles.map((vehicle) => (
        <Card
          key={vehicle.id}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onSelect(vehicle)}
        >
          <CardContent className="p-4">
            <Image
              src={vehicle.imageUrl || "/placeholder.svg"}
              alt={vehicle.name}
              width={300}
              height={200}
              className="rounded-lg mb-4"
            />
            <h3 className="font-semibold text-lg">{vehicle.name}</h3>
            <p className="text-sm text-muted-foreground">{vehicle.model}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

