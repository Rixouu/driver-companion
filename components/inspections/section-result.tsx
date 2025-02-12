"use client"

import { useLanguage } from "@/components/providers/language-provider"

interface SectionResultProps {
  result: {
    status: 'passed' | 'failed' | 'na' | 'pending'
  }
}

export function SectionResult({ result }: SectionResultProps) {
  const { t } = useLanguage()

  return (
    <span className="status-badge">
      {t(`inspections.sections.sectionStatus.${result.status}`)}
    </span>
  )
} 