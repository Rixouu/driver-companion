"use client"

import { ArrowLeft, ArrowRight, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import Image from "next/image"

interface VehicleGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  vehicle_count?: number;
}

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand?: string;
  model?: string;
  image_url?: string | null;
  year?: string;
  vehicle_group_id?: string;
  vehicle_group?: VehicleGroup;
}

interface VehicleListProps {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  onVehicleSelect: (vehicle: Vehicle) => void;
  filteredVehicles: Vehicle[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  vehiclesPerPage: number;
  resetFilters: () => void;
}

export function VehicleList({
  vehicles,
  selectedVehicle,
  onVehicleSelect,
  filteredVehicles,
  currentPage,
  setCurrentPage,
  vehiclesPerPage,
  resetFilters
}: VehicleListProps) {
  const { t } = useI18n();

  return (
    <>
      {/* Vehicle list */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-8 border rounded-lg mt-4">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">
            {t('drivers.filters.noResults')}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
            {t('vehicles.noVehicles')}
          </p>
          <Button variant="outline" onClick={resetFilters}>
            {t('drivers.filters.clearFilters')}
          </Button>
        </div>
      ) : (
        <div className="relative">
          <ScrollArea className="h-[60vh] pr-4 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 pb-2">
              {vehicles.map((vehicle) => (
                <Card 
                  key={vehicle.id} 
                  className={`cursor-pointer transition-colors ${selectedVehicle?.id === vehicle.id ? 'border-primary border-2' : ''}`}
                  onClick={() => onVehicleSelect(vehicle)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-row gap-4 items-center">
                      {/* Vehicle thumbnail with 16:9 aspect ratio */}
                      <div className="w-24 sm:w-48 shrink-0 flex items-center">
                        <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden">
                          {vehicle.image_url ? (
                            <Image 
                              src={vehicle.image_url} 
                              alt={vehicle.name}
                              fill
                              sizes="(max-width: 768px) 96px, 192px"
                              className="object-cover"
                              priority={currentPage === 1}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground">{t('common.noImage')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Vehicle details */}
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="font-medium text-lg">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">{vehicle.plate_number}</p>
                        {vehicle.brand && vehicle.model && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {vehicle.year && <span>{vehicle.year} </span>}
                            <span>{vehicle.brand} </span>
                            <span>{vehicle.model}</span>
                          </p>
                        )}
                        {vehicle.vehicle_group && (
                          <div className="flex items-center gap-2 mt-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: vehicle.vehicle_group.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {vehicle.vehicle_group.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Pagination controls */}
      {filteredVehicles.length > vehiclesPerPage && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            {t('drivers.pagination.page', { page: String(currentPage) })} {t('drivers.pagination.of', { total: String(Math.ceil(filteredVehicles.length / vehiclesPerPage)) })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredVehicles.length / vehiclesPerPage)))}
              disabled={currentPage >= Math.ceil(filteredVehicles.length / vehiclesPerPage)}
            >
              <ArrowRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
