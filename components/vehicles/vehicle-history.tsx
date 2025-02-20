"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { DbVehicle } from "@/types"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

interface VehicleHistoryProps {
  vehicle: DbVehicle
}

interface MaintenanceHistory {
  id: string
  title: string
  completed_date: string
  status: string
}

interface InspectionHistory {
  id: string
  schedule_type: string
  date: string
  status: string
}

export function VehicleHistory({ vehicle }: VehicleHistoryProps) {
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceHistory[]>([])
  const [inspectionHistory, setInspectionHistory] = useState<InspectionHistory[]>([])

  useEffect(() => {
    async function fetchHistory() {
      // Fetch completed maintenance tasks
      const { data: maintenanceTasks } = await supabase
        .from('maintenance_tasks')
        .select('id, title, completed_date, status')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'completed')
        .order('completed_date', { ascending: false })

      if (maintenanceTasks) {
        setMaintenanceHistory(maintenanceTasks)
      }

      // Fetch completed inspections
      const { data: inspections } = await supabase
        .from('inspections')
        .select('id, schedule_type, date, status')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'completed')
        .order('date', { ascending: false })

      if (inspections) {
        setInspectionHistory(inspections)
      }
    }

    fetchHistory()
  }, [vehicle.id])

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Maintenance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {maintenanceHistory.map((task) => (
              <Link 
                key={task.id} 
                href={`/maintenance/${task.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                  <div className="space-y-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Completed on {formatDate(task.completed_date)}
                    </p>
                  </div>
                  <Badge variant="success">Completed</Badge>
                </div>
              </Link>
            ))}
            {maintenanceHistory.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No maintenance history found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Inspection History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inspectionHistory.map((inspection) => (
              <Link 
                key={inspection.id} 
                href={`/inspections/${inspection.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                  <div className="space-y-1">
                    <p className="font-medium">{inspection.schedule_type} Inspection</p>
                    <p className="text-sm text-muted-foreground">
                      Completed on {formatDate(inspection.date)}
                    </p>
                  </div>
                  <Badge variant="success">Completed</Badge>
                </div>
              </Link>
            ))}
            {inspectionHistory.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No inspection history found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 