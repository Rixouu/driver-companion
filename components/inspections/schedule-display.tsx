"use client"

import { useLanguage } from "@/components/providers/language-provider"

interface ScheduleDisplayProps {
  schedule: {
    status: 'scheduled' | 'inProgress' | 'completed' | 'cancelled' | 'overdue'
  }
}

export function ScheduleDisplay({ schedule }: ScheduleDisplayProps) {
  const { t } = useLanguage()

  return (
    <span className={`schedule-status ${
      schedule.status === 'completed' 
        ? 'bg-green-500/10 text-green-500'
        : schedule.status === 'overdue'
          ? 'bg-red-500/10 text-red-500'
          : 'bg-blue-500/10 text-blue-500'
    }`}>
      {t(`inspections.schedule.scheduleStatus.${schedule.status}`)}
    </span>
  )
} 