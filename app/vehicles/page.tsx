"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PageContainer } from "@/components/layouts/page-container"
import Image from "next/image"
import { useLanguage } from "@/components/providers/language-provider"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import { LoadingState } from "@/components/ui/loading-state"

// Mock data for vehicles
const MOCK_VEHICLES = [
  { 
    id: "1", 
    name: "Toyota Alphard Z-Class", 
    lastInspection: "2023-05-10", 
    status: "completed",
    plateNumber: "ABC-123",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg"
  },
  { 
    id: "2", 
    name: "Toyota Alphard Executive Lounge", 
    lastInspection: null, 
    status: "pending",
    plateNumber: "XYZ-789",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg"
  },
  { 
    id: "3", 
    name: "Mercedes-Benz V220d", 
    lastInspection: null, 
    status: "pending",
    plateNumber: "DEF-456",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/10/mercedes-benz-vito-1-300x200.png"
  },
  { 
    id: "4", 
    name: "Toyota Hiace Grand Cabin", 
    lastInspection: null, 
    status: "pending",
    plateNumber: "GHI-789",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg"
  },
]

const VehicleGrid = dynamic(() => import("@/components/vehicle-grid"), {
  loading: () => <LoadingState />
})

export default function VehiclesPage() {
  const { t } = useLanguage()

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">{t("vehicles.title")}</h1>
          <Button asChild>
            <Link href="/vehicles/new">{t("vehicles.addVehicle")}</Link>
          </Button>
        </div>
        <Suspense fallback={<LoadingState />}>
          <VehicleGrid vehicles={MOCK_VEHICLES} />
        </Suspense>
      </div>
    </PageContainer>
  )
} 