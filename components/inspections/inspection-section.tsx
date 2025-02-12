"use client"

import { useLanguage } from "@/components/providers/language-provider"

interface InspectionSectionProps {
  item: {
    status: 'passed' | 'failed' | 'na' | 'pending'
  }
}

export function InspectionSection({ item }: InspectionSectionProps) {
  const { t } = useLanguage()

  return (
    <div className="status-badge">
      {t(`inspections.sections.inspectionStatus.${item.status}`)}
    </div>
  )
} 