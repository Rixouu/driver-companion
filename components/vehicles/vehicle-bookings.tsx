"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { Truck, Filter, CalendarRange, X, Search, Calendar, MapPin, User, Hash, Clock, Eye } from "lucide-react"
import { DateRange } from "react-day-picker"
import Link from "next/link"

interface VehicleBookingsProps {
  vehicle: DbVehicle
}

interface DriverInfo {
  id: string
  first_name: string
  last_name: string
}

export function VehicleBookings({ vehicle }: VehicleBookingsProps) {
  const { t } = useI18n()
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [driverInfo, setDriverInfo] = useState<Record<string, DriverInfo>>({})
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch driver information for multiple bookings at once with caching
  const fetchDriverInfoBatch = useCallback(async (bookingIds: string[]) => {
    const uniqueIds = [...new Set(bookingIds.filter(id => id))]
    if (uniqueIds.length === 0) return {}
    
    try {
      const response = await fetch('/api/drivers/dispatch-info-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_ids: uniqueIds }),
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.drivers || {}
      }
    } catch (error) {
      console.warn('Failed to fetch driver info batch:', error)
    }
    return {}
  }, [])

  useEffect(() => {
    let isMounted = true
    
    async function loadBookings() {
      if (!vehicle.id) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vehicles/${vehicle.id}/bookings`)
        if (!isMounted) return
        
        if (response.ok) {
          const data = await response.json()
          const bookingsData = data.bookings || []
          
          // Only fetch driver info if we have bookings
          if (bookingsData.length > 0) {
            const bookingIds = bookingsData
              .map((booking: any) => booking.id)
              .filter((id: any) => id)
            
            if (bookingIds.length > 0) {
              const driversData = await fetchDriverInfoBatch(bookingIds)
              if (!isMounted) return
              
              // Map driver info to booking IDs
              const driverMap: Record<string, DriverInfo> = {}
              bookingsData.forEach((booking: any) => {
                if (booking.id && driversData[booking.id]) {
                  driverMap[booking.id] = driversData[booking.id]
                }
              })
              setDriverInfo(driverMap)
            }
          }
          
          setBookings(bookingsData)
        }
      } catch (error) {
        console.error('Failed to load bookings:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadBookings()
    
    return () => {
      isMounted = false
    }
  }, [vehicle.id, fetchDriverInfoBatch])

  // Filter bookings based on selections - optimized for performance
  const filteredBookings = useMemo(() => {
    if (!bookings.length) return []
    
    // Early return if no filters are active
    if (statusFilter === 'all' && serviceFilter === 'all' && !dateRange?.from && !searchTerm) {
      return bookings
    }
    
    return bookings.filter(booking => {
      // Status filter
      if (statusFilter !== 'all' && booking.status !== statusFilter) {
        return false
      }
      
      // Service filter
      if (serviceFilter !== 'all' && booking.service_name !== serviceFilter) {
        return false
      }
      
      // Date range filter
      if (dateRange?.from) {
        const bookingDate = new Date(booking.pickup_date || booking.date)
        const from = new Date(dateRange.from)
        const to = dateRange.to ? new Date(dateRange.to) : from
        
        if (bookingDate < from || bookingDate > to) {
          return false
        }
      }
      
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const customerLower = booking.customer_name?.toLowerCase() || ''
        const serviceLower = booking.service_name?.toLowerCase() || ''
        if (!customerLower.includes(searchLower) && !serviceLower.includes(searchLower)) {
          return false
        }
      }
      
      return true
    })
  }, [bookings, statusFilter, serviceFilter, dateRange, searchTerm])

  // Get unique statuses and service names for filters - optimized
  const uniqueStatuses = useMemo(() => {
    if (!bookings.length) return []
    const statuses = new Set<string>()
    for (const booking of bookings) {
      if (booking.status) statuses.add(booking.status)
    }
    return Array.from(statuses).sort()
  }, [bookings])

  const uniqueServices = useMemo(() => {
    if (!bookings.length) return []
    const services = new Set<string>()
    for (const booking of bookings) {
      if (booking.service_name) services.add(booking.service_name)
    }
    return Array.from(services).sort()
  }, [bookings])

  const hasActiveFilters = useMemo(() => 
    statusFilter !== 'all' || serviceFilter !== 'all' || dateRange?.from || searchTerm
  , [statusFilter, serviceFilter, dateRange, searchTerm])

  const getStatusColor = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
    }
  }, [])

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
          <CardTitle className="text-base sm:text-lg">Bookings</CardTitle>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          {/* Skeleton loading for better perceived performance */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full p-6 rounded-lg border border-border/50 bg-card animate-pulse">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <div className="h-6 bg-muted rounded-full w-24"></div>
                    <div className="h-6 bg-muted rounded-full w-20"></div>
                  </div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-4 bg-muted rounded w-40"></div>
                    <div className="h-4 bg-muted rounded w-28"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-36"></div>
                    <div className="h-4 bg-muted rounded w-44"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (bookings.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
          <div className="space-y-4">
            <div>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                Vehicle Bookings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Vehicle booking history and scheduled services
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium text-lg">No Bookings Found</p>
            <p className="text-sm text-muted-foreground mt-1">This vehicle has no booking records.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (filteredBookings.length === 0 && hasActiveFilters) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
          <div className="space-y-4">
            <div>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                Vehicle Bookings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Vehicle booking history and scheduled services
              </p>
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Date Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                        </>
                      ) : (
                        dateRange.from.toLocaleDateString()
                      )
                    ) : (
                      "Filter by date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status: string) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Additional Filters Row */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Service Filter */}
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {uniqueServices.map((service: string) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers or services..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Clear Filters Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('all')
                  setServiceFilter('all')
                  setDateRange(undefined)
                  setSearchTerm('')
                }}
                className="px-3"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium text-lg">No bookings match your filters</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or clearing them to see more results</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
        <div className="space-y-4">
          <div>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
              Vehicle Bookings
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Vehicle booking history and scheduled services
            </p>
          </div>
          
          {/* Filter Controls */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarRange className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                      </>
                    ) : (
                      dateRange.from.toLocaleDateString()
                    )
                  ) : (
                    "Filter by date"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map((status: string) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Additional Filters Row */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Service Filter */}
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {uniqueServices.map((service: string) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers or services..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('all')
                  setServiceFilter('all')
                  setDateRange(undefined)
                  setSearchTerm('')
                }}
                className="px-3"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 sm:pt-6">
        {/* Filter Results Info */}
        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>
                Showing {filteredBookings.length} of {bookings.length} bookings
                {statusFilter !== 'all' && ` (${statusFilter} status)`}
                {serviceFilter !== 'all' && ` (${serviceFilter} service)`}
                {dateRange?.from && ' for selected date range'}
              </span>
            </div>
          </div>
        )}

        {/* Bookings List - Full Width */}
        <div className="space-y-4">
          {filteredBookings.map((booking: any) => (
            <div key={booking.id} className="w-full p-6 rounded-lg border border-border/50 bg-card hover:bg-muted/30 hover:border-border transition-colors">
              {/* Top Section - Service Provider, Driver, Date/Time */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-600">
                    #{booking.wp_id || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left Column - Service Provider, Driver, Date/Time */}
                <div className="space-y-4">
                  {/* Service Provider */}
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-green-500" />
                    <div>
                      <span className="text-sm text-muted-foreground">Service Provider</span>
                      <div className="text-sm font-medium text-foreground">
                        {booking.service_provider || 'Air Charter Service HK Limited'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Driver */}
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <span className="text-sm text-muted-foreground">Driver</span>
                      <div className="text-sm font-medium text-foreground">
                        {driverInfo[booking.driver_id]?.first_name || 'Not assigned'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Date and Time */}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    <div>
                      <span className="text-sm text-muted-foreground">Date & Time</span>
                      <div className="text-sm font-medium text-foreground">
                        {new Date(booking.pickup_date || booking.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })} at {booking.pickup_time || '15:30:00'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Pickup and Dropoff Locations */}
                <div className="space-y-4">
                  {/* Pickup Location */}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-blue-600 font-medium">Pickup Location</span>
                      <div className="text-sm text-foreground mt-1">
                        {booking.pickup_location || '〒144-0041 東京都大田区羽田空港'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Dropoff Location */}
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    </div>
                    <div>
                      <span className="text-sm text-red-600 font-medium">Dropoff Location</span>
                      <div className="text-sm text-foreground mt-1">
                        {booking.dropoff_location || '〒106-0032東京都港区六本木6-1 2-3 Roppongi Hills Residences C'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Service Details with Divider */}
              <div className="border-t border-border/50 pt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">
                    {booking.service_name || 'Airport Transfer Haneda - Toyota Alphard Executive Lounge'}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/bookings/${booking.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>


            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 