"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"

interface Activity {
  id: string
  type: 'maintenance' | 'fuel' | 'mileage'
  vehicleName: string
  description: string
  date: string
  cost?: number
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    async function fetchRecentActivity() {
      // Get all vehicles first for reference
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, name')

      const vehicleMap = new Map(vehicles?.map(v => [v.id, v.name]) || [])

      // Fetch recent maintenance tasks
      const { data: maintenance } = await supabase
        .from('maintenance_tasks')
        .select('id, vehicle_id, title, completed_date, cost')
        .order('completed_date', { ascending: false })
        .limit(5)

      // Get recent fuel logs
      const { data: fuelEntries, error: fuelError } = await supabase
        .from('fuel_entries')
        .select('*, vehicles(name)')
        .order('date', { ascending: false })
        .limit(5)

      if (fuelError) throw fuelError

      // Get recent mileage logs
      const { data: mileageEntries, error: mileageError } = await supabase
        .from('mileage_entries')
        .select('*, vehicles(name)')
        .order('date', { ascending: false })
        .limit(5)

      if (mileageError) throw mileageError

      // Combine and format all activities
      const allActivities: Activity[] = [
        ...(maintenance?.map(task => ({
          id: task.id,
          type: 'maintenance' as const,
          vehicleName: vehicleMap.get(task.vehicle_id) || 'Unknown Vehicle',
          description: task.title,
          date: task.completed_date,
          cost: task.cost
        })) || []),
        ...(fuelEntries?.map(entry => ({
          id: entry.id,
          type: 'fuel' as const,
          vehicleName: vehicleMap.get(entry.vehicle_id) || 'Unknown Vehicle',
          description: `Refueled ${entry.liters}L`,
          date: entry.date,
          cost: entry.cost
        })) || []),
        ...(mileageEntries?.map(entry => ({
          id: entry.id,
          type: 'mileage' as const,
          vehicleName: vehicleMap.get(entry.vehicle_id) || 'Unknown Vehicle',
          description: `Mileage updated to ${entry.reading}km`,
          date: entry.date
        })) || [])
      ]

      // Sort by date and take the most recent 10
      const sortedActivities = allActivities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)

      setActivities(sortedActivities)
    }

    fetchRecentActivity()
  }, [])

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">
              {activity.vehicleName}
            </p>
            <p className="text-sm text-muted-foreground">
              {activity.description}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm">
              {format(new Date(activity.date), 'MMM d, yyyy')}
            </p>
            {activity.cost && (
              <p className="text-sm text-muted-foreground">
                ${activity.cost.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 