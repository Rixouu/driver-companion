"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ViewToggle } from "@/components/ui/view-toggle"
import Link from "next/link"
import { DbVehicle } from "@/types"
import { useDebounce } from "@/lib/hooks/use-debounce"
import Image from "next/image"
import { useI18n } from "@/lib/i18n/context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { SearchFilterBar } from "@/components/ui/search-filter-bar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Car, Tag } from "lucide-react"
import { useVehiclePricingCategories } from "@/lib/hooks/useVehiclePricingCategories"

interface VehicleListProps {
  vehicles: DbVehicle[];
  currentPage?: number;
  totalPages?: number;
  initialFilters?: {
    query?: string;
    status?: string;
    brand?: string;
    model?: string;
  };
  brandOptions?: { value: string; label: string }[];
  modelOptions?: { value: string; label: string }[];
}

const ITEMS_PER_PAGE = 9;

export function VehicleList({ 
  vehicles = [], 
  currentPage = 1, 
  totalPages = 1, 
  initialFilters, 
  brandOptions = [], 
  modelOptions = [] 
}: VehicleListProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const [search, setSearch] = useState(initialFilters?.query || '');
  const [statusFilterState, setStatusFilterState] = useState(initialFilters?.status || 'all');
  const [brandFilterState, setBrandFilterState] = useState(initialFilters?.brand || 'all');
  const [modelFilterState, setModelFilterState] = useState(initialFilters?.model || 'all');
  const [view, setView] = useState<"list" | "grid">("list"); // Default to list view
  const debouncedSearch = useDebounce(search, 500);
  const { t } = useI18n();

  // Update local state if initialFilters prop changes
  useEffect(() => {
    setSearch(initialFilters?.query || '');
    setStatusFilterState(initialFilters?.status || 'all');
    setBrandFilterState(initialFilters?.brand || 'all');
    setModelFilterState(initialFilters?.model || 'all');
  }, [initialFilters]);

  // Effect to navigate when debounced search or filters change
  useEffect(() => {
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    if (debouncedSearch) params.set('query', debouncedSearch);
    else params.delete('query');

    if (statusFilterState !== 'all') params.set('status', statusFilterState);
    else params.delete('status');

    if (brandFilterState !== 'all') params.set('brand', brandFilterState);
    else params.delete('brand');

    if (modelFilterState !== 'all') params.set('model', modelFilterState);
    else params.delete('model');
    
    // Only reset to page 1 if filters actually changed, not on initial load
    const currentParams = new URLSearchParams(currentSearchParams?.toString() || '');
    const hasFilterChanges = (
      (debouncedSearch !== (currentParams.get('query') || '')) ||
      (statusFilterState !== (currentParams.get('status') || 'all')) ||
      (brandFilterState !== (currentParams.get('brand') || 'all')) ||
      (modelFilterState !== (currentParams.get('model') || 'all'))
    );
    
    if (hasFilterChanges) {
      params.set("page", "1"); // Reset to page 1 only on filter change
    }
    
    // Only push if params actually changed to avoid redundant navigation
    if (params.toString() !== currentParams.toString()) {
       router.push(`/vehicles?${params.toString()}`);
    }
  }, [debouncedSearch, statusFilterState, brandFilterState, modelFilterState, router, currentSearchParams]);

  // Extract unique brands and models for filters
  // Use normalized brand options passed from server to avoid duplicates like 'Toyota' vs 'toyota'
  const brands = brandOptions.length
    ? brandOptions
    : Array.from(new Set(vehicles.filter(v => v.brand).map(v => (v.brand as string).trim())))
        .map(brand => ({ value: brand.toLowerCase(), label: brand }))
  
  // Get models based on selected brand
  const models = useMemo(() => {
    if (brandFilterState === "all") return []
    const key = brandFilterState.toLowerCase();
    return Array.from(new Set(
      vehicles
        .filter(v => v.model && (v.brand || '').trim().toLowerCase() === key)
        .map(v => v.model as string)
    )).map(model => ({ value: model, label: model }))
  }, [vehicles, brandFilterState])

  // Calculate pagination
  const paginatedVehicles = vehicles;
  const displayTotalPages = totalPages;
  const displayCurrentPage = currentPage;
  
  const serverTotalItems = totalPages * ITEMS_PER_PAGE;
  const displayStartIndex = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, serverTotalItems);
  const displayEndIndex = Math.min(currentPage * ITEMS_PER_PAGE, serverTotalItems);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    params.set("page", page.toString());
    router.push(`/vehicles?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleStatusFilterChange = (newFilter: string) => {
    setStatusFilterState(newFilter);
  };

  const handleBrandFilterChange = (value: string) => {
    setBrandFilterState(value);
    setModelFilterState("all");
  };

  const handleModelFilterChange = (value: string) => {
    setModelFilterState(value);
  };

  function getStatusVariant(status: string) {
    switch (status) {
      case "active":
        return "success"
      case "maintenance":
        return "warning"
      case "inactive":
        return "destructive"
      default:
        return "default"
    }
  }

  // Get colored status button class
  function getStatusButtonClass(status: string, isSelected: boolean) {
    const baseClasses = {
      active: 'border-green-300 text-green-800 dark:border-green-700 dark:text-green-300',
      maintenance: 'border-orange-300 text-orange-800 dark:border-orange-700 dark:text-orange-300',
      inactive: 'border-gray-300 text-gray-800 dark:border-gray-700 dark:text-gray-300',
    };

    const selectedClasses = {
      active: 'bg-green-600 text-white hover:bg-green-700',
      maintenance: 'bg-orange-600 text-white hover:bg-orange-700',
      inactive: 'bg-gray-600 text-white hover:bg-gray-700',
    };

    const unselectedClasses = {
      active: 'bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40',
      maintenance: 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/40',
      inactive: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900/20 dark:hover:bg-gray-900/40',
    };

    const statusKey = status as keyof typeof baseClasses;

    if (isSelected) {
      return cn(baseClasses[statusKey], selectedClasses[statusKey]);
    }
    if (status === 'all') {
      return "border-border text-foreground hover:bg-accent"
    }
    return cn(baseClasses[statusKey], unselectedClasses[statusKey]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <SearchFilterBar 
          onSearchChange={handleSearchChange}
          onBrandFilterChange={handleBrandFilterChange}
          onModelFilterChange={handleModelFilterChange}
          searchPlaceholder={t("vehicles.searchPlaceholder")}
          brandOptions={brandOptions}
          modelOptions={modelFilterState === 'all' && brandFilterState === 'all' ? [] : modelOptions}
          totalItems={serverTotalItems}
          startIndex={displayStartIndex}
          endIndex={displayEndIndex}
          selectedBrand={brandFilterState}
          selectedModel={modelFilterState}
          currentSearchValue={search}
          showingTranslationKey="vehicles.pagination.showing"
        />
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="sm:hidden">
              <Select
                value={statusFilterState}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("common.filter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="active">{t("vehicles.status.active")}</SelectItem>
                  <SelectItem value="maintenance">{t("vehicles.status.maintenance")}</SelectItem>
                  <SelectItem value="inactive">{t("vehicles.status.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden sm:flex flex-wrap gap-2">
              <Button 
                variant={statusFilterState === 'all' ? 'default' : 'outline'}
                onClick={() => handleStatusFilterChange('all')}
                className={cn(
                  statusFilterState === 'all' ? '' : 'border-border text-foreground hover:bg-accent'
                )}
              >
                {t("common.all")}
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleStatusFilterChange('active')}
                className={cn(getStatusButtonClass('active', statusFilterState === 'active'))}
              >
                {t("vehicles.status.active")}
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleStatusFilterChange('maintenance')}
                className={cn(getStatusButtonClass('maintenance', statusFilterState === 'maintenance'))}
              >
                {t("vehicles.status.maintenance")}
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleStatusFilterChange('inactive')}
                className={cn(getStatusButtonClass('inactive', statusFilterState === 'inactive'))}
              >
                {t("vehicles.status.inactive")}
              </Button>
            </div>
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>
      
      {paginatedVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
          <Car className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-center">
            {t("vehicles.noVehicles")}
          </p>
        </div>
      ) : (
        <>
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <Link href={`/vehicles/${vehicle.id}`}>
                    <div className="relative aspect-video w-full">
                      {vehicle.image_url ? (
                        <Image
                          src={vehicle.image_url}
                          alt={vehicle.name}
                          fill
                          className="object-cover rounded-t-lg"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-t-lg">
                          <Car className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{vehicle.plate_number}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge 
                          className={cn(
                            "font-medium border-0",
                            vehicle.status === 'active' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                            vehicle.status === 'maintenance' && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                            vehicle.status === 'inactive' && "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          )}
                        >
                          {t(`vehicles.status.${vehicle.status}`)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {vehicle.brand} {vehicle.model}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Desktop List View with Thumbnails */}
              <div className="hidden sm:block space-y-3">
                {paginatedVehicles.map((vehicle) => (
                  <Card 
                    key={vehicle.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                    onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                  >
                    <div className="flex items-center p-4">
                      {/* Vehicle Thumbnail - Medium size */}
                      <div className="w-24 h-16 relative flex-shrink-0 mr-6">
                        {vehicle.image_url ? (
                          <Image
                            src={vehicle.image_url}
                            alt={vehicle.name}
                            fill
                            sizes="96px"
                            className="object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center rounded-md">
                            <Car className="h-6 w-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      
                      {/* Vehicle Info - Flexbox layout */}
                      <div className="flex-1 grid grid-cols-4 items-center gap-4">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                          <p className="text-sm text-muted-foreground font-mono">{vehicle.plate_number}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            {vehicle.brand} {vehicle.model}
                          </Badge>
                          {vehicle.year && (
                            <span className="text-sm text-muted-foreground">({vehicle.year})</span>
                          )}
                        </div>
                        
                        <div className="flex justify-center">
                          <Badge 
                            className={cn(
                              "font-medium border",
                              vehicle.status === 'active' && "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700",
                              vehicle.status === 'maintenance' && "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700",
                              vehicle.status === 'inactive' && "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-green-300 dark:border-green-700"
                            )}
                          >
                            {t(`vehicles.status.${vehicle.status}`)}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-center">
                          <VehiclePricingCategoriesBadges vehicleId={vehicle.id} />
                        </div>
                        
                        <div className="flex justify-end">
                          <Button variant="outline" size="sm">
                            {t("common.view")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 sm:hidden">
                {paginatedVehicles.map((vehicle) => (
                  <Card 
                    key={vehicle.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                  >
                    <div className="flex">
                      {/* Vehicle Thumbnail */}
                      <div className="w-28 h-20 relative flex-shrink-0">
                        {vehicle.image_url ? (
                          <Image
                            src={vehicle.image_url}
                            alt={vehicle.name}
                            fill
                            sizes="112px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Car className="h-6 w-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      
                      {/* Vehicle Info */}
                      <div className="flex-1 p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-base">{vehicle.name}</h3>
                            <p className="text-sm text-muted-foreground font-mono">{vehicle.plate_number}</p>
                          </div>
                          <Badge 
                            className={cn(
                              "text-xs font-medium border-0",
                              vehicle.status === 'active' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                              vehicle.status === 'maintenance' && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                              vehicle.status === 'inactive' && "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                            )}
                          >
                            {t(`vehicles.status.${vehicle.status}`)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {vehicle.brand} {vehicle.model}
                          </Badge>
                          {vehicle.year && (
                            <span className="text-xs text-muted-foreground">{vehicle.year}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Improved Pagination */}
          {displayTotalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  {displayCurrentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(displayCurrentPage - 1);
                        }}
                      />
                    </PaginationItem>
                  )}
                  
                  {/* Show first page */}
                  {displayCurrentPage > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(1);
                          }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {displayCurrentPage > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}
                  
                  {/* Show pages around current */}
                  {Array.from({ length: Math.min(5, displayTotalPages) }, (_, i) => {
                    const startPage = Math.max(1, displayCurrentPage - 2);
                    const endPage = Math.min(displayTotalPages, startPage + 4);
                    const adjustedStartPage = Math.max(1, endPage - 4);
                    const pageNumber = adjustedStartPage + i;
                    
                    if (pageNumber <= endPage) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(pageNumber);
                            }}
                            isActive={displayCurrentPage === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  {/* Show last page */}
                  {displayCurrentPage < displayTotalPages - 2 && (
                    <>
                      {displayCurrentPage < displayTotalPages - 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(displayTotalPages);
                          }}
                        >
                          {displayTotalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  {displayCurrentPage < displayTotalPages && (
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(displayCurrentPage + 1);
                        }}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface VehiclePricingCategoriesBadgesProps {
  vehicleId: string;
}

function VehiclePricingCategoriesBadges({ vehicleId }: VehiclePricingCategoriesBadgesProps) {
  const { categories, isLoading } = useVehiclePricingCategories(vehicleId);

  if (isLoading) {
    return (
      <div className="flex gap-1">
        <div className="h-5 w-12 bg-muted rounded animate-pulse"></div>
        <div className="h-5 w-8 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        No categories
      </div>
    );
  }

  // Show only the first 2 categories to avoid cluttering
  const displayCategories = categories.slice(0, 2);
  const hasMore = categories.length > 2;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {displayCategories.map((category) => (
        <Badge
          key={category.id}
          variant="outline"
          className="text-xs px-2 py-1 h-5"
        >
          {category.name}
        </Badge>
      ))}
      {hasMore && (
        <Badge variant="secondary" className="text-xs px-2 py-1 h-5">
          +{categories.length - 2}
        </Badge>
      )}
    </div>
  );
} 