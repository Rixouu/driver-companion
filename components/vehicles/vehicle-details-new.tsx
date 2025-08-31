"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Edit, Car, Calendar, Activity, Package, ArrowLeft, TrendingUp, Users, MapPin } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VehicleTabs } from "./vehicle-tabs"
import type { DbVehicle } from "@/types"

interface VehicleDetailsNewProps {
  vehicle: DbVehicle
}

interface VehicleGroup {
  id: string
  name: string
  color: string
}

interface VehiclePricingCategory {
  id: string
  name: string
  description: string
}

export function VehicleDetailsNew({ vehicle }: VehicleDetailsNewProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [bookings, setBookings] = useState<any[]>([])
  const [inspections, setInspections] = useState<any[]>([])
  const [vehicleGroup, setVehicleGroup] = useState<VehicleGroup | null>(null)
  const [pricingCategories, setPricingCategories] = useState<VehiclePricingCategory[]>([])

  // Load vehicle data for stats, vehicle group, and pricing categories
  useEffect(() => {
    async function loadVehicleData() {
      try {
        const [bookingsRes, inspectionsRes, groupRes, pricingRes] = await Promise.all([
          fetch(`/api/vehicles/${vehicle.id}/bookings`),
          fetch(`/api/vehicles/${vehicle.id}/inspections`),
          vehicle.vehicle_group_id ? fetch(`/api/vehicle-groups/${vehicle.vehicle_group_id}`) : Promise.resolve(null),
          fetch(`/api/vehicles/${vehicle.id}/pricing-categories`)
        ])
        
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          setBookings(bookingsData.bookings || [])
        }
        
        if (inspectionsRes.ok) {
          const inspectionsData = await inspectionsRes.json()
          setInspections(inspectionsData.inspections || [])
        }

        if (groupRes && groupRes.ok) {
          const groupData = await groupRes.json()
          setVehicleGroup(groupData)
        }

        if (pricingRes.ok) {
          const pricingData = await pricingRes.json()
          setPricingCategories(pricingData.categories || [])
        }
      } catch (error) {
        console.error('Failed to load vehicle data:', error)
      }
    }

    loadVehicleData()
  }, [vehicle.id, vehicle.vehicle_group_id])

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-card">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Mobile Layout - Stacked */}
          <div className="block xl:hidden space-y-4">
            {/* Vehicle Image - Full Width on Mobile with Increased Height */}
            <div className="w-full h-56 sm:h-64 rounded-lg border-2 border-primary/20 overflow-hidden">
              <img
                src={vehicle.image_url || "/placeholder.jpg"}
                alt={vehicle.name || "Vehicle"}
                className="w-full h-full object-cover"
                style={{ aspectRatio: '16/9' }}
              />
            </div>
            
            {/* Vehicle Info - Stacked on Mobile */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{vehicle.name}</h1>
                <p className="text-base sm:text-lg text-muted-foreground font-mono">{vehicle.plate_number}</p>
              </div>
              
              {/* Status and Category Badges - Better Organized Layout */}
              <div className="space-y-4">
                {/* Vehicle Group and Status Row - Better Alignment */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {vehicleGroup && (
                    <Badge 
                      variant="outline" 
                      className="px-3 py-2 text-sm border-red-200 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-950/30 text-center"
                    >
                      {vehicleGroup.name}
                    </Badge>
                  )}
                  <Badge 
                    variant="outline"
                    className="px-3 py-2 text-sm border-green-200 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-300 dark:bg-green-950/30 text-center"
                  >
                    {vehicle.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="px-3 py-2 text-sm border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-950/30 text-center"
                  >
                    {vehicle.year}
                  </Badge>
                </div>

                {/* Vehicle Pricing Category - Better Alignment */}
                {pricingCategories.length > 0 && (
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <span className="text-sm text-muted-foreground">Pricing Group:</span>
                    <Badge 
                      variant="outline" 
                      className="px-3 py-2 text-sm border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:bg-orange-950/30"
                    >
                      {pricingCategories[0].name}
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Edit Button - Full Width on Mobile */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/vehicles/${vehicle.id}/edit`)}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
          
          {/* Desktop Layout - Side by Side */}
          <div className="hidden xl:flex items-start space-x-6">
            {/* Vehicle Image - 16:9 ratio with proper height */}
            <div className="w-80 h-52 rounded-lg border-2 border-primary/20 overflow-hidden flex-shrink-0">
              <img
                src={vehicle.image_url || "/placeholder.jpg"}
                alt={vehicle.name || "Vehicle"}
                className="w-full h-full object-cover"
                style={{ aspectRatio: '16/9' }}
              />
            </div>
            
            {/* Vehicle Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{vehicle.name}</h1>
                    <p className="text-lg text-muted-foreground font-mono">{vehicle.plate_number}</p>
                  </div>
                  
                  {/* Status and Category Badges in Color - Improved UI */}
                  <div className="space-y-4">
                    {/* Vehicle Group and Status Row - Better Spacing */}
                    <div className="flex items-center space-x-3">
                      {vehicleGroup && (
                        <Badge 
                          variant="outline" 
                          className="px-3 py-2 text-sm border-red-200 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-950/30"
                        >
                          {vehicleGroup.name}
                        </Badge>
                      )}
                      <Badge 
                        variant="outline"
                        className="px-3 py-2 text-sm border-green-200 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-300 dark:bg-green-950/30"
                      >
                        {vehicle.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="px-3 py-2 text-sm border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-950/30"
                      >
                        {vehicle.year}
                      </Badge>
                    </div>

                    {/* Vehicle Pricing Category - Better Spacing */}
                    {pricingCategories.length > 0 && (
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-muted-foreground">Pricing Group:</span>
                        <Badge 
                          variant="outline" 
                          className="px-3 py-2 text-sm border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:bg-orange-950/30"
                        >
                          {pricingCategories[0].name}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Edit Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/vehicles/${vehicle.id}/edit`)}
                  className="flex-shrink-0"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Vehicle Info */}
          <div className="xl:col-span-4 space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Vehicle Information - ABOVE Quick Stats with REORGANIZED layout */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Car className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 sm:pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column: Brand, Plate, Year */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Brand</p>
                        <p className="text-sm font-medium">{vehicle.brand || "N/A"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Plate</p>
                        <p className="text-sm font-medium">{vehicle.plate_number || "N/A"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Year</p>
                        <p className="text-sm font-medium">{vehicle.year || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column: Model, VIN */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Model</p>
                        <p className="text-sm font-medium">{vehicle.model || "N/A"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">VIN</p>
                        <p className="text-sm font-medium">{vehicle.vin || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Luggage Left & Capacity Right below with separator line */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Luggage</p>
                        <p className="text-sm font-medium">{vehicle.luggage_capacity || "N/A"} bags</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Capacity</p>
                        <p className="text-sm font-medium">{vehicle.passenger_capacity || "N/A"} pax</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats - Now with 4 numbers */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 sm:pt-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center p-4 sm:p-5 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{bookings?.length || 0}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Total Bookings</div>
                  </div>
                  <div className="text-center p-4 sm:p-5 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{inspections?.length || 0}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Inspections</div>
                  </div>
                  <div className="text-center p-4 sm:p-5 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{pricingCategories?.length || 0}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Pricing Categories</div>
                  </div>
                  <div className="text-center p-4 sm:p-5 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{vehicleGroup ? 1 : 0}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Vehicle Group</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="xl:col-span-8">
            <VehicleTabs vehicle={vehicle} />
          </div>
        </div>
      </div>
    </div>
  )
}
