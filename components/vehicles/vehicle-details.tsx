"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DbVehicle } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/context"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VehicleInfo } from "@/components/vehicles/vehicle-info"
import { VehicleSchedule } from "@/components/vehicles/vehicle-schedule"
import { VehicleHistory } from "@/components/vehicles/vehicle-history"
import { VehicleInProgress } from "./vehicle-in-progress"
import { 
  Edit, 
  Trash2, 
  AlertCircle, 
  Info, 
  Calendar, 
  History, 
  ArrowLeft,
  Car,
  Play
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface VehicleDetailsProps {
  vehicle: DbVehicle
}

export function VehicleDetails({ vehicle }: VehicleDetailsProps) {
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("info")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Log vehicle data for debugging
  console.log('Vehicle details:', vehicle);
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      
      // Check if vehicle has associated inspections or maintenance tasks
      const { data: inspections, error: inspectionsError } = await supabase
        .from('inspections')
        .select('id')
        .eq('vehicle_id', vehicle.id)
        .limit(1)
      
      if (inspectionsError) throw inspectionsError
      
      const { data: maintenanceTasks, error: maintenanceError } = await supabase
        .from('maintenance_tasks')
        .select('id')
        .eq('vehicle_id', vehicle.id)
        .limit(1)
        
      if (maintenanceError) throw maintenanceError
      
      // If vehicle has associated records, show warning
      if ((inspections && inspections.length > 0) || (maintenanceTasks && maintenanceTasks.length > 0)) {
        toast({
          title: t('vehicles.messages.deleteError'),
          description: t('vehicles.messages.hasAssociatedRecords'),
          variant: "destructive",
        })
        return
      }
      
      // Delete the vehicle
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicle.id)
        
      if (error) throw error
      
      toast({
        title: t('vehicles.messages.deleteSuccess'),
      })
      
      // Redirect to vehicles list
      router.push('/vehicles')
      router.refresh()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      toast({
        title: t('vehicles.messages.error'),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Vehicle Header with Muted Background */}
      <div className="relative rounded-xl overflow-hidden border bg-card shadow-sm">
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <h1 className="text-3xl font-bold">{vehicle.name}</h1>
            </div>
            <p className="text-muted-foreground text-lg">{vehicle.plate_number}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline">
                {vehicle.brand || 'N/A'} {vehicle.model || ''}
              </Badge>
              {vehicle.year && (
                <Badge variant="outline">
                  {vehicle.year}
                </Badge>
              )}
              <Badge variant={vehicle.status === 'active' ? 'success' : vehicle.status === 'maintenance' ? 'warning' : 'secondary'}>
                {t(`vehicles.status.${vehicle.status || 'active'}`)}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/vehicles/${vehicle.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Vehicle Tabs - Full Width */}
      <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="info" className="flex items-center gap-1">
            <Info className="h-4 w-4" />
            {t('vehicles.tabs.info')}
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {t('vehicles.tabs.schedule')}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="flex items-center gap-1">
            <Play className="h-4 w-4" />
            {t('vehicles.tabs.inProgress')}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1">
            <History className="h-4 w-4" />
            {t('vehicles.tabs.history')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="space-y-4">
          <VehicleInfo vehicle={vehicle} />
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-4">
          <VehicleSchedule vehicle={vehicle} />
        </TabsContent>
        
        <TabsContent value="in_progress" className="space-y-4">
          <VehicleInProgress vehicle={vehicle} />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <VehicleHistory vehicle={vehicle} />
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('vehicles.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('vehicles.deleteDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 