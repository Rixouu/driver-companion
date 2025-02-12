"use client"

import { useLanguage } from "@/components/providers/language-provider"

interface SectionCheckProps {
  check: {
    status: 'passed' | 'failed' | 'na' | 'pending'
  }
}

export function SectionCheck({ check }: SectionCheckProps) {
  const { t } = useLanguage()

  return (
    <span className="status-badge">
      {t(`inspections.sections.checkStatus.${check.status}`)}
    </span>
  )
} 