'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Car, Settings, User, FileText } from 'lucide-react'
import Image from 'next/image'
import { Booking } from '@/types/bookings'
import { PricingCategory, VehicleWithCategory } from '@/app/actions/services'

interface VehicleSelectionTabProps {
  formData: Partial<Booking & { 
    vehicle_id?: string | null;
    selectedVehicle?: VehicleWithCategory;
    originalVehicleId?: string | null;
    upgradeDowngradeData?: any;
  }>
  setFormData: React.Dispatch<React.SetStateAction<any>>
  availableCategories: PricingCategory[]
  vehiclesWithCategories: VehicleWithCategory[]
  vehicleFilters: {
    category: string
    brand: string
    model: string
    minPassengers: string
    minLuggage: string
  }
  setVehicleFilters: React.Dispatch<React.SetStateAction<any>>
  filteredVehicles: VehicleWithCategory[]
  getFilterOptions: {
    categories: (string | undefined)[]
    brands: (string | undefined)[]
  }
  bookingId?: string
  originalServiceName?: string
  onVehicleChange?: (pricingData: any) => void
}

export function VehicleSelectionTab({
  formData,
  setFormData,
  availableCategories,
  vehiclesWithCategories,
  vehicleFilters,
  setVehicleFilters,
  filteredVehicles,
  getFilterOptions,
  bookingId,
  originalServiceName,
  onVehicleChange
}: VehicleSelectionTabProps) {
  
  // Function to handle vehicle selection with upgrade/downgrade detection
  const handleVehicleSelection = async (vehicle: VehicleWithCategory) => {
    const currentVehicleId = formData.originalVehicleId || formData.vehicle_id;
    const newVehicleId = vehicle.id;
    
    // Update form data immediately
    setFormData((prev: any) => ({
      ...prev,
      vehicle_id: vehicle.id,
      selectedVehicle: vehicle,
      // Update vehicle details fields to match selected vehicle
      vehicle_make: vehicle.brand,
      vehicle_model: vehicle.model,
      vehicle_capacity: vehicle.passenger_capacity,
      vehicle_year: vehicle.year?.toString()
    }));
    
    // If this is an edit, handle vehicle pricing logic
    if (bookingId && currentVehicleId) {
      // Check if service type has changed from original quotation
      const serviceTypeChanged = originalServiceName && formData.service_name && 
        originalServiceName !== formData.service_name;
      
      if (serviceTypeChanged) {
        console.log('🚫 Service type changed from original quotation, skipping upgrade/downgrade pricing API call');
        console.log('Original service:', originalServiceName, 'Current service:', formData.service_name);
        return; // Skip the upgrade/downgrade logic
      }
      
      // If selecting back to the original vehicle, reset pricing
      if (currentVehicleId === newVehicleId) {
        console.log('🔄 Selected back to original vehicle, resetting pricing');
        if (onVehicleChange) {
          onVehicleChange({
            priceDifference: 0,
            assignmentType: 'update',
            isOriginalVehicle: true
          });
        }
        return;
      }
      
      // If selecting a different vehicle, check for upgrade/downgrade
      console.log('🚗 Vehicle selection - calling pricing API with:', {
        currentVehicleId,
        newVehicleId,
        serviceType: formData.service_name,
        serviceDays: formData.service_days,
        hoursPerDay: formData.hours_per_day,
        durationHours: formData.duration_hours,
        bookingId
      });
      
      try {
        const response = await fetch(`/api/bookings/${bookingId}/get-vehicle-pricing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentVehicleId,
            newVehicleId,
            serviceType: formData.service_name || 'Airport Transfer',
            serviceDays: formData.service_days,
            hoursPerDay: formData.hours_per_day,
            durationHours: formData.duration_hours
          }),
        });
        
        if (response.ok) {
          const pricingData = await response.json();
          console.log('Vehicle pricing data:', pricingData);
          
          // Call the parent component's handler if provided
          if (onVehicleChange) {
            onVehicleChange(pricingData);
          }
        } else {
          console.error('Failed to get vehicle pricing:', await response.text());
        }
      } catch (error) {
        console.error('Error getting vehicle pricing:', error);
      }
    }
  };
  return (
    <Card className="border rounded-lg shadow-sm dark:border-gray-800">
      <div className="border-b py-4 px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center">
            <Car className="mr-2 h-5 w-5" />
            Select Your Vehicle
          </h2>
          {(vehicleFilters.minPassengers || vehicleFilters.minLuggage) && (
            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
              Smart Filter Active
            </div>
          )}
        </div>
      </div>
      
      {/* Vehicle Filters */}
      <div className="border-b bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Filters</h3>
          {Object.values(vehicleFilters).some(filter => filter) && (
            <button
              onClick={() => setVehicleFilters({ category: '', brand: '', model: '', minPassengers: '', minLuggage: '' })}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Category Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Category</Label>
            <Select 
              value={vehicleFilters.category || undefined} 
              onValueChange={(value) => setVehicleFilters((prev: any) => ({ ...prev, category: value || '' }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {getFilterOptions.categories.filter(Boolean).map((category) => (
                  <SelectItem key={category} value={category as string}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Brand Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Brand</Label>
            <Select 
              value={vehicleFilters.brand || undefined} 
              onValueChange={(value) => setVehicleFilters((prev: any) => ({ ...prev, brand: value || '' }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {getFilterOptions.brands.filter(Boolean).map((brand) => (
                  <SelectItem key={brand} value={brand as string}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Model Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Model</Label>
            <Input
              placeholder="Search model..."
              value={vehicleFilters.model}
              onChange={(e) => setVehicleFilters((prev: any) => ({ ...prev, model: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
          
          {/* Passengers Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Min. Passengers</Label>
            <Select 
              value={vehicleFilters.minPassengers || undefined} 
              onValueChange={(value) => setVehicleFilters((prev: any) => ({ ...prev, minPassengers: value || '' }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <SelectItem key={num} value={num.toString()}>{num}+</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Bags Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Min. Bags</Label>
            <Select 
              value={vehicleFilters.minLuggage || undefined} 
              onValueChange={(value) => setVehicleFilters((prev: any) => ({ ...prev, minLuggage: value || '' }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <SelectItem key={num} value={num.toString()}>{num}+</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Filter Results Count */}
        <div className="mt-3 text-xs text-muted-foreground">
          Showing {filteredVehicles.length} of {vehiclesWithCategories.length} vehicles
        </div>
      </div>
      
      <div className="p-6">
        {availableCategories.length > 0 ? (
          <div className="space-y-8">
            {availableCategories
              .filter(category => {
                const categoryVehicles = filteredVehicles.filter(v => v.category_name?.trim() === category.name?.trim())
                return categoryVehicles.length > 0
              })
              .map((category) => {
              const categoryVehicles = filteredVehicles.filter(v => v.category_name?.trim() === category.name?.trim())
              
              return (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {categoryVehicles.length} vehicle{categoryVehicles.length !== 1 ? 's' : ''}
                    </Badge>
                    {/* Show status for each vehicle in this category */}
                    {formData.originalVehicleId && (
                      <div className="flex gap-1 flex-wrap">
                        {categoryVehicles.map((vehicle) => {
                          if (vehicle.id === formData.originalVehicleId) {
                            return <Badge key={vehicle.id} variant="outline" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700">CURRENT</Badge>
                          }
                          // Show upgrade/downgrade status based on current selection vs original
                          if (formData.selectedVehicle && formData.selectedVehicle.id === vehicle.id) {
                            if (formData.upgradeDowngradeData) {
                              const priceDiff = formData.upgradeDowngradeData.priceDifference
                              if (priceDiff > 0) {
                                return <Badge key={vehicle.id} variant="destructive" className="text-xs">UPGRADE +¥{priceDiff.toLocaleString()}</Badge>
                              } else if (priceDiff < 0) {
                                return <Badge key={vehicle.id} variant="default" className="text-xs bg-green-600">DOWNGRADE -¥{Math.abs(priceDiff).toLocaleString()}</Badge>
                              } else {
                                return <Badge key={vehicle.id} variant="outline" className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600">SAME PRICE</Badge>
                              }
                            }
                            return <Badge key={vehicle.id} variant="outline" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700">SELECTED</Badge>
                          }
                          return <Badge key={vehicle.id} variant="outline" className="text-xs bg-muted text-muted-foreground dark:bg-muted/50 dark:text-muted-foreground border-border">SELECT</Badge>
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryVehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className={`
                          border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md
                          ${formData.vehicle_id === vehicle.id ? 'border-2 border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-primary/50'}
                        `}
                        onClick={() => handleVehicleSelection(vehicle)}
                      >
                        <div className="space-y-3">
                          {/* Vehicle Image */}
                          <div className="aspect-video bg-muted rounded-md overflow-hidden">
                            {vehicle.image_url ? (
                              <Image
                                src={vehicle.image_url}
                                alt={`${vehicle.brand} ${vehicle.model}`}
                                width={300}
                                height={200}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          {/* Vehicle Details */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">
                              {vehicle.brand} {vehicle.model}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {vehicle.year} • {vehicle.name}
                            </p>
                            
                            {/* Capacity Info */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{vehicle.passenger_capacity || 0} passengers</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>{vehicle.luggage_capacity || 0} bags</span>
                              </div>
                            </div>

                            {/* Upgrade/Downgrade Status */}
                            {formData.originalVehicleId && vehicle.id !== formData.originalVehicleId && (
                              <div className="mt-2">
                                {vehicle.id === formData.selectedVehicle?.id && formData.upgradeDowngradeData ? (
                                  <>
                                    {formData.upgradeDowngradeData.priceDifference > 0 ? (
                                      <Badge variant="destructive" className="text-xs w-full justify-center">UPGRADE +¥{formData.upgradeDowngradeData.priceDifference.toLocaleString()}</Badge>
                                    ) : formData.upgradeDowngradeData.priceDifference < 0 ? (
                                      <Badge variant="default" className="text-xs w-full justify-center bg-green-600">DOWNGRADE -¥{Math.abs(formData.upgradeDowngradeData.priceDifference).toLocaleString()}</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs w-full justify-center">SAME PRICE</Badge>
                                    )}
                                  </>
                                ) : (
                                  <Badge variant="outline" className="text-xs w-full justify-center">SELECT</Badge>
                                )}
                              </div>
                            )}
                            {formData.originalVehicleId && vehicle.id === formData.originalVehicleId && (
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs w-full justify-center bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700">CURRENT</Badge>
                              </div>
                            )}
                            
                            {/* Select Button */}
                            <Button
                              variant={formData.vehicle_id === vehicle.id ? "default" : "outline"}
                              size="sm"
                              className="w-full mt-3"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleVehicleSelection(vehicle)
                              }}
                            >
                              {formData.vehicle_id === vehicle.id ? 'Selected' : 'Select'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 border rounded-lg bg-muted/30 text-center">
            <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No vehicle categories available. Please add vehicles and categories first.</p>
          </div>
        )}
      </div>
    </Card>
  )
}
