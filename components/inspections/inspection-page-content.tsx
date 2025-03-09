"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { InspectionList } from "@/components/inspections/inspection-list"
import { supabase } from "@/lib/supabase/client"
import type { Inspection, DbVehicle } from "@/types"

export function InspectionPageContent() {
  const { t } = useI18n()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [vehicles, setVehicles] = useState<DbVehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [inspectionsResponse, vehiclesResponse] = await Promise.all([
          supabase
            .from('inspections')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('vehicles')
            .select('*')
        ])

        if (inspectionsResponse.error) throw inspectionsResponse.error
        if (vehiclesResponse.error) throw vehiclesResponse.error

        setInspections(inspectionsResponse.data)
        setVehicles(vehiclesResponse.data)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("inspections.title")}</h1>
          <p className="text-muted-foreground">
            {t("inspections.description")}
          </p>
        </div>
        <Button asChild className="sm:flex-shrink-0">
          <Link href="/inspections/create">
            <Plus className="mr-2 h-4 w-4" />
            {t("inspections.createInspection")}
          </Link>
        </Button>
      </div>

      <InspectionList inspections={inspections} vehicles={vehicles} />
    </div>
  )
} 