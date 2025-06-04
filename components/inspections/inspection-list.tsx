"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertTriangle, Eye, Search, X, Filter, List, Grid3X3 } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
}

export function InspectionList({ inspections = [], vehicles = [], currentPage = 1, totalPages = 1 }: InspectionListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const [inspectionsWithVehicles, setInspectionsWithVehicles] = useState(inspections)
  const [calendarView, setCalendarView] = useState<CalendarView>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const debouncedSearch = useDebounce(search, 500)

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (viewMode !== "calendar") params.set("view", viewMode)
    
    const newUrl = params.toString() ? `?${params.toString()}` : ""
    router.replace(newUrl as any, { scroll: false })
  }, [debouncedSearch, statusFilter, viewMode, router])

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
                  vehicle: {
                    ...vehicle,
                    image_url: vehicle.image_url === null ? undefined : vehicle.image_url
                  }
                } as Inspection
              }
            }
            return inspection
          })
        )
        // Sort inspections by date (most recent first)
        const sortedInspections = updatedInspections.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ) as Inspection[]
        setInspectionsWithVehicles(sortedInspections)
      } catch (error) {
        console.error(t('errors.failedToLoadData', { entity: 'vehicle data' }), error)
      }
    }

    loadVehicleData()
  }, [inspections, vehicles, t])

  // Filter inspections based on search and status
  const filteredInspections = useMemo(() => {
    return inspectionsWithVehicles.filter((inspection) => {
      const matchesSearch = !debouncedSearch || 
        (inspection.vehicle?.name && inspection.vehicle.name.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (inspection.vehicle?.plate_number && inspection.vehicle.plate_number.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (inspection.type && inspection.type.toLowerCase().includes(debouncedSearch.toLowerCase()))
      
      const matchesStatus = statusFilter === "all" || inspection.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [inspectionsWithVehicles, debouncedSearch, statusFilter])

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
      inspection => inspection.status === 'cancelled'
    ).length

    return [
      {
        title: t("inspections.quickStats.todaysInspections"),
        value: todaysInspections,
        icon: CalendarIcon,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-900/20"
      },
      {
        title: t("inspections.quickStats.pendingInspections"),
        value: pendingInspections,
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20"
      },
      {
        title: t("inspections.quickStats.weeklyCompleted"),
        value: weeklyCompleted,
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-900/20"
      },
      {
        title: t("inspections.quickStats.failedInspections"),
        value: failedInspections,
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-900/20"
      }
    ]
  }, [filteredInspections, t])

  // Status filter options
  const statusOptions = useMemo(() => [
    { value: "all", label: t("common.all") },
    { value: "scheduled", label: t("inspections.status.scheduled") },
    { value: "in_progress", label: t("inspections.status.inProgress") },
    { value: "completed", label: t("inspections.status.completed") },
    { value: "cancelled", label: t("inspections.status.failed") },
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

  // Get selected date inspections
  const selectedDateInspections = selectedDate ? getInspectionsForDate(selectedDate) : []

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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "in_progress":
        return "bg-yellow-500"
      case "cancelled":
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
    setSearch("")
  }

  // Clear all filters
  const clearFilters = () => {
    setSearch("")
    setStatusFilter("all")
  }

  // Render list view
  const renderListView = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t("inspections.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("inspections.fields.vehicle")}</TableHead>
              <TableHead>{t("inspections.fields.type")}</TableHead>
              <TableHead>{t("inspections.fields.date")}</TableHead>
              <TableHead>{t("inspections.fields.status")}</TableHead>
              <TableHead className="w-[100px]">{t("common.actions.default")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {debouncedSearch || statusFilter !== "all" 
                    ? t("common.noResults")
                    : t("inspections.noInspections")
                  }
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
                    {inspection.type ? t(`inspections.type.${inspection.type.toLowerCase()}`) || inspection.type : t("inspections.type.unspecified")}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(inspection.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", {
                        "border-green-500 text-green-700": inspection.status === "completed",
                        "border-yellow-500 text-yellow-700": inspection.status === "in_progress", 
                        "border-red-500 text-red-700": inspection.status === "cancelled",
                        "border-blue-500 text-blue-700": inspection.status === "scheduled"
                      })}
                    >
                      {t(`inspections.status.${inspection.status}` as any)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/inspections/${inspection.id}`}>
                        <Eye className="h-3 w-3" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

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
            <Link href="/inspections/create">
              <Plus className="mr-2 h-4 w-4" />
              {t("inspections.createInspection")}
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t("inspections.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-10"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={clearSearch}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(search || statusFilter !== "all") && (
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Clear
              </Button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-lg", stat.bgColor)}>
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">
                      {stat.value}
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
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div key={day} className="p-3 text-center font-medium bg-muted text-sm">
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
                <CardContent className="space-y-3">
                  {selectedDateInspections.length > 0 ? (
                    selectedDateInspections.map((inspection) => (
                      <div key={inspection.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            {inspection.vehicle?.name || t("inspections.unnamedInspection")}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", {
                              "border-green-500 text-green-700": inspection.status === "completed",
                              "border-yellow-500 text-yellow-700": inspection.status === "in_progress", 
                              "border-red-500 text-red-700": inspection.status === "cancelled",
                              "border-blue-500 text-blue-700": inspection.status === "scheduled"
                            })}
                          >
                            {t(`inspections.status.${inspection.status}` as any)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Vehicle: {inspection.vehicle?.plate_number || t("inspections.noVehicle")}</div>
                          <div>Type: {inspection.type || t("inspections.type.unspecified")}</div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full" asChild>
                          <Link href={`/inspections/${inspection.id}`}>
                            <Eye className="mr-2 h-3 w-3" />
                            {t("inspections.calendar.viewInspection")}
                          </Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {t("inspections.calendar.noInspectionsOnDate")}
                    </div>
                  )}
                </CardContent>
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