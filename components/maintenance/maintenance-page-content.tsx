"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Calendar } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { MaintenanceList } from "./maintenance-list"
import type { MaintenanceTask } from "@/types"

interface MaintenancePageContentProps {
  tasks: MaintenanceTask[]
}

export function MaintenancePageContent({ tasks }: MaintenancePageContentProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("maintenance.title")}</h1>
          <p className="text-muted-foreground">
            {t("maintenance.description")}
          </p>
        </div>
        <Button asChild>
          <Link href="/maintenance/schedule">
            <Plus className="mr-2 h-4 w-4" />
            {t("maintenance.schedule.title")}
          </Link>
        </Button>
      </div>

      <MaintenanceList tasks={tasks} />
    </div>
  )
} 