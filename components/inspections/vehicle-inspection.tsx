"use client"

import { useLanguage } from "@/components/providers/language-provider"

interface VehicleInspectionProps {
  check: {
    status: 'passed' | 'failed' | 'na'
  }
}

export function VehicleInspection({ check }: VehicleInspectionProps) {
  const { t } = useLanguage()

  return (
    <span className={`check-status ${
      check.status === 'passed' 
        ? 'bg-green-500/10 text-green-500' 
        : check.status === 'failed'
          ? 'bg-red-500/10 text-red-500'
          : 'bg-gray-500/10 text-gray-500'
    }`}>
      {t(`inspections.vehicleInspection.checkStatus.${check.status}`)}
    </span>
  )
} 