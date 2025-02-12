"use client"

import { useLanguage } from "@/components/providers/language-provider"

interface SectionItemProps {
  item: {
    status: 'passed' | 'failed' | 'na' | 'pending'
  }
}

export function SectionItem({ item }: SectionItemProps) {
  const { t } = useLanguage()

  return (
    <span className="status-badge">
      {t(`inspections.sections.sectionItemStatus.${item.status}`)}
    </span>
  )
} 