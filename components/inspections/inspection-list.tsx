"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Calendar, Clipboard } from "lucide-react"
import { ViewToggle } from "@/components/ui/view-toggle"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils/formatting"
import { useI18n } from "@/lib/i18n/context"
import type { Inspection, DbVehicle } from "@/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface InspectionListProps {
  inspections: Inspection[]
  vehicles: DbVehicle[]
  currentPage?: number
  totalPages?: number
}

const ITEMS_PER_PAGE = 6

export function InspectionList({ inspections = [], vehicles = [], currentPage = 1, totalPages = 1 }: InspectionListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState<"list" | "grid">("grid")
  const debouncedSearch = useDebounce(search, 500)
  const { t, language } = useI18n()
  const [inspectionsWithVehicles, setInspectionsWithVehicles] = useState(inspections)

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

  useEffect(() => {
    async function loadVehicleData() {
      try {
        const updatedInspections = await Promise.all(
          inspections.map(async (inspection) => {
            if (inspection.vehicle_id) {
              const vehicle = vehicles.find(v => v.id === inspection.vehicle_id)
              if (vehicle) {
                return {
                  ...inspection,
                  vehicle
                }
              }
            }
            return inspection
          })
        )
        // Sort inspections by date (most recent first)
        const sortedInspections = updatedInspections.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setInspectionsWithVehicles(sortedInspections)
      } catch (error) {
        console.error('Error loading vehicle data:', error)
      }
    }

    loadVehicleData()
  }, [inspections, vehicles])

  const filteredInspections = inspectionsWithVehicles.filter(inspection => {
    if (!inspection) return false
    
    const matchesFilter = filter === 'all' || inspection.status === filter
    const matchesSearch = !debouncedSearch || 
      (inspection.vehicle?.name && 
       inspection.vehicle.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
    
    return matchesFilter && matchesSearch
  })

  // Calculate pagination
  const totalFilteredPages = Math.ceil(filteredInspections.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedInspections = filteredInspections.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const formatScheduledDate = (date: string) => {
    return t("inspections.details.scheduledFor", {
      date: formatDate(date)
    })
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/inspections?${params.toString()}`)
  }

  function getStatusVariant(status: string) {
    switch (status) {
      case "completed":
        return "success"
      case "in_progress":
        return "warning"
      case "scheduled":
        return "secondary"
      default:
        return "default"
    }
  }

  const getInspectionType = (type: string | null | undefined) => {
    if (!type) return 'unspecified'
    const baseType = type.split('_')[0]
    return baseType || 'unspecified'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("inspections.title")}</h1>
          <p className="text-muted-foreground">
            {t("inspections.description")}
          </p>
        </div>
        <Button asChild>
          <Link href="/inspections/create">
            <Plus className="mr-2 h-4 w-4" />
            {t("inspections.createInspection")}
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("inspections.searchPlaceholder")}
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
                    <SelectItem value="scheduled">{t("inspections.status.scheduled")}</SelectItem>
                    <SelectItem value="in_progress">{t("inspections.status.in_progress")}</SelectItem>
                    <SelectItem value="completed">{t("inspections.status.completed")}</SelectItem>
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
                  variant={filter === 'scheduled' ? 'default' : 'outline'}
                  onClick={() => setFilter('scheduled')}
                >
                  {t("inspections.status.scheduled")}
                </Button>
                <Button 
                  variant={filter === 'in_progress' ? 'default' : 'outline'}
                  onClick={() => setFilter('in_progress')}
                >
                  {t("inspections.status.in_progress")}
                </Button>
                <Button 
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  onClick={() => setFilter('completed')}
                >
                  {t("inspections.status.completed")}
                </Button>
              </div>
            </div>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        {paginatedInspections.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
            <p className="text-muted-foreground text-center">
              {t("inspections.noInspections")}
            </p>
          </div>
        ) : (
          <>
            {view === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedInspections.map((inspection) => (
                  <Card key={inspection.id}>
                    <Link href={`/inspections/${inspection.id}`}>
                      <div className="relative aspect-video w-full">
                        {inspection.vehicle?.image_url ? (
                          <Image
                            src={inspection.vehicle.image_url}
                            alt={inspection.vehicle?.name || ""}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <p className="text-muted-foreground">{t('inspections.details.vehicleInfo.noImage')}</p>
                          </div>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-6">
                      <div className="flex flex-col space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-medium">{inspection.vehicle?.name}</h3>
                          {inspection.vehicle && (
                            <p className="text-sm text-muted-foreground">{inspection.vehicle.plate_number}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {formatScheduledDate(inspection.date)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={getStatusVariant(inspection.status)}>
                            {t(`inspections.status.${inspection.status}`)}
                          </Badge>
                          <Badge variant="outline">
                            {t(`inspections.type.${getInspectionType(inspection.type)}`)}
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
                        <TableHead>{t("inspections.fields.date")}</TableHead>
                        <TableHead>{t("inspections.fields.type")}</TableHead>
                        <TableHead>{t("inspections.fields.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInspections.map((inspection) => (
                        <TableRow 
                          key={inspection.id}
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => router.push(`/inspections/${inspection.id}`)}
                        >
                          <TableCell className="font-medium">{inspection.vehicle?.name}</TableCell>
                          <TableCell>{inspection.vehicle?.plate_number}</TableCell>
                          <TableCell>{formatDate(inspection.date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {t(`inspections.type.${getInspectionType(inspection.type)}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(inspection.status)}>
                              {t(`inspections.status.${inspection.status}`)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 sm:hidden">
                  {paginatedInspections.map((inspection) => (
                    <Card 
                      key={inspection.id} 
                      className="overflow-hidden cursor-pointer"
                      onClick={() => router.push(`/inspections/${inspection.id}`)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{inspection.vehicle?.name}</CardTitle>
                        {inspection.vehicle && (
                          <CardDescription>
                            {inspection.vehicle.plate_number}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pb-3 pt-0">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{t("inspections.fields.date")}</p>
                            <p className="text-sm font-medium">{formatDate(inspection.date)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{t("inspections.fields.type")}</p>
                            <Badge variant="outline" className="mt-1">
                              {t(`inspections.type.${getInspectionType(inspection.type)}`)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between items-center">
                        <Badge variant={getStatusVariant(inspection.status)}>
                          {t(`inspections.status.${inspection.status}`)}
                        </Badge>
                      </CardFooter>
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
    </div>
  )
} 