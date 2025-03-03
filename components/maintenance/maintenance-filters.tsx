"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/context"

interface MaintenanceFiltersProps {
  onSearch: (value: string) => void
  onStatusFilter: (status: string) => void
  onPriorityFilter: (priority: string) => void
}

export function MaintenanceFilters({
  onSearch,
  onStatusFilter,
  onPriorityFilter,
}: MaintenanceFiltersProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("maintenance.searchPlaceholder")}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Select onValueChange={onStatusFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("common.filter")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="scheduled">{t("maintenance.status.scheduled")}</SelectItem>
            <SelectItem value="in_progress">{t("maintenance.status.in_progress")}</SelectItem>
            <SelectItem value="completed">{t("maintenance.status.completed")}</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={onPriorityFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("maintenance.fields.priority")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="high">{t("maintenance.priority.high")}</SelectItem>
            <SelectItem value="medium">{t("maintenance.priority.medium")}</SelectItem>
            <SelectItem value="low">{t("maintenance.priority.low")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
} 