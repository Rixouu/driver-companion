"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { ViewToggle } from "@/components/ui/view-toggle"
import Link from "next/link"
import { DbVehicle } from "@/types"
import { useDebounce } from "@/hooks/use-debounce"
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

interface VehicleListProps {
  vehicles: DbVehicle[]
  currentPage?: number
  totalPages?: number
}

const ITEMS_PER_PAGE = 6

export function VehicleList({ vehicles = [], currentPage = 1, totalPages = 1 }: VehicleListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState<"list" | "grid">("grid")
  const debouncedSearch = useDebounce(search, 500)
  const { t } = useI18n()

  // Set default view based on screen size
  useEffect(() => {
    // Check if we're on mobile
    const isMobile = window.innerWidth < 640; // sm breakpoint in Tailwind
    if (isMobile) {
      setView("list");
    }
    
    // Add resize listener to change view when resizing between mobile and desktop
    const handleResize = () => {
      const isMobileNow = window.innerWidth < 640;
      if (isMobileNow && view === "grid") {
        setView("list");
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view]);

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesFilter = filter === 'all' || vehicle.status === filter
    const matchesSearch = !debouncedSearch || 
      vehicle.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      vehicle.plate_number.toLowerCase().includes(debouncedSearch.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  // Calculate pagination
  const totalFilteredPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/vehicles?${params.toString()}`)
  }

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("vehicles.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="sm:hidden">
              <Select
                value={filter}
                onValueChange={setFilter}
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
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                {t("common.all")}
              </Button>
              <Button 
                variant={filter === 'active' ? 'default' : 'outline'}
                onClick={() => setFilter('active')}
              >
                {t("vehicles.status.active")}
              </Button>
              <Button 
                variant={filter === 'maintenance' ? 'default' : 'outline'}
                onClick={() => setFilter('maintenance')}
              >
                {t("vehicles.status.maintenance")}
              </Button>
              <Button 
                variant={filter === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilter('inactive')}
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
          <p className="text-muted-foreground text-center">
            {t("vehicles.noVehicles")}
          </p>
        </div>
      ) : (
        <>
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedVehicles.map((vehicle) => (
                <Card key={vehicle.id}>
                  <Link href={`/vehicles/${vehicle.id}`}>
                    <div className="relative aspect-video w-full">
                      {vehicle.image_url ? (
                        <Image
                          src={vehicle.image_url}
                          alt={vehicle.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <p className="text-muted-foreground">{t('vehicles.noImage')}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">{vehicle.plate_number}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusVariant(vehicle.status)}>
                          {t(`vehicles.status.${vehicle.status}`)}
                        </Badge>
                        <Badge variant="outline">
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
              {/* Desktop Table View - Hidden on Mobile */}
              <div className="hidden sm:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("vehicles.fields.name")}</TableHead>
                      <TableHead>{t("vehicles.fields.plateNumber")}</TableHead>
                      <TableHead>{t("vehicles.fields.type")}</TableHead>
                      <TableHead>{t("vehicles.fields.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVehicles.map((vehicle) => (
                      <TableRow 
                        key={vehicle.id}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                      >
                        <TableCell className="font-medium">{vehicle.name}</TableCell>
                        <TableCell>{vehicle.plate_number}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {vehicle.brand} {vehicle.model}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(vehicle.status)}>
                            {t(`vehicles.status.${vehicle.status}`)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 sm:hidden">
                {paginatedVehicles.map((vehicle) => (
                  <Card 
                    key={vehicle.id} 
                    className="overflow-hidden cursor-pointer relative"
                    onClick={() => router.push(`/vehicles/${vehicle.id}`)}
                  >
                    {/* Status Badge - Top Right Corner */}
                    <Badge 
                      variant={getStatusVariant(vehicle.status)}
                      className="absolute top-2 right-2 z-10"
                    >
                      {t(`vehicles.status.${vehicle.status}`)}
                    </Badge>
                    
                    <div className="flex">
                      {/* Vehicle Thumbnail */}
                      <div className="w-32 h-[100px] relative flex-shrink-0">
                        {vehicle.image_url ? (
                          <Image
                            src={vehicle.image_url}
                            alt={vehicle.name}
                            fill
                            sizes="128px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <p className="text-xs text-muted-foreground">No Image</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Vehicle Info */}
                      <div className="flex-1 p-3">
                        <h3 className="font-medium text-base mb-1">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{vehicle.plate_number}</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <Badge variant="outline" className="text-xs">
                            {vehicle.brand} {vehicle.model}
                          </Badge>
                          <span className="text-xs font-medium">{vehicle.year}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                </PaginationItem>
              )}
              {[...Array(totalFilteredPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    href="#"
                    onClick={() => handlePageChange(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {currentPage < totalFilteredPages && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => handlePageChange(currentPage + 1)}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </>
      )}
    </div>
  )
} 