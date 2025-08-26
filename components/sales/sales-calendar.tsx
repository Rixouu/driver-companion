"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertTriangle, Eye, Search, X, Filter, List, Grid3X3, FileText, ShoppingCart, TrendingUp, DollarSign, Users, CalendarDays, SortAsc, SortDesc, ChevronDown } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
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
import { EventsFilter, EventsFilterOptions } from "./events-filter"

interface SalesEvent {
  id: string
  type: 'quotation' | 'booking'
  title: string
  customer_name: string
  customer_email?: string
  date: string
  pickup_date?: string
  pickup_time?: string
  status: string
  total_amount?: number
  currency?: string
  vehicle_type?: string
  service_type?: string
  notes?: string
}

interface SalesCalendarProps {
  quotations?: any[]
  bookings?: any[]
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

export function SalesCalendar({ quotations = [], bookings = [] }: SalesCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const supabase = useSupabase()
  
  const [salesEvents, setSalesEvents] = useState<SalesEvent[]>([])
  const [calendarView, setCalendarView] = useState<CalendarView>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [sidebarPage, setSidebarPage] = useState(1)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [filters, setFilters] = useState<EventsFilterOptions>({
    typeFilter: 'all',
    statusFilter: 'all',
    searchQuery: '',
    sortBy: 'time',
    sortOrder: 'asc',
    groupBy: 'none'
  })
  const [weeklyRevenueFilter, setWeeklyRevenueFilter] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const debouncedSearch = useDebounce(filters.searchQuery, 500)

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (filters.statusFilter !== "all") params.set("status", filters.statusFilter)
    if (filters.typeFilter !== "all") params.set("type", filters.typeFilter)
    if (viewMode !== "calendar") params.set("view", viewMode)
    
    const newUrl = params.toString() ? `?${params.toString()}` : ""
    router.replace(newUrl as any, { scroll: false })
  }, [debouncedSearch, filters.statusFilter, filters.typeFilter, viewMode, router])

  // Transform quotations and bookings into unified sales events
  useEffect(() => {
    const transformedEvents: SalesEvent[] = []

    // Transform quotations
    quotations.forEach((quotation) => {
      transformedEvents.push({
        id: quotation.id,
        type: 'quotation',
        title: quotation.title || `Quote for ${quotation.customer_name}`,
        customer_name: quotation.customer_name || 'Unknown Customer',
        customer_email: quotation.customer_email,
        date: quotation.pickup_date || quotation.created_at,
        pickup_date: quotation.pickup_date,
        pickup_time: quotation.pickup_time,
        status: quotation.status || 'draft',
        total_amount: quotation.total_amount,
        currency: quotation.currency || 'JPY',
        vehicle_type: quotation.vehicle_type,
        service_type: quotation.service_type,
        notes: quotation.merchant_notes
      })
    })

    // Transform bookings
    bookings.forEach((booking) => {
      transformedEvents.push({
        id: booking.id,
        type: 'booking',
        title: `Booking for ${booking.customer_name}`,
        customer_name: booking.customer_name || 'Unknown Customer',
        customer_email: booking.customer_email,
        date: booking.date || booking.created_at,
        pickup_date: booking.date,
        pickup_time: booking.time,
        status: booking.status || 'confirmed',
        total_amount: booking.price_amount,
        currency: booking.price_currency || 'JPY',
        vehicle_type: booking.vehicle_make && booking.vehicle_model ? `${booking.vehicle_make} ${booking.vehicle_model}` : 'Vehicle',
        service_type: booking.service_name || booking.service_type,
        notes: booking.notes
      })
    })

    // Sort by date (most recent first)
    const sortedEvents = transformedEvents.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    setSalesEvents(sortedEvents)
  }, [quotations, bookings])

  // Filter events based on search, status, and type
  const filteredEvents = useMemo(() => {
    let filtered = salesEvents.filter((event) => {
      const matchesSearch = !debouncedSearch || 
        event.customer_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        event.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (event.customer_email && event.customer_email.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (event.vehicle_type && event.vehicle_type.toLowerCase().includes(debouncedSearch.toLowerCase()))
      
      const matchesStatus = filters.statusFilter === "all" || event.status === filters.statusFilter
      const matchesType = filters.typeFilter === "all" || event.type === filters.typeFilter
      
      // Apply weekly revenue filter if active
      let matchesWeeklyRevenue = true
      if (weeklyRevenueFilter) {
        const today = new Date()
        const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 })
        const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 })
        
        const eventDate = parseISO(event.date)
        const isInWeek = isValid(eventDate) && 
                        eventDate >= startOfThisWeek && 
                        eventDate <= endOfThisWeek
        
        // Only include events that contribute to revenue
        const countsAsRevenue = event.type === 'quotation' 
          ? (event.status === 'approved' || event.status === 'paid')
          : (event.status === 'confirmed' || event.status === 'completed' || event.status === 'paid')
        
        matchesWeeklyRevenue = Boolean(isInWeek && countsAsRevenue && (event.total_amount ?? 0) > 0)
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesWeeklyRevenue
    })

    // Sort the filtered events
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filters.sortBy) {
        case 'time':
          aValue = a.pickup_time || '00:00:00'
          bValue = b.pickup_time || '00:00:00'
          break
        case 'amount':
          aValue = a.total_amount || 0
          bValue = b.total_amount || 0
          break
        case 'customer':
          aValue = a.customer_name.toLowerCase()
          bValue = b.customer_name.toLowerCase()
          break
        case 'type':
          aValue = a.type
          bValue = b.type
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
  }, [salesEvents, debouncedSearch, filters.statusFilter, filters.typeFilter, filters.sortBy, filters.sortOrder, weeklyRevenueFilter])

  // Calculate quick stats with enhanced data
  const quickStats = useMemo((): QuickStat[] => {
    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 })
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 })
    const startOfThisMonth = startOfMonth(today)
    const endOfThisMonth = endOfMonth(today)

    const todaysEvents = filteredEvents.filter(event => {
      const eventDate = parseISO(event.date)
      return isValid(eventDate) && 
             eventDate >= startOfToday && 
             eventDate <= endOfToday
    }).length

    const pendingQuotations = filteredEvents.filter(
      event => event.type === 'quotation' && (event.status === 'sent' || event.status === 'draft')
    ).length

    // Calculate weekly revenue from ALL events (not filtered) to get the total
    const weeklyRevenue = salesEvents.filter(event => {
      const eventDate = parseISO(event.date)
      const isInWeek = isValid(eventDate) && 
                      eventDate >= startOfThisWeek && 
                      eventDate <= endOfThisWeek
      
      // Count approved/paid quotations and confirmed/completed/paid bookings
      const countsAsRevenue = event.type === 'quotation' 
        ? (event.status === 'approved' || event.status === 'paid')
        : (event.status === 'confirmed' || event.status === 'completed' || event.status === 'paid')
      
      return isInWeek && countsAsRevenue && event.total_amount && event.total_amount > 0
    }).reduce((sum, event) => sum + (event.total_amount || 0), 0)

    const confirmedBookings = filteredEvents.filter(
      event => event.type === 'booking' && event.status === 'confirmed'
    ).length

    return [
      {
        title: "Today's Events",
        value: todaysEvents,
        icon: CalendarDays,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        action: "viewToday",
        description: "View today's schedule"
      },
      {
        title: "Pending Quotations",
        value: pendingQuotations,
        icon: Clock,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        action: "viewPending",
        description: "Review pending quotes"
      },
      {
        title: "Weekly Revenue",
        value: `¥${weeklyRevenue.toLocaleString()}`,
        icon: TrendingUp,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        action: "viewRevenue",
        description: "Revenue analytics"
      },
      {
        title: "Confirmed Bookings",
        value: confirmedBookings,
        icon: Users,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        action: "viewBookings",
        description: "Manage bookings"
      }
    ]
  }, [filteredEvents, salesEvents])

  // Handle quick stat card clicks
  const handleQuickStatClick = (action: string) => {
    switch (action) {
      case 'viewToday':
        setCurrentDate(new Date())
        setSelectedDate(new Date())
        break
      case 'viewPending':
        setFilters(prev => ({ ...prev, typeFilter: 'quotation', statusFilter: 'sent' }))
        break
      case 'viewRevenue':
        // Filter to show only weekly revenue-generating events
        setWeeklyRevenueFilter(true)
        setFilters(prev => ({ 
          ...prev, 
          typeFilter: 'all', 
          statusFilter: 'all',
          searchQuery: '',
          sortBy: 'amount',
          sortOrder: 'desc'
        }))
        break
      case 'viewBookings':
        setFilters(prev => ({ ...prev, typeFilter: 'booking', statusFilter: 'confirmed' }))
        break
    }
  }

  // Status filter options
  const statusOptions = useMemo(() => [
    { value: "all", label: t("common.all") },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "approved", label: "Approved" },
    { value: "paid", label: "Paid" },
    { value: "rejected", label: "Rejected" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ], [t])

  // Type filter options
  const typeOptions = useMemo(() => [
    { value: "all", label: t("common.all") },
    { value: "quotation", label: "Quotations" },
    { value: "booking", label: "Bookings" },
  ], [t])

  // Get calendar dates based on view
  const calendarDates = useMemo(() => {
    switch (calendarView) {
      case "month":
        // For month view, start from the beginning of the week containing the first day of the month
        // and end at the end of the week containing the last day of the month
        return eachDayOfInterval({
          start: startOfWeek(startOfMonth(currentDate)),
          end: endOfWeek(endOfMonth(currentDate))
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

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = parseISO(event.date)
      return isValid(eventDate) && isSameDay(eventDate, date)
    })
  }

  const ITEMS_PER_PAGE = 3

  // Get selected date events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []
  const totalSidebarPages = Math.ceil(selectedDateEvents.length / ITEMS_PER_PAGE)
  const paginatedSidebarEvents = selectedDateEvents.slice(
    (sidebarPage - 1) * ITEMS_PER_PAGE,
    sidebarPage * ITEMS_PER_PAGE
  )

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
  const getStatusBadgeClasses = (status: string, type: string) => {
    if (type === 'quotation') {
      switch (status?.toLowerCase()) {
        case 'approved':
        case 'paid':
          return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
        case 'sent':
          return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
        case 'rejected':
          return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
        case 'draft':
          return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700'
      }
    } else {
      switch (status?.toLowerCase()) {
        case 'completed':
        case 'paid':
          return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
        case 'confirmed':
          return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
        case 'cancelled':
          return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700'
      }
    }
  }

  // Get status color for calendar dots
  const getStatusColor = (status: string, type: string) => {
    if (type === 'quotation') {
      switch (status) {
        case "approved":
        case "paid":
          return "bg-green-500"
        case "sent":
          return "bg-blue-500"
        case "rejected":
          return "bg-red-500"
        case "draft":
          return "bg-gray-500"
        default:
          return "bg-gray-500"
      }
    } else {
      switch (status) {
        case "completed":
        case "paid":
          return "bg-green-500"
        case "confirmed":
          return "bg-blue-500"
        case "cancelled":
          return "bg-red-500"
        default:
          return "bg-blue-500"
      }
    }
  }

  // Handle day click
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setSidebarPage(1)
  }

  // Render calendar day
  const renderCalendarDay = (date: Date) => {
    const dayEvents = getEventsForDate(date)
    const isCurrentDay = isToday(date)
    const isSelected = selectedDate && isSameDay(date, selectedDate)
    const eventCount = dayEvents.length

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
          {eventCount > 0 && (
            <Badge variant="secondary" className="text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {eventCount}
            </Badge>
          )}
        </div>
        
        {/* Status dots for quick visual overview */}
        {eventCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {dayEvents.slice(0, 3).map((event, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full",
                  getStatusColor(event.status, event.type)
                )}
                title={`${event.title} - ${event.status}`}
              />
            ))}
            {eventCount > 3 && (
              <span 
                className="text-xs text-muted-foreground cursor-help" 
                title={`Click to view all ${eventCount} events`}
              >
                +{eventCount - 3}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      typeFilter: 'all',
      statusFilter: 'all',
      searchQuery: '',
      sortBy: 'time',
      sortOrder: 'asc',
      groupBy: 'none'
    })
    setWeeklyRevenueFilter(false)
  }

  // Handle filters change
  const handleFiltersChange = (newFilters: EventsFilterOptions) => {
    setFilters(newFilters)
  }

  // Render list view
  const renderListView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Sales Events</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile Card List */}
        <div className="md:hidden space-y-4">
          {filteredEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {debouncedSearch || filters.statusFilter !== "all" || filters.typeFilter !== "all"
                ? t("common.noResults")
                : "No sales events found"}
            </p>
          ) : (
            filteredEvents.map((event) => (
              <Card key={`${event.type}-${event.id}`} className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {event.type === 'quotation' ? (
                        <FileText className="h-4 w-4 text-blue-500" />
                      ) : (
                        <ShoppingCart className="h-4 w-4 text-green-500" />
                      )}
                      <p className="font-medium">{event.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.customer_name}
                    </p>
                    {event.total_amount && (
                      <p className="text-sm font-medium text-white">
                        {event.currency} {event.total_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={cn("text-xs", getStatusBadgeClasses(event.status, event.type))}>
                    {event.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap justify-between text-sm mt-3 gap-2">
                  <span>{event.vehicle_type || 'N/A'}</span>
                  <span>{format(parseISO(event.date), "MMM d, yyyy")}</span>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm text-muted-foreground">
                    {event.service_type || 'Standard Service'}
                  </p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/${event.type === 'quotation' ? 'quotations' : 'bookings'}/${event.id}`}>
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
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="w-[100px]">{t("common.actions.default")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {debouncedSearch || filters.statusFilter !== "all" || filters.typeFilter !== "all"
                      ? t("common.noResults")
                      : "No sales events found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={`${event.type}-${event.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {event.type === 'quotation' ? (
                          <FileText className="h-4 w-4 text-blue-500" />
                        ) : (
                          <ShoppingCart className="h-4 w-4 text-green-500" />
                        )}
                        <span className="capitalize">{event.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{event.customer_name}</div>
                        {event.customer_email && (
                          <div className="text-sm text-muted-foreground">{event.customer_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{event.service_type || 'Standard Service'}</div>
                        {event.vehicle_type && (
                          <div className="text-sm text-muted-foreground">{event.vehicle_type}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{format(parseISO(event.date), "MMM d, yyyy")}</div>
                        {event.pickup_time && (
                          <div className="text-sm text-muted-foreground">{event.pickup_time}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", getStatusBadgeClasses(event.status, event.type))}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {event.total_amount ? (
                        <span className="font-medium text-white">
                          {event.currency} {event.total_amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/${event.type === 'quotation' ? 'quotations' : 'bookings'}/${event.id}`}>
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Page Header */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="text-left sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Sales Calendar</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Track quotations and bookings in one unified view</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button asChild size="sm" className="w-full sm:w-auto sm:text-base">
              <Link href="/quotations/create">
                <Plus className="mr-2 h-4 w-4" />
                New Quotation
              </Link>
            </Button>
          </div>
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
              <span className="text-sm sm:text-base font-medium">Filters & Search</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {filtersOpen && (
            <EventsFilter
              filters={filters}
              onFiltersChange={setFilters}
              totalEvents={filteredEvents.length}
              totalQuotations={filteredEvents.filter(e => e.type === 'quotation').length}
              totalBookings={filteredEvents.filter(e => e.type === 'booking').length}
              showGrouping={false}
              showSorting={true}
              className="border-t-0"
            />
          )}
        </div>

        {/* View Mode Toggle and Results Summary - Better Spacing */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 mt-6 sm:mt-8">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Showing {filteredEvents.length} of {salesEvents.length} total events
            {weeklyRevenueFilter && (
              <span className="ml-2 text-green-600 dark:text-green-400">
                (Weekly Revenue Only)
              </span>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            {/* Active Filters Display */}
            {(filters.searchQuery || filters.statusFilter !== 'all' || filters.typeFilter !== 'all' || weeklyRevenueFilter) && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {weeklyRevenueFilter && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
                    Weekly Revenue Only
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
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none px-3"
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
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
                               stat.color === 'text-purple-600 dark:text-purple-400' ? '#9333ea' : '#6b7280' 
              }}
              onClick={() => handleQuickStatClick(stat.action)}
            >
              <CardContent className="p-3 sm:p-5 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className={cn("p-2 sm:p-3 rounded-lg transition-transform group-hover:scale-110 flex-shrink-0 self-center sm:self-start", stat.bgColor)}>
                    <Icon className={cn("h-4 w-4 sm:h-6 sm:w-6", stat.color)} />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {stat.title}
                    </p>
                    <p className={cn("text-lg sm:text-2xl font-bold transition-colors", stat.color)}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
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
                  <CardTitle>Sales Calendar</CardTitle>
                  <div className="flex items-center gap-4">
                    <Select value={calendarView} onValueChange={(value) => setCalendarView(value as CalendarView)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={navigatePrevious}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToToday}>
                        Today
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
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {selectedDateEvents.length} events on {format(selectedDate, "MMMM d")}
                    {selectedDateEvents.length > ITEMS_PER_PAGE && (
                      <span className="block text-xs mt-1">
                        Showing first {ITEMS_PER_PAGE} events
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 p-3">
                  {selectedDateEvents.length > 0 ? (
                    paginatedSidebarEvents.map((event) => (
                      <Link key={`${event.type}-${event.id}`} href={`/${event.type === 'quotation' ? 'quotations' : 'bookings'}/${event.id}`} className="block">
                        <div className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {event.type === 'quotation' ? (
                                <FileText className="h-4 w-4 text-blue-500" />
                              ) : (
                                <ShoppingCart className="h-4 w-4 text-green-500" />
                              )}
                              <h4 className="font-medium text-sm truncate pr-2 max-w-[120px]">
                                {event.title.length > 25 ? `${event.title.substring(0, 25)}...` : event.title}
                              </h4>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs flex-shrink-0", getStatusBadgeClasses(event.status, event.type))}
                            >
                              {event.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div><span className="font-medium">{event.customer_name}</span> - {event.vehicle_type || 'N/A'}</div>
                            <div className="flex justify-between mt-1">
                              <div>
                                <span className="text-xs text-muted-foreground">Service:</span>{" "}
                                <span className="text-xs font-medium">{event.service_type || 'Standard'}</span>
                              </div>
                              {event.pickup_time && (
                                <div>
                                  <span className="text-xs text-muted-foreground">{t("common.time")}:</span>{" "}
                                  <span className="text-xs">{event.pickup_time}</span>
                                </div>
                              )}
                            </div>
                            {event.total_amount && (
                              <div className="text-xs font-medium text-white">
                                {event.currency} {event.total_amount.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No events on this date
                    </div>
                  )}
                </CardContent>
                {selectedDateEvents.length > ITEMS_PER_PAGE && (
                  <div className="px-3 pb-3 border-t pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <Link href={`/sales/calendar/date/${format(selectedDate, 'yyyy-MM-dd')}`}>
                        View All {selectedDateEvents.length} Events
                      </Link>
                    </Button>
                  </div>
                )}
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
