"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/context"

interface DriverStatusFilterProps {
  value: string
  onChange: (value: string) => void
}

export function DriverStatusFilter({ value, onChange }: DriverStatusFilterProps) {
  const { t } = useI18n()

  return (
    <div className="w-full sm:w-auto">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">{t("drivers.status.active")}</SelectItem>
          <SelectItem value="inactive">{t("drivers.status.inactive")}</SelectItem>
          <SelectItem value="on_leave">{t("drivers.status.on_leave")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
} 