"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Label } from "@/components/ui/label"

export function MileageSection() {
  const { t } = useLanguage()

  return (
    <div>
      <h3>{t("vehicles.management.mileage.title")}</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>{t("vehicles.management.mileage.current")}</Label>
          <p>12,500 {t("vehicles.management.mileage.metrics.kilometers")}</p>
        </div>
        <div>
          <Label>{t("vehicles.management.mileage.daily")}</Label>
          <p>71.4 {t("vehicles.management.mileage.metrics.kilometers")}</p>
        </div>
        <div>
          <Label>{t("vehicles.management.mileage.monthly")}</Label>
          <p>2143 {t("vehicles.management.mileage.metrics.kilometers")}</p>
        </div>
      </div>
    </div>
  )
} 