"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertTriangle, Eye, Search, X, Filter, List, Grid3X3, TrendingUp, Users, CalendarDays, AlertCircle, ChevronDown } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import type { OptimizedInspection, DbVehicle } from "@/types"
import { format, parseISO, isValid, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addWeeks, subWeeks, startOfDay, endOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { getInspectionStatusBadgeClasses, getInspectionStatusDotColor } from "@/lib/utils/styles"
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
import { useAutoScroll } from "@/lib/hooks/use-auto-scroll"

// Helper function to translate month names
const getTranslatedMonth = (date: Date, t: (key: string) => string, format: 'full' | 'abbr' = 'full') => {
  const monthIndex = date.getMonth()
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ]
  const monthAbbrs = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ]
  
  if (format === 'full') {
    return t(`inspections.months.${monthNames[monthIndex]}`)
  } else {
    return t(`inspections.monthAbbreviations.${monthAbbrs[monthIndex]}`)
  }
}

// Helper function to translate Daily Checklist
const translateDailyChecklist = (type: string, t: (key: string) => string) => {
  if (type && type.includes('Daily Checklist')) {
    return type.replace('Daily Checklist', t('inspections.dailyChecklist'))
  }
  return type
}

// Extended inspection type for this component
interface ExtendedInspection extends Omit<OptimizedInspection, 'type'> {
  vehicle?: {
    id: string
    name: string
    plate_number: string
    image_url?: string
    brand?: string
    model?: string
  }
  inspector?: {
    id: string
    name: string
  }
  type?: string // Custom type field for template display name
}

interface InspectionListProps {
  inspections: OptimizedInspection[]
  allInspections: any[] // Full dataset for calendar view
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

export function InspectionList({ inspections = [], allInspections = [], vehicles = [], currentPage = 1, totalPages = 1 }: InspectionListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const supabase = useSupabase()
  const [inspectionsWithVehicles, setInspectionsWithVehicles] = useState<ExtendedInspection[]>([])
  const [allInspectionsWithVehicles, setAllInspectionsWithVehicles] = useState<ExtendedInspection[]>([])
  const [filteredInspections, setFilteredInspections] = useState<ExtendedInspection[]>([])
  const [calendarView, setCalendarView] = useState<CalendarView>("month")
  const [currentDate, setCurrentDate] = useState(() => {
    // Get today's date in local timezone, avoiding any UTC conversion
    const today = new Date()
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
    const todayLocal = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())
    
    console.log('📅 [INSPECTION_LIST] Component initialized with date:', {
      original: today.toISOString(),
      localDate: localDate.toISOString(),
      todayLocal: todayLocal.toISOString(),
      dayOfWeek: format(todayLocal, 'EEEE'),
      month: format(todayLocal, 'MMMM'),
      year: format(todayLocal, 'yyyy'),
      fullDate: todayLocal.toString()
    })
    return todayLocal
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [sidebarPage, setSidebarPage] = useState(1)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [filters, setFilters] = useState<InspectionFilterOptions>({
    statusFilter: 'all',
    vehicleModelFilter: 'all', // Changed from vehicleFilter
    inspectorFilter: 'all',
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
    dateRange: 'all'
  })
  const [weeklyCompletedFilter, setWeeklyCompletedFilter] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const debouncedSearch = useDebounce(filters.searchQuery, 500)
  
  // Auto-scroll hook for sidebar
  const { targetRef: sidebarRef, scrollToTarget } = useAutoScroll(
    (date: Date) => getInspectionsForDate(date).length > 0,
    { scrollDelay: 100 }
  )

  // Simple inspector loading function
  const loadInspectorData = async (inspectorId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', inspectorId)
        .single()
      
      if (data) {
        return { id: data.id, name: data.full_name }
      }
    } catch (error) {
      console.error('Error loading inspector:', error)
    }
    return null
  }

  // Batch load inspector data for multiple inspections
  const loadInspectorsBatch = async (inspectorIds: string[]) => {
    try {
      const uniqueIds = [...new Set(inspectorIds.filter(id => id && id !== null))]
      if (uniqueIds.length === 0) return new Map()
      
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', uniqueIds)
      
      if (data) {
        return new Map(data.map(i => [
          i.id, 
          { id: i.id, name: i.full_name }
        ]))
      }
    } catch (error) {
      console.error('Error batch loading inspectors:', error)
    }
    return new Map()
  }

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (filters.statusFilter !== "all") params.set("status", filters.statusFilter)
    if (viewMode !== "calendar") params.set("view", viewMode)
    
    const newUrl = params.toString() ? `?${params.toString()}` : ""
    router.replace(newUrl as any, { scroll: false })
  }, [debouncedSearch, filters.statusFilter, viewMode, router])

  // Single data transformation - happens once when data changes, not on view changes
  useEffect(() => {
    if (!inspections || inspections.length === 0) {
      setInspectionsWithVehicles([]);
      setFilteredInspections([]);
      return;
    }

    console.log('🔍 [DATA_TRANSFORM] Raw inspection data sample:', {
      first: inspections[0],
      fields: Object.keys(inspections[0] || {}),
      vehicleFields: {
        vehicle_name: inspections[0]?.vehicle_name,
        vehicle_brand: inspections[0]?.vehicle_brand,
        vehicle_model: inspections[0]?.vehicle_model
      }
    });

    try {
      setIsLoading(true)
      
      // Transform the pre-joined data once
      const transformedInspections = inspections.map((inspection) => {
        const transformed = { ...inspection } as ExtendedInspection;
        
        // Vehicle data is already pre-joined
        if (inspection.vehicle_name) {
          transformed.vehicle = {
            id: inspection.vehicle_id,
            name: inspection.vehicle_name,
            plate_number: inspection.vehicle_plate_number,
            brand: inspection.vehicle_brand || undefined,
            model: inspection.vehicle_model || undefined,
            image_url: undefined
          };
        }
        
        // Inspector data is already pre-joined
        if (inspection.inspector_name) {
          transformed.inspector = {
            id: inspection.inspector_id || '',
            name: inspection.inspector_name
          };
        }
        
        // Use template_display_name if available
        if (inspection.template_display_name) {
          (transformed as any).type = inspection.template_display_name;
        }
        
        return transformed;
      });
      
      // Sort by date (most recent first)
      const sortedInspections = transformedInspections.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setInspectionsWithVehicles(sortedInspections);
      setFilteredInspections(sortedInspections); // Initialize filtered data with all data
      
      // Keep calendar showing current month - don't override with inspection dates
      // The calendar should always start with the current month for better UX
      console.log('📅 [INSPECTION_LIST] Calendar initialized with current date:', currentDate.toISOString());
    } catch (error) {
      console.error('Error transforming inspection data:', error);
      setInspectionsWithVehicles(inspections as any);
      setFilteredInspections(inspections as any);
    } finally {
      setIsLoading(false);
    }
  }, [inspections]); // Only depend on inspections data, not view mode

  // Transform all inspections for calendar view
  useEffect(() => {
    if (!allInspections || allInspections.length === 0) return;
    
    try {
      // Transform all inspections for calendar view
      const transformedAllInspections = allInspections.map((item: any) => {
        const transformed = { ...item } as ExtendedInspection;
        
        // Vehicle data
        if (item.vehicle_name || item.vehicle_brand) {
          transformed.vehicle = {
            id: item.vehicle_id,
            name: item.vehicle_name || '',
            plate_number: item.vehicle_plate_number || '',
            brand: item.vehicle_brand || undefined,
            model: item.vehicle_model || undefined,
            image_url: undefined
          };
        }
        
        // Inspector data (we'll get this from the main inspections data)
        if (item.inspector_id) {
          // Find the inspector data from the main inspections
          const mainInspection = inspections.find(i => i.id === item.id);
          if (mainInspection?.inspector_name) {
            transformed.inspector = {
              id: item.inspector_id,
              name: mainInspection.inspector_name
            };
          }
        }
        
        // Use type as template display name
        (transformed as any).type = item.type || 'routine';
        
        return transformed;
      });
      
      // Store all inspections for calendar view
      setAllInspectionsWithVehicles(transformedAllInspections);
    } catch (error) {
      console.error('Error transforming all inspection data:', error);
    }
  }, [allInspections, inspections]);

  // View-specific filtering - no data reloading, just filtering existing data
  useEffect(() => {
    if (!inspectionsWithVehicles || inspectionsWithVehicles.length === 0) return;

    console.log('🔍 [INSPECTION_LIST] Applying filters:', {
      viewMode,
      calendarView,
      currentDate,
      filters,
      totalInspections: inspectionsWithVehicles.length
    });

    // For calendar view, we need to use all inspections initially, then apply filters
    // For list view, we use the paginated inspections
    let dataToFilter = viewMode === "calendar" ? allInspectionsWithVehicles : inspectionsWithVehicles;
    
    if (!dataToFilter || dataToFilter.length === 0) {
      dataToFilter = inspectionsWithVehicles; // Fallback
    }

    let filteredData = [...dataToFilter];

    // Apply calendar view date filtering if needed
    if (viewMode === "calendar") {
      const rangeStart = calendarView === "month" 
        ? startOfMonth(currentDate) 
        : startOfWeek(currentDate)
      const rangeEnd = calendarView === "month" 
        ? endOfMonth(currentDate) 
        : endOfWeek(currentDate)
      
      console.log('📅 [INSPECTION_LIST] Calendar date range:', {
        rangeStart: rangeStart.toISOString(),
        rangeEnd: rangeEnd.toISOString(),
        currentDate: currentDate.toISOString()
      });
      
      filteredData = filteredData.filter(inspection => {
        const inspectionDate = new Date(inspection.date)
        return inspectionDate >= rangeStart && inspectionDate <= rangeEnd
      });
      
      console.log('📅 [INSPECTION_LIST] After calendar filtering:', filteredData.length, 'inspections');
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const today = startOfDay(now)
      const endOfToday = endOfDay(now)
      
      switch (filters.dateRange) {
        case 'today':
          filteredData = filteredData.filter(inspection => {
            const inspectionDate = new Date(inspection.date)
            return inspectionDate >= today && inspectionDate <= endOfToday
          })
          break
        case 'week':
          const startOfThisWeek = startOfWeek(now)
          const endOfThisWeek = endOfWeek(now)
          filteredData = filteredData.filter(inspection => {
            const inspectionDate = new Date(inspection.date)
            return inspectionDate >= startOfThisWeek && inspectionDate <= endOfThisWeek
          })
          break
        case 'month':
          const startOfThisMonth = startOfMonth(now)
          const endOfThisMonth = endOfMonth(now)
          filteredData = filteredData.filter(inspection => {
            const inspectionDate = new Date(inspection.date)
            return inspectionDate >= startOfThisMonth && inspectionDate <= endOfThisMonth
          })
          break
      }
    }

    // Apply other filters (status, vehicle, inspector, search)
    filteredData = filteredData.filter((inspection: ExtendedInspection) => {
      // Status filter
      const matchesStatus = filters.statusFilter === 'all' || inspection.status === filters.statusFilter
      if (!matchesStatus) return false

      // Vehicle model filter (changed from brand)
      if (filters.vehicleModelFilter !== 'all') {
        console.log('🔍 [VEHICLE_FILTER] Filtering by model:', {
          filterModel: filters.vehicleModelFilter,
          inspectionModel: inspection.vehicle?.model,
          vehicleName: inspection.vehicle?.name,
          vehicleId: inspection.vehicle_id,
          vehicleObject: inspection.vehicle,
          matches: inspection.vehicle?.model === filters.vehicleModelFilter
        });
        const matchesVehicle = inspection.vehicle?.model === filters.vehicleModelFilter
        if (!matchesVehicle) return false
      }

      // Inspector filter
      if (filters.inspectorFilter !== 'all') {
        console.log('🔍 [INSPECTOR_FILTER] Filtering by inspector:', {
          filterInspector: filters.inspectorFilter,
          inspectionInspectorId: inspection.inspector_id,
          inspectionInspectorName: inspection.inspector?.name,
          matches: inspection.inspector_id === filters.inspectorFilter
        });
        
        if (filters.inspectorFilter === 'assigned') {
          if (!inspection.inspector_id) return false
        } else if (filters.inspectorFilter === 'unassigned') {
          if (inspection.inspector_id) return false
        } else {
          // Specific inspector ID (which is inspector_id from profiles)
          if (inspection.inspector_id !== filters.inspectorFilter) return false
        }
      }

      // Weekly completed filter
      if (weeklyCompletedFilter) {
        const inspectionDate = parseISO(inspection.date)
        const startOfThisWeek = startOfWeek(new Date())
        const endOfThisWeek = endOfWeek(new Date())
        const isInWeek = isValid(inspectionDate) &&
          inspectionDate >= startOfThisWeek &&
          inspectionDate <= endOfThisWeek
        const matchesWeeklyCompleted = isInWeek && inspection.status === 'completed'
        if (!matchesWeeklyCompleted) return false
      }

      return true
    });

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      filteredData = filteredData.filter((inspection: ExtendedInspection) => (
        (inspection.vehicle?.name && inspection.vehicle.name.toLowerCase().includes(searchLower)) ||
        (inspection.vehicle?.plate_number && inspection.vehicle.plate_number.toLowerCase().includes(searchLower)) ||
        (inspection.type && inspection.type.toLowerCase().includes(searchLower))
      ))
    }

    // Sort the filtered data
    filteredData.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date':
          return filters.sortOrder === 'asc' 
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'vehicle':
          return filters.sortOrder === 'asc'
            ? (a.vehicle?.name || '').localeCompare(b.vehicle?.name || '')
            : (b.vehicle?.name || '').localeCompare(a.vehicle?.name || '')
        case 'status':
          return filters.sortOrder === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status)
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    });

    console.log('✅ [INSPECTION_LIST] Final filtered data:', {
      total: filteredData.length,
      sample: filteredData.slice(0, 2).map(i => ({ id: i.id, date: i.date, vehicle: i.vehicle?.name }))
    });

    // Update the filtered inspections state
    setFilteredInspections(filteredData);
  }, [inspectionsWithVehicles, allInspectionsWithVehicles, viewMode, calendarView, currentDate, filters, debouncedSearch, weeklyCompletedFilter]);

  // Server-provided pagination for list view
  const listCurrentPage = currentPage
  const listTotalPages = totalPages

  const goToPage = (page: number) => {
    const params = new URLSearchParams(Array.from(searchParams?.entries() || []))
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
        description: t("inspections.summaryCards.viewTodayInspections")
      },
      {
        title: t("inspections.quickStats.pendingInspections"),
        value: pendingInspections,
        icon: Clock,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        action: "viewPending",
        description: t("inspections.summaryCards.reviewPendingInspections")
      },
      {
        title: t("inspections.quickStats.weeklyCompleted"),
        value: weeklyCompleted,
        icon: CheckCircle,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        action: "viewWeeklyCompleted",
        description: t("inspections.summaryCards.viewCompletedThisWeek")
      },
      {
        title: t("inspections.quickStats.failedInspections"),
        value: failedInspections,
        icon: AlertCircle,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        action: "viewFailed",
        description: t("inspections.summaryCards.reviewFailedInspections")
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
    // Debug: Log current date info
    console.log('📅 [CALENDAR] Current date info:', {
      original: currentDate.toISOString(),
      dayOfWeek: format(currentDate, 'EEEE'),
      month: format(currentDate, 'MMMM'),
      year: format(currentDate, 'yyyy'),
      view: calendarView,
      fullDate: currentDate.toString(),
      // Test: What should today actually be?
      expectedToday: new Date().toDateString(),
      currentDateString: currentDate.toDateString()
    });
    
    let startDate, endDate;
    
    switch (calendarView) {
      case "month":
        // For month view, start from the beginning of the week containing the first day of the month
        // and end at the end of the week containing the last day of the month
        startDate = startOfWeek(startOfMonth(currentDate))
        endDate = endOfWeek(endOfMonth(currentDate))
        console.log('📅 [CALENDAR] Month view dates:', {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          startDay: format(startDate, 'EEEE, MMMM d, yyyy'),
          endDay: format(endDate, 'EEEE, MMMM d, yyyy'),
          monthStart: format(startOfMonth(currentDate), 'EEEE, MMMM d, yyyy'),
          monthEnd: format(endOfMonth(currentDate), 'EEEE, MMMM d, yyyy')
        })
        break
      case "week":
        startDate = startOfWeek(currentDate)
        endDate = endOfWeek(currentDate)
        console.log('📅 [CALENDAR] Week view dates:', {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          startDay: format(startDate, 'EEEE, MMMM d, yyyy'),
          endDay: format(endDate, 'EEEE, MMMM d, yyyy')
        })
        break
      default:
        return []
    }
    
    const dates = eachDayOfInterval({ start: startDate, end: endDate })
    console.log('📅 [CALENDAR] Generated dates count:', dates.length, 'First date:', format(dates[0], 'EEEE, MMMM d, yyyy'))
    
    return dates
  }, [calendarView, currentDate])

  // Get inspections for a specific date (limited for performance)
  const getInspectionsForDate = (date: Date) => {
    // For calendar view, use filtered inspections to respect filters
    const dataToFilter = viewMode === "calendar" ? filteredInspections : filteredInspections;
    
    const dayInspections = dataToFilter.filter(inspection => {
      const inspectionDate = parseISO(inspection.date)
      return isValid(inspectionDate) && isSameDay(inspectionDate, date)
    })
    
    // Limit to first 5 inspections per day for performance
    return dayInspections.slice(0, 5)
  }

  // Get total count for a date (for "View All" functionality)
  const getInspectionCountForDate = (date: Date) => {
    // For calendar view, use filtered inspections to respect filters
    const dataToFilter = viewMode === "calendar" ? filteredInspections : filteredInspections;
    
    return dataToFilter.filter(inspection => {
      const inspectionDate = parseISO(inspection.date)
      return isValid(inspectionDate) && isSameDay(inspectionDate, date)
    }).length
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
        const prevMonth = subMonths(currentDate, 1)
        setCurrentDate(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate()))
        break
      case "week":
        const prevWeek = subWeeks(currentDate, 1)
        setCurrentDate(new Date(prevWeek.getFullYear(), prevWeek.getMonth(), prevWeek.getDate()))
        break
    }
  }

  const navigateNext = () => {
    switch (calendarView) {
      case "month":
        const nextMonth = addMonths(currentDate, 1)
        setCurrentDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonth.getDate()))
        break
      case "week":
        const nextWeek = addWeeks(currentDate, 1)
        setCurrentDate(new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate()))
        break
    }
  }

  const goToToday = () => {
    // Get today's date in local timezone, avoiding any UTC conversion
    const today = new Date()
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
    const todayLocal = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate())
    
    console.log('📅 [INSPECTION_LIST] Going to today:', {
      original: today.toISOString(),
      localDate: localDate.toISOString(),
      todayLocal: todayLocal.toISOString(),
      dayOfWeek: format(todayLocal, 'EEEE'),
      month: format(todayLocal, 'MMMM'),
      year: format(todayLocal, 'yyyy'),
      fullDate: todayLocal.toString()
    })
    setCurrentDate(todayLocal)
  }

  // Get calendar title
  const getCalendarTitle = () => {
    switch (calendarView) {
      case "month":
        return `${getTranslatedMonth(currentDate, t, 'full')} ${currentDate.getFullYear()}`
      case "week":
        const weekStart = startOfWeek(currentDate)
        const weekEnd = endOfWeek(currentDate)
        return `${getTranslatedMonth(weekStart, t, 'abbr')} ${weekStart.getDate()} - ${getTranslatedMonth(weekEnd, t, 'abbr')} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
      default:
        return ""
    }
  }


  // Handle day click
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setSidebarPage(1)
    scrollToTarget(date)
  }

  // Render calendar day
  const renderCalendarDay = (date: Date) => {
    const dayInspections = getInspectionsForDate(date)
    const isCurrentDay = isToday(date)
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const inspectionCount = dayInspections.length

    // Debug: Log calendar day data for first few days
    if (date.getDate() <= 3) { // Log first 3 days to see the pattern
      console.log('📅 [CALENDAR_DAY] Rendering day:', {
        date: date.toISOString(),
        dayOfWeek: format(date, 'EEEE'),
        dayNumber: date.getDate(),
        month: format(date, 'MMMM'),
        year: date.getFullYear(),
        inspectionCount,
        dayInspections: dayInspections.map(i => ({ id: i.id, vehicle: i.vehicle?.name, status: i.status }))
      });
    }

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
                  getInspectionStatusDotColor(inspection.status)
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
      vehicleModelFilter: "all",
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
                  <Badge variant="outline" className={cn("text-xs", getInspectionStatusBadgeClasses(inspection.status))}>
                    {inspection.status ? (
                      (() => {
                        const statusKey = `inspections.status.${inspection.status}`;
                        try { return t(statusKey as any); } catch { return inspection.status; }
                      })()
                    ) : t("common.notAvailable")}
                  </Badge>
                </div>

                <div className="flex flex-wrap justify-between text-sm mt-3 gap-2">
                  <span>{inspection.type ? translateDailyChecklist(inspection.type, t) : t("inspections.type.unspecified")}</span>
                  <span>{getTranslatedMonth(parseISO(inspection.date), t, 'abbr')} {parseISO(inspection.date).getDate()}, {parseISO(inspection.date).getFullYear()}</span>
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
                      {inspection.type ? translateDailyChecklist(inspection.type, t) : t("inspections.type.unspecified")}
                    </TableCell>
                    <TableCell>
                      {getTranslatedMonth(parseISO(inspection.date), t, 'abbr')} {parseISO(inspection.date).getDate()}, {parseISO(inspection.date).getFullYear()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", getInspectionStatusBadgeClasses(inspection.status))}>
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
  const getTemplateDisplayName = async (inspection: OptimizedInspection): Promise<string | null> => {
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
        return translateDailyChecklist(inspection.type, t);
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching template type:", error);
      return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Page Header */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="text-left sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("inspections.title")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t("inspections.description")}</p>
          </div>
          <Button asChild size="sm" className="w-full sm:w-auto sm:text-base">
            <Link href="/inspections/create">
              <Plus className="h-4 w-4 mr-2" />
              {t("inspections.create")}
            </Link>
          </Button>
        </div>

        {/* Collapsible Search and Filters */}
        <div className="border rounded-lg mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full justify-between p-3 sm:p-4 rounded-none border-b-0"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm sm:text-base font-medium">{t("inspections.filtersAndSearch")}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {filtersOpen && (
            <InspectionFilter
              filters={filters}
              onFiltersChange={setFilters}
              totalInspections={inspectionsWithVehicles.length}
              totalScheduled={inspectionsWithVehicles.filter(i => i.status === 'scheduled').length}
              totalCompleted={inspectionsWithVehicles.filter(i => i.status === 'completed').length}
              totalFailed={inspectionsWithVehicles.filter(i => i.status === 'failed').length}
              className="border-t-0"
            />
          )}
        </div>

        {/* View Mode Toggle and Results Summary - Better Spacing */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 mt-6 sm:mt-8">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
{t("inspections.showingResults", { filtered: filteredInspections.length, total: inspectionsWithVehicles.length })}
            {weeklyCompletedFilter && (
              <span className="ml-2 text-green-600 dark:text-green-400">
                (Completed this week)
              </span>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            {/* Active Filters Display */}
            {(filters.searchQuery || filters.statusFilter !== 'all' || weeklyCompletedFilter) && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
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
                className="rounded-r-none px-3"
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                {t("inspections.viewToggle.grid")}
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none px-3"
              >
                <List className="h-4 w-4 mr-2" />
                {t("inspections.viewToggle.list")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card 
              key={index} 
              className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 hover:border-l-current"
              style={{ 
                borderLeftColor: stat.color === 'text-blue-600 dark:text-blue-400' ? '#2563eb' : 
                                 stat.color === 'text-yellow-600 dark:text-yellow-400' ? '#ca8a04' :
                                 stat.color === 'text-green-600 dark:text-green-400' ? '#16a34a' :
                                 stat.color === 'text-red-600 dark:text-red-400' ? '#dc2626' : '#6b7280' 
              }}
              onClick={() => handleQuickStatClick(stat.action)}
            >
              <CardContent className="p-3 sm:p-5 lg:p-6">
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-2 sm:gap-4">
                  <div className={cn("p-2 sm:p-3 rounded-xl transition-transform group-hover:scale-110 flex-shrink-0", stat.bgColor)}>
                    <Icon className={cn("h-4 w-4 sm:h-6 sm:w-6", stat.color)} />
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight mb-1 sm:mb-2">
                      {stat.title}
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground group-hover:text-foreground transition-colors">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors mt-1 hidden sm:block">
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
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold">{getCalendarTitle()}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
                  {/* Week headers - Start from Sunday to match calendar generation */}
                  {[
                    t("calendar.weekdays.sun"),
                    t("calendar.weekdays.mon"),
                    t("calendar.weekdays.tue"), 
                    t("calendar.weekdays.wed"),
                    t("calendar.weekdays.thu"),
                    t("calendar.weekdays.fri"),
                    t("calendar.weekdays.sat")
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
            <div ref={sidebarRef} className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base">
                    {t(`common.days.${format(selectedDate, 'EEEE').toLowerCase()}`)}, {getTranslatedMonth(selectedDate, t, 'full')} {selectedDate.getDate()}, {selectedDate.getFullYear()}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {t("inspections.calendar.inspectionsOnDate", { 
                      count: getInspectionCountForDate(selectedDate),
                      date: `${getTranslatedMonth(selectedDate, t, 'full')} ${selectedDate.getDate()}`
                    })}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto p-3">
                  {selectedDateInspections.length > 0 ? (
                    <>
                      {paginatedSidebarInspections.map((inspection) => (
                        <Link key={inspection.id} href={`/inspections/${inspection.id}`} className="block">
                          <div className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate pr-2">
                                {inspection.vehicle?.name || t("inspections.unnamedInspection")}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs flex-shrink-0", getInspectionStatusBadgeClasses(inspection.status))}
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
                                  <span className="text-xs font-medium">
                                    {inspection.inspector?.name || (inspection.inspector_id ? 'Loading...' : t("common.notAssigned"))}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">{t("common.time")}:</span>{" "}
                                  <span className="text-xs">{format(parseISO(inspection.date), "HH:mm")}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                      
                      {/* Show "View All" button if there are more inspections */}
                      {getInspectionCountForDate(selectedDate) > 5 && (
                        <div className="p-3 border rounded-lg bg-muted/50">
                          <Button variant="outline" size="sm" className="w-full">
                            View All {getInspectionCountForDate(selectedDate)} Inspections
                          </Button>
                        </div>
                      )}
                    </>
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