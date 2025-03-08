"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { DbVehicle, MaintenanceTask, Inspection } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, ClipboardCheck, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils/formatting"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface VehicleInProgressProps {
  vehicle: DbVehicle
}

type InProgressItem = 
  | (MaintenanceTask & { record_type: 'maintenance' })
  | (Inspection & { record_type: 'inspection' });

// Helper function to safely get the timestamp for sorting
function getItemTimestamp(item: any): number {
  if (item.record_type === 'maintenance') {
    return new Date(item.created_at).getTime();
  } else {
    return new Date(item.updated_at).getTime();
  }
}

export function VehicleInProgress({ vehicle }: VehicleInProgressProps) {
  const { t } = useI18n()
  const [inProgressItems, setInProgressItems] = useState<InProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get in-progress inspections
      const { data: inspections, error: inspectionsError } = await supabase
        .from('inspections')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false })

      if (inspectionsError) {
        console.error('Error fetching in-progress inspections:', inspectionsError);
        throw inspectionsError;
      }
      console.log('In-progress inspections:', inspections);
      
      // Get in-progress maintenance tasks
      const { data: maintenanceTasks, error: maintenanceError } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })

      if (maintenanceError) {
        console.error('Error fetching in-progress maintenance tasks:', maintenanceError);
        throw maintenanceError;
      }
      console.log('In-progress maintenance tasks:', maintenanceTasks);
      
      // Format the data with record types
      const formattedInspections = (inspections || []).map(inspection => ({
        ...inspection,
        record_type: 'inspection' as const
      }));
      
      const formattedMaintenance = (maintenanceTasks || []).map(task => ({
        ...task,
        record_type: 'maintenance' as const
      }));
      
      // Combine and sort by updated_at/created_at
      const combined = [...formattedInspections, ...formattedMaintenance]
        .sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));
      
      console.log('Combined in-progress items:', combined);
      setInProgressItems(combined)
    } catch (error) {
      console.error('Error loading in-progress items:', error)
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    loadData()
  }, [vehicle.id])

  // Function to navigate to the appropriate page based on item type
  const handleItemClick = (item: InProgressItem) => {
    if (item.record_type === 'maintenance') {
      router.push(`/maintenance/${item.id}`)
    } else {
      router.push(`/inspections/${item.id}/perform`)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            {t('vehicles.inProgress.maintenanceTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : inProgressItems.filter(item => item.record_type === 'maintenance').length > 0 ? (
            <div className="space-y-4">
              {inProgressItems
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
                        <Badge variant="warning">
                          {t('maintenance.status.in_progress')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(
                          (item as any).record_type === 'maintenance' 
                            ? (item as any).created_at 
                            : (item as any).updated_at
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              {t('vehicles.inProgress.noMaintenanceTasks')}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            {t('vehicles.inProgress.inspectionsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : inProgressItems.filter(item => item.record_type === 'inspection').length > 0 ? (
            <div className="space-y-4">
              {inProgressItems
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
                        <Badge variant="warning">
                          {t('inspections.status.in_progress')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(
                          (item as any).record_type === 'maintenance' 
                            ? (item as any).created_at 
                            : (item as any).updated_at
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              {t('vehicles.inProgress.noInspections')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 