"use client"

import { Button } from "@/components/ui/button"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/providers/supabase-provider"
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
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  FileText,
  Tag,
  MapPin,
  Clock,
  Star
} from "lucide-react"
import { useVehiclePricingCategories } from "@/lib/hooks/useVehiclePricingCategories"
import Link from "next/link"
import { cn } from "@/lib/utils"

async function fetchMileageLogsPage1(vehicleId: string) {
  const pageSize = 5; // Default page size used in VehicleMileageLogs
  const response = await fetch(`/api/vehicles/${vehicleId}/mileage?page=1&pageSize=${pageSize}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to prefetch mileage logs" }));
    throw new Error(errorData.message || "vehicles.messages.prefetchMileageError");
  }
  return response.json();
}

async function fetchFuelLogsPage1(vehicleId: string) {
  const pageSize = 5; // Default page size used in VehicleFuelLogs
  const response = await fetch(`/api/vehicles/${vehicleId}/fuel?page=1&pageSize=${pageSize}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to prefetch fuel logs" }));
    throw new Error(errorData.message || "vehicles.messages.prefetchFuelError");
  }
  return response.json();
}

interface VehicleDetailsProps {
  vehicle: DbVehicle
}

export function VehicleDetails({ vehicle }: VehicleDetailsProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const supabase = useSupabase()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (vehicle?.id) {
      // Prefetch mileage logs (page 1) using options object
      queryClient.prefetchQuery({
        queryKey: ["mileageLogs", vehicle.id, 1, 5],
        queryFn: () => fetchMileageLogsPage1(vehicle.id),
        staleTime: 1000 * 60 * 5, // 5 minutes, same as default in QueryProvider
      });
      // Prefetch fuel logs (page 1) using options object
      queryClient.prefetchQuery({
        queryKey: ["fuelLogs", vehicle.id, 1, 5],
        queryFn: () => fetchFuelLogsPage1(vehicle.id),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    }
  }, [vehicle?.id, queryClient]);

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
    } catch (error: unknown) {
      console.error(error)
      let errorMessage = t("vehicles.messages.hasAssociatedRecords");
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: t("vehicles.messages.deleteError"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6 mt-6">
      {/* Main Content Grid - 2/3 + 1/3 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Header with Actions */}
          <Card className="overflow-hidden shadow-sm border border-border/50">
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                {/* Vehicle Image - 16:9 Ratio, Wider */}
                <div className="relative w-full lg:w-[400px] h-[225px] lg:h-[225px] flex-shrink-0">
                  {vehicle.image_url ? (
                    <img
                      src={vehicle.image_url}
                      alt={vehicle.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <Car className="h-24 w-24 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                
                {/* Vehicle Info and Actions */}
                <div className="flex-1 p-6 bg-gradient-to-br from-background to-muted/10">
                  {/* Header with Status and Edit */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h1 className="text-2xl font-bold mb-2 text-foreground">{vehicle.name}</h1>
                      <div className="flex flex-wrap items-center gap-4 text-base text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="h-4 w-4" />
                          {vehicle.plate_number}
                        </span>
                        {vehicle.brand && (
                          <span className="flex items-center gap-1">
                            <Truck className="h-4 w-4" />
                            {vehicle.brand} {vehicle.model}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <Badge 
                        className={cn(
                          "font-medium text-sm px-3 py-1 border-0",
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
                        size="sm"
                        className="gap-2 px-3 py-1"
                      >
                        <Link href={`/vehicles/${vehicle.id}/edit`}>
                          <Edit className="h-3 w-3" />
                          {t("common.edit")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Quick Actions - Compact */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button asChild variant="outline" size="sm" className="h-auto flex-col p-3 gap-1 hover:bg-muted/50 transition-colors">
                      <Link href={`/vehicles/${vehicle.id}?tab=history`}>
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium">{t('vehicles.actions.viewAllHistory')}</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-auto flex-col p-3 gap-1 hover:bg-muted/50 transition-colors">
                      <Link href={`/vehicles/${vehicle.id}?tab=bookings`}>
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium">{t('vehicles.actions.viewBookings')}</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-auto flex-col p-3 gap-1 hover:bg-muted/50 transition-colors">
                      <Link href={`/vehicles/${vehicle.id}?tab=inspections`}>
                        <CircleDot className="h-4 w-4 text-orange-600" />
                        <span className="text-xs font-medium">{t('vehicles.actions.viewInspections')}</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-auto flex-col p-3 gap-1 hover:bg-muted/50 transition-colors">
                      <Link href={`/vehicles/${vehicle.id}/edit`}>
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium">{t('vehicles.actions.editVehicle')}</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Tabs - Main Content */}
          <VehicleTabs vehicle={vehicle} />
        </div>

        {/* Sidebar - 1/3 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Vehicle Information Summary */}
          <Card className="shadow-sm border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Brand</span>
                  <span className="font-medium">{vehicle.brand || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Model</span>
                  <span className="font-medium">{vehicle.model || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Year</span>
                  <span className="font-medium">{vehicle.year || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Plate Number</span>
                  <span className="font-medium font-mono">{vehicle.plate_number}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card className="shadow-sm border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">VIN</span>
                  <span className="font-medium font-mono text-xs">{vehicle.vin ? vehicle.vin.slice(-8) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Passengers
                  </span>
                  <span className="font-medium">
                    {vehicle.passenger_capacity ? `${vehicle.passenger_capacity}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Luggage
                  </span>
                  <span className="font-medium">
                    {vehicle.luggage_capacity ? `${vehicle.luggage_capacity}` : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Categories */}
          <Card className="shadow-sm border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Tag className="h-5 w-5 text-orange-600" />
                Pricing Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VehiclePricingCategoriesSidebar vehicleId={vehicle.id} />
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card className="shadow-sm border border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Status</span>
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
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Added On</span>
                  <span className="font-medium text-sm">
                    {vehicle.created_at ? formatDate(vehicle.created_at) : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="shadow-sm border border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-red-600 dark:text-red-400">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="w-full"
              >
                Delete Vehicle
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

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
  );
}

interface VehiclePricingCategoriesSidebarProps {
  vehicleId: string;
}

function VehiclePricingCategoriesSidebar({ vehicleId }: VehiclePricingCategoriesSidebarProps) {
  const { t } = useI18n();
  const { categories, isLoading, error } = useVehiclePricingCategories(vehicleId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse"></div>
        <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Error loading pricing categories
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No pricing categories assigned
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div key={category.id} className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                category.is_active ? "border-green-300 text-green-700" : "border-gray-300 text-gray-500"
              )}
            >
              {category.name}
            </Badge>
            {!category.is_active && (
              <span className="text-xs text-muted-foreground">(Inactive)</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            #{category.sort_order}
          </span>
        </div>
      ))}
    </div>
  );
}
