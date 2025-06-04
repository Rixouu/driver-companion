"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { 
  Car, 
  Edit, 
  Hash, 
  Truck, 
  Users, 
  Package, 
  Info, 
  Settings, 
  Calendar,
  Activity,
  CircleDot,
  FileText
} from "lucide-react"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface VehicleInfoProps {
  vehicle: DbVehicle
}

export function VehicleInfo({ vehicle }: VehicleInfoProps) {
  const { t } = useI18n()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Header with Actions */}
      <Card className="overflow-hidden shadow-sm border border-border/50">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Vehicle Image - 16:9 Ratio, Wider */}
            <div className="relative w-full lg:w-[500px] h-[281px] lg:h-[281px] flex-shrink-0">
              {vehicle.image_url ? (
                <Image
                  src={vehicle.image_url}
                  alt={vehicle.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 500px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <Car className="h-24 w-24 text-muted-foreground/30" />
                </div>
              )}
            </div>
            
            {/* Vehicle Info and Actions */}
            <div className="flex-1 p-8 bg-gradient-to-br from-background to-muted/10">
              {/* Header with Status and Edit */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-3 text-foreground">{vehicle.name}</h1>
                  <div className="flex flex-wrap items-center gap-6 text-base text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Hash className="h-5 w-5" />
                      {vehicle.plate_number}
                    </span>
                    {vehicle.brand && (
                      <span className="flex items-center gap-1">
                        <Truck className="h-5 w-5" />
                        {vehicle.brand} {vehicle.model}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <Badge 
                    className={cn(
                      "font-medium text-sm px-4 py-2 border-0",
                      vehicle.status === 'active' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                      vehicle.status === 'maintenance' && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                      vehicle.status === 'inactive' && "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-2",
                      vehicle.status === 'active' && "bg-green-500",
                      vehicle.status === 'maintenance' && "bg-orange-500", 
                      vehicle.status === 'inactive' && "bg-gray-500"
                    )}></div>
                    {vehicle.status ? t(`vehicles.status.${vehicle.status}`) : t('vehicles.status.active')}
                  </Badge>
                  <Button 
                    asChild
                    variant="outline" 
                    size="default"
                    className="gap-2 px-4 py-2"
                  >
                    <Link href={`/vehicles/${vehicle.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      {t("common.edit")}
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* Quick Actions - Prominent placement */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  {t('vehicles.quickActions')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button asChild variant="outline" className="h-auto flex-col p-4 gap-2 hover:bg-muted/50 transition-colors">
                    <Link href={`/vehicles/${vehicle.id}?tab=history`}>
                      <Activity className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">{t('vehicles.actions.viewAllHistory')}</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto flex-col p-4 gap-2 hover:bg-muted/50 transition-colors">
                    <Link href={`/vehicles/${vehicle.id}?tab=bookings`}>
                      <Calendar className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">{t('vehicles.actions.viewBookings')}</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto flex-col p-4 gap-2 hover:bg-muted/50 transition-colors">
                    <Link href={`/vehicles/${vehicle.id}?tab=inspections`}>
                      <CircleDot className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium">{t('vehicles.actions.viewInspections')}</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto flex-col p-4 gap-2 hover:bg-muted/50 transition-colors">
                    <Link href={`/vehicles/${vehicle.id}/edit`}>
                      <FileText className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium">{t('vehicles.actions.editVehicle')}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="shadow-sm border border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              {t('vehicles.basicInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">{t('vehicles.fields.brandLabel')}</span>
                <span className="font-semibold">{vehicle.brand || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">{t('vehicles.fields.modelLabel')}</span>
                <span className="font-semibold">{vehicle.model || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">{t('vehicles.fields.yearLabel')}</span>
                <span className="font-semibold">{vehicle.year || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">{t('vehicles.fields.plateNumberLabel')}</span>
                <span className="font-semibold font-mono">{vehicle.plate_number}</span>
              </div>
            </div>
          </CardContent>
        </Card>
       
        {/* Specifications */}
        <Card className="shadow-sm border border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              {t('vehicles.specifications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">{t('vehicles.fields.vinLabel')}</span>
                <span className="font-semibold font-mono text-right text-xs">{vehicle.vin ? vehicle.vin.slice(-8) : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">{t('vehicles.fields.passengerCapacityLabel')}</span>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">
                    {vehicle.passenger_capacity ? `${vehicle.passenger_capacity}` : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">{t('vehicles.fields.luggageCapacityLabel')}</span>
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">
                    {vehicle.luggage_capacity ? `${vehicle.luggage_capacity}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card className="shadow-sm border border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">{t('vehicles.fields.statusLabel')}</span>
                <Badge 
                  className={cn(
                    "text-xs border-0",
                    vehicle.status === 'active' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                    vehicle.status === 'maintenance' && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                    vehicle.status === 'inactive' && "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  )}
                >
                  {vehicle.status ? t(`vehicles.status.${vehicle.status}`) : t('vehicles.status.active')}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">{t('vehicles.fields.addedOnLabel')}</span>
                <span className="font-semibold text-sm">
                  {vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 