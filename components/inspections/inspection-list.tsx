"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Calendar, Clipboard, Car, BarChart3, Filter, ListFilter, X } from "lucide-react"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { useMediaQuery } from "@/hooks/use-media-query"
import { format, parseISO, isToday, isThisWeek, isThisMonth, isFuture, isPast, isYesterday, isValid, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

interface InspectionListProps {
  inspections: Inspection[]
  vehicles: DbVehicle[]
  currentPage?: number
  totalPages?: number
}

const ITEMS_PER_PAGE = 6

// Add a new grouping mode type
type GroupingMode = "vehicle" | "date" | "none"

// Simple Date Range Picker Component
function DateRangePicker({
  date,
  onDateChange,
}: {
  date: DateRange | undefined
  onDateChange: (range: DateRange | undefined) => void
}) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant={"outline"}
          className={cn(
            "w-full sm:w-[260px] justify-start text-left font-normal h-9",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "LLL dd, y")} -{" "}
                {format(date.to, "LLL dd, y")}
              </>
            ) : (
              format(date.from, "LLL dd, y")
            )
          ) : (
            <span>{t("schedules.selectDate")}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={(newDate) => {
            onDateChange(newDate)
            if (newDate?.from && newDate?.to) {
              setIsOpen(false)
            }
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}

export function InspectionList({ inspections = [], vehicles = [], currentPage = 1, totalPages = 1 }: InspectionListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState<"list" | "grid">("grid")
  const [groupingMode, setGroupingMode] = useState<GroupingMode>("date")
  const [filterVehicleId, setFilterVehicleId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const debouncedSearch = useDebounce(search, 500)
  const { t, language } = useI18n()
  const [inspectionsWithVehicles, setInspectionsWithVehicles] = useState(inspections)
  const isMobile = useMediaQuery("(max-width: 640px)")

  // Set default view based on screen size
  useEffect(() => {
    // If on mobile, default to list view
    if (isMobile) {
      setView("list");
    }
  }, [isMobile]);

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

  const filteredInspections = useMemo(() => {
    return inspectionsWithVehicles.filter(inspection => {
      if (!inspection) return false
      
      const matchesStatusFilter = filter === 'all' || inspection.status === filter
      
      const matchesSearch = !debouncedSearch || 
        (inspection.vehicle?.name && 
         inspection.vehicle.name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (inspection.vehicle?.plate_number &&
         inspection.vehicle.plate_number.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (inspection.type &&
         inspection.type.toLowerCase().includes(debouncedSearch.toLowerCase()))
         
      const matchesVehicleFilter = !filterVehicleId || inspection.vehicle_id === filterVehicleId
      
      // Date Range Filter Logic
      let matchesDateRange = true;
      if (groupingMode === 'date' && dateRange?.from) {
          const inspectionDate = parseISO(inspection.date);
          if (isValid(inspectionDate)) {
              const start = startOfDay(dateRange.from);
              const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
              matchesDateRange = isWithinInterval(inspectionDate, { start, end });
          } else {
              matchesDateRange = false;
          }
      }
      
      return matchesStatusFilter && matchesSearch && matchesVehicleFilter && matchesDateRange
    })
  }, [inspectionsWithVehicles, filter, debouncedSearch, filterVehicleId, groupingMode, dateRange])

  // Adjust pagination logic - only applies when grouping is 'none'
  const paginatedInspections = useMemo(() => {
    if (groupingMode !== 'none') return filteredInspections; // Return all filtered if grouping
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInspections.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInspections, groupingMode, currentPage]);

  const totalFilteredPages = useMemo(() => {
    // Pagination only active when not grouping
    return groupingMode === 'none' ? Math.ceil(filteredInspections.length / ITEMS_PER_PAGE) : 1;
  }, [filteredInspections, groupingMode]);

  // Group inspections by vehicle (uses already filtered inspections)
  const groupedByVehicle = useMemo(() => {
    if (groupingMode !== 'vehicle') return {};
    const groups: Record<string, Inspection[]> = {}
    filteredInspections.forEach(inspection => {
      const key = inspection.vehicle_id || 'no-vehicle';
      if (!groups[key]) groups[key] = [];
      groups[key].push(inspection);
    });
    // Sort groups by vehicle name
    return Object.entries(groups)
      .sort(([vehicleIdA], [vehicleIdB]) => {
        const vehicleA = vehicles.find(v => v.id === vehicleIdA);
        const vehicleB = vehicles.find(v => v.id === vehicleIdB);
        const nameA = vehicleA?.name || t("inspections.noVehicle");
        const nameB = vehicleB?.name || t("inspections.noVehicle");
        return nameA.localeCompare(nameB);
      })
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, Inspection[]>);
  }, [filteredInspections, groupingMode, vehicles, t])

  // Group inspections by date (uses already filtered inspections)
  const groupedByDate = useMemo(() => {
    if (groupingMode !== 'date') return {};
    const groups: Record<string, Inspection[]> = {}
    filteredInspections.forEach(inspection => {
      let dateKey = 'unknown';
      try {
          const inspectionDate = parseISO(inspection.date);
          if (isValid(inspectionDate)) {
              if (isToday(inspectionDate)) dateKey = 'today';
              else if (isYesterday(inspectionDate)) dateKey = 'yesterday';
              else if (isThisWeek(inspectionDate, { weekStartsOn: 1 })) dateKey = 'this-week';
              else if (isThisMonth(inspectionDate)) dateKey = 'this-month';
              else if (isFuture(inspectionDate)) dateKey = 'upcoming';
              else dateKey = 'older';
          }
      } catch (e) {
          console.error("Error parsing inspection date:", inspection.date, e);
      }

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(inspection);
    });

    // Sort inspections within each date group (most recent first)
    for (const key in groups) {
        groups[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return groups;
  }, [filteredInspections, groupingMode])

  // Define getInspectionType function before it is used in inspectionStats
  const getInspectionType = (type: string | null | undefined) => {
    if (!type) return 'unspecified'
    const baseType = type.toLowerCase().includes('routine') ? 'routine'
                   : type.toLowerCase().includes('safety') ? 'safety'
                   : type.toLowerCase().includes('maintenance') ? 'maintenance'
                   : 'unspecified';
    return baseType;
  }

  // Generate stats for the inspections
  const inspectionStats = useMemo(() => {
    const stats = {
      total: filteredInspections.length,
      byStatus: {
        scheduled: filteredInspections.filter(i => i.status === 'scheduled').length,
        in_progress: filteredInspections.filter(i => i.status === 'in_progress').length,
        completed: filteredInspections.filter(i => i.status === 'completed').length
      },
      byVehicle: {} as Record<string, number>,
      byType: {} as Record<string, number>
    }
    
    // Count by vehicle
    filteredInspections.forEach(inspection => {
      const vehicleName = inspection.vehicle?.name || t("inspections.noVehicle")
      if (!stats.byVehicle[vehicleName]) stats.byVehicle[vehicleName] = 0
      stats.byVehicle[vehicleName]++
      
      // Count by type
      const typeKey = getInspectionType(inspection.type)
      const typeName = t(`inspections.type.${typeKey}` as any)

      if (!stats.byType[typeName]) stats.byType[typeName] = 0
      stats.byType[typeName]++
    })
    
    return stats
  }, [filteredInspections, t, getInspectionType])

  const formatScheduledDate = (date: string) => {
    try {
      return t("inspections.details.scheduledFor", {
        date: formatDate(date)
      })
    } catch (e) {
      console.error("Error formatting date:", date, e);
      return "Invalid Date";
    }
  }

  const getDateGroupTitle = (key: string) => {
    switch (key) {
      case 'today': return t("inspections.dateGroup.today")
      case 'yesterday': return t("inspections.dateGroup.yesterday")
      case 'this-week': return t("inspections.dateGroup.thisWeek")
      case 'this-month': return t("inspections.dateGroup.thisMonth")
      case 'upcoming': return t("inspections.dateGroup.upcoming")
      case 'older': return t("inspections.dateGroup.older")
      default: return t("inspections.dateGroup.unknown")
    }
  }

  const handlePageChange = (page: number) => {
    if (groupingMode === 'none') {
       const params = new URLSearchParams(searchParams.toString())
       params.set("page", page.toString())
       router.push(`/inspections?${params.toString()}`, { scroll: false })
     } else {
        // If grouping, just update state, maybe scroll to top?
        // For now, pagination controls are hidden when grouping, so this shouldn't be called.
     }
  }

  // Function to determine Badge variant based on status
  function getStatusVariant(status: string): "success" | "warning" | "secondary" | "default" {
    switch (status) {
      case "completed": return "success";
      case "in_progress": return "warning";
      case "scheduled": return "secondary";
      default: return "default";
    }
  }

  // Render inspections in different views depending on grouping mode
  const renderInspectionsContent = () => {
    // Use paginatedInspections only when groupingMode is 'none'
    const inspectionsForView = groupingMode === 'none' ? paginatedInspections : filteredInspections;

    if (filteredInspections.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg mt-4 text-center">
          <Clipboard className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{t("inspections.noInspections")}</p>
          <p className="text-muted-foreground">
            {debouncedSearch || filterVehicleId || dateRange?.from
              ? t("drivers.empty.searchResults")
              : t("inspections.addNew")
            }
          </p>
          <Button variant="outline" className="mt-4" onClick={() => {
              setSearch('');
              setFilterVehicleId(null);
              setDateRange(undefined);
              setGroupingMode('date');
          }}>
            {t("reporting.filters.reset")}
          </Button>
        </div>
      );
    }

    if (groupingMode === 'none') {
      return (
        <>
          {view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inspectionsForView.map((inspection) => (
                <InspectionCard 
                  key={inspection.id} 
                  inspection={inspection} 
                  getStatusVariant={getStatusVariant}
                  formatScheduledDate={formatScheduledDate}
                  getInspectionType={getInspectionType}
                />
              ))}
            </div>
          ) : (
            <InspectionTable 
              inspections={inspectionsForView}
              getStatusVariant={getStatusVariant} 
              formatScheduledDate={formatScheduledDate}
              getInspectionType={getInspectionType}
            />
          )}
          {totalFilteredPages > 1 && (
            <Pagination className="mt-4 w-full flex justify-center">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => { e.preventDefault(); handlePageChange(Math.max(1, currentPage - 1)); }}
                    aria-disabled={currentPage === 1}
                    className={cn(
                      "cursor-pointer",
                      currentPage === 1 && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                {(() => {
                  const pageNumbers: React.ReactNode[] = [];
                  const maxPagesToShow = 5;
                  const halfMaxPages = Math.floor(maxPagesToShow / 2);

                  let startPage = Math.max(1, currentPage - halfMaxPages);
                  let endPage = Math.min(totalFilteredPages, currentPage + halfMaxPages);

                  if (currentPage <= halfMaxPages) {
                      endPage = Math.min(totalFilteredPages, maxPagesToShow);
                  }
                  if (currentPage + halfMaxPages >= totalFilteredPages) {
                      startPage = Math.max(1, totalFilteredPages - maxPagesToShow + 1);
                  }

                  if (startPage > 1) {
                      pageNumbers.push(
                          <PaginationItem key="start-ellipsis">
                              <PaginationEllipsis />
                          </PaginationItem>
                      );
                  }

                  for (let i = startPage; i <= endPage; i++) {
                      pageNumbers.push(
                          <PaginationItem key={i}>
                              <PaginationLink
                                  href="#"
                                  onClick={(e) => { e.preventDefault(); handlePageChange(i); }}
                                  isActive={i === currentPage}
                                  className="cursor-pointer"
                              >
                                  {i}
                              </PaginationLink>
                          </PaginationItem>
                      );
                  }

                  if (endPage < totalFilteredPages) {
                      pageNumbers.push(
                          <PaginationItem key="end-ellipsis">
                              <PaginationEllipsis />
                          </PaginationItem>
                      );
                  }

                  return pageNumbers;
                })()}
                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => { e.preventDefault(); handlePageChange(Math.min(totalFilteredPages, currentPage + 1)); }}
                    aria-disabled={currentPage === totalFilteredPages}
                    className={cn(
                      "cursor-pointer",
                      currentPage === totalFilteredPages && "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )
    }

    if (groupingMode === 'vehicle') {
      return (
        <div className="space-y-8 mt-6">
          {Object.entries(groupedByVehicle).map(([vehicleId, vehicleInspections]) => {
            if (vehicleInspections.length === 0) return null; 
            
            const vehicle = vehicles.find(v => v.id === vehicleId)
            const vehicleName = vehicle?.name || t("inspections.noVehicle")
            const vehicleBadge = vehicle?.plate_number || ""
            
            return (
              <div key={vehicleId} className="space-y-2">
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">{vehicleName}</h2>
                    {vehicleBadge && (
                      <Badge variant="outline">{vehicleBadge}</Badge>
                    )}
                  </div>
                  <Badge variant="outline">{t("inspections.stats.vehicleCount", { count: String(vehicleInspections.length) })}</Badge>
                </div>
                {view === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicleInspections.map(inspection => (
                      <InspectionCard 
                        key={inspection.id} 
                        inspection={inspection} 
                        getStatusVariant={getStatusVariant}
                        formatScheduledDate={formatScheduledDate}
                        getInspectionType={getInspectionType}
                        compact={false}
                      />
                    ))}
                  </div>
                ) : (
                  <InspectionTable 
                    inspections={vehicleInspections}
                    getStatusVariant={getStatusVariant} 
                    formatScheduledDate={formatScheduledDate}
                    getInspectionType={getInspectionType}
                    hideVehicleColumn={true}
                  />
                )}
              </div>
            )
          })}
        </div>
      )
    }

    if (groupingMode === 'date') {
      const dateGroupOrder = ['today', 'yesterday', 'this-week', 'this-month', 'upcoming', 'older', 'unknown'];
      const nonEmptyDateGroups = dateGroupOrder.filter(key => groupedByDate[key]?.length > 0);

      return (
        <div className="space-y-8 mt-6">
          {nonEmptyDateGroups.map(dateKey => {
            const dateInspections = groupedByDate[dateKey];
            if (dateInspections.length === 0) return null; 
            
            return (
              <div key={dateKey} className="space-y-2">
                <div className="flex items-center justify-between border-b pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">{getDateGroupTitle(dateKey)}</h2>
                  </div>
                  <Badge variant="outline">{t("inspections.stats.count", { count: String(dateInspections.length) })}</Badge>
                </div>
                
                {view === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dateInspections.map(inspection => (
                      <InspectionCard 
                        key={inspection.id} 
                        inspection={inspection} 
                        getStatusVariant={getStatusVariant}
                        formatScheduledDate={formatScheduledDate}
                        getInspectionType={getInspectionType}
                      />
                    ))}
                  </div>
                ) : (
                  <InspectionTable 
                    inspections={dateInspections}
                    getStatusVariant={getStatusVariant} 
                    formatScheduledDate={formatScheduledDate}
                    getInspectionType={getInspectionType}
                  />
                )}
              </div>
            );
          })}
        </div>
      );
    }
  }

  // Separate Inspection Card component for reuse
  const InspectionCard = ({ 
    inspection, 
    getStatusVariant, 
    formatScheduledDate,
    getInspectionType,
    compact = false
  }: { 
    inspection: Inspection,
    getStatusVariant: (status: string) => "success" | "warning" | "secondary" | "default",
    formatScheduledDate: (date: string) => string,
    getInspectionType: (type: string | null | undefined) => string,
    compact?: boolean 
  }) => (
    <Card className="overflow-hidden transition-shadow hover:shadow-md h-full flex flex-col">
      <CardHeader className={cn("p-4", compact && "p-3")}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className={cn("text-lg truncate", compact && "text-base")}>
              {inspection.vehicle?.name || t("inspections.noVehicle")}
            </CardTitle>
            {!compact && inspection.vehicle?.plate_number && (
              <CardDescription>
                {inspection.vehicle.plate_number}
              </CardDescription>
            )}
          </div>
          <Badge variant={getStatusVariant(inspection.status || 'scheduled')} className="flex-shrink-0">
            {t(`inspections.status.${inspection.status || 'scheduled'}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={cn("p-4 flex-grow", compact && "px-3 py-2")}>
        {inspection.vehicle?.image_url && !compact && (
          <div className="relative aspect-video w-full mb-4 rounded-md overflow-hidden bg-muted">
            <Image
              src={inspection.vehicle.image_url}
              alt={inspection.vehicle.name || t("common.noImage")}
              className="object-cover"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
        <div className={`space-y-${compact ? "1" : "2"}`}>
          <div className="flex items-center">
            <Calendar className={cn("mr-2 h-4 w-4 text-muted-foreground flex-shrink-0", compact && "h-3 w-3")} />
            <span className={cn("text-sm", compact && "text-xs")}>{formatScheduledDate(inspection.date)}</span>
          </div>
          
          <div className="flex items-center">
            <Clipboard className={cn("mr-2 h-4 w-4 text-muted-foreground flex-shrink-0", compact && "h-3 w-3")} />
            <span className={cn("text-sm capitalize", compact && "text-xs")}>
              {t(`inspections.type.${getInspectionType(inspection.type)}` as any)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className={cn("p-4 pt-0 mt-auto", compact && "p-3 pt-0")}>
        <Button variant="secondary" size={compact ? "sm" : "sm"} className="w-full" asChild>
          <Link href={`/inspections/${inspection.id}`}>
            {t("common.viewDetails")}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )

  // Separate Inspection Table component for reuse
  const InspectionTable = ({ 
    inspections, 
    getStatusVariant, 
    formatScheduledDate,
    getInspectionType,
    hideVehicleColumn = false
  }: { 
    inspections: Inspection[],
    getStatusVariant: (status: string) => "success" | "warning" | "secondary" | "default",
    formatScheduledDate: (date: string) => string,
    getInspectionType: (type: string | null | undefined) => string,
    hideVehicleColumn?: boolean
  }) => {
    // Use media query hook inside the component
    const isMobile = useMediaQuery("(max-width: 640px)");
    const showVehicleColumn = !hideVehicleColumn && !isMobile;

    return (
    <div className="border rounded-md overflow-x-auto"> 
      <Table>
        <TableHeader>
          <TableRow>
            {/* Conditionally render vehicle column */} 
            {showVehicleColumn && <TableHead>{t("vehicles.title")}</TableHead>}
            <TableHead>{t("inspections.fields.date")}</TableHead>
            <TableHead>{t("inspections.fields.type")}</TableHead>
            <TableHead>{t("inspections.fields.status")}</TableHead>
            <TableHead className="w-[100px] text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inspections.map((inspection) => (
            <TableRow key={inspection.id} className="hover:bg-muted/50">
              {/* Conditionally render vehicle cell */} 
              {showVehicleColumn && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {inspection.vehicle?.image_url && (
                      <div className="relative h-8 w-12 rounded-sm overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={inspection.vehicle.image_url}
                          alt={inspection.vehicle.name || t("common.noImage")}
                          className="object-cover"
                          fill
                          sizes="48px"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{inspection.vehicle?.name || t("inspections.noVehicle")}</div>
                      {inspection.vehicle?.plate_number && (
                        <div className="text-xs text-muted-foreground">{inspection.vehicle.plate_number}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
              )}
              <TableCell>{formatDate(inspection.date)}</TableCell>
              <TableCell className="capitalize">
                {t(`inspections.type.${getInspectionType(inspection.type)}` as any)}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(inspection.status || 'scheduled')}>
                  {t(`inspections.status.${inspection.status || 'scheduled'}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/inspections/${inspection.id}`}>
                    {t("common.view")}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("inspections.title")}</h1>
          <p className="text-muted-foreground">
            {t("inspections.description")}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/inspections/create">
             <Plus className="mr-2 h-4 w-4" />
             {t("inspections.createInspection")}
           </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-x-4">
            <div className="relative col-span-1 sm:col-span-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("inspections.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full sm:w-auto">
              <Select
                value={filterVehicleId || 'all-vehicles'}
                onValueChange={(val) => {
                  setFilterVehicleId(val === 'all-vehicles' ? null : val);
                  handlePageChange(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[250px] h-9">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    <SelectValue placeholder={t("vehicles.title")} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-vehicles">{t("vehicles.allVehicles")}</SelectItem>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} {vehicle.plate_number ? `(${vehicle.plate_number})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={groupingMode}
                onValueChange={(val) => {
                  const newMode = val as GroupingMode;
                  setGroupingMode(newMode);
                  handlePageChange(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <div className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4" />
                    <SelectValue placeholder={t("inspections.groupBy")} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t("inspections.groupByDate")}
                    </div>
                  </SelectItem>
                  <SelectItem value="vehicle">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      {t("inspections.groupByVehicle")}
                    </div>
                  </SelectItem>
                  <SelectItem value="none">{t("inspections.noGrouping")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 w-full sm:w-auto">
                <DateRangePicker
                  date={dateRange}
                  onDateChange={(range) => {
                    setDateRange(range);
                    handlePageChange(1);
                  }}
                />
                {dateRange?.from && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={() => {
                      setDateRange(undefined);
                      handlePageChange(1);
                    }}
                    aria-label={t("Clear date range")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 justify-start sm:justify-end w-full sm:w-auto">
              <span className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
                {t("inspections.resultsCount", { count: String(filteredInspections.length) })}
              </span>
              <ViewToggle view={view} onViewChange={setView} />
            </div>
          </div>
        </div>

        {renderInspectionsContent()}
      </div>
    </div>
  )
} 