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

  return (
    <div className="space-y-6">
      {/* Main Layout Grid - 2/3 + 1/3 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content Area - 2/3 (3 columns) */}
        <div className="xl:col-span-3 space-y-6">
          {/* Vehicle Hero Section */}
          <Card>
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
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Car className="h-20 w-20 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Vehicle Info */}
              <div className="flex-1 p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="space-y-3">
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
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className={cn(
                          "text-sm",
                          vehicle.status === 'active' && "border-green-200 text-green-700",
                          vehicle.status === 'maintenance' && "border-orange-200 text-orange-700",
                          vehicle.status === 'inactive' && "border-gray-200 text-gray-700"
                        )}
                      >
                        {vehicle.status ? t(`vehicles.status.${vehicle.status}`) : t('vehicles.status.active')}
                      </Badge>
                      {vehicle.year && (
                        <span className="text-sm text-muted-foreground">({vehicle.year})</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/vehicles/${vehicle.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Vehicle Tabs - Main Content */}
          <VehicleTabs vehicle={vehicle} />
        </div>

        {/* Sidebar - 1/3 (1 column) */}
        <div className="xl:col-span-1 space-y-6">
          {/* Pricing Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Pricing Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditableVehiclePricingCategories vehicleId={vehicle.id} />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <VehicleQuickStats vehicleId={vehicle.id} />
            </CardContent>
          </Card>

          {/* Danger Zone - Less Prominent */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-muted-foreground">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="w-full text-muted-foreground hover:text-destructive hover:border-destructive"
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
              className="text-xs"
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

interface EditableVehiclePricingCategoriesProps {
  vehicleId: string;
}

function EditableVehiclePricingCategories({ vehicleId }: EditableVehiclePricingCategoriesProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Array<{id: string, name: string, description: string, is_active: boolean}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { categories, isLoading: isLoadingCategories, error, updateCategories } = useVehiclePricingCategories(vehicleId);

  // Fetch available pricing categories
  useEffect(() => {
    async function fetchAvailableCategories() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/pricing/categories');
        if (response.ok) {
          const data = await response.json();
          setAvailableCategories(data);
        }
      } catch (error) {
        console.error('Error fetching available categories:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAvailableCategories();
  }, []);

  // Update selected categories when categories change
  useEffect(() => {
    if (categories) {
      setSelectedCategoryIds(categories.map(cat => cat.id));
    }
  }, [categories]);

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategoryIds(prev => [...prev, categoryId]);
    } else {
      setSelectedCategoryIds(prev => prev.filter(id => id !== categoryId));
    }
  };

  const handleSaveCategories = async () => {
    if (!vehicleId) return;
    
    setIsSaving(true);
    try {
      const success = await updateCategories(selectedCategoryIds);
      if (success) {
        setIsEditing(false);
        toast({
          title: "Pricing categories updated successfully",
          description: "Vehicle pricing categories have been updated.",
        });
      }
    } catch (error) {
      toast({
        title: "Error updating pricing categories",
        description: "Failed to update vehicle pricing categories.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isLoadingCategories) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded animate-pulse"></div>
        <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Error loading pricing categories: {error}
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        {categories && categories.length > 0 ? (
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="text-xs"
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
        ) : (
          <div className="text-sm text-muted-foreground">
            No pricing categories assigned
          </div>
        )}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="w-full"
        >
          Edit Pricing Categories
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Select the pricing categories this vehicle belongs to. This will determine which pricing rules apply to this vehicle.
      </div>
      
      <div className="space-y-3 max-h-40 overflow-y-auto">
        {availableCategories.map((category) => (
          <div key={category.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`edit-category-${category.id}`}
              checked={selectedCategoryIds.includes(category.id)}
              onChange={(e) => handleCategoryToggle(category.id, e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor={`edit-category-${category.id}`} className="text-sm cursor-pointer">
              {category.name}
              {!category.is_active && (
                <span className="ml-2 text-xs text-muted-foreground">(Inactive)</span>
              )}
            </label>
          </div>
        ))}
      </div>

      {availableCategories.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No pricing categories available. Create some in the Pricing Management section.
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(false)}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleSaveCategories}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

interface VehicleQuickStatsProps {
  vehicleId: string;
}

function VehicleQuickStats({ vehicleId }: VehicleQuickStatsProps) {
  const { t } = useI18n();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalInspections: 0,
    lastService: null as string | null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch bookings count
        const bookingsResponse = await fetch(`/api/vehicles/${vehicleId}/bookings?countOnly=true`);
        const bookingsData = await bookingsResponse.json();
        
        // Fetch inspections count
        const inspectionsResponse = await fetch(`/api/vehicles/${vehicleId}/inspections?countOnly=true`);
        const inspectionsData = await inspectionsResponse.json();
        
        // Fetch last maintenance/service
        const maintenanceResponse = await fetch(`/api/vehicles/${vehicleId}/maintenance/overview?latestOnly=true`);
        const maintenanceData = await maintenanceResponse.json();
        
        setStats({
          totalBookings: bookingsData.count || 0,
          totalInspections: inspectionsData.count || 0,
          lastService: maintenanceData.latestService?.date || null
        });
      } catch (error) {
        console.error('Error fetching vehicle stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (vehicleId) {
      fetchStats();
    }
  }, [vehicleId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Total Bookings</span>
          </div>
          <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4" />
            <span className="text-sm">Inspections</span>
          </div>
          <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Last Service</span>
          </div>
          <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">Total Bookings</span>
        </div>
        <span className="font-semibold">{stats.totalBookings}</span>
      </div>
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <CircleDot className="h-4 w-4" />
          <span className="text-sm">Inspections</span>
        </div>
        <span className="font-semibold">{stats.totalInspections}</span>
      </div>
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Last Service</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {stats.lastService ? formatDate(stats.lastService) : 'Never'}
        </span>
      </div>
    </div>
  );
}
