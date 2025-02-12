"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Label } from "@/components/ui/label"

export function AssignmentSection() {
  const { t } = useLanguage()
  
  return (
    <div>
      <h3>{t("vehicles.details.assignmentSection")}</h3>
      <div>
        <Label>{t("vehicles.details.assignedTo")}</Label>
        <p>Test User</p>
      </div>
      <div>
        <Label>{t("vehicles.details.lastInspection")}</Label>
        <p>2023-05-10</p>
      </div>
    </div>
  )
} 