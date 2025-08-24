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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { Car, Tag } from "lucide-react"
import { useVehiclePricingCategories } from "@/lib/hooks/useVehiclePricingCategories"
import { VehicleFilter, VehicleFilterOptions } from "./vehicle-filter"

interface VehicleListProps {
  vehicles: DbVehicle[];
  currentPage?: number;
  totalPages?: number;
  initialFilters?: {
    query?: string;
    status?: string;
    brand?: string;
    model?: string;
    category?: string;
  };
  brandOptions?: { value: string; label: string }[];
  modelOptions?: { value: string; label: string }[];
  categoryOptions?: { value: string; label: string }[];
}

const ITEMS_PER_PAGE = 9;

export function VehicleList({ 
  vehicles = [], 
  currentPage = 1, 
  totalPages = 1, 
  initialFilters, 
  brandOptions = [], 
  modelOptions = [],
  categoryOptions = []
}: VehicleListProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const [filters, setFilters] = useState<VehicleFilterOptions>({
    searchQuery: initialFilters?.query || '',
    statusFilter: initialFilters?.status || 'all',
    brandFilter: initialFilters?.brand || 'all',
    modelFilter: initialFilters?.model || 'all',
    categoryFilter: initialFilters?.category || 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [view, setView] = useState<"list" | "grid">("list");
  const debouncedSearch = useDebounce(filters.searchQuery, 500);
  const { t } = useI18n();

  // Update local state if initialFilters prop changes
  useEffect(() => {
    setFilters({
      searchQuery: initialFilters?.query || '',
      statusFilter: initialFilters?.status || 'all',
      brandFilter: initialFilters?.brand || 'all',
      modelFilter: initialFilters?.model || 'all',
      categoryFilter: initialFilters?.category || 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }, [initialFilters]);

  // Effect to navigate when debounced search or filters change
  useEffect(() => {
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    if (debouncedSearch) params.set('query', debouncedSearch);
    else params.delete('query');

    if (filters.statusFilter !== 'all') params.set('status', filters.statusFilter);
    else params.delete('status');

    if (filters.brandFilter !== 'all') params.set('brand', filters.brandFilter);
    else params.delete('brand');

    if (filters.modelFilter !== 'all') params.set('model', filters.modelFilter);
    else params.delete('model');
    
    if (filters.categoryFilter !== 'all') params.set('category', filters.categoryFilter);
    else params.delete('category');
    
    const newUrl = params.toString() ? `?${params.toString()}` : ""
    router.replace(newUrl as any, { scroll: false })
  }, [debouncedSearch, filters.statusFilter, filters.brandFilter, filters.modelFilter, filters.categoryFilter, router])

  // Use brand options from server
  const brands = brandOptions
  
  // Use model options from server, filtered by selected brand
  const models = useMemo(() => {
    if (filters.brandFilter === "all") return modelOptions;
    return modelOptions.filter(model => {
      // Find vehicles with this model and check if they match the selected brand
      return vehicles.some(v => 
        v.model === model.value && 
        v.brand?.toLowerCase() === filters.brandFilter.toLowerCase()
      );
    });
  }, [modelOptions, vehicles, filters.brandFilter])

  // Filter vehicles based on search and filters
  // Note: Most filtering is done server-side, this is just for search and local state
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Search filter (local)
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = !debouncedSearch || 
        vehicle.name?.toLowerCase().includes(searchLower) ||
        vehicle.plate_number?.toLowerCase().includes(searchLower) ||
        vehicle.brand?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower);

      // Other filters are handled server-side, so we just return true
      return matchesSearch;
    });
  }, [vehicles, debouncedSearch]);

  // Sort vehicles
  const sortedVehicles = useMemo(() => {
    return [...filteredVehicles].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'plate_number':
          aValue = a.plate_number || '';
          bValue = b.plate_number || '';
          break;
        case 'brand':
          aValue = a.brand || '';
          bValue = b.brand || '';
          break;
        case 'model':
          aValue = a.model || '';
          bValue = b.model || '';
          break;
        case 'year':
          aValue = a.year || 0;
          bValue = b.year || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at || '').getTime();
          bValue = new Date(b.created_at || '').getTime();
          break;
        default:
          return 0;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredVehicles, filters.sortBy, filters.sortOrder]);

  // Calculate pagination
  const paginatedVehicles = sortedVehicles;
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

  const handleFiltersChange = (newFilters: VehicleFilterOptions) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      statusFilter: 'all',
      brandFilter: 'all',
      modelFilter: 'all',
      categoryFilter: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    });
    
    // Clear URL parameters and navigate to base vehicles page
    router.push('/vehicles');
  };

  // Get status button classes
  const getStatusButtonClass = (status: string, isSelected: boolean) => {
    const baseClasses = {
      active: 'bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40',
      maintenance: 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/40',
      inactive: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900/20 dark:hover:bg-gray-900/40',
    };

    const statusKey = status as keyof typeof baseClasses;

    if (isSelected) {
      return cn(baseClasses[statusKey], 'border-green-500 text-green-700 dark:border-green-400 dark:text-green-300');
    }
    if (status === 'all') {
      return "border-border text-foreground hover:bg-accent"
    }
    return cn(baseClasses[statusKey], 'border-border text-foreground hover:bg-accent');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <VehicleFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalVehicles={filteredVehicles.length}
          brandOptions={brands}
          modelOptions={models}
          categoryOptions={categoryOptions}
        />
        
        <div className="flex items-center justify-end">
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
                      <div className="flex-1 grid grid-cols-5 items-center gap-4">
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
                              vehicle.status === 'inactive' && "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700"
                            )}
                          >
                            {t(`vehicles.status.${vehicle.status}`)}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-center">
                          <VehiclePricingCategoriesBadges vehicleId={vehicle.id} />
                        </div>
                        
                        <div className="flex justify-end">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/vehicles/${vehicle.id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Mobile Grid View */}
              <div className="sm:hidden grid gap-4 grid-cols-1">
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
                            sizes="(max-width: 640px) 100vw"
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
            </>
          )}
        </>
      )}

      {/* Pagination */}
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
