"use client"


interface ScheduleDisplayProps {
  schedule: {
    status: 'scheduled' | 'inProgress' | 'completed' | 'cancelled' | 'overdue'
  }
}

export function ScheduleDisplay({ schedule }: ScheduleDisplayProps) {

  return (
    <span className={`schedule-status ${
      schedule.status === 'completed' 
        ? 'bg-green-500/10 text-green-500'
        : schedule.status === 'overdue'
          ? 'bg-red-500/10 text-red-500'
          : 'bg-blue-500/10 text-blue-500'
    }`}>
    {schedule.status}
    </span>
  )
} 