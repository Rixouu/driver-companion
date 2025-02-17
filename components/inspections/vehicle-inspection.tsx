"use client"


interface VehicleInspectionProps {
  check: {
    status: 'passed' | 'failed' | 'na'
  }
}

export function VehicleInspection({ check }: VehicleInspectionProps) {

  return (
    <span className={`check-status ${
      check.status === 'passed' 
        ? 'bg-green-500/10 text-green-500' 
        : check.status === 'failed'
          ? 'bg-red-500/10 text-red-500'
          : 'bg-gray-500/10 text-gray-500'
    }`}>
      {check.status}
    </span>
  )
} 