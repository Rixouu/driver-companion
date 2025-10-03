"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Search, Filter, XCircle, Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { useIsMobile } from "@/lib/hooks/use-mobile"
import Image from "next/image"
// Local Vehicle interface to match the parent component
interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand?: string;
  model?: string;
  image_url?: string | null;
  year?: string;
  vehicle_group_id?: string;
  vehicle_group?: {
    id: string;
    name: string;
    description?: string;
    color: string;
    vehicle_count?: number;
  };
}

interface VehicleSelectionStepProps {
  vehicles: Vehicle[]
  selectedVehicle: Vehicle | null
  onVehicleSelect: (vehicle: Vehicle) => void
  onNext: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  brandFilter: string
  setBrandFilter: (brand: string) => void
  modelFilter: string
  setModelFilter: (model: string) => void
  groupFilter: string
  setGroupFilter: (group: string) => void
  inspectionDate: Date | undefined
  setInspectionDate: (date: Date | undefined) => void
  isBackdatingEnabled: boolean
  setIsBackdatingEnabled: (enabled: boolean) => void
  isSearchFiltersExpanded: boolean
  setIsSearchFiltersExpanded: (expanded: boolean) => void
  brandOptions: Array<{ value: string; label: string }>
  modelOptions: Array<{ value: string; label: string }>
  groupOptions: Array<{ value: string; label: string }>
  filteredVehicles: Vehicle[]
}

export function VehicleSelectionStep({
  vehicles,
  selectedVehicle,
  onVehicleSelect,
  onNext,
  searchQuery,
  setSearchQuery,
  brandFilter,
  setBrandFilter,
  modelFilter,
  setModelFilter,
  groupFilter,
  setGroupFilter,
  inspectionDate,
  setInspectionDate,
  isBackdatingEnabled,
  setIsBackdatingEnabled,
  isSearchFiltersExpanded,
  setIsSearchFiltersExpanded,
  brandOptions,
  modelOptions,
  groupOptions,
  filteredVehicles
}: VehicleSelectionStepProps) {
  const { t } = useI18n()
  const isMobile = useIsMobile()

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('inspections.steps.selectVehicle')}</h2>
      
      {/* Search and filters */}
      <div className="bg-muted/30 rounded-lg">
        {/* Collapsible header - only show on mobile/tablet */}
        <div className={cn(
          "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors",
          "sm:hidden" // Only show on mobile/tablet
        )} onClick={() => setIsSearchFiltersExpanded(!isSearchFiltersExpanded)}>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-foreground/70" />
            <span className="font-medium text-foreground">Search & Filters</span>
            {(searchQuery || brandFilter !== "all" || modelFilter !== "all" || groupFilter !== "all") && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              setIsSearchFiltersExpanded(!isSearchFiltersExpanded);
            }}
          >
            {isSearchFiltersExpanded ? (
              <ChevronUp className="h-4 w-4 text-foreground/70" />
            ) : (
              <ChevronDown className="h-4 w-4 text-foreground/70" />
            )}
          </Button>
        </div>

        {/* Desktop header - only show on desktop */}
        <div className="hidden sm:block px-4 pt-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-foreground/70" />
            <span className="font-medium text-foreground">Search & Filters</span>
            {(searchQuery || brandFilter !== "all" || modelFilter !== "all" || groupFilter !== "all") && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Collapsible content */}
        <div className={cn(
          "space-y-4 transition-all duration-300 ease-in-out overflow-hidden",
          isMobile ? (isSearchFiltersExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0") : "max-h-none opacity-100"
        )}>
          <div className="px-4 pb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search input */}
              <div className="flex-1 relative">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('vehicles.filters.searchPlaceholder')}
                  className="pl-9 w-full"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                {searchQuery && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0" 
                    onClick={() => setSearchQuery("")}
                  >
                    <XCircle className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                )}
              </div>
              
              {/* Brand filter */}
              <div className="w-full sm:w-48">
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('drivers.filters.brand')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('drivers.filters.allBrands')}</SelectItem>
                    {brandOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Model filter - only show if brand is selected */}
              {brandFilter !== "all" && (
                <div className="w-full sm:w-48">
                  <Select value={modelFilter} onValueChange={setModelFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('drivers.filters.model')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('drivers.filters.allModels')}</SelectItem>
                      {modelOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Group filter */}
              <div className="w-full sm:w-48">
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('drivers.filters.group')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('drivers.filters.allGroups')}</SelectItem>
                    {groupOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date selection */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <h3 className="font-medium mb-2">{t('inspections.date.title')}</h3>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[280px] justify-start text-left font-normal",
                      !inspectionDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {inspectionDate ? format(inspectionDate, "PPP") : t('inspections.date.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={inspectionDate}
                    onSelect={setInspectionDate}
                    disabled={(date) => date < new Date() && !isBackdatingEnabled}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {inspectionDate && inspectionDate < new Date() && !isBackdatingEnabled && (
              <p className="text-sm text-amber-600 mt-2">
                {t('inspections.date.backdatingWarning')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="backdating"
              checked={isBackdatingEnabled}
              onChange={(e) => setIsBackdatingEnabled(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="backdating" className="text-sm font-medium">
              {t('inspections.date.enableBackdating')}
            </label>
          </div>
        </div>
      </div>

      {/* Vehicle list */}
      <div className="space-y-4">
        <h3 className="font-medium">
          {t('vehicles.available')} ({filteredVehicles.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedVehicle?.id === vehicle.id
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-muted/50"
              )}
              onClick={() => onVehicleSelect(vehicle)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Vehicle Thumbnail */}
                  {vehicle.image_url ? (
                    <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={vehicle.image_url}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-muted-foreground text-sm">
                        {t('vehicles.noImage')}
                      </div>
                    </div>
                  )}
                  
                  {/* Vehicle Details */}
                  <div className="space-y-2">
                    <h4 className="font-medium">{vehicle.brand} {vehicle.model}</h4>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.plate_number} • {vehicle.year}
                    </p>
                    {vehicle.vehicle_group && (
                      <span className="inline-block bg-muted px-2 py-1 rounded text-xs">
                        {vehicle.vehicle_group.name}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Next button */}
      {selectedVehicle && (
        <div className="flex justify-end">
          <Button onClick={onNext} className="w-full sm:w-auto">
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  )
}
