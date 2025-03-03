"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import Image from "next/image"
import { DbVehicle } from "@/types"
import { 
  Car, 
  Calendar, 
  Hash, 
  Truck, 
  Tag, 
  FileText, 
  Layers,
  CircleDot
} from "lucide-react"

interface VehicleInfoProps {
  vehicle: DbVehicle
}

export function VehicleInfo({ vehicle }: VehicleInfoProps) {
  const { t } = useI18n()

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            {t('vehicles.vehicleInformation')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative aspect-video w-full">
            {vehicle.image_url ? (
              <Image
                src={vehicle.image_url}
                alt={vehicle.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">{t('maintenance.details.vehicleInfo.noImage')}</p>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('vehicles.fields.name')}
                  </h3>
                </div>
                <p className="font-medium">{vehicle.name}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('vehicles.fields.plateNumber')}
                  </h3>
                </div>
                <p className="font-medium">{vehicle.plate_number}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('vehicles.fields.brand')}
                  </h3>
                </div>
                <p>{vehicle.brand || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Car className="h-4 w-4" />
                  <h3 className="font-medium text-sm">
                    {t('vehicles.fields.model')}
                  </h3>
                </div>
                <p>{vehicle.model || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {t('vehicles.vehicleDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <h3 className="font-medium text-sm">
                  {t('vehicles.fields.year')}
                </h3>
              </div>
              <p>{vehicle.year || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <h3 className="font-medium text-sm">
                  {t('vehicles.fields.vin')}
                </h3>
              </div>
              <p className="font-mono text-sm">{vehicle.vin || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CircleDot className="h-4 w-4" />
                <h3 className="font-medium text-sm">
                  {t('vehicles.fields.status')}
                </h3>
              </div>
              <Badge variant={vehicle.status === 'active' ? 'success' : vehicle.status === 'maintenance' ? 'warning' : 'secondary'}>
                {vehicle.status ? t(`vehicles.status.${vehicle.status}`) : t('vehicles.status.active')}
              </Badge>
            </div>
          </div>

          {/* Additional vehicle stats */}
          <div className="mt-8 pt-6 border-t grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm">{t('vehicles.tabs.maintenanceHistory')}</p>
              <p className="text-2xl font-bold mt-1">{vehicle.maintenance_tasks?.filter(task => task.status === 'completed').length || 0}</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm">{t('vehicles.tabs.inspectionHistory')}</p>
              <p className="text-2xl font-bold mt-1">{vehicle.inspections?.filter(inspection => inspection.status === 'completed').length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 