"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Label } from "@/components/ui/label"

export function MaintenanceCosts() {
  const { t } = useLanguage()

  return (
    <div>
      <h3>{t("vehicles.details.maintenance.costs.title")}</h3>
      <div className="flex justify-between">
        <div>
          <Label>{t("vehicles.details.maintenance.costs.total")}</Label>
          <p>$650.00</p>
        </div>
        <div>
          <Label>{t("vehicles.details.maintenance.costs.average")}</Label>
          <p>$216.67</p>
        </div>
      </div>
    </div>
  )
} 