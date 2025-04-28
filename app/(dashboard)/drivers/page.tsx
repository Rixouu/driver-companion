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
import { useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"
import type { Driver } from "@/types"

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
  const [statusFilter, setStatusFilter] = useState<string>("all")
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

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(driver => driver.status === statusFilter)
    }

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      result = result.filter(
        driver =>
          driver.first_name.toLowerCase().includes(query) ||
          driver.last_name.toLowerCase().includes(query) ||
          driver.email.toLowerCase().includes(query) ||
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("drivers.title")}</h1>
          <p className="text-muted-foreground">
            {t("drivers.description")}
          </p>
        </div>
        <Button asChild>
          <Link href="/drivers/new" className="flex items-center" legacyBehavior>
            <Plus className="mr-2 h-4 w-4" />
            {t("drivers.actions.addDriver")}
          </Link>
        </Button>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("drivers.search")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="hidden sm:flex flex-wrap gap-2">
                <Button 
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  {t("common.all")}
                </Button>
                <Button 
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('active')}
                >
                  {t("drivers.status.active")}
                </Button>
                <Button 
                  variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('inactive')}
                >
                  {t("drivers.status.inactive")}
                </Button>
              </div>
            </div>
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )
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
              <Button asChild>
                <Link href="/drivers/new" legacyBehavior>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("drivers.actions.addDriver")}
                </Link>
              </Button>
            }
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDrivers.map(driver => (
              <DriverCard key={driver.id} driver={driver} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border divide-y">
            {paginatedDrivers.map(driver => (
              <DriverListItem key={driver.id} driver={driver} />
            ))}
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