"use client"

import { useState, useEffect, useMemo } from "react"
import { useI18n } from "@/lib/i18n/context"
import { DbVehicle, MaintenanceTask, Inspection } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, ClipboardCheck, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils/formatting"
import { useSupabase } from "@/components/providers/supabase-provider";
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface VehicleInProgressProps {
  vehicle: DbVehicle
}

// Simpler InProgressItem types
type InProgressMaintenanceTask = MaintenanceTask & { record_type: 'maintenance' };
type InProgressInspection = Inspection & { record_type: 'inspection' };

type InProgressItem = InProgressMaintenanceTask | InProgressInspection;

// Helper function to safely get the timestamp for sorting
function getItemTimestamp(item: InProgressItem): number {
  if (item.record_type === 'maintenance') {
    return new Date(item.created_at).getTime();
  } else { // Inspection
    return new Date(item.updated_at).getTime();
  }
}

export function VehicleInProgress({ vehicle }: VehicleInProgressProps) {
  const { t } = useI18n()
  const [inProgressItems, setInProgressItems] = useState<InProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const supabase = useSupabase();

  // Memoize filtered items
  const maintenanceItems = useMemo(() => 
    inProgressItems.filter((item): item is InProgressMaintenanceTask => item.record_type === 'maintenance'),
    [inProgressItems]
  );

  const inspectionItems = useMemo(() =>
    inProgressItems.filter((item): item is InProgressInspection => item.record_type === 'inspection'),
    [inProgressItems]
  );

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get in-progress inspections
      const { data: inspections, error: inspectionsError } = await supabase
        .from('inspections')
        .select<'*', Inspection>('*') // Explicitly type the selection
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false })

      if (inspectionsError) {
        console.error('Error fetching in-progress inspections:', inspectionsError);
        throw inspectionsError;
      }
      
      // Get in-progress maintenance tasks
      const { data: maintenanceTasks, error: maintenanceError } = await supabase
        .from('maintenance_tasks')
        .select<'*', MaintenanceTask>('*') // Explicitly type the selection
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'in_progress')

      if (maintenanceError) {
        console.error('Error fetching in-progress maintenance tasks:', maintenanceError);
        throw maintenanceError;
      }
      
      // Format the data with record types
      const formattedInspections: InProgressInspection[] = (inspections || []).map(inspection => ({
        ...inspection,
        record_type: 'inspection' as const
      }));
      
      const formattedMaintenance: InProgressMaintenanceTask[] = (maintenanceTasks || []).map(task => ({
        ...task,
        record_type: 'maintenance' as const
      }));
      
      // Combine and sort by updated_at/created_at
      const combined = [...formattedInspections, ...formattedMaintenance]
        .sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a));
      
      setInProgressItems(combined)
    } catch (error) {
      console.error('Error loading in-progress items:', error)
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    loadData()
  }, [vehicle.id, supabase])

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
          ) : maintenanceItems.length > 0 ? (
            <div className="space-y-4">
              {maintenanceItems
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
                        {/* Use created_at directly for maintenance */}
                        {formatDate(item.created_at)}
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
          ) : inspectionItems.length > 0 ? (
            <div className="space-y-4">
              {inspectionItems
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
                          {/* Use item.type directly from Inspection type */}
                          {item.type ? t(`inspections.type.${item.type}`) : t('inspections.defaultType')}
                        </span>
                        <Badge variant="warning">
                          {t('inspections.status.in_progress')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                         {/* Use updated_at directly for inspection */}
                        {formatDate(item.updated_at)}
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