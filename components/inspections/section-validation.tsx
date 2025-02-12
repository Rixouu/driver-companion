"use client"

import { useLanguage } from "@/components/providers/language-provider"

interface SectionValidationProps {
  validation: {
    status: 'passed' | 'failed' | 'na' | 'pending'
  }
}

export function SectionValidation({ validation }: SectionValidationProps) {
  const { t } = useLanguage()

  return (
    <span className="status-badge">
      {t(`inspections.sections.validationStatus.${validation.status}`)}
    </span>
  )
} 