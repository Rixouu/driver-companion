"use client"

import Link from "next/link"
import Image from "next/image"
import { Car, Trash2, Eye } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { unassignVehicleFromDriverAction } from "@/app/actions/drivers" // Corrected import path (assuming it exists here)
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Update prop type to include vehicle status
interface AssignedVehicle {
  id: string
  name: string
  plate_number: string
  image_url?: string
  brand?: string
  model?: string
  status?: 'active' | 'maintenance' | 'inactive' | string // Add status
}

interface DriverVehiclesProps {
  driverId: string
  assignedVehicles?: AssignedVehicle[]
  onUnassignSuccess?: () => void // Callback after unassigning
}

export function DriverVehicles({ 
  driverId, 
  assignedVehicles = [],
  onUnassignSuccess
}: DriverVehiclesProps) {
  const { t } = useI18n()
  const [isUnassigning, setIsUnassigning] = useState<string | null>(null) // Track which vehicle is being unassigned

  const handleUnassign = async (vehicleId: string) => {
    setIsUnassigning(vehicleId)
    try {
      const result = await unassignVehicleFromDriverAction(driverId, vehicleId)
      if (result.success) {
        toast({ title: t("drivers.messages.unassignSuccess"), description: result.message })
        if (onUnassignSuccess) {
          onUnassignSuccess() // Trigger refresh in parent component
        }
      } else {
        toast({ title: t("common.error"), description: result.message, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: t("common.error"), description: t("drivers.messages.unassignErrorDescription"), variant: "destructive" })
    } finally {
      setIsUnassigning(null)
    }
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="success">{t('vehicles.status.active')}</Badge>;
      case 'maintenance':
        return <Badge variant="warning">{t('vehicles.status.maintenance')}</Badge>;
      case 'inactive':
        return <Badge variant="secondary">{t('vehicles.status.inactive')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{t("drivers.vehicles.title")}</CardTitle>
          <CardDescription>{t("drivers.vehicles.description")}</CardDescription>
        </div>
        <Link href={`/drivers/${driverId}/assign-vehicle`} passHref>
          <Button variant="outline" size="sm">
            <Car className="mr-2 h-4 w-4" />
            {t("drivers.actions.assignVehicle")}
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-4">
        {assignedVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-muted/30 rounded-lg min-h-[150px]">
             <p className="text-sm text-muted-foreground mb-4">
               {t("drivers.vehicles.noVehicles")}
             </p>
             <Link href={`/drivers/${driverId}/assign-vehicle`} passHref>
               <Button className="mt-2">
                 <Car className="mr-2 h-4 w-4" />
                 {t("drivers.actions.assignVehicle")}
               </Button>
             </Link>
           </div>
        ) : (
          <div className="space-y-4">
            {assignedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 border rounded-lg gap-4">
                <div className="w-full sm:w-24 h-auto flex-shrink-0">
                  <div className="aspect-video relative rounded-md overflow-hidden bg-muted">
                    {vehicle.image_url ? (
                      <Image
                        src={vehicle.image_url}
                        alt={vehicle.name}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 30vw, 150px" // Adjusted sizes for mobile
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full bg-muted">
                        <Car className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between h-full mt-2 sm:mt-0 w-full">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-1">
                    <h4 className="font-medium text-md mb-1 sm:mb-0 truncate">{vehicle.name}</h4>
                    {getStatusBadge(vehicle.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 sm:mb-0">
                    {t('vehicles.fields.plateNumber')}: {vehicle.plate_number}
                  </p>
                  <div className="flex items-center gap-2 mt-2 sm:mt-auto self-start sm:self-end">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/vehicles/${vehicle.id}`} className="flex items-center gap-1">
                        <Eye className="h-3 w-3"/> {t('common.view')}
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline"
                          size="sm" 
                          className="flex items-center gap-1 text-destructive hover:text-destructive border-destructive/50 hover:border-destructive/80 dark:text-red-500 dark:border-red-500/50 dark:hover:border-red-500/80 dark:hover:bg-red-900/20"
                          disabled={isUnassigning === vehicle.id}
                        > 
                          <Trash2 className="h-3 w-3"/> 
                          {isUnassigning === vehicle.id ? t('common.deleting') : t('drivers.actions.unassignVehicle') }
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('drivers.unassignVehicle.confirm')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('drivers.unassignVehicle.confirmDescription')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleUnassign(vehicle.id)} disabled={isUnassigning === vehicle.id}>
                            {isUnassigning === vehicle.id ? t('common.deleting') : t('drivers.actions.unassignVehicle')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 