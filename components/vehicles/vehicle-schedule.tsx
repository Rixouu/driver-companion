"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { DbVehicle, DbInspection, MaintenanceTask, Inspection } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, ClipboardCheck, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils/formatting"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface VehicleScheduleProps {
  vehicle: DbVehicle
}

type ScheduledItem = 
  | (MaintenanceTask & { record_type: 'maintenance' })
  | (Inspection & { record_type: 'inspection' });

export function VehicleSchedule({ vehicle }: VehicleScheduleProps) {
  const { t } = useI18n()
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get scheduled inspections
      const { data: inspections, error: inspectionsError } = await supabase
        .from('inspections')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'scheduled')
        .order('date', { ascending: true })

      if (inspectionsError) {
        console.error('Error fetching scheduled inspections:', inspectionsError);
        throw inspectionsError;
      }
      console.log('Scheduled inspections:', inspections);
      
      // Get scheduled maintenance tasks
      const { data: maintenanceTasks, error: maintenanceError } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'scheduled')
        .order('due_date', { ascending: true })

      if (maintenanceError) {
        console.error('Error fetching scheduled maintenance tasks:', maintenanceError);
        throw maintenanceError;
      }
      console.log('Scheduled maintenance tasks:', maintenanceTasks);
      
      // Format the data with record types
      const formattedInspections = (inspections || []).map(inspection => ({
        ...inspection,
        record_type: 'inspection' as const
      }));
      
      const formattedMaintenance = (maintenanceTasks || []).map(task => ({
        ...task,
        record_type: 'maintenance' as const
      }));
      
      // Combine and sort by date
      const combined = [...formattedInspections, ...formattedMaintenance]
        .sort((a, b) => {
          const dateA = a.record_type === 'inspection' 
            ? new Date((a as any).date || Date.now()).getTime() 
            : new Date(a.due_date).getTime();
          const dateB = b.record_type === 'inspection' 
            ? new Date((b as any).date || Date.now()).getTime() 
            : new Date(b.due_date).getTime();
          return dateA - dateB;
        });
      
      console.log('Combined scheduled items:', combined);
      setScheduledItems(combined)
    } catch (error) {
      console.error('Error loading scheduled items:', error)
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    loadData()
  }, [vehicle.id])

  // Function to navigate to the appropriate page based on item type
  const handleItemClick = (item: ScheduledItem) => {
    if (item.record_type === 'maintenance') {
      router.push(`/maintenance/${item.id}`)
    } else {
      router.push(`/inspections/${item.id}`)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            {t('vehicles.schedule.maintenanceTitle')}
          </CardTitle>
          <Link href={`/maintenance/schedule?vehicle_id=${vehicle.id}`}>
            <Button size="sm" variant="outline">
              {t('maintenance.schedule.title')}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : scheduledItems.filter(item => item.record_type === 'maintenance').length > 0 ? (
            <div className="space-y-4">
              {scheduledItems
                .filter(item => item.record_type === 'maintenance')
                .map((item) => (
                  <div 
                    key={`${item.record_type}-${item.id}`} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-primary" />
                        <span className="font-medium">{item.title}</span>
                        <Badge variant="secondary">
                          {t('maintenance.status.scheduled')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('maintenance.details.scheduledFor', { date: formatDate((item as any).due_date) })}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              {t('vehicles.schedule.noMaintenanceTasks')}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            {t('vehicles.schedule.inspectionsTitle')}
          </CardTitle>
          <Link href={`/vehicles/${vehicle.id}/inspections/schedule`}>
            <Button size="sm" variant="outline">
              {t('vehicles.tabs.scheduleInspection')}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : scheduledItems.filter(item => item.record_type === 'inspection').length > 0 ? (
            <div className="space-y-4">
              {scheduledItems
                .filter(item => item.record_type === 'inspection')
                .map((item) => (
                  <div 
                    key={`${item.record_type}-${item.id}`} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                        <span className="font-medium">
                          {(item as any).type || t('inspections.defaultType')}
                        </span>
                        <Badge variant="secondary">
                          {t('inspections.status.scheduled')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.record_type === 'inspection'
                          ? t('inspections.details.scheduledFor', { date: formatDate((item as any).date) })
                          : t('maintenance.details.scheduledFor', { date: formatDate((item as any).due_date) })
                        }
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              {t('vehicles.schedule.noInspections')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}