"use client"

import { useLanguage } from "@/components/providers/language-provider"

interface ValidationDisplayProps {
  item: {
    status: 'passed' | 'failed' | 'na'
  }
}

export function ValidationDisplay({ item }: ValidationDisplayProps) {
  const { t } = useLanguage()

  return (
    <span className={`status-badge ${
      item.status === 'passed' 
        ? 'bg-green-500/10 text-green-500' 
        : item.status === 'failed'
          ? 'bg-red-500/10 text-red-500'
          : 'bg-gray-500/10 text-gray-500'
    }`}>
      {t(`inspections.validation.validationStatus.${item.status}`)}
    </span>
  )
} 