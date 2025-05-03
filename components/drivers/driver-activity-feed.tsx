"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Clock, Car, Wrench, FileText, ExternalLink } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { formatDate } from "@/lib/utils/formatting"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Activity {
  id: string
  type: "inspection" | "maintenance" | "vehicle_assignment"
  date: string
  title: string
  description: string
  link: string
}

interface DriverActivityFeedProps {
  driverId: string
  limit?: number
}

export function DriverActivityFeed({ driverId, limit }: DriverActivityFeedProps) {
  const { t } = useI18n()
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadActivities() {
      setIsLoading(true)
      
      try {
        // Get inspections
        const { data: inspections, error: inspectionError } = await supabase
          .from('inspections')
          .select(`
            id,
            date,
            type,
            status,
            vehicle:vehicles (
              id,
              name
            )
          `)
          .eq('driver_id', driverId)
          .order('date', { ascending: false })
          .limit(limit || 50)

        if (inspectionError) throw inspectionError

        // Get vehicle IDs assigned to this driver from the vehicle_assignments table
        const { data: vehicleAssignments, error: assignmentError } = await supabase
          .from('vehicle_assignments')
          .select('vehicle_id')
          .eq('driver_id', driverId)
          .eq('status', 'active')

        if (assignmentError) throw assignmentError

        let maintenanceTasks: any[] = []
        if (vehicleAssignments && vehicleAssignments.length > 0) {
          const vehicleIds = vehicleAssignments.map(v => v.vehicle_id)
          
          // Get details of assigned vehicles
          const { data: vehicles, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id, name')
            .in('id', vehicleIds)
            
          if (vehicleError) throw vehicleError
          
          // Get maintenance tasks for assigned vehicles
          const { data: maintenance, error: maintenanceError } = await supabase
            .from('maintenance_tasks')
            .select(`
              id,
              title,
              due_date,
              status,
              vehicle:vehicles (
                id,
                name
              )
            `)
            .in('vehicle_id', vehicleIds)
            .order('due_date', { ascending: false })
            .limit(limit || 50)

          if (maintenanceError) throw maintenanceError
          maintenanceTasks = maintenance || []
        }

        // Combine activities
        const allActivities = [
          // Map inspections to activities
          ...(inspections || []).map(inspection => ({
            id: `inspection-${inspection.id}`,
            type: "inspection" as const,
            date: inspection.date,
            title: t(`inspections.type.${inspection.type}`),
            description: `${t("maintenance.fields.vehicle")}: ${inspection.vehicle?.name}`,
            link: `/inspections/${inspection.id}`
          })),
          
          // Map maintenance tasks to activities
          ...maintenanceTasks.map(task => ({
            id: `maintenance-${task.id}`,
            type: "maintenance" as const,
            date: task.due_date,
            title: task.title,
            description: `${t("maintenance.fields.vehicle")}: ${task.vehicle?.name}`,
            link: `/maintenance/${task.id}`
          }))
        ]

        // Sort by date descending
        allActivities.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        // Apply limit if specified
        setActivities(limit ? allActivities.slice(0, limit) : allActivities)
      } catch (error) {
        console.error("Error loading activities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadActivities()
  }, [driverId, limit, t])

  if (isLoading) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        {t("common.loading")}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t("drivers.recentActivity.title")}</CardTitle>
        <CardDescription>{t("drivers.recentActivity.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-muted/30 rounded-lg min-h-[150px]">
             <Clock className="h-10 w-10 text-muted-foreground mb-3" />
             <h3 className="text-lg font-medium mb-1">{t("drivers.activity.empty.title")}</h3>
             <p className="text-muted-foreground text-sm">
               {t("drivers.activity.empty.description")}
             </p>
           </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={activity.link} passHref
                className="block p-3 sm:p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors" 
              >
                <div className="flex items-start gap-3 justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {activity.type === "inspection" && (
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        )}
                        {activity.type === "maintenance" && (
                          <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        )}
                        {activity.type === "vehicle_assignment" && (
                          <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{activity.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end flex-shrink-0 ml-2 sm:ml-4">
                    <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(activity.date)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 