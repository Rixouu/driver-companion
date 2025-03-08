"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { useState } from "react"
import { Edit, Car } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase/client"
import { VehicleTabs } from "./vehicle-tabs"
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicle.id)

      if (error) throw error

      toast({
        title: t("vehicles.messages.deleteSuccess"),
      })

      router.push("/vehicles")
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast({
        title: t("vehicles.messages.deleteError"),
        description: error?.message || t("vehicles.messages.hasAssociatedRecords"),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Header with Muted Background */}
      <div className="relative rounded-xl overflow-hidden border bg-card shadow-sm">
        <div className="relative z-10 p-4 md:p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold">{vehicle.name}</h1>
              </div>
              <p className="text-muted-foreground text-base md:text-lg">{vehicle.plate_number}</p>
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
            
            {/* Desktop Actions */}
            <div className="hidden md:flex">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/vehicles/${vehicle.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </Button>
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/vehicles/${vehicle.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">{t('common.edit')}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Vehicle Tabs */}
      <VehicleTabs vehicle={vehicle} />

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
              onClick={handleDelete}
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