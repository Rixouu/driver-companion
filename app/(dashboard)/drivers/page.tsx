"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ViewToggle } from "@/components/ui/view-toggle"
import { getDrivers } from "@/lib/services/drivers"
import { DriverCard } from "@/components/drivers/driver-card"
import { DriverListItem } from "@/components/drivers/driver-list-item"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"
import type { Driver } from "@/types/drivers"
import { DriverStatusBadge } from "@/components/drivers/driver-status-badge"

const ITEMS_PER_PAGE = 6

export default function DriversPage() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams?.get('status') || "all"
  )
  const debouncedSearch = useDebounce(searchQuery, 500)
  
  // Get current page from URL query or default to 1
  const currentPage = searchParams?.get('page') 
    ? parseInt(searchParams.get('page') as string) 
    : 1

  useEffect(() => {
    async function loadDrivers() {
      try {
        setIsLoading(true)
        const data = await getDrivers()
        setDrivers(data)
        setFilteredDrivers(data)
      } catch (error) {
        console.error("Error loading drivers:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDrivers()
  }, [])

  useEffect(() => {
    let result = [...drivers]

    // Apply status filter using availability_status
    if (statusFilter !== "all") {
      result = result.filter(driver => 
         (driver.availability_status || driver.status || 'available') === statusFilter
      )
    }

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      result = result.filter(
        driver =>
          driver.first_name?.toLowerCase().includes(query) ||
          driver.last_name?.toLowerCase().includes(query) ||
          driver.email?.toLowerCase().includes(query) ||
          driver.license_number?.toLowerCase().includes(query)
      )
    }

    setFilteredDrivers(result)
  }, [drivers, statusFilter, debouncedSearch])

  // Set default view based on screen size
  useEffect(() => {
    // Check if we're on mobile
    const isMobile = window.innerWidth < 640; // sm breakpoint in Tailwind
    if (isMobile) {
      setViewMode("list");
    }
    
    // Add resize listener to change view when resizing between mobile and desktop
    const handleResize = () => {
      const isMobileNow = window.innerWidth < 640;
      if (isMobileNow && viewMode === "grid") {
        setViewMode("list");
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDrivers = filteredDrivers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/drivers?${params.toString()}`);
  };
  
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    
    // Update URL to include status filter
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", status);
    
    // Reset to page 1 when filter changes
    params.set("page", "1");
    
    router.push(`/drivers?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("drivers.title")}</h1>
          <p className="text-muted-foreground">
            {t("drivers.description")}
          </p>
        </div>
        <Link href="/drivers/new">
          <Button className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            {t("drivers.actions.addDriver")}
          </Button>
        </Link>
      </div>
      
      {/* Filter and search section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("drivers.search")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex-1 flex justify-end">
            <ViewToggle
              view={viewMode}
              onViewChange={(value) => setViewMode(value as "list" | "grid")}
            />
          </div>
        </div>
        
        {/* Status filter buttons (using availability statuses) */}
        <div className="flex overflow-x-auto pb-2">
          <div className="flex space-x-2">
            <Button 
              variant={statusFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleStatusFilterChange('all')}
            >
              {t("common.all")}
            </Button>
            <Button 
              variant={statusFilter === 'available' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleStatusFilterChange('available')}
            >
              {t("drivers.availability.statuses.available")}
            </Button>
            <Button 
              variant={statusFilter === 'unavailable' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleStatusFilterChange('unavailable')}
            >
              {t("drivers.availability.statuses.unavailable")}
            </Button>
            <Button 
              variant={statusFilter === 'leave' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleStatusFilterChange('leave')}
            >
              {t("drivers.availability.statuses.leave")}
            </Button>
            <Button 
              variant={statusFilter === 'training' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleStatusFilterChange('training')}
            >
              {t("drivers.availability.statuses.training")}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Driver list/grid */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDrivers.length === 0 ? (
          <EmptyState
            icon={<div className="mx-auto h-10 w-10 text-muted-foreground">👤</div>}
            title={t("drivers.empty.title")}
            description={
              searchQuery
                ? t("drivers.empty.searchResults")
                : t("drivers.empty.description")
            }
            action={
              <Link href="/drivers/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("drivers.actions.addDriver")}
                </Button>
              </Link>
            }
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDrivers.map(driver => (
              <DriverCard key={driver.id} driver={driver} />
            ))}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="divide-y">
              {paginatedDrivers.map(driver => (
                <DriverListItem key={driver.id} driver={driver} />
              ))}
            </div>
          </div>
        )}
        
        {filteredDrivers.length > 0 && totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                
                // Show current page, first, last, and pages around current
                if (
                  page === 1 || 
                  page === totalPages || 
                  Math.abs(page - currentPage) <= 1
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page);
                        }}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                
                // Show ellipsis for gaps (but only once per gap)
                if (
                  (page === 2 && currentPage > 3) || 
                  (page === totalPages - 1 && currentPage < totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) handlePageChange(currentPage + 1);
                  }}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
} 