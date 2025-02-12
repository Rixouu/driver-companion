"use client"

import { useLanguage } from "@/components/providers/language-provider"

interface InspectionFormProps {
  item: {
    status: 'passed' | 'failed' | 'na' | 'pending'
  }
}

export function InspectionForm({ item }: InspectionFormProps) {
  const { t } = useLanguage()

  return (
    <div className="status-indicator">
      {t(`inspections.validation.validationStatus.${item.status}`)}
    </div>
  )
} 