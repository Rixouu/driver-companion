"use client"

import { useLanguage } from "@/components/providers/language-provider"

interface ItemStatusProps {
  item: {
    status: 'passed' | 'failed' | 'na' | 'pending'
  }
}

export function ItemStatus({ item }: ItemStatusProps) {
  const { t } = useLanguage()

  const statusClassName = `status-badge ${
    item.status === 'passed' 
      ? 'bg-green-500/10 text-green-500' 
      : item.status === 'failed'
        ? 'bg-red-500/10 text-red-500'
        : 'bg-gray-500/10 text-gray-500'
  }`

  return (
    <span className={statusClassName}>
      {t(`inspections.itemStatus.${item.status}`)}
    </span>
  )
} 