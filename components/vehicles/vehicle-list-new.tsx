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
import { Car, Tag, Trash2, Download, TrendingUp, Users, EyeIcon, FileEditIcon } from "lucide-react"

import { VehicleFilter, VehicleFilterOptions } from "./vehicle-filter"

interface VehicleListProps {
  vehicles: DbVehicle[];
  currentPage?: number;
  totalPages?: number;
  isLoading?: boolean;
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
  isLoading = false,
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
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
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

  // Selection management
  const handleSelectAll = () => {
    if (selectedVehicles.size === paginatedVehicles.length) {
      setSelectedVehicles(new Set());
    } else {
      setSelectedVehicles(new Set(paginatedVehicles.map(v => v.id)));
    }
  };

  const handleSelectVehicle = (vehicleId: string) => {
    const newSelected = new Set(selectedVehicles);
    if (newSelected.has(vehicleId)) {
      newSelected.delete(vehicleId);
    } else {
      newSelected.add(vehicleId);
    }
    setSelectedVehicles(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedVehicles.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedVehicles.size} vehicle(s)?`)) {
      // TODO: Implement bulk delete API call
      console.log('Deleting vehicles:', Array.from(selectedVehicles));
      setSelectedVehicles(new Set());
    }
  };

  const handleExportCSV = () => {
    if (selectedVehicles.size === 0) return;
    
    // TODO: Implement CSV export
    console.log('Exporting vehicles:', Array.from(selectedVehicles));
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
      {/* Stats Overview - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Vehicles - Blue */}
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Total Vehicles</CardTitle>
            <Car className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{vehicles.length.toLocaleString()}</div>
          </CardContent>
        </Card>

        {/* Active Vehicles - Green */}
        <Card className="relative overflow-hidden border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Active Vehicles</CardTitle>
            <Car className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
              {vehicles.filter(vehicle => vehicle.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        {/* Vehicles in Maintenance - Orange */}
        <Card className="relative overflow-hidden border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">In Maintenance</CardTitle>
            <Tag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold break-words text-orange-600 dark:text-orange-400">
              {vehicles.filter(vehicle => vehicle.status === 'maintenance').length}
            </div>
          </CardContent>
        </Card>

        {/* Active Categories - Purple */}
        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Categories</CardTitle>
            <Tag className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {new Set(vehicles.map(vehicle => vehicle.status)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <VehicleFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalVehicles={filteredVehicles.length}
          brandOptions={brands}
          modelOptions={models}
          categoryOptions={categoryOptions}
        />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t("vehicles.showing")} {filteredVehicles.length} {t("vehicles.vehicles")}
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>

        {/* Select All Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedVehicles.size === paginatedVehicles.length && paginatedVehicles.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              aria-label="Select all vehicles"
            />
            <span className="text-sm font-medium text-muted-foreground">Select All</span>
            {selectedVehicles.size > 0 && (
              <span className="text-sm text-muted-foreground">
                ({selectedVehicles.size} of {paginatedVehicles.length} selected)
              </span>
            )}
          </div>

          {/* Multi-select Actions */}
          {selectedVehicles.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedVehicles.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVehicles(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
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
                <Card key={vehicle.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-border/60 bg-card/95 backdrop-blur">
                  <div className="relative">
                    {/* Selection Checkbox - Top Right */}
                    <div className="absolute top-2 right-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedVehicles.has(vehicle.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectVehicle(vehicle.id);
                        }}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-background/80"
                        aria-label={`Select ${vehicle.name}`}
                      />
                    </div>
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
                          <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center rounded-t-lg">
                            <Car className="h-12 w-12 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-foreground">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded-md inline-block">
                          {vehicle.plate_number}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={cn(
                              "font-medium border-0 px-2.5 py-1.5 h-6",
                              vehicle.status === 'active' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                              vehicle.status === 'maintenance' && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                              vehicle.status === 'inactive' && "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                            )}
                          >
                            {t(`vehicles.status.${vehicle.status}`)}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2.5 py-1.5 h-6 bg-background/80">
                            {vehicle.brand} {vehicle.model}
                          </Badge>
                        </div>
                        {/* Pricing Group */}
                        <div className="flex justify-start">
                          <VehiclePricingGroupDisplay vehicleId={vehicle.id} />
                        </div>
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
                {/* Column Headers */}
                <div className="grid grid-cols-12 items-center gap-4 px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
                  <div className="col-span-1">
                    <span className="text-sm font-medium text-muted-foreground">Select</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-sm font-medium text-muted-foreground">Vehicle</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-sm font-medium text-muted-foreground">Details</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-muted-foreground">Brand & Model</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-muted-foreground">Pricing Group</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-sm font-medium text-muted-foreground">Actions</span>
                  </div>
                </div>

                {paginatedVehicles.map((vehicle) => (
                  <Card 
                    key={vehicle.id} 
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border-border/60 bg-card/95 backdrop-blur"
                    onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                  >
                    <div className="grid grid-cols-12 items-center gap-4 p-4">
                      {/* Selection Checkbox */}
                      <div className="col-span-1 flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedVehicles.has(vehicle.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectVehicle(vehicle.id);
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          aria-label={`Select ${vehicle.name}`}
                        />
                      </div>
                      
                      {/* Vehicle Column - Thumbnail, Name and Plate */}
                      <div className="col-span-3 flex items-center gap-3 justify-start">
                        <div className="w-20 h-14 relative flex-shrink-0 rounded-lg overflow-hidden border border-border/40">
                          {vehicle.image_url ? (
                            <Image
                              src={vehicle.image_url}
                              alt={vehicle.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                              <Car className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <h3 className="font-semibold text-sm text-foreground truncate text-left">{vehicle.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded-md text-left">
                            {vehicle.plate_number}
                          </p>
                        </div>
                      </div>
                      
                      {/* Details Column - Year */}
                      <div className="col-span-1 flex items-center justify-start">
                        {vehicle.year && (
                          <span className="text-sm text-muted-foreground bg-muted/20 px-2 py-1 rounded-md text-left">
                            {vehicle.year}
                          </span>
                        )}
                      </div>
                      
                      {/* Brand & Model Column - Separated for better readability */}
                      <div className="col-span-2 space-y-1 flex flex-col items-start justify-start">
                        <div className="text-sm font-medium text-foreground text-left">
                          {vehicle.brand}
                        </div>
                        <div className="text-sm text-muted-foreground text-left">
                          {vehicle.model}
                        </div>
                      </div>
                      
                      {/* Status Column */}
                      <div className="col-span-1 flex justify-start">
                        <Badge 
                          className={cn(
                            "font-medium border px-2.5 py-1.5 h-6",
                            vehicle.status === 'active' && "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700",
                            vehicle.status === 'maintenance' && "bg-orange-100 text-orange-800 border-orange-300 dark:bg-green-900/20 dark:text-orange-300 dark:border-orange-700",
                            vehicle.status === 'inactive' && "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700"
                          )}
                        >
                          {t(`vehicles.status.${vehicle.status}`)}
                        </Badge>
                      </div>
                      
                      {/* Pricing Group Column */}
                      <div className="col-span-2 flex justify-start">
                        <VehiclePricingGroupDisplay vehicleId={vehicle.id} />
                      </div>
                      
                      {/* Action Column */}
                      <div className="col-span-1 flex justify-start gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild 
                          className="flex items-center gap-2"
                        >
                          <Link href={`/vehicles/${vehicle.id}`}>
                            <EyeIcon className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild 
                          className="flex items-center gap-2"
                        >
                          <Link href={`/vehicles/${vehicle.id}/edit`}>
                            <FileEditIcon className="h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Mobile List View - Enhanced Design */}
              <div className="sm:hidden space-y-4">
                {paginatedVehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-border/60 bg-card/95 backdrop-blur">
                    <div className="p-4">
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedVehicles.has(vehicle.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectVehicle(vehicle.id);
                            }}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary flex-shrink-0"
                            aria-label={`Select ${vehicle.name}`}
                          />
                          {/* Enhanced Vehicle Thumbnail */}
                          <div className="w-20 h-14 relative flex-shrink-0 rounded-lg overflow-hidden border border-border/40">
                            {vehicle.image_url ? (
                              <Image
                                src={vehicle.image_url}
                                alt={vehicle.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                                <Car className="h-7 w-7 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          
                          {/* Vehicle Name and Plate */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-foreground truncate mb-1">
                              {vehicle.name}
                            </h3>
                            <p className="text-sm text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded-md inline-block">
                              {vehicle.plate_number}
                            </p>
                          </div>
                        </div>
                        
                        {/* Status Badge - Top Right */}
                        <Badge 
                          className={cn(
                            "text-xs font-medium border-0 px-3 py-1.5 h-auto",
                            vehicle.status === 'active' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                            vehicle.status === 'maintenance' && "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
                            vehicle.status === 'inactive' && "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          )}
                        >
                          {t(`vehicles.status.${vehicle.status}`)}
                        </Badge>
                      </div>
                      
                      {/* Details Row */}
                      <div className="space-y-3">
                        {/* Brand and Model - Separated for better readability */}
                        <div className="flex items-center gap-3">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-foreground">
                              {vehicle.brand}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {vehicle.model}
                            </div>
                          </div>
                          {vehicle.year && (
                            <span className="text-sm text-muted-foreground bg-muted/20 px-2 py-1 rounded-md">
                              {vehicle.year}
                            </span>
                          )}
                        </div>
                        
                        {/* Pricing Group */}
                        <div className="flex justify-start">
                          <VehiclePricingGroupDisplay vehicleId={vehicle.id} />
                        </div>
                      </div>
                      
                      {/* Action Button - Full Width */}
                      <div className="mt-4 pt-3 border-t border-border/40">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild 
                          className="flex items-center gap-2 w-full justify-center"
                        >
                          <Link href={`/vehicles/${vehicle.id}`}>
                            <EyeIcon className="h-4 w-4" />
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
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



interface VehiclePricingGroupDisplayProps {
  vehicleId: string;
}

function VehiclePricingGroupDisplay({ vehicleId }: VehiclePricingGroupDisplayProps) {
  const [pricingCategory, setPricingCategory] = useState<{ name: string; description: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPricingCategory() {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}/pricing-categories`);
        if (response.ok) {
          const data = await response.json();
          if (data.categories && data.categories.length > 0) {
            setPricingCategory(data.categories[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch pricing category:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPricingCategory();
  }, [vehicleId]);

  if (isLoading) {
    return (
      <div className="flex gap-1">
        <div className="h-5 w-12 bg-muted rounded animate-pulse"></div>
        <div className="h-5 w-8 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (!pricingCategory) {
    return (
      <div className="text-xs text-muted-foreground">
        No pricing group
      </div>
    );
  }

  // Show the pricing category as the main pricing group
  return (
    <div className="flex flex-wrap gap-2 items-center justify-start w-full">
      <Badge 
        variant="outline" 
        className="text-xs px-2.5 py-1.5 h-6 font-medium bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700"
      >
        {pricingCategory.name}
      </Badge>
    </div>
  );
}