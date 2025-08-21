'use client'

import { useState, useEffect } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, ShoppingCart, Eye, Clock, MapPin, User, Car, Calendar, ChevronLeft, ChevronRight, Group, Search } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'
import { cn } from '@/lib/utils'
import { EventsFilter, EventsFilterOptions } from './events-filter'

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
  location?: string
}

interface DateEventsPageProps {
  date: string
}

export function DateEventsPage({ date }: DateEventsPageProps) {
  const { t } = useI18n()
  const [events, setEvents] = useState<SalesEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<EventsFilterOptions>({
    typeFilter: 'all',
    statusFilter: 'all',
    searchQuery: '',
    sortBy: 'time',
    sortOrder: 'asc',
    groupBy: 'none'
  })
  const [currentPage, setCurrentPage] = useState(1)

  const ITEMS_PER_PAGE = 6

  // Parse the date parameter
  const parsedDate = parseISO(date)
  const isValidDate = isValid(parsedDate)

  useEffect(() => {
    if (!isValidDate) {
      setError('Invalid date format')
      setLoading(false)
      return
    }

    fetchDateEvents()
  }, [date, isValidDate])

  const fetchDateEvents = async () => {
    try {
      setLoading(true)
      
      // Fetch events from the API endpoint
      const response = await fetch(`/api/sales/calendar/date/${date}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API Response:', data) // Debug logging
      setEvents(data.events || [])
    } catch (err) {
      console.error('Error fetching date events:', err)
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  if (!isValidDate) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Invalid date format: {date}</p>
            <p>Expected format: YYYY-MM-DD</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchDateEvents} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No events found for this date</p>
        </CardContent>
      </Card>
    )
  }

  // Filter events based on current filters
  const filteredEvents = events.filter(event => {
    const matchesType = filters.typeFilter === 'all' || event.type === filters.typeFilter
    const matchesStatus = filters.statusFilter === 'all' || event.status === filters.statusFilter
    const matchesSearch = !filters.searchQuery || 
      event.customer_name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      event.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      (event.customer_email && event.customer_email.toLowerCase().includes(filters.searchQuery.toLowerCase())) ||
      (event.vehicle_type && event.vehicle_type.toLowerCase().includes(filters.searchQuery.toLowerCase()))
    
    return matchesType && matchesStatus && matchesSearch
  })

  // Sort events
  const sortedEvents = [...filteredEvents].sort((a, b) => {
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

  // Group events if grouping is enabled
  const groupedEvents = filters.groupBy === 'none' ? sortedEvents : sortedEvents.reduce((groups, event) => {
    let key: string
    switch (filters.groupBy) {
      case 'type':
        key = event.type
        break
      case 'status':
        key = event.status
        break
      case 'customer':
        key = event.customer_name
        break
      default:
        key = 'none'
    }
    
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(event)
    return groups
  }, {} as Record<string, SalesEvent[]>)

  // Pagination
  const totalPages = Math.ceil(sortedEvents.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedEvents = sortedEvents.slice(startIndex, endIndex)

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderEventCard = (event: SalesEvent) => (
    <Card key={`${event.type}-${event.id}`} className="group hover:shadow-xl transition-all duration-300 border-l-4 overflow-hidden" style={{
      borderLeftColor: event.type === 'quotation' ? '#3b82f6' : '#10b981'
    }}>
      <CardContent className="p-0">
        {/* Header Section */}
        <div className="p-6 pb-4 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: Icon, Title, Status */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className={cn(
                "p-3 rounded-xl flex-shrink-0",
                event.type === 'quotation' 
                  ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" 
                  : "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
              )}>
                {event.type === 'quotation' ? (
                  <FileText className={cn(
                    "h-5 w-5",
                    event.type === 'quotation' 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-green-600 dark:text-green-400"
                  )} />
                ) : (
                  <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs font-medium",
                      getStatusBadgeClasses(event.status, event.type)
                    )}
                  >
                    {event.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize">
                    {event.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Amount */}
            {event.total_amount && (
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {event.currency} {event.total_amount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {event.type === 'quotation' ? 'Quote Amount' : 'Booking Price'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Customer & Vehicle Info */}
            <div className="space-y-4">
              {/* Customer Information */}
              <div className="bg-muted/30 dark:bg-muted/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-background dark:bg-muted rounded-lg border border-border/50">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Customer Details
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="font-medium text-foreground">{event.customer_name}</span>
                  </div>
                  {event.customer_email && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="font-medium text-foreground text-sm">{event.customer_email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="bg-muted/30 dark:bg-muted/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-background dark:bg-muted rounded-lg border border-border/50">
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Vehicle
                  </h4>
                </div>
                <div className="text-foreground font-medium">
                  {event.vehicle_type || 'N/A'}
                </div>
              </div>
            </div>

            {/* Right Column: Service & Time Info */}
            <div className="space-y-4">
              {/* Service Information */}
              <div className="bg-muted/30 dark:bg-muted/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-background dark:bg-muted rounded-lg border border-border/50">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Service Details
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <span className="font-medium text-foreground text-sm">{event.service_type || 'Standard Service'}</span>
                  </div>
                  {event.location && event.location !== 'Location not specified' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Location:</span>
                      <span className="font-medium text-foreground text-sm">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Time Information */}
              <div className="bg-muted/30 dark:bg-muted/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-background dark:bg-muted rounded-lg border border-border/50">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Schedule
                  </h4>
                </div>
                <div className="space-y-2">
                  {event.pickup_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Time:</span>
                      <span className="font-medium text-foreground">{event.pickup_time}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <span className="font-medium text-foreground text-sm">
                      {format(parseISO(event.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section - Full Width */}
          {event.notes && (
            <div className="mt-6 pt-4 border-t border-border/50">
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex-shrink-0">
                    <FileText className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm mb-1 text-yellow-800 dark:text-yellow-200">Notes</div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">{event.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Section */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>ID: {event.id}</span>
                <span>•</span>
                <span>Created: {format(parseISO(event.date), 'MMM d, yyyy')}</span>
              </div>
              
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/${event.type === 'quotation' ? 'quotations' : 'bookings'}/${event.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const handleFiltersChange = (newFilters: EventsFilterOptions) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Filters and Search */}
      <EventsFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalEvents={events.length}
        totalQuotations={events.filter(e => e.type === 'quotation').length}
        totalBookings={events.filter(e => e.type === 'booking').length}
        showGrouping={true}
        showSorting={true}
      />

      {/* Results Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Events for {format(parsedDate, 'EEEE, MMMM d, yyyy')}</h2>
          <p className="text-muted-foreground">
            Showing {filteredEvents.length} of {events.length} total events
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <FileText className="h-3 w-3 mr-1" />
            {events.filter(e => e.type === 'quotation').length} Quotations
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <ShoppingCart className="h-3 w-3 mr-1" />
            {events.filter(e => e.type === 'booking').length} Bookings
          </Badge>
        </div>
      </div>

      {/* Events List with Grouping */}
      {filters.groupBy === 'none' ? (
        // No grouping - show paginated list
        <div className="space-y-4">
          {paginatedEvents.map(renderEventCard)}
        </div>
      ) : (
        // Grouped view
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([groupKey, groupEvents]) => (
            <div key={groupKey} className="space-y-4">
              <div className="flex items-center gap-2">
                <Group className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold capitalize">
                  {filters.groupBy === 'type' ? groupKey : filters.groupBy === 'status' ? groupKey : groupKey}
                </h3>
                <Badge variant="secondary">{groupEvents.length} events</Badge>
              </div>
              <div className="space-y-4">
                {groupEvents.map(renderEventCard)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filters.groupBy === 'none' && totalPages > 1 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, sortedEvents.length)} of {sortedEvents.length} events
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-10 h-10"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredEvents.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">No events match the current filters</p>
            <p className="text-muted-foreground text-sm">Try adjusting your search criteria or clearing filters</p>
            <Button onClick={() => handleFiltersChange({
              typeFilter: 'all',
              statusFilter: 'all',
              searchQuery: '',
              sortBy: 'time',
              sortOrder: 'asc',
              groupBy: 'none'
            })} className="mt-4">
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
