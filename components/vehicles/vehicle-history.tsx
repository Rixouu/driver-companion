"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { DbVehicle, DbInspection, MaintenanceTask, Inspection } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { History, ClipboardCheck, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils/formatting"
import { supabase } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface VehicleHistoryProps {
  vehicle: DbVehicle
}

type HistoryItem = 
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

export function VehicleHistory({ vehicle }: VehicleHistoryProps) {
  const { t } = useI18n()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get completed inspections
      const { data: inspections, error: inspectionsError } = await supabase
        .from('inspections')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(10)

      if (inspectionsError) {
        console.error('Error fetching completed inspections:', inspectionsError);
        throw inspectionsError;
      }
      console.log('Completed inspections:', inspections);
      
      // Get completed maintenance tasks
      const { data: maintenanceTasks, error: maintenanceError } = await supabase
        .from('maintenance_tasks')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)

      if (maintenanceError) {
        console.error('Error fetching completed maintenance tasks:', maintenanceError);
        throw maintenanceError;
      }
      console.log('Completed maintenance tasks:', maintenanceTasks);
      
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
        .sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a))
        .slice(0, 10); // Limit to 10 most recent items
      
      console.log('Combined history items:', combined);
      setHistory(combined)
    } catch (error) {
      console.error('Error loading vehicle history:', error)
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    loadData()
  }, [vehicle.id])

  // Function to navigate to the appropriate page based on item type
  const handleItemClick = (item: HistoryItem) => {
    if (item.record_type === 'maintenance') {
      router.push(`/maintenance/${item.id}`)
    } else {
      router.push(`/inspections/${item.id}`)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            {t('vehicles.history.maintenanceTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : history.filter(item => item.record_type === 'maintenance').length > 0 ? (
            <div className="space-y-4">
              {history
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
                        <Badge variant="success">
                          {t('maintenance.status.completed')}
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
              {t('vehicles.history.noMaintenanceRecords')}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            {t('vehicles.history.inspectionTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : history.filter(item => item.record_type === 'inspection').length > 0 ? (
            <div className="space-y-4">
              {history
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
                        <Badge variant="success">
                          {t('inspections.status.completed')}
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
              {t('vehicles.history.noInspectionRecords')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 