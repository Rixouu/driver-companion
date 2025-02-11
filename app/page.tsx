"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { VehicleSelector } from "@/components/vehicle-selector"
import { InspectionInterface } from "@/components/inspection-interface"
import type { Vehicle } from "@/types"

export default function Home() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6">
        {!selectedVehicle ? (
          <>
            <h1 className="text-3xl font-bold mb-6 text-center">
              Select Vehicle for Inspection
              <span className="block text-lg font-normal text-muted-foreground mt-2">
                検査する車両を選択してください
              </span>
            </h1>
            <VehicleSelector onSelect={setSelectedVehicle} />
          </>
        ) : (
          <InspectionInterface vehicle={selectedVehicle} />
        )}
      </main>
    </div>
  )
}

