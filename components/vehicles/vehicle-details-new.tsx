"use client"

import { Button } from "@/components/ui/button"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/providers/supabase-provider"
import { VehicleTabs } from "./vehicle-tabs"
import { useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Car, 
  Edit, 
  Hash, 
  Truck, 
  Calendar,
  Activity,
  CircleDot,
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Vehicle Category Badge Component
  const VehicleCategoryBadge = ({ vehicleId }: { vehicleId: string }) => {
    const { categories, isLoading } = useVehiclePricingCategories(vehicleId);

    if (isLoading || !categories || categories.length === 0) {
      return null;
    }

    // Show the first category as the main category
    const mainCategory = categories[0];
    
    return (
      <Badge 
        variant="secondary" 
        className="text-sm bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
      >
        {mainCategory.name}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 px-4 sm:px-6">
      {/* Mobile Header */}
      <div className="block xl:hidden">
        <div className="mb-4">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              {vehicle.image_url ? (
                <img
                  src={vehicle.image_url}
                  alt={vehicle.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
                  <Car className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight mb-1">{vehicle.name}</h1>
              <p className="text-sm text-muted-foreground mb-2">{vehicle.plate_number}</p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline"
                  className={cn(
                    "text-xs",
                    vehicle.status === 'active' && "border-green-200 text-green-700",
                    vehicle.status === 'maintenance' && "border-orange-200 text-orange-700",
                    vehicle.status === 'inactive' && "border-gray-200 text-gray-700"
                  )}
                >
                  {vehicle.status ? t(`vehicles.status.${vehicle.status}`) : t('vehicles.status.active')}
                </Badge>
                {vehicle.year && (
                  <span className="text-xs text-muted-foreground">({vehicle.year})</span>
                )}
                <VehicleCategoryBadge vehicleId={vehicle.id} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="h-9 px-4"
            >
              <Link href={`/vehicles/${vehicle.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Quick Stats and Info */}
        <div className="space-y-4 xl:hidden">
          {/* Quick Stats */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Activity className="h-4 w-4" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <VehicleQuickStats vehicleId={vehicle.id} />
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Car className="h-4 w-4" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Plate Number:</span>
                  <span className="text-sm font-medium">{vehicle.plate_number}</span>
                </div>
                {vehicle.brand && (
                  <div className="flex items-center gap-3">
                    <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Brand:</span>
                    <span className="text-sm font-medium">{vehicle.brand}</span>
                  </div>
                )}
                {vehicle.model && (
                  <div className="flex items-center gap-3">
                    <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Model:</span>
                    <span className="text-sm font-medium">{vehicle.model}</span>
                  </div>
                )}
                {vehicle.year && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Year:</span>
                    <span className="text-sm font-medium">{vehicle.year}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs",
                      vehicle.status === 'active' && "border-green-200 text-green-700",
                      vehicle.status === 'maintenance' && "border-orange-200 text-orange-700",
                      vehicle.status === 'inactive' && "border-gray-200 text-gray-700"
                    )}
                  >
                    {vehicle.status ? t(`vehicles.status.${vehicle.status}`) : t('vehicles.status.active')}
                  </Badge>
                  <VehicleCategoryBadge vehicleId={vehicle.id} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden xl:block">
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
                    {/* Vehicle Category Badge */}
                    <VehicleCategoryBadge vehicleId={vehicle.id} />
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
      </div>

      {/* Main Layout Grid - Left Column + Right Column */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Column - Quick Stats and Info (1 column) */}
        <div className="xl:col-span-1 space-y-6">
          {/* Quick Stats */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-primary">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 sm:space-y-4">
              <VehicleQuickStats vehicleId={vehicle.id} />
            </CardContent>
          </Card>

          {/* Vehicle Information Card */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-primary">
                <Car className="h-4 w-4 sm:h-5 sm:w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 sm:space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground">Plate Number:</span>
                  <span className="text-xs sm:text-sm font-medium">{vehicle.plate_number}</span>
                </div>
                {vehicle.brand && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Brand:</span>
                    <span className="text-xs sm:text-sm font-medium">{vehicle.brand}</span>
                  </div>
                )}
                {vehicle.model && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Car className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Model:</span>
                    <span className="text-xs sm:text-sm font-medium">{vehicle.model}</span>
                  </div>
                )}
                {vehicle.year && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Year:</span>
                    <span className="text-xs sm:text-sm font-medium">{vehicle.year}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs",
                      vehicle.status === 'active' && "border-green-200 text-green-700",
                      vehicle.status === 'maintenance' && "border-orange-200 text-orange-700",
                      vehicle.status === 'inactive' && "border-gray-200 text-gray-700"
                    )}
                  >
                    {vehicle.status ? t(`vehicles.status.${vehicle.status}`) : t('vehicles.status.active')}
                  </Badge>
                  <VehicleCategoryBadge vehicleId={vehicle.id} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Vehicle Tabs (3 columns) */}
        <div className="xl:col-span-3 space-y-6">
          {/* Vehicle Tabs - Main Content */}
          <VehicleTabs vehicle={vehicle} />
        </div>
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
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm">Total Bookings</span>
          </div>
          <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <CircleDot className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm">Inspections</span>
          </div>
          <div className="h-4 w-8 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs sm:text-sm">Last Service</span>
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
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2 sm:gap-3">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs sm:text-sm">Total Bookings</span>
        </div>
        <span className="text-lg sm:text-xl font-semibold">{stats.totalBookings}</span>
      </div>
      <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2 sm:gap-3">
          <CircleDot className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs sm:text-sm">Inspections</span>
        </div>
        <span className="text-lg sm:text-xl font-semibold">{stats.totalInspections}</span>
      </div>
      <div className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2 sm:gap-3">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs sm:text-sm">Last Service</span>
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground">
          {stats.lastService ? formatDate(stats.lastService) : 'Never'}
        </span>
      </div>
    </div>
  );
}
