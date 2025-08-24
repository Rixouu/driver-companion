"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { VehicleList } from "@/components/vehicles/vehicle-list-new"
import { DbVehicle } from "@/types"

interface VehiclesPageContentProps {
  vehicles: DbVehicle[]
  currentPage: number
  totalPages: number
  initialFilters?: {
    query?: string
    status?: string
    brand?: string
    model?: string
  }
  brandOptions?: { value: string; label: string }[]
  modelOptions?: { value: string; label: string }[]
}

export function VehiclesPageContent({ 
  vehicles, 
  currentPage, 
  totalPages, 
  initialFilters, 
  brandOptions, 
  modelOptions 
}: VehiclesPageContentProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("vehicles.title")}</h1>
          <p className="text-muted-foreground">
            {t("vehicles.description")}
          </p>
        </div>
        <Link href="/vehicles/new">
          <Button className="sm:flex-shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            {t("vehicles.addVehicle")}
          </Button>
        </Link>
      </div>
      <VehicleList
        vehicles={vehicles}
        currentPage={currentPage}
        totalPages={totalPages}
        initialFilters={initialFilters}
        brandOptions={brandOptions}
        modelOptions={modelOptions}
      />
    </div>
  );
} 