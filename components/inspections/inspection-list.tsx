"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertTriangle, Eye, Search, X, Filter, List, Grid3X3, TrendingUp, Users, CalendarDays, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import type { Inspection, DbVehicle } from "@/types"
import { format, parseISO, isValid, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addWeeks, subWeeks, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks/use-debounce"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSupabase } from "@/components/providers/supabase-provider"
import { InspectionFilter, InspectionFilterOptions } from "./inspection-filter"

interface InspectionListProps {
  inspections: Inspection[]
  vehicles: DbVehicle[]
  currentPage?: number
  totalPages?: number
}

type CalendarView = "month" | "week"

interface QuickStat {
  title: string
  value: number | string
  icon: React.ElementType
  color: string
  bgColor: string
  action: string
  description: string
}

export function InspectionList({ inspections = [], vehicles = [], currentPage = 1, totalPages = 1 }: InspectionListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const supabase = useSupabase()
  const [inspectionsWithVehicles, setInspectionsWithVehicles] = useState(inspections)
  const [calendarView, setCalendarView] = useState<CalendarView>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [sidebarPage, setSidebarPage] = useState(1)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [filters, setFilters] = useState<InspectionFilterOptions>({
    statusFilter: 'all',
    vehicleFilter: 'all',
    inspectorFilter: 'all',
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
    dateRange: 'all'
  })
  const [weeklyCompletedFilter, setWeeklyCompletedFilter] = useState(false)
  const debouncedSearch = useDebounce(filters.searchQuery, 500)

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (filters.statusFilter !== "all") params.set("status", filters.statusFilter)
    if (viewMode !== "calendar") params.set("view", viewMode)
    
    const newUrl = params.toString() ? `?${params.toString()}` : ""
    router.replace(newUrl as any, { scroll: false })
  }, [debouncedSearch, filters.statusFilter, viewMode, router])

  useEffect(() => {
    // In list view, enrich the server-provided, paginated inspections
    if (viewMode === "calendar") return
    async function loadVehicleData() {
      try {
        const updatedInspections = await Promise.all(
          inspections.map(async (inspection) => {
            let updatedInspection = { ...inspection } as Inspection;
            
            // Load vehicle data if available
            if (inspection.vehicle_id) {
              const vehicle = vehicles.find(v => v.id === inspection.vehicle_id);
              if (vehicle) {
                updatedInspection.vehicle = {
                  ...vehicle,
                  image_url: vehicle.image_url === null ? undefined : vehicle.image_url
                };
              }
              
              // Load template display name
              const templateName = await getTemplateDisplayName(inspection);
              if (templateName) {
                // If we found a template name, use it as the type
                // Use 'as any' to bypass type checking since we're adding custom template types
                (updatedInspection as any).type = templateName;
              }
            }
            
            // Load inspector data if available
            if (inspection.inspector_id) {
              try {
                const { data: inspectorData } = await supabase
                  .from('profiles')
                  .select('id, full_name')
                  .eq('id', inspection.inspector_id)
                  .single();
                
                if (inspectorData) {
                  updatedInspection.inspector = {
                    id: inspectorData.id,
                    name: inspectorData.full_name || t('common.notAssigned')
                  };
                }
              } catch (error) {
                console.error('Error fetching inspector data:', error);
              }
            }
            
            return updatedInspection;
          })
        );
        
        // Sort inspections by date (most recent first)
        const sortedInspections = updatedInspections.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ) as Inspection[];
        
        setInspectionsWithVehicles(sortedInspections);
      } catch (error) {
        console.error(t('errors.failedToLoadData', { entity: 'vehicle data' }), error);
      }
    }

    loadVehicleData();
  }, [inspections, vehicles, t, supabase, viewMode]);

  // Calendar view: load all inspections for the visible date range regardless of list pagination
  useEffect(() => {
    if (viewMode !== "calendar") return

    const fetchCalendarInspections = async () => {
      try {
        const rangeStart = calendarView === "month" 
          ? startOfMonth(currentDate) 
          : startOfWeek(currentDate, { weekStartsOn: 1 })
        const rangeEnd = calendarView === "month" 
          ? endOfMonth(currentDate) 
          : endOfWeek(currentDate, { weekStartsOn: 1 })

        let query = supabase
          .from('inspections')
          .select(`*, vehicle:vehicles(id, name, plate_number, image_url)`)
          .gte('date', rangeStart.toISOString())
          .lte('date', rangeEnd.toISOString())
          .order('date', { ascending: false })

        if (filters.statusFilter !== 'all') {
          query = query.eq('status', filters.statusFilter)
        }

        const { data, error } = await query
        if (error) throw error

        // Map and enrich with template display name similar to server-enriched flow
        const enriched = await Promise.all((data || []).map(async (inspection: any) => {
          const updatedInspection: any = { ...inspection }
          if (inspection.vehicle) {
            updatedInspection.vehicle = {
              ...inspection.vehicle,
              image_url: inspection.vehicle.image_url === null ? undefined : inspection.vehicle.image_url
            }
          }
          const templateName = await getTemplateDisplayName(updatedInspection)
          if (templateName) (updatedInspection as any).type = templateName
          return updatedInspection
        }))

        // Apply client-side search filter (by vehicle name/plate/type)
        const searchLower = (debouncedSearch || '').toLowerCase()
        const searched = !searchLower ? enriched : enriched.filter((inspection: any) => (
          (inspection.vehicle?.name && inspection.vehicle.name.toLowerCase().includes(searchLower)) ||
          (inspection.vehicle?.plate_number && inspection.vehicle.plate_number.toLowerCase().includes(searchLower)) ||
          (inspection.type && String(inspection.type).toLowerCase().includes(searchLower))
        ))

        // Sort newest first and set
        const sorted = searched.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setInspectionsWithVehicles(sorted)
      } catch (err) {
        console.error('[INSPECTIONS_CALENDAR_FETCH] Failed to fetch inspections for calendar view:', err)
      }
    }

    fetchCalendarInspections()
  }, [viewMode, calendarView, currentDate, filters.statusFilter, debouncedSearch, supabase])

  // Filter inspections based on search and status
  const filteredInspections = useMemo(() => {
    let filtered = inspectionsWithVehicles.filter((inspection) => {
      const matchesSearch = !debouncedSearch ||
        (inspection.vehicle?.name && inspection.vehicle.name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (inspection.vehicle?.plate_number && inspection.vehicle.plate_number.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (inspection.type && inspection.type.toLowerCase().includes(debouncedSearch.toLowerCase()))
      
      const matchesStatus = filters.statusFilter === "all" || inspection.status === filters.statusFilter
      
      const matchesVehicle = filters.vehicleFilter === "all" || 
        (inspection.vehicle?.name && inspection.vehicle.name.toLowerCase().includes(filters.vehicleFilter.toLowerCase()))
      
      const matchesInspector = filters.inspectorFilter === "all" || 
        (filters.inspectorFilter === "assigned" && inspection.inspector_id) ||
        (filters.inspectorFilter === "unassigned" && !inspection.inspector_id)
      
      // Apply weekly completed filter if active
      let matchesWeeklyCompleted = true
      if (weeklyCompletedFilter) {
        const today = new Date()
        const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 })
        const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 })
        
        const inspectionDate = parseISO(inspection.date)
        const isInWeek = isValid(inspectionDate) && 
                        inspectionDate >= startOfThisWeek && 
                        inspectionDate <= endOfThisWeek
        
        matchesWeeklyCompleted = isInWeek && inspection.status === 'completed'
      }
      
      return matchesSearch && matchesStatus && matchesVehicle && matchesInspector && matchesWeeklyCompleted
    })

    // Sort the filtered inspections
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filters.sortBy) {
        case 'date':
          aValue = a.date || '1970-01-01'
          bValue = b.date || '1970-01-01'
          break
        case 'vehicle':
          aValue = a.vehicle?.name || ''
          bValue = b.vehicle?.name || ''
          break
        case 'inspector':
          aValue = a.inspector?.name || ''
          bValue = b.inspector?.name || ''
          break
        case 'type':
          aValue = a.type || ''
          bValue = b.type || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        default:
          return 0
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [inspectionsWithVehicles, debouncedSearch, filters.statusFilter, filters.vehicleFilter, filters.inspectorFilter, weeklyCompletedFilter, filters.sortBy, filters.sortOrder])

  // Server-provided pagination for list view
  const listCurrentPage = currentPage
  const listTotalPages = totalPages

  const goToPage = (page: number) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (page <= 1) params.delete('page')
    else params.set('page', String(page))
    router.replace(`?${params.toString()}` as any, { scroll: false })
  }

  // Calculate quick stats
  const quickStats = useMemo((): QuickStat[] => {
    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 })
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 })

    const todaysInspections = filteredInspections.filter(inspection => {
      const inspectionDate = parseISO(inspection.date)
      return isValid(inspectionDate) && 
             inspectionDate >= startOfToday && 
             inspectionDate <= endOfToday
    }).length

    const pendingInspections = filteredInspections.filter(
      inspection => inspection.status === 'scheduled'
    ).length

    const weeklyCompleted = filteredInspections.filter(inspection => {
      const inspectionDate = parseISO(inspection.date)
      return isValid(inspectionDate) && 
             inspectionDate >= startOfThisWeek && 
             inspectionDate <= endOfThisWeek &&
             inspection.status === 'completed'
    }).length

    const failedInspections = filteredInspections.filter(
      inspection => inspection.status === "failed"
    ).length

    return [
      {
        title: t("inspections.quickStats.todaysInspections"),
        value: todaysInspections,
        icon: CalendarDays,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        action: "viewToday",
        description: "View today's inspections"
      },
      {
        title: t("inspections.quickStats.pendingInspections"),
        value: pendingInspections,
        icon: Clock,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        action: "viewPending",
        description: "Review pending inspections"
      },
      {
        title: t("inspections.quickStats.weeklyCompleted"),
        value: weeklyCompleted,
        icon: CheckCircle,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        action: "viewWeeklyCompleted",
        description: "View completed this week"
      },
      {
        title: t("inspections.quickStats.failedInspections"),
        value: failedInspections,
        icon: AlertCircle,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        action: "viewFailed",
        description: "Review failed inspections"
      }
    ]
  }, [filteredInspections, t])

  // Handle quick stat card clicks
  const handleQuickStatClick = (action: string) => {
    switch (action) {
      case 'viewToday':
        setCurrentDate(new Date())
        setSelectedDate(new Date())
        break
      case 'viewPending':
        setFilters(prev => ({ ...prev, statusFilter: 'scheduled' }))
        break
      case 'viewWeeklyCompleted':
        setWeeklyCompletedFilter(true)
        setFilters(prev => ({ ...prev, statusFilter: 'completed' }))
        break
      case 'viewFailed':
        setFilters(prev => ({ ...prev, statusFilter: 'failed' }))
        break
    }
  }

  // Status filter options
  const statusOptions = useMemo(() => [
    { value: "all", label: t("common.all") },
    { value: "scheduled", label: t("inspections.status.scheduled") },
    { value: "in_progress", label: t("inspections.status.inProgress") },
    { value: "completed", label: t("inspections.status.completed") },
    { value: "cancelled", label: t("inspections.status.cancelled") },
    { value: "failed", label: t("inspections.status.failed") },
  ], [t])

  // Get calendar dates based on view
  const calendarDates = useMemo(() => {
    switch (calendarView) {
      case "month":
        return eachDayOfInterval({
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate)
        })
      case "week":
        return eachDayOfInterval({
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 })
        })
      default:
        return []
    }
  }, [calendarView, currentDate])

  // Get inspections for a specific date
  const getInspectionsForDate = (date: Date) => {
    return filteredInspections.filter(inspection => {
      const inspectionDate = parseISO(inspection.date)
      return isValid(inspectionDate) && isSameDay(inspectionDate, date)
    })
  }

  const ITEMS_PER_PAGE = 5;

  // Get selected date inspections
  const selectedDateInspections = selectedDate ? getInspectionsForDate(selectedDate) : []
  const totalSidebarPages = Math.ceil(selectedDateInspections.length / ITEMS_PER_PAGE)
  const paginatedSidebarInspections = selectedDateInspections.slice(
    (sidebarPage - 1) * ITEMS_PER_PAGE,
    sidebarPage * ITEMS_PER_PAGE
  );

  // Navigation functions
  const navigatePrevious = () => {
    switch (calendarView) {
      case "month":
        setCurrentDate(subMonths(currentDate, 1))
        break
      case "week":
        setCurrentDate(subWeeks(currentDate, 1))
        break
    }
  }

  const navigateNext = () => {
    switch (calendarView) {
      case "month":
        setCurrentDate(addMonths(currentDate, 1))
        break
      case "week":
        setCurrentDate(addWeeks(currentDate, 1))
        break
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get calendar title
  const getCalendarTitle = () => {
    switch (calendarView) {
      case "month":
        return format(currentDate, "MMMM yyyy")
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
        return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
      default:
        return ""
    }
  }

  // Get status badge classes
  const getStatusBadgeClasses = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700';
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "in_progress":
        return "bg-yellow-500"
      case "cancelled":
        return "bg-red-500"
      case "failed":
        return "bg-red-500"
      case "scheduled":
        return "bg-blue-500"
      default:
        return "bg-blue-500"
    }
  }

  // Handle day click
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setSidebarPage(1)
  }

  // Render calendar day
  const renderCalendarDay = (date: Date) => {
    const dayInspections = getInspectionsForDate(date)
    const isCurrentDay = isToday(date)
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const inspectionCount = dayInspections.length

    return (
      <div
        key={date.toISOString()}
        className={cn(
          "min-h-[80px] border border-border p-2 bg-background cursor-pointer hover:bg-muted/50 transition-colors",
          isCurrentDay && "bg-blue-50 dark:bg-blue-900/20",
          isSelected && "ring-2 ring-primary",
          calendarView === "month" && "aspect-square"
        )}
        onClick={() => handleDayClick(date)}
      >
        <div className={cn(
          "flex items-center justify-between mb-2",
          isCurrentDay && "font-semibold text-blue-600"
        )}>
          <span className="text-sm">
            {format(date, calendarView === "month" ? "d" : "EEE d")}
          </span>
          {inspectionCount > 0 && (
            <Badge variant="secondary" className="text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {inspectionCount}
            </Badge>
          )}
        </div>
        
        {/* Status dots for quick visual overview */}
        {inspectionCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {dayInspections.slice(0, 4).map((inspection, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full",
                  getStatusColor(inspection.status)
                )}
                title={`${inspection.vehicle?.name || 'Unnamed'} - ${inspection.status}`}
              />
            ))}
            {inspectionCount > 4 && (
              <span className="text-xs text-muted-foreground">+{inspectionCount - 4}</span>
            )}
          </div>
        )}
      </div>
    )
  }

  // Clear search
  const clearSearch = () => {
    setFilters(prev => ({ ...prev, searchQuery: "" }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters(prev => ({
      ...prev,
      statusFilter: "all",
      vehicleFilter: "all",
      inspectorFilter: "all",
      searchQuery: "",
      dateRange: "all"
    }))
    setWeeklyCompletedFilter(false)
  }

  // Render list view
  const renderListView = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t("inspections.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile Card List */}
        <div className="md:hidden space-y-4">
          {filteredInspections.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {debouncedSearch || filters.statusFilter !== "all" 
                ? t("common.noResults")
                : t("inspections.noInspections")}
            </p>
          ) : (
            filteredInspections.map((inspection) => (
              <Card key={inspection.id} className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium">
                      {inspection.vehicle?.name || t("inspections.noVehicle")}
                    </p>
                    {inspection.vehicle?.plate_number && (
                      <p className="text-xs text-muted-foreground">
                        {inspection.vehicle.plate_number}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={cn("text-xs", getStatusBadgeClasses(inspection.status))}>
                    {inspection.status ? (
                      (() => {
                        const statusKey = `inspections.status.${inspection.status}`;
                        try { return t(statusKey as any); } catch { return inspection.status; }
                      })()
                    ) : t("common.notAvailable")}
                  </Badge>
                </div>

                <div className="flex flex-wrap justify-between text-sm mt-3 gap-2">
                  <span>{inspection.type || t("inspections.type.unspecified")}</span>
                  <span>{format(parseISO(inspection.date), "MMM d, yyyy")}</span>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm text-muted-foreground">
                    {inspection.inspector?.name || t("common.notAssigned")}
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/inspections/${inspection.id}`}> 
                      <Eye className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("inspections.fields.vehicle")}</TableHead>
                <TableHead>{t("inspections.fields.type")}</TableHead>
                <TableHead>{t("inspections.fields.date")}</TableHead>
                <TableHead>{t("inspections.fields.status")}</TableHead>
                <TableHead>{t("inspections.fields.inspector")}</TableHead>
                <TableHead className="w-[100px]">{t("common.actions.default")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {debouncedSearch || filters.statusFilter !== "all" 
                      ? t("common.noResults")
                      : t("inspections.noInspections")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {inspection.vehicle?.name || t("inspections.noVehicle")}
                        </div>
                        {inspection.vehicle?.plate_number && (
                          <div className="text-sm text-muted-foreground">
                            {inspection.vehicle.plate_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {inspection.type || t("inspections.type.unspecified")}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(inspection.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", getStatusBadgeClasses(inspection.status))}>
                        {inspection.status ? (
                          (() => {
                            const statusKey = `inspections.status.${inspection.status}`;
                            try { return t(statusKey as any); } catch { return inspection.status; }
                          })()
                        ) : t("common.notAvailable")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inspection.inspector?.name || t("common.notAssigned")}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/inspections/${inspection.id}`}> <Eye className="h-3 w-3" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t px-6 py-4">
        <div className="text-sm text-muted-foreground">
          {t ? t("common.pagination.pageOf", { page: listCurrentPage, total: listTotalPages }) : `Page ${listCurrentPage} of ${listTotalPages}`}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={listCurrentPage <= 1} onClick={() => goToPage(listCurrentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={listCurrentPage >= listTotalPages} onClick={() => goToPage(listCurrentPage + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )

  // Add debugging function to check template assignments
  const debugTemplateAssignments = async (vehicleId: string) => {
    if (!vehicleId) return;
    
    try {
      console.log("[INSPECTION_LIST_DEBUG] Checking template assignments for vehicle:", vehicleId);
      
      // Check direct vehicle assignments
      const { data: vehicleAssignments } = await supabase
        .from('inspection_template_assignments')
        .select('template_type')
        .eq('vehicle_id', vehicleId)
        .eq('is_active', true);
        
      console.log("[INSPECTION_LIST_DEBUG] Direct vehicle assignments:", vehicleAssignments);
      
      // Get vehicle group ID
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('vehicle_group_id')
        .eq('id', vehicleId)
        .single();
        
      if (vehicleData?.vehicle_group_id) {
        // Check group assignments
        const { data: groupAssignments } = await supabase
          .from('inspection_template_assignments')
          .select('template_type')
          .eq('vehicle_group_id', vehicleData.vehicle_group_id)
          .eq('is_active', true);
          
        console.log("[INSPECTION_LIST_DEBUG] Group assignments for vehicle group:", vehicleData.vehicle_group_id, groupAssignments);
      }
    } catch (error) {
      console.error("[INSPECTION_LIST_DEBUG] Error checking template assignments:", error);
    }
  };

  // Function to get template display name for an inspection
  const getTemplateDisplayName = async (inspection: Inspection): Promise<string | null> => {
    if (!inspection.vehicle_id) return null;
    
    try {
      // First check for a specific assignment for this vehicle
      let { data: vehicleAssignment } = await supabase
        .from('inspection_template_assignments')
        .select('template_type')
        .eq('vehicle_id', inspection.vehicle_id)
        .eq('is_active', true)
        .maybeSingle();

      if (vehicleAssignment) {
        // noisy console removed
        return vehicleAssignment.template_type;
      }
      
      // If no vehicle-specific assignment, try to find via vehicle group
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('vehicle_group_id')
        .eq('id', inspection.vehicle_id)
        .maybeSingle();

      if (vehicleData?.vehicle_group_id) {
        const { data: groupAssignment } = await supabase
          .from('inspection_template_assignments')
          .select('template_type')
          .eq('vehicle_group_id', vehicleData.vehicle_group_id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (groupAssignment) {
          return groupAssignment.template_type;
        }
      }
      
      // If we have a direct type, use it
      if (inspection.type && inspection.type.includes('Daily Checklist')) {
        return inspection.type;
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching template type:", error);
      return null;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("inspections.title")}</h1>
            <p className="text-muted-foreground">{t("inspections.description")}</p>
          </div>
          <Button asChild>
            <Link href="/inspections/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("inspections.createInspection")}
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <InspectionFilter
          filters={filters}
          onFiltersChange={setFilters}
          totalInspections={filteredInspections.length}
          totalScheduled={filteredInspections.filter(i => i.status === 'scheduled').length}
          totalCompleted={filteredInspections.filter(i => i.status === 'completed').length}
          totalFailed={filteredInspections.filter(i => i.status === 'failed').length}
          className="mb-6"
        />

        {/* Results Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t("inspections.title")}</h2>
            <p className="text-muted-foreground">
              {weeklyCompletedFilter 
                ? "Weekly completed inspections" 
                : "Track and manage vehicle inspections"
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              Showing {filteredInspections.length} of {inspectionsWithVehicles.length} total inspections
              {weeklyCompletedFilter && (
                <span className="ml-2 text-green-600 dark:text-green-400">
                  (Completed this week)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-4">
            {/* Active Filters Display */}
            {(filters.searchQuery || filters.statusFilter !== 'all' || weeklyCompletedFilter) && (
              <div className="flex items-center gap-2">
                {weeklyCompletedFilter && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
                    Weekly Completed Only
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
            
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card 
              key={index} 
              className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 border-l-transparent hover:border-l-current"
              onClick={() => handleQuickStatClick(stat.action)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-lg transition-transform group-hover:scale-110", stat.bgColor)}>
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {stat.title}
                    </p>
                    <p className={cn("text-2xl font-bold transition-colors", stat.color)}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content - Calendar or List View */}
      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className={cn("space-y-4", selectedDate ? "lg:col-span-3" : "lg:col-span-4")}>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>{t("inspections.calendar.title")}</CardTitle>
                  <div className="flex items-center gap-4">
                    <Select value={calendarView} onValueChange={(value) => setCalendarView(value as CalendarView)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">{t("inspections.calendar.month")}</SelectItem>
                        <SelectItem value="week">{t("inspections.calendar.week")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={navigatePrevious}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToToday}>
                        {t("inspections.calendar.today")}
                      </Button>
                      <Button variant="outline" size="sm" onClick={navigateNext}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-lg font-semibold">{getCalendarTitle()}</div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
                  {/* Week headers */}
                  {[
                    t("calendar.weekdays.mon"),
                    t("calendar.weekdays.tue"), 
                    t("calendar.weekdays.wed"),
                    t("calendar.weekdays.thu"),
                    t("calendar.weekdays.fri"),
                    t("calendar.weekdays.sat"),
                    t("calendar.weekdays.sun")
                  ].map((day, index) => (
                    <div key={index} className="p-3 text-center font-medium bg-muted text-sm">
                      {day}
                    </div>
                  ))}
                  {/* Calendar days */}
                  {calendarDates.map((date) => renderCalendarDay(date))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Details Panel */}
          {selectedDate && (
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {t("inspections.calendar.inspectionsOnDate", { 
                      count: selectedDateInspections.length,
                      date: format(selectedDate, "MMMM d")
                    })}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto p-3">
                  {selectedDateInspections.length > 0 ? (
                    paginatedSidebarInspections.map((inspection) => (
                      <Link key={inspection.id} href={`/inspections/${inspection.id}`} className="block">
                        <div className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate pr-2">
                              {inspection.vehicle?.name || t("inspections.unnamedInspection")}
                            </h4>
                                                          <Badge 
                              variant="outline" 
                              className={cn("text-xs flex-shrink-0", getStatusBadgeClasses(inspection.status))}
                            >
                              {inspection.status ? (
                                // Use a safer approach to access translation keys
                                (() => {
                                  console.log("[INSPECTION_LIST_BADGE] Status:", inspection.status);
                                  const statusKey = `inspections.status.${inspection.status}`;
                                  try {
                                    return t(statusKey as any);
                                  } catch (error) {
                                    console.error(`Error translating status: ${statusKey}`, error);
                                    return inspection.status;
                                  }
                                })()
                              ) : t("common.notAvailable")}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div><span className="font-medium">{inspection.vehicle?.plate_number || t("inspections.noVehicle")}</span> - {inspection.type || t("inspections.type.unspecified")}</div>
                            <div className="flex justify-between mt-1">
                              <div>
                                <span className="text-xs text-muted-foreground">{t("inspections.fields.inspector")}:</span>{" "}
                                <span className="text-xs font-medium">{inspection.inspector?.name || t("common.notAssigned")}</span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">{t("common.time")}:</span>{" "}
                                <span className="text-xs">{format(parseISO(inspection.date), "HH:mm")}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {t("inspections.calendar.noInspectionsOnDate")}
                    </div>
                  )}
                </CardContent>
                {totalSidebarPages > 1 && (
                  <CardFooter className="flex justify-between items-center pt-3 pb-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSidebarPage(p => p - 1)}
                      disabled={sidebarPage === 1}
                    >
                      {t('common.previous')}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {sidebarPage} / {totalSidebarPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSidebarPage(p => p + 1)}
                      disabled={sidebarPage === totalSidebarPages}
                    >
                      {t('common.next')}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
          )}
        </div>
      ) : (
        renderListView()
      )}
    </div>
  )
} 