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

      {/* Date Selection Section - Better positioned */}
      {selectedVehicle && (
        <div className="bg-muted/30 p-4 sm:p-6 rounded-lg space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-medium">{t("inspections.labels.inspectionDate")}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("inspections.labels.inspectionDateDescription")}</p>
            </div>
            <Button
              variant="outline"
              size={isMobile ? "default" : "sm"}
              className={cn(
                "w-full sm:w-auto min-h-[44px] sm:min-h-0",
                isMobile && "text-sm"
              )}
              onClick={() => setIsBackdatingEnabled(!isBackdatingEnabled)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span className="truncate">
                {isBackdatingEnabled ? t("inspections.actions.useCurrentDate") : t("inspections.actions.backdateInspection")}
              </span>
            </Button>
          </div>

          {isBackdatingEnabled && (
            <div className="space-y-4">
              <div className="w-full">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal min-h-[44px]",
                        isMobile && "text-sm"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {inspectionDate ? format(inspectionDate, "PPP") : t("inspections.labels.selectDate")}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className={cn(
                      "w-auto p-0",
                      isMobile && "w-[calc(100vw-2rem)] max-w-sm mx-auto"
                    )} 
                    align={isMobile ? "center" : "start"}
                    side={isMobile ? "bottom" : "bottom"}
                  >
                    <CalendarComponent
                      mode="single"
                      selected={inspectionDate}
                      onSelect={setInspectionDate}
                      disabled={(date) => date > new Date() || date < new Date(1900, 0, 1)}
                      initialFocus
                      className={cn(
                        isMobile && "w-full [&_table]:w-full [&_td]:w-[14.28%] [&_td]:p-0 [&_td_button]:w-full [&_td_button]:h-10 [&_td_button]:rounded-none [&_td_button]:text-center [&_td_button]:text-sm"
                      )}
                      classNames={isMobile ? {
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_hidden: "invisible",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full justify-between",
                        head_cell: "text-muted-foreground text-center font-normal text-xs w-[14.28%] px-0",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative w-[14.28%] [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      } : undefined}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {inspectionDate && inspectionDate < new Date() && (
                <div className="flex items-start space-x-2 text-xs sm:text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
                  <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {t("inspections.labels.backdatingWarning", { 
                      date: format(inspectionDate, "PPP"),
                      daysAgo: Math.ceil((new Date().getTime() - inspectionDate.getTime()) / (1000 * 60 * 60 * 24))
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {!isBackdatingEnabled && (
            <div className="text-xs sm:text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              {t("inspections.labels.currentDateInspection", { date: format(new Date(), "PPP") })}
            </div>
          )}
        </div>
      )}

      {/* Vehicle list */}
      <div className="space-y-4">
        <h3 className="font-medium">
          {t('vehicles.available')} ({filteredVehicles.length})
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {filteredVehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className={cn(
                "cursor-pointer transition-colors",
                selectedVehicle?.id === vehicle.id
                  ? "border-primary border-2"
                  : ""
              )}
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
