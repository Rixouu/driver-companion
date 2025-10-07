"use client"

import { Search, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { useIsMobile } from "@/lib/hooks/use-mobile"

interface FilterOption {
  value: string;
  label: string;
}

interface VehicleGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  vehicle_count?: number;
}

interface VehicleSearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  brandFilter: string;
  setBrandFilter: (filter: string) => void;
  modelFilter: string;
  setModelFilter: (filter: string) => void;
  groupFilter: string;
  setGroupFilter: (filter: string) => void;
  isSearchFiltersExpanded: boolean;
  setIsSearchFiltersExpanded: (expanded: boolean) => void;
  brandOptions: FilterOption[];
  modelOptions: FilterOption[];
  groupOptions: FilterOption[];
  vehicleGroups: VehicleGroup[];
  filteredVehicles: any[];
  currentPage: number;
  vehiclesPerPage: number;
  resetFilters: () => void;
}

export function VehicleSearchFilters({
  searchQuery,
  setSearchQuery,
  brandFilter,
  setBrandFilter,
  modelFilter,
  setModelFilter,
  groupFilter,
  setGroupFilter,
  isSearchFiltersExpanded,
  setIsSearchFiltersExpanded,
  brandOptions,
  modelOptions,
  groupOptions,
  vehicleGroups,
  filteredVehicles,
  currentPage,
  vehiclesPerPage,
  resetFilters
}: VehicleSearchFiltersProps) {
  const { t } = useI18n();
  const isMobile = useIsMobile();

  return (
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
                    {modelOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Vehicle Group filter */}
            <div className="w-full sm:w-48">
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('vehicleGroups.filter')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('vehicleGroups.allGroups')}</SelectItem>
                  {vehicleGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Clear filters button - only show if any filter is applied */}
            {(searchQuery || brandFilter !== "all" || modelFilter !== "all" || groupFilter !== "all") && (
              <Button 
                variant="outline" 
                size="sm" 
                className="sm:self-end" 
                onClick={resetFilters}
              >
                {t('drivers.filters.clearFilters')}
              </Button>
            )}
          </div>
          
          {/* Showing results info */}
          <div className="text-sm text-muted-foreground mt-4">
            {t('inspections.labels.showingVehicles', {
              start: String(Math.min((currentPage - 1) * vehiclesPerPage + 1, filteredVehicles.length)),
              end: String(Math.min(currentPage * vehiclesPerPage, filteredVehicles.length)),
              total: String(filteredVehicles.length)
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
