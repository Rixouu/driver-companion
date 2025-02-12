"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Badge } from "@/components/ui/badge"

interface MaintenanceScheduleProps {
  vehicleId?: string
}

export function MaintenanceSchedule({ vehicleId }: MaintenanceScheduleProps) {
  const { t } = useLanguage()

  const tasks = [
    { id: 1, status: 'scheduled' },
    { id: 2, status: 'inProgress' },
    { id: 3, status: 'completed' },
    { id: 4, status: 'cancelled' },
    { id: 5, status: 'overdue' }
  ]

  return (
    <div className="space-y-2">
      {tasks.map(task => (
        <Badge 
          key={task.id}
          className={`mr-2 ${
            task.status === 'completed' 
              ? 'bg-green-500/10 text-green-500'
              : task.status === 'overdue'
                ? 'bg-red-500/10 text-red-500'
                : 'bg-blue-500/10 text-blue-500'
          }`}
        >
          {t(`inspections.maintenanceSchedule.maintenanceStatus.${task.status}`)}
        </Badge>
      ))}
    </div>
  )
} 