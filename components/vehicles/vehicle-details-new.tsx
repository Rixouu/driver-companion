"use client"

import { Button } from "@/components/ui/button"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { useState, useEffect } from "react"
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
  ArrowLeft,
  Star,
  MapPin,
  Clock
} from "lucide-react"
import { useVehiclePricingCategories } from "@/lib/hooks/useVehiclePricingCategories"
import Link from "next/link"
import { cn } from "@/lib/utils"

async function fetchMileageLogsPage1(vehicleId: string) {
  const pageSize = 5;
  const response = await fetch(`/api/vehicles/${vehicleId}/mileage?page=1&pageSize=${pageSize}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to prefetch mileage logs" }));
    throw new Error(errorData.message || "vehicles.messages.prefetchMileageError");
  }
  return response.json();
}

async function fetchFuelLogsPage1(vehicleId: string) {
  const pageSize = 5;
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
  const [activeTab, setActiveTab] = useState("information")

  const supabase = useSupabase()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (vehicle?.id) {
      queryClient.prefetchQuery({
        queryKey: ["mileageLogs", vehicle.id, 1, 5],
        queryFn: () => fetchMileageLogsPage1(vehicle.id),
        staleTime: 1000 * 60 * 5,
      });
      queryClient.prefetchQuery({
        queryKey: ["fuelLogs", vehicle.id, 1, 5],
        queryFn: () => fetchFuelLogsPage1(vehicle.id),
        staleTime: 1000 * 60 * 5,
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

  const tabs = [
    { id: "information", label: "Information", icon: Info },
    { id: "history", label: "History", icon: Activity },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "inspections", label: "Inspections", icon: CircleDot },
  ]

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/vehicles">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Vehicles
          </Link>
        </Button>
      </div>

      {/* Main Layout Grid - 2/3 + 1/3 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content Area - 2/3 (3 columns) */}
        <div className="xl:col-span-3 space-y-6">
          {/* Vehicle Hero Section */}
          <Card className="overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Vehicle Image */}
              <div className="relative w-full lg:w-80 h-48 lg:h-48 flex-shrink-0">
                {vehicle.image_url ? (
                  <img
                    src={vehicle.image_url}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <Car className="h-20 w-20 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              
              {/* Vehicle Info */}
              <div className="flex-1 p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{vehicle.name}</h1>
                    <div className="flex items-center gap-4 text-lg text-muted-foreground">
                      <span className="flex items-center gap-2 font-mono">
                        <Hash className="h-4 w-4" />
                        {vehicle.plate_number}
                      </span>
                      {vehicle.brand && (
                        <span className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          {vehicle.brand} {vehicle.model}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <Badge 
                      className={cn(
                        "text-sm px-3 py-1 border-0",
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
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/vehicles/${vehicle.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Vehicle
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button asChild variant="outline" className="h-auto flex-col p-4 gap-2 hover:bg-muted/50">
                  <Link href={`/vehicles/${vehicle.id}?tab=history`}>
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">View History</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto flex-col p-4 gap-2 hover:bg-muted/50">
                  <Link href={`/vehicles/${vehicle.id}?tab=bookings`}>
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">View Bookings</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto flex-col p-4 gap-2 hover:bg-muted/50">
                  <Link href={`/vehicles/${vehicle.id}?tab=inspections`}>
                    <CircleDot className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium">View Inspections</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto flex-col p-4 gap-2 hover:bg-muted/50">
                  <Link href={`/vehicles/${vehicle.id}/edit`}>
                    <FileText className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">Edit Vehicle</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Navigation */}
          <Card>
            <CardHeader className="pb-0">
              <div className="flex space-x-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </Button>
                  )
                })}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Tab Content */}
              {activeTab === "information" && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Info className="h-5 w-5 text-blue-600" />
                          Basic Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm text-muted-foreground">Brand</span>
                          <span className="font-medium">{vehicle.brand || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm text-muted-foreground">Model</span>
                          <span className="font-medium">{vehicle.model || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm text-muted-foreground">Year</span>
                          <span className="font-medium">{vehicle.year || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-muted-foreground">Plate Number</span>
                          <span className="font-medium font-mono">{vehicle.plate_number}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Settings className="h-5 w-5 text-green-600" />
                          Specifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm text-muted-foreground">VIN</span>
                          <span className="font-medium font-mono text-sm">
                            {vehicle.vin ? vehicle.vin.slice(-8) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Passenger Capacity
                          </span>
                          <span className="font-medium">
                            {vehicle.passenger_capacity ? `${vehicle.passenger_capacity}` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Luggage Capacity
                          </span>
                          <span className="font-medium">
                            {vehicle.luggage_capacity ? `${vehicle.luggage_capacity}` : 'N/A'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        Additional Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-border/50">
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
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-muted-foreground">Added On</span>
                            <span className="font-medium text-sm">
                              {vehicle.created_at ? formatDate(vehicle.created_at) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "history" && (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">History</h3>
                  <p className="text-muted-foreground">Vehicle history and maintenance logs will appear here.</p>
                </div>
              )}

              {activeTab === "bookings" && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Bookings</h3>
                  <p className="text-muted-foreground">Vehicle bookings and reservations will appear here.</p>
                </div>
              )}

              {activeTab === "inspections" && (
                <div className="text-center py-12">
                  <CircleDot className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Inspections</h3>
                  <p className="text-muted-foreground">Vehicle inspection records will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1/3 (1 column) */}
        <div className="xl:col-span-1 space-y-6">
          {/* Pricing Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-orange-600" />
                Pricing Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VehiclePricingCategoriesSidebar vehicleId={vehicle.id} />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Total Bookings</span>
                </div>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <CircleDot className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Inspections</span>
                </div>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Last Service</span>
                </div>
                <span className="text-sm text-muted-foreground">Never</span>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
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
    <div className="space-y-3">
      {categories.map((category) => (
        <div key={category.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
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
          <span className="text-xs text-muted-foreground font-mono">
            #{category.sort_order}
          </span>
        </div>
      ))}
    </div>
  );
}
