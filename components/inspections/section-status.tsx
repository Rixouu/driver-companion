"use client"

import { useLanguage } from "@/components/providers/language-provider"

interface SectionStatusProps {
  section: {
    status: 'passed' | 'failed' | 'na' | 'pending'
  }
}

export function SectionStatus({ section }: SectionStatusProps) {
  const { t } = useLanguage()

  const statusClassName = `status-badge ${
    section.status === 'passed' 
      ? 'bg-green-500/10 text-green-500' 
      : section.status === 'failed'
        ? 'bg-red-500/10 text-red-500'
        : 'bg-gray-500/10 text-gray-500'
  }`

  return (
    <span className={statusClassName}>
      {t(`inspections.sections.inspectionStatus.${section.status}`)}
    </span>
  )
} 