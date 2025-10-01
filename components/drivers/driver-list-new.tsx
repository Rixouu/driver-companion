"use client"

import React, { useState, useEffect, useMemo } from "react"
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
import { Driver } from "@/types/drivers"
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
import { getDriverStatusBadgeClasses } from "@/lib/utils/styles"
import { 
  Car, 
  Tag, 
  Trash2, 
  Download, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  CheckSquare,
  Square,
  TrendingUp,
  Users,
  EyeIcon,
  FileEditIcon
} from "lucide-react"
import { DriverFilter, DriverFilterOptions } from "./driver-filter"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { DeleteConfirmationModal } from "@/components/shared/delete-confirmation-modal"
import { toast } from "@/components/ui/use-toast"

interface DriverListProps {
  drivers: Driver[];
  currentPage?: number;
  totalPages?: number;
  isLoading?: boolean;
  viewMode?: "list" | "grid";
  onViewModeChange?: (view: "list" | "grid") => void;
  initialFilters?: {
    searchQuery?: string;
    statusFilter?: string;
    availabilityFilter?: string;
    licenseFilter?: string;
    sortBy?: string;
    sortOrder?: string;
  };
  availabilityOptions?: { value: string; label: string }[];
}

const ITEMS_PER_PAGE = 9;

export function DriverList({ 
  drivers = [], 
  currentPage = 1, 
  totalPages = 1, 
  isLoading = false,
  viewMode = "list",
  onViewModeChange,
  initialFilters, 
  availabilityOptions = []
}: DriverListProps) {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Pagination logic
  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return drivers.slice(startIndex, endIndex)
  }, [drivers, currentPage])

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedDrivers.size === paginatedDrivers.length) {
      setSelectedDrivers(new Set())
    } else {
      setSelectedDrivers(new Set(paginatedDrivers.map(driver => driver.id)))
    }
  }

  // Delete handlers
  const handleDeleteSelected = async () => {
    if (selectedDrivers.size === 0) return
    
    setIsDeleting(true)
    try {
      // TODO: Implement actual delete API call
      // For now, just simulate the delete
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remove deleted drivers from the list
      // This would normally be handled by the parent component
      console.log('Deleting drivers:', Array.from(selectedDrivers))
      
      toast({
        title: "Drivers deleted",
        description: `Successfully deleted ${selectedDrivers.size} driver${selectedDrivers.size > 1 ? 's' : ''}.`,
      })
      
      setSelectedDrivers(new Set())
      setIsDeleteModalOpen(false)
    } catch (error) {
      console.error('Error deleting drivers:', error)
      toast({
        title: "Error",
        description: "Failed to delete drivers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSelectDriver = (driverId: string) => {
    const newSelected = new Set(selectedDrivers)
    if (newSelected.has(driverId)) {
      newSelected.delete(driverId)
    } else {
      newSelected.add(driverId)
    }
    setSelectedDrivers(newSelected)
  }

  const handleExport = () => {
    if (selectedDrivers.size === 0) return
    
    const selectedDriversData = drivers.filter(driver => selectedDrivers.has(driver.id))
    const csvContent = generateCSV(selectedDriversData)
    downloadCSV(csvContent, 'drivers-export.csv')
  }

  const generateCSV = (drivers: Driver[]) => {
    const headers = ['Name', 'Email', 'Phone', 'License Number', 'License Expiry', 'Status', 'Created At']
    const rows = drivers.map(driver => [
      driver.full_name || `${driver.first_name} ${driver.last_name}`,
      driver.email,
      driver.phone || '',
      driver.license_number || '',
      driver.license_expiry || '',
      driver.availability_status || driver.status,
      new Date(driver.created_at).toLocaleDateString()
    ])
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Driver Status Badge Component
  const DriverStatusBadge = ({ status }: { status: string }) => {
    return (
      <Badge 
        className={cn(
          "font-medium border px-2.5 py-1.5 h-6",
          getDriverStatusBadgeClasses(status)
        )}
      >
        {t(`drivers.availability.statuses.${status}`)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* View Toggle and Actions */}
      <div className="flex items-center gap-3">
        {selectedDrivers.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedDrivers.size} selected
            </span>
          </div>
        )}
      </div>

      {viewMode === "list" ? (
        <>
          <div className="flex flex-col gap-4">
            {/* Driver Count and View Toggle */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing all {drivers.length} drivers
              </div>
              <div className="ml-auto">
                <ViewToggle view={viewMode} onViewChange={onViewModeChange || (() => {})} />
              </div>
            </div>

            {/* Select All Bar */}
            <div className="flex flex-col gap-3 px-4 py-3 bg-muted/20 rounded-lg border border-border/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedDrivers.size === paginatedDrivers.length && paginatedDrivers.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all drivers"
                />
                <span className="text-sm font-medium text-muted-foreground">Select All</span>
                {selectedDrivers.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({selectedDrivers.size} of {paginatedDrivers.length} selected)
                  </span>
                )}
              </div>

              {/* Multi-select Actions */}
              {selectedDrivers.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center gap-2 flex-1 sm:flex-none"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden xs:inline">Delete</span>
                    <span className="xs:hidden">Del</span>
                    <span className="ml-1">({selectedDrivers.size})</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDrivers(new Set());
                    }}
                    className="flex-1 sm:flex-none"
                  >
                    <span className="hidden xs:inline">Clear Selection</span>
                    <span className="xs:hidden">Clear</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="flex items-center gap-2 flex-1 sm:flex-none"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden xs:inline">Export CSV</span>
                    <span className="xs:hidden">Export</span>
                  </Button>
                </div>
              )}
            </div>

          {/* Desktop List View with Headers */}
          <div className="hidden sm:block space-y-3">
            {/* Column Headers */}
            <div className="grid grid-cols-12 items-center gap-4 px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="col-span-1">
                <span className="text-sm font-medium text-muted-foreground">Select</span>
              </div>
              <div className="col-span-3">
                <span className="text-sm font-medium text-muted-foreground">Driver</span>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium text-muted-foreground">Contact</span>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium text-muted-foreground">License</span>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium text-muted-foreground">Actions</span>
              </div>
            </div>

            {paginatedDrivers.map((driver) => (
              <Card 
                key={driver.id} 
                className="hover:shadow-lg transition-all duration-200 overflow-hidden border-border/60 bg-card/95 backdrop-blur"
              >
                                <div className="grid grid-cols-12 items-center gap-4 p-4">
                  {/* Selection Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={selectedDrivers.has(driver.id)}
                      onCheckedChange={() => {
                        handleSelectDriver(driver.id);
                      }}
                      aria-label={`Select ${driver.full_name || driver.first_name}`}
                    />
                  </div>
                  
                  {/* Driver Column - Avatar, Name and ID */}
                  <div className="col-span-3 flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-border/40 flex-shrink-0">
                      <AvatarImage src={driver.profile_image_url || ""} alt={driver.full_name || ""} />
                      <AvatarFallback className="text-sm font-bold bg-primary text-primary-foreground">
                        {driver.first_name?.[0]}{driver.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {driver.full_name || `${driver.first_name} ${driver.last_name}`}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded-md inline-block">
                        ID: {driver.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Contact Column - Email and Phone */}
                  <div className="col-span-2 space-y-1 flex flex-col items-start justify-start">
                    <div className="flex items-center gap-2 text-sm w-full">
                      <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate text-left">{driver.email}</span>
                    </div>
                    {driver.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground w-full">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate text-left">{driver.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* License Column - License Number and Expiry */}
                  <div className="col-span-2 space-y-1 flex flex-col items-start justify-start">
                    {driver.license_number ? (
                      <>
                        <div className="text-sm font-medium text-foreground text-left">
                          {driver.license_number}
                        </div>
                        {driver.license_expiry && (
                          <div className="text-xs text-muted-foreground text-left">
                            Expires: {new Date(driver.license_expiry).toLocaleDateString()}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground text-left">No license</span>
                    )}
                  </div>
                  
                                                              {/* Status Column */}
                  <div className="col-span-2 flex justify-start">
                    <DriverStatusBadge status={driver.availability_status || driver.status} />
                  </div>
                  
                  {/* Actions Column */}
                  <div className="col-span-2 flex justify-start gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild 
                      className="flex items-center gap-2"
                    >
                      <Link href={`/drivers/${driver.id}`}>
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
                      <Link href={`/drivers/${driver.id}/edit`}>
                        <FileEditIcon className="h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Mobile List View */}
          <div className="sm:hidden space-y-4">
            {paginatedDrivers.map((driver) => (
              <Card key={driver.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-border/60 bg-card/95 backdrop-blur">
                <div className="p-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Selection Checkbox */}
                      <Checkbox
                        checked={selectedDrivers.has(driver.id)}
                        onCheckedChange={() => {
                          handleSelectDriver(driver.id);
                        }}
                        aria-label={`Select ${driver.full_name || driver.first_name}`}
                      />
                      {/* Enhanced Driver Avatar */}
                      <Avatar className="w-16 h-16 border border-border/40">
                        <AvatarImage src={driver.profile_image_url || ""} alt={driver.full_name || ""} />
                        <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
                          {driver.first_name?.[0]}{driver.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Driver Name and ID */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-foreground truncate mb-1">
                          {driver.full_name || `${driver.first_name} ${driver.last_name}`}
                        </h3>
                        <p className="text-sm text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded-md inline-block">
                          ID: {driver.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <DriverStatusBadge status={driver.availability_status || driver.status} />
                  </div>
                  
                  {/* Contact and License Info */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{driver.email}</span>
                        </div>
                        {driver.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span className="truncate">{driver.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {driver.license_number ? (
                          <>
                            <div className="text-sm font-medium text-foreground">
                              {driver.license_number}
                            </div>
                            {driver.license_expiry && (
                              <div className="text-xs text-muted-foreground">
                                Expires: {new Date(driver.license_expiry).toLocaleDateString()}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">No license</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        asChild 
                        className="flex-1 flex items-center gap-2 justify-center"
                      >
                        <Link href={`/drivers/${driver.id}`}>
                          <EyeIcon className="h-4 w-4" />
                          View Details
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        asChild 
                        className="flex-1 flex items-center gap-2 justify-center"
                      >
                        <Link href={`/drivers/${driver.id}/edit`}>
                          <FileEditIcon className="h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
            </div>
        </>
      ) : (
        <>
          {/* Grid View Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-muted-foreground">
              {t("drivers.showingResults", { 
                count: paginatedDrivers.length, 
                total: drivers.length 
              })}
            </div>
            <ViewToggle
              view={viewMode}
              onViewChange={onViewModeChange || (() => {})}
            />
          </div>

          {/* Grid View Selection Header */}
          <div className="flex flex-col gap-3 mb-4 p-3 bg-muted/30 rounded-lg border sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedDrivers.size === paginatedDrivers.length && paginatedDrivers.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all drivers"
              />
              <span className="text-sm font-medium text-muted-foreground">
                Select All
              </span>
              {selectedDrivers.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({selectedDrivers.size} of {paginatedDrivers.length} selected)
                </span>
              )}
            </div>

            {/* Multi-select Actions */}
            {selectedDrivers.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement bulk delete for drivers
                    console.log('Deleting drivers:', Array.from(selectedDrivers));
                  }}
                  className="flex items-center gap-2 flex-1 sm:flex-none"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden xs:inline">Delete</span>
                  <span className="xs:hidden">Del</span>
                  <span className="ml-1">({selectedDrivers.size})</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDrivers(new Set());
                  }}
                  className="flex-1 sm:flex-none"
                >
                  <span className="hidden xs:inline">Clear Selection</span>
                  <span className="xs:hidden">Clear</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-2 flex-1 sm:flex-none"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden xs:inline">Export CSV</span>
                  <span className="xs:hidden">Export</span>
                </Button>
              </div>
            )}
          </div>

          {/* Grid View */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedDrivers.map((driver) => (
              <Card 
                key={driver.id} 
                className="overflow-hidden hover:shadow-md transition-shadow h-full cursor-pointer active:bg-muted/50"
                onClick={() => router.push(`/drivers/${driver.id}`)}
              >
                <div className="h-full flex flex-col">
                  <CardContent className="p-6 pt-5 flex-grow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedDrivers.has(driver.id)}
                          onCheckedChange={() => handleSelectDriver(driver.id)}
                          aria-label={`Select ${driver.full_name || driver.first_name}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Avatar className="h-16 w-16 border-2 border-primary/10">
                          <AvatarImage src={driver.profile_image_url || ""} alt={driver.full_name || ""} />
                          <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
                            {driver.first_name?.[0]}{driver.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <DriverStatusBadge status={driver.availability_status || driver.status} />
                    </div>
                    
                    <div className="mb-3">
                      <h3 className="font-medium text-lg">{driver.full_name || `${driver.first_name} ${driver.last_name}`}</h3>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{driver.email}</span>
                      </div>
                      
                      {driver.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{driver.phone}</span>
                        </div>
                      )}
                      
                      {driver.license_number && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Car className="h-4 w-4" />
                          <span>{driver.license_number}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <div className="flex gap-2 w-full">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        asChild 
                        className="flex-1 flex items-center gap-2 justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/drivers/${driver.id}`}>
                          <EyeIcon className="h-4 w-4" />
                          View
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        asChild 
                        className="flex-1 flex items-center gap-2 justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/drivers/${driver.id}/edit`}>
                          <FileEditIcon className="h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      const params = new URLSearchParams(searchParams?.toString() || '')
                      params.set('page', (currentPage - 1).toString())
                      router.push(`?${params.toString()}`)
                    }
                  }}
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                .map((page, index, arr) => (
                  <React.Fragment key={page}>
                    {index > 0 && arr[index-1] + 1 < page && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const params = new URLSearchParams(searchParams?.toString() || '')
                          params.set('page', page.toString())
                          router.push(`?${params.toString()}`)
                        }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
                ))}
              
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      const params = new URLSearchParams(searchParams?.toString() || '')
                      params.set('page', (currentPage + 1).toString())
                      router.push(`?${params.toString()}`)
                    }
                  }}
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteSelected}
        isDeleting={isDeleting}
        title="Delete Drivers"
        description={`Are you sure you want to delete ${selectedDrivers.size} selected driver${selectedDrivers.size > 1 ? 's' : ''}? This action cannot be undone and will permanently remove the selected drivers from the system.`}
        itemName="Driver"
        itemCount={selectedDrivers.size}
        warningItems={[
          "This will permanently delete the selected driver" + (selectedDrivers.size > 1 ? 's' : ''),
          "All associated data will be removed",
          "This action cannot be undone"
        ]}
      />
    </div>
  )
}
