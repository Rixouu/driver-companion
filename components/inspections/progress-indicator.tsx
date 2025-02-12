"use client"

import { useLanguage } from "@/components/providers/language-provider"

interface ProgressIndicatorProps {
  progress: {
    status: string
    count?: number
    total?: number
  }
}

export function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const { t } = useLanguage()

  return (
    <div className="progress-text">
      {t(`inspections.start.progress.progressStatus.${progress.status}`, {
        count: progress.count || 0,
        total: progress.total || 0
      })}
    </div>
  )
} 