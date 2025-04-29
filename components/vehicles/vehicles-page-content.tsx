"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { VehicleList } from "@/components/vehicles/vehicle-list"
import { DbVehicle } from "@/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface VehiclesPageContentProps {
  vehicles: DbVehicle[]
  currentPage: number
  totalPages: number
}

export function VehiclesPageContent({ vehicles, currentPage, totalPages }: VehiclesPageContentProps) {
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
        <Link href="/vehicles/new" ><span className="flex items-center gap-2"><span className="flex items-center gap-2">
          <Button className="sm:flex-shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            {t("vehicles.addVehicle")}
          </Button>
        </span></span></Link>
      </div>
      <VehicleList
        vehicles={vehicles}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
} 