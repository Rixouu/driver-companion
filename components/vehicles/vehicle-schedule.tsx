"use client"

import { useState, useEffect, useMemo } from "react"
import { useI18n } from "@/lib/i18n/context"
import { DbVehicle, MaintenanceTask, Inspection } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, ClipboardCheck, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils/formatting"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface VehicleScheduleProps {
  vehicle: DbVehicle
}

// Refined ScheduledItem types
type ScheduledMaintenanceTask = MaintenanceTask & { record_type: 'maintenance' };
type ScheduledInspection = Inspection & { record_type: 'inspection' }; // Assuming Inspection type has a 'date' field for scheduled items
type ScheduledItem = ScheduledMaintenanceTask | ScheduledInspection;

// Helper function to get the date for sorting
function getItemSortDate(item: ScheduledItem): number {
  if (item.record_type === 'inspection') {
    // Ensure item.date is valid; might need a check or rely on type guarantees
    return new Date(item.date || Date.now()).getTime(); // Fallback to Date.now() if item.date is null/undefined - review if this is intended for sorting past items without dates
  } else { // MaintenanceTask
    return new Date(item.due_date).getTime();
  }
}

export function VehicleSchedule({ vehicle }: VehicleScheduleProps) {
  const { t } = useI18n()
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const supabase = useSupabase()

  // Memoize filtered items
  const scheduledMaintenance = useMemo(() => 
    scheduledItems.filter((item): item is ScheduledMaintenanceTask => item.record_type === 'maintenance'),
    [scheduledItems]
  );

  const scheduledInspections = useMemo(() =>
    scheduledItems.filter((item): item is ScheduledInspection => item.record_type === 'inspection'),
    [scheduledItems]
  );

  const loadData = async () => {
    try {
      setLoading(true)
      
      const { data: inspections, error: inspectionsError } = await supabase
        .from('inspections')
        .select<'*', Inspection>('*')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'scheduled')
        .order('date', { ascending: true })

      if (inspectionsError) {
        console.error('Error fetching scheduled inspections:', inspectionsError);
        throw inspectionsError;
      }
      
      const { data: maintenanceTasks, error: maintenanceError } = await supabase
        .from('maintenance_tasks')
        .select<'*', MaintenanceTask>('*')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'scheduled')
        .order('due_date', { ascending: true })

      if (maintenanceError) {
        console.error('Error fetching scheduled maintenance tasks:', maintenanceError);
        throw maintenanceError;
      }
      
      const formattedInspections: ScheduledInspection[] = (inspections || []).map(i => ({
        ...i,
        record_type: 'inspection' as const
      }));
      
      const formattedMaintenance: ScheduledMaintenanceTask[] = (maintenanceTasks || []).map(task => ({
        ...task,
        record_type: 'maintenance' as const
      }));
      
      const combined = [...formattedInspections, ...formattedMaintenance]
        .sort((a, b) => getItemSortDate(a) - getItemSortDate(b));
      
      setScheduledItems(combined)
    } catch (error) {
      console.error('Error loading scheduled items:', error)
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle.id, supabase])

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
          <Link href={`/maintenance/schedule?vehicle_id=${vehicle.id}`} ><span className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              {t('maintenance.schedule.title')}
            </Button>
          </span></Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : scheduledMaintenance.length > 0 ? (
            <div className="space-y-4">
              {scheduledMaintenance
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
                        {t('maintenance.details.scheduledFor', { date: formatDate(item.due_date) })}
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
          <Link href={`/vehicles/${vehicle.id}/inspections/schedule`} ><span className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              {t('vehicles.tabs.scheduleInspection')}
            </Button>
          </span></Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : scheduledInspections.length > 0 ? (
            <div className="space-y-4">
              {scheduledInspections
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
                          {item.type ? t(`inspections.type.${item.type}`) : t('inspections.defaultType')}
                        </span>
                        <Badge variant="secondary">
                          {t('inspections.status.scheduled')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('inspections.details.scheduledFor', { date: formatDate(item.date) })}
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
  );
}