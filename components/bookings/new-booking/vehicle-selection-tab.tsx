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
}

export function VehicleSelectionTab({
  formData,
  setFormData,
  availableCategories,
  vehiclesWithCategories,
  vehicleFilters,
  setVehicleFilters,
  filteredVehicles,
  getFilterOptions
}: VehicleSelectionTabProps) {
  return (
    <Card className="border rounded-lg shadow-sm dark:border-gray-800">
      <div className="border-b py-4 px-6">
        <h2 className="text-lg font-semibold flex items-center">
          <Car className="mr-2 h-5 w-5" />
          Select Your Vehicle
        </h2>
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
          
          {/* Luggage Filter */}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Min. Luggage</Label>
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
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryVehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className={`
                          border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md
                          ${formData.vehicle_id === vehicle.id ? 'border-2 border-primary ring-2 ring-primary/20 bg-primary/5' : 'hover:border-primary/50'}
                        `}
                        onClick={() => {
                          setFormData((prev: any) => ({
                            ...prev,
                            vehicle_id: vehicle.id,
                            selectedVehicle: vehicle,
                            // Update vehicle details fields to match selected vehicle
                            vehicle_make: vehicle.brand,
                            vehicle_model: vehicle.model,
                            vehicle_capacity: vehicle.passenger_capacity,
                            vehicle_year: vehicle.year?.toString()
                          }))
                        }}
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
                                <span>{vehicle.luggage_capacity || 0} luggage</span>
                              </div>
                            </div>
                            
                            {/* Select Button */}
                            <Button
                              variant={formData.vehicle_id === vehicle.id ? "default" : "outline"}
                              size="sm"
                              className="w-full mt-3"
                              onClick={(e) => {
                                e.stopPropagation()
                                setFormData((prev: any) => ({
                                  ...prev,
                                  vehicle_id: vehicle.id,
                                  selectedVehicle: vehicle,
                                  // Update vehicle details fields to match selected vehicle
                                  vehicle_make: vehicle.brand,
                                  vehicle_model: vehicle.model,
                                  vehicle_capacity: vehicle.passenger_capacity,
                                  vehicle_year: vehicle.year?.toString()
                                }))
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
