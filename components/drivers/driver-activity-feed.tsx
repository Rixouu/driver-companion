"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Clock, Car, Wrench, FileText, ExternalLink, Calendar, Filter, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { formatDate } from "@/lib/utils/formatting"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { DateRange } from "react-day-picker"

interface Activity {
  id: string
  type: "booking" | "inspection" | "maintenance" | "vehicle_assignment"
  date: string
  title: string
  description: string
  link: string
}

interface DriverActivityFeedProps {
  driverId: string
  limit?: number
}

export function DriverActivityFeed({ driverId, limit }: DriverActivityFeedProps) {
  const { t } = useI18n()
  const [activities, setActivities] = useState<Activity[]>([])
  const [allActivities, setAllActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalActivities, setTotalActivities] = useState(0)
  
  // New filter states
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')


  const applyFiltersAndPagination = (activities: Activity[], typeFilter: string, page: number) => {
    let filtered = activities;
    
    // Apply type filter
    if (typeFilter !== "all") {
      filtered = activities.filter(activity => activity.type === typeFilter);
    }
    
    // Apply date range filter
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.date);
        if (dateRange?.from && activityDate < dateRange.from) return false;
        if (dateRange?.to && activityDate > dateRange.to) return false;
        return true;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'newest' 
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });
    
    // Apply pagination
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    
    setActivities(paginated);
    setCurrentPage(page);
    setTotalActivities(filtered.length);
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value);
    applyFiltersAndPagination(allActivities, value, 1);
  };

  const handlePageChange = (page: number) => {
    applyFiltersAndPagination(allActivities, filterType, page);
  };

  useEffect(() => {
    async function loadActivities() {
      setIsLoading(true)
      console.log('🔍 DriverActivityFeed: Starting to load activities for driverId:', driverId)
      
      try {
        // Use the consolidated API endpoint to avoid permission issues
        console.log('🔍 DriverActivityFeed: Fetching consolidated activities...')
        const response = await fetch(`/api/drivers/${driverId}/activities`)
        if (!response.ok) throw new Error('Failed to fetch driver activities')
        const data = await response.json()
        
        console.log('🔍 DriverActivityFeed: Consolidated data result:', data)

        const inspectionDetails = data.inspections || []
        const bookings = data.bookings || []
        const maintenanceTasks = data.maintenance || []

        // Combine activities
        console.log('🔍 DriverActivityFeed: Combining activities...')
        const allActivities = [
          // Map bookings to activities
          ...(bookings || []).map((booking: any) => ({
            id: `booking-${booking.id}`,
            type: "booking" as const,
            date: booking.date,
            title: `Booking #${booking.id?.slice(-5)}`,
            description: `${booking.customer_name || 'Customer'} • ${booking.pickup_location} → ${booking.dropoff_location}`,
            link: `/bookings/${booking.id}`
          })),
          
          // Map inspections to activities
          ...(inspectionDetails || []).map((inspection: any) => ({
            id: `inspection-${inspection.id}`,
            type: "inspection" as const,
            date: inspection.date || new Date().toISOString(),
            title: `Vehicle Inspection - ${inspection.model || 'Unknown'} ${inspection.year || ''}`,
            description: `Inspected ${inspection.vehicle_name || 'Vehicle'} (${inspection.status})`,
            link: `/inspections/${inspection.id}`
          })),
          
          // Map maintenance tasks to activities
          ...maintenanceTasks.map((task: any) => ({
            id: `maintenance-${task.id}`,
            type: "maintenance" as const,
            date: task.due_date,
            title: task.title,
            description: `${t("maintenance.fields.vehicle")}: ${task.vehicle?.name}`,
            link: `/maintenance/${task.id}`
          }))
        ]

        console.log('🔍 DriverActivityFeed: Combined activities result:', {
          totalActivities: allActivities.length,
          bookingsCount: bookings?.length || 0,
          inspectionDetailsCount: inspectionDetails?.length || 0,
          maintenanceTasksCount: maintenanceTasks?.length || 0,
          sampleActivities: allActivities.slice(0, 3)
        })

        // Sort by date descending
        allActivities.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        // Store all activities
        setAllActivities(allActivities)
        
        // Apply limit if specified (for backward compatibility)
        if (limit) {
          setActivities(allActivities.slice(0, limit))
        } else {
          // Apply filtering and pagination
          applyFiltersAndPagination(allActivities, filterType, 1)
        }
      } catch (error) {
        console.error("❌ DriverActivityFeed: Error loading activities:", error)
        console.error("❌ DriverActivityFeed: Error details:", {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          driverId,
          error
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadActivities()
  }, [driverId, limit, t])

  if (isLoading) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        {t("common.loading")}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t("drivers.recentActivity.title")}</CardTitle>
        <CardDescription>{t("drivers.recentActivity.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mobile-optimized Filters and Pagination */}
        {!limit && allActivities.length > 0 && (
          <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
            {/* Mobile-optimized Filter Controls */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Filter by type - mobile-friendly layout */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs sm:text-sm font-medium">Filter by:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleFilterChange("all")}
                    className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors border ${
                      filterType === "all"
                        ? "bg-white text-gray-900 border-gray-300 shadow-sm dark:bg-white dark:text-gray-900 dark:border-white"
                        : "text-gray-600 border-gray-300 bg-gray-50 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-600 dark:bg-transparent dark:hover:bg-gray-800"
                    }`}
                  >
                    All Activities
                  </button>
                  <button
                    onClick={() => handleFilterChange("booking")}
                    className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors border ${
                      filterType === "booking"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm dark:bg-blue-600 dark:text-white dark:border-blue-600"
                        : "text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-600 dark:bg-transparent dark:hover:bg-blue-900/20"
                    }`}
                  >
                    Bookings
                  </button>
                  <button
                    onClick={() => handleFilterChange("inspection")}
                    className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors border ${
                      filterType === "inspection"
                        ? "bg-green-600 text-white border-green-600 shadow-sm dark:bg-green-600 dark:text-white dark:border-green-600"
                        : "text-green-700 border-green-300 bg-green-50 hover:bg-green-100 dark:text-green-300 dark:border-green-600 dark:bg-transparent dark:hover:bg-green-900/20"
                    }`}
                  >
                    Inspections
                  </button>
                  <button
                    onClick={() => handleFilterChange("maintenance")}
                    className={`px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors border ${
                      filterType === "maintenance"
                        ? "bg-orange-600 text-white border-orange-600 shadow-sm dark:bg-orange-600 dark:text-white dark:border-orange-600"
                        : "text-orange-700 border-orange-300 bg-orange-50 hover:bg-orange-100 dark:text-orange-300 dark:border-orange-600 dark:bg-transparent dark:hover:bg-orange-900/20"
                    }`}
                  >
                    Maintenance
                  </button>
                </div>
              </div>
              
              {/* Mobile-optimized Date and Sort controls */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs sm:text-sm font-medium">Date:</span>
                  <CalendarDateRangePicker
                    date={dateRange}
                    onSelect={(newDateRange) => {
                      setDateRange(newDateRange);
                      applyFiltersAndPagination(allActivities, filterType, 1);
                    }}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs sm:text-sm font-medium">Sort:</span>
                  <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => {
                    setSortOrder(value);
                    applyFiltersAndPagination(allActivities, filterType, 1);
                  }}>
                    <SelectTrigger className="w-28 sm:w-32 h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Activity Count */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {allActivities.filter(a => filterType === "all" || a.type === filterType).length} activities
              </Badge>
              {filterType !== "all" && (
                <Badge 
                  variant="secondary" 
                  className={`${
                    filterType === "booking" 
                      ? "bg-blue-100 text-blue-800 border-blue-200" 
                      : filterType === "inspection" 
                      ? "bg-green-100 text-green-800 border-green-200"
                      : filterType === "maintenance" 
                      ? "bg-orange-100 text-orange-800 border-orange-200"
                      : "bg-purple-100 text-purple-800 border-purple-200"
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)} only
                </Badge>
              )}
            </div>
          </div>
        )}

        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-muted/30 rounded-lg min-h-[150px]">
             <Clock className="h-10 w-10 text-muted-foreground mb-3" />
             <h3 className="text-lg font-medium mb-1">{t("drivers.activity.empty.title")}</h3>
             <p className="text-muted-foreground text-sm">
               {t("drivers.activity.empty.description")}
             </p>
           </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={{pathname: activity.link}} passHref
                className="block p-3 sm:p-4 border border-border rounded-lg hover:bg-muted/30 transition-all duration-200 hover:shadow-sm" 
              >
                <div className="flex items-start gap-2 sm:gap-3 justify-between">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {/* Mobile-optimized color-coded activity type icon */}
                      <div className={`h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 rounded-full flex items-center justify-center ${
                        activity.type === "booking" 
                          ? "bg-blue-500/10 text-blue-600" 
                          : activity.type === "inspection" 
                          ? "bg-green-500/10 text-green-600"
                          : activity.type === "maintenance" 
                          ? "bg-orange-500/10 text-orange-600"
                          : "bg-purple-500/10 text-purple-600"
                      }`}>
                        {activity.type === "booking" && (
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                        )}
                        {activity.type === "inspection" && (
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                        )}
                        {activity.type === "maintenance" && (
                          <Wrench className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                        )}
                        {activity.type === "vehicle_assignment" && (
                          <Car className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <h4 className="font-medium text-foreground text-xs sm:text-sm lg:text-base truncate">{activity.title}</h4>
                        {/* Mobile-optimized activity type label */}
                        <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium border transition-colors hover:bg-gray-800 ${
                          activity.type === "booking" 
                            ? "text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-600 dark:bg-transparent dark:hover:bg-blue-900/20" 
                            : activity.type === "inspection" 
                            ? "text-green-700 border-green-300 bg-green-50 hover:bg-green-100 dark:text-green-300 dark:border-green-600 dark:bg-transparent dark:hover:bg-green-900/20"
                            : activity.type === "maintenance" 
                            ? "text-orange-700 border-orange-300 bg-orange-50 hover:bg-orange-100 dark:text-orange-300 dark:border-orange-600 dark:bg-transparent dark:hover:bg-orange-900/20"
                            : "text-purple-700 border-purple-300 bg-purple-50 hover:bg-purple-100 dark:text-purple-300 dark:border-purple-600 dark:bg-transparent dark:hover:bg-purple-900/20"
                        }`}>
                          {activity.type === "booking" && "Booking"}
                          {activity.type === "inspection" && "Inspection"}
                          {activity.type === "maintenance" && "Maintenance"}
                          {activity.type === "vehicle_assignment" && "Assignment"}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end flex-shrink-0 ml-1 sm:ml-2 lg:ml-4">
                    <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(activity.date)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Mobile-optimized Pagination */}
        {!limit && allActivities.length > 0 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md text-center sm:text-left">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, allActivities.filter(a => filterType === "all" || a.type === filterType).length)} of {allActivities.filter(a => filterType === "all" || a.type === filterType).length} activities
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
              
              <span className="text-xs sm:text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-md">
                Page {currentPage} of {Math.ceil(allActivities.filter(a => filterType === "all" || a.type === filterType).length / itemsPerPage)}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(allActivities.filter(a => filterType === "all" || a.type === filterType).length / itemsPerPage)}
                className="h-8 sm:h-9 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 