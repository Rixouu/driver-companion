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
  Clock,
  ClipboardCheck
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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6">
      {/* Main Layout Grid - 2/3 + 1/3 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Main Content Area - 2/3 (3 columns) */}
        <div className="xl:col-span-3 space-y-4 sm:space-y-6">
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
              <div className="flex-1 p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="space-y-2 sm:space-y-3">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{vehicle.name}</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm sm:text-base lg:text-lg text-muted-foreground">
                      <span className="flex items-center gap-2 font-mono">
                        <Hash className="h-3 w-3 sm:h-4 sm:w-4" />
                        {vehicle.plate_number}
                      </span>
                      {vehicle.brand && (
                        <span className="flex items-center gap-2">
                          <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
                          {vehicle.brand} {vehicle.model}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
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
                  
                  {/* Mobile: Stacked button layout */}
                  <div className="block lg:hidden w-full">
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" size="sm" className="h-10">
                        <Link href={`/vehicles/${vehicle.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="h-10">
                        <Car className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  {/* Desktop: Elegant button layout - Same as Driver Details */}
                  <div className="hidden lg:block">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="h-9 px-4">
                          <Link href={`/vehicles/${vehicle.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 px-4">
                          <Car className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                      
                      <div className="h-6 w-px bg-border"></div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9 px-4">
                          <Truck className="h-4 w-4 mr-2" />
                          History
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 px-4">
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                          Inspections
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Vehicle Tabs - Main Content */}
          <VehicleTabs vehicle={vehicle} />
        </div>

        {/* Sidebar - 1/3 (1 column) */}
        <div className="xl:col-span-1 space-y-4 sm:space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-0">
              <VehicleQuickStats vehicleId={vehicle.id} />
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <CircleDot className="h-4 w-4 sm:h-5 sm:w-5" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-0">
              <div className="text-sm text-muted-foreground">
                This vehicle is currently {vehicle.status === 'active' ? 'active and available' : vehicle.status === 'maintenance' ? 'undergoing maintenance' : 'inactive'} for service.
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Truck className="h-4 w-4 mr-2" />
                View Full History
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-0">
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                View All Activity
              </Button>
            </CardContent>
          </Card>
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
