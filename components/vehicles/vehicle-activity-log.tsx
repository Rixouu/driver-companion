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
import { Activity, Calendar, ClipboardCheck, Filter, CalendarRange, X, Eye } from "lucide-react"
import { DateRange } from "react-day-picker"
import Link from "next/link"

interface VehicleActivityLogProps {
  vehicle: DbVehicle
}

export function VehicleActivityLog({ vehicle }: VehicleActivityLogProps) {
  const { t } = useI18n()
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inspectorInfo, setInspectorInfo] = useState<Record<string, any>>({})
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Fetch inspector information for multiple inspections at once with caching
  const fetchInspectorInfoBatch = useCallback(async (inspectorIds: string[]) => {
    const uniqueIds = [...new Set(inspectorIds.filter(id => id))]
    if (uniqueIds.length === 0) return {}
    
    try {
      const response = await fetch('/api/drivers/inspector-info-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspector_ids: uniqueIds }),
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.drivers || {}
      }
    } catch (error) {
      console.warn('Failed to fetch inspector info batch:', error)
    }
    return {}
  }, [])

  useEffect(() => {
    let isMounted = true
    
    async function loadActivityData() {
      if (!vehicle.id) return
      
      try {
        setIsLoading(true)
        const [inspectionsRes, bookingsRes] = await Promise.all([
          fetch(`/api/vehicles/${vehicle.id}/inspections`),
          fetch(`/api/vehicles/${vehicle.id}/bookings`)
        ])
        
        if (!isMounted) return
        
        let allActivities: any[] = []
        
        if (inspectionsRes.ok) {
          const inspectionsData = await inspectionsRes.json()
          const inspectionActivities = (inspectionsData.inspections || []).map((inspection: any) => ({
            ...inspection,
            type: 'inspection',
            date: inspection.date || inspection.created_at,
            id: inspection.id
          }))
          allActivities.push(...inspectionActivities)
        }
        
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          const bookingActivities = (bookingsData.bookings || []).map((booking: any) => ({
            ...booking,
            type: 'booking',
            date: booking.pickup_date || booking.created_at,
            id: booking.id
          }))
          allActivities.push(...bookingActivities)
        }
        
        // Sort by date (most recent first)
        allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        
        // Fetch inspector info for inspections in batch
        if (allActivities.length > 0) {
          const inspectorIds = allActivities
            .filter(activity => activity.type === 'inspection' && activity.inspector_id)
            .map(activity => activity.inspector_id)
          
          if (inspectorIds.length > 0) {
            const driversData = await fetchInspectorInfoBatch(inspectorIds)
            if (!isMounted) return
            
            // Map inspector names to activity IDs
            const inspectorMap: Record<string, any> = {}
            allActivities.forEach(activity => {
              if (activity.type === 'inspection' && activity.inspector_id && driversData[activity.inspector_id]) {
                const driver = driversData[activity.inspector_id]
                inspectorMap[activity.id] = `${driver.first_name} ${driver.last_name}`.trim()
              }
            })
            setInspectorInfo(inspectorMap)
          }
        }
        
        setActivities(allActivities.slice(0, 20)) // Show last 20 activities
      } catch (error) {
        console.error('Failed to load activity data:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadActivityData()
    
    return () => {
      isMounted = false
    }
  }, [vehicle.id, fetchInspectorInfoBatch])

  // Filter activities based on type and date range - optimized for performance
  const filteredActivities = useMemo(() => {
    if (!activities.length) return []
    
    // Early return if no filters are active
    if (typeFilter === 'all' && !dateRange?.from) {
      return activities
    }
    
    return activities.filter(activity => {
      // Type filter
      if (typeFilter !== 'all' && activity.type !== typeFilter) {
        return false
      }
      
      // Date range filter
      if (dateRange?.from) {
        const activityDate = new Date(activity.date)
        const from = new Date(dateRange.from)
        const to = dateRange.to ? new Date(dateRange.to) : from
        
        if (activityDate < from || activityDate > to) {
          return false
        }
      }
      
      return true
    })
  }, [activities, typeFilter, dateRange])

  const hasActiveFilters = useMemo(() => 
    typeFilter !== 'all' || dateRange?.from
  , [typeFilter, dateRange])

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
          <CardTitle className="text-base sm:text-lg">Activity Log</CardTitle>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          {/* Skeleton loading for better perceived performance */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full p-4 rounded-lg border border-border/50 bg-card animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-5 bg-muted rounded-full w-24"></div>
                    <div className="h-5 bg-muted rounded-full w-20"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-48"></div>
                  <div className="h-4 bg-muted rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
          <div className="space-y-4">
            <div>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                {t("vehicles.tabs.recentActivity", { defaultValue: "Recent Activity" })}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Vehicle activity history and timeline
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium text-lg">{t("vehicles.tabs.noRecentActivity", { defaultValue: "No recent activity" })}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("vehicles.tabs.noRecentActivityDescription", { defaultValue: "This vehicle has no recent activity." })}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (filteredActivities.length === 0 && hasActiveFilters) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
          <div className="space-y-4">
            <div>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                {t("vehicles.tabs.recentActivity", { defaultValue: "Recent Activity" })}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Vehicle activity history and timeline
              </p>
            </div>
            
            {/* Filter and Search Controls */}
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
              
              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="inspection">Inspections</SelectItem>
                  <SelectItem value="booking">Bookings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Clear Filters Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTypeFilter('all')
                  setDateRange(undefined)
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
            <p className="text-foreground font-medium text-lg">No activities match your filters</p>
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
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
              {t("vehicles.tabs.recentActivity", { defaultValue: "Recent Activity" })}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Vehicle activity history and timeline
            </p>
          </div>
          
          {/* Filter and Search Controls */}
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
            
            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inspection">Inspections</SelectItem>
                <SelectItem value="booking">Bookings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTypeFilter('all')
                  setDateRange(undefined)
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
        <div className="space-y-4">
          {/* Filter Results Info */}
          {hasActiveFilters && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>
                  Showing {filteredActivities.length} of {activities.length} activities
                  {typeFilter !== 'all' && ` (${typeFilter} type)`}
                  {dateRange?.from && ' for selected date range'}
                </span>
              </div>
            </div>
          )}
          
          {filteredActivities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors">
              <div className="flex-shrink-0">
                {activity.type === 'inspection' ? (
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <ClipboardCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={activity.type === 'inspection' 
                      ? 'border-green-200 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-300 dark:bg-green-900/20' 
                      : 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/20'
                    }
                  >
                    {activity.type === 'inspection' ? 'Inspection' : 'Booking'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {new Date(activity.date).toLocaleDateString()}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">{t("vehicles.tabs.vehicleName", { defaultValue: "Vehicle" })}:</span> {vehicle.plate_number || 'N/A'}
                  </p>
                  {activity.type === 'inspection' && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{t("vehicles.tabs.inspectorName", { defaultValue: "Inspector" })}:</span> {inspectorInfo[activity.id] || 'Not assigned'}
                    </p>
                  )}
                  {activity.type === 'booking' && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Customer:</span> {activity.customer_name || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button asChild variant="outline" size="sm">
                  {activity.type === 'inspection' ? (
                    <Link href={`/inspections/${activity.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  ) : (
                    <Link href={`/bookings/${activity.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
