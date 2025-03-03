"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Calendar, Wrench } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { MaintenanceList } from "./maintenance-list"
import type { MaintenanceTask } from "@/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("maintenance.addTask")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/maintenance/schedule" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {t("maintenance.schedule.title")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/maintenance/new" className="flex items-center">
                <Wrench className="mr-2 h-4 w-4" />
                {t("maintenance.createDirect")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <MaintenanceList tasks={tasks} />
    </div>
  )
} 