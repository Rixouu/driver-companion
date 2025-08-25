"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Clock, Car, Wrench, FileText, ExternalLink, Calendar, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { formatDate } from "@/lib/utils/formatting"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

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
  const supabase = createClient();

  const applyFiltersAndPagination = (activities: Activity[], typeFilter: string, page: number) => {
    let filtered = activities;
    
    // Apply type filter
    if (typeFilter !== "all") {
      filtered = activities.filter(activity => activity.type === typeFilter);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    
    setActivities(paginated);
    setCurrentPage(page);
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
        // Get driver email first
        console.log('🔍 DriverActivityFeed: Fetching driver email...')
        const { data: driverData, error: driverError } = await supabase
          .from('drivers')
          .select('email')
          .eq('id', driverId)
          .single()

        console.log('🔍 DriverActivityFeed: Driver data result:', { driverData, driverError })
        if (driverError) throw driverError

        // Get inspections from inspection_details table (where this driver is the inspector)
        console.log('🔍 DriverActivityFeed: Fetching inspection details for email:', driverData.email)
        const { data: inspectionDetails, error: inspectionError } = await supabase
          .from('inspection_details')
          .select(`
            id,
            model,
            year,
            inspector_email,
            inspector_name,
            created_at
          `)
          .eq('inspector_email', driverData.email)
          .order('created_at', { ascending: false })
          .limit(limit || 50)

        console.log('🔍 DriverActivityFeed: Inspection details result:', { 
          count: inspectionDetails?.length, 
          inspectionError,
          sampleData: inspectionDetails?.slice(0, 2)
        })
        if (inspectionError) throw inspectionError

        // Get bookings
        console.log('🔍 DriverActivityFeed: Fetching bookings for driverId:', driverId)
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            date,
            time,
            status,
            customer_name,
            pickup_location,
            dropoff_location,
            vehicle:vehicles (
              id,
              name
            )
          `)
          .eq('driver_id', driverId)
          .order('date', { ascending: false })
          .limit(limit || 50)

        console.log('🔍 DriverActivityFeed: Bookings result:', { 
          count: bookings?.length, 
          bookingsError,
          sampleData: bookings?.slice(0, 2)
        })
        if (bookingsError) throw bookingsError

        // Get vehicle IDs assigned to this driver from the vehicle_assignments table
        const { data: vehicleAssignments, error: assignmentError } = await supabase
          .from('vehicle_assignments')
          .select('vehicle_id')
          .eq('driver_id', driverId)
          .eq('status', 'active')

        if (assignmentError) throw assignmentError

        let maintenanceTasks: any[] = []
        if (vehicleAssignments && vehicleAssignments.length > 0) {
          const vehicleIds = vehicleAssignments.map(v => v.vehicle_id)
          
          // Get details of assigned vehicles
          const { data: vehicles, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id, name')
            .in('id', vehicleIds)
            
          if (vehicleError) throw vehicleError
          
          // Get maintenance tasks for assigned vehicles
          const { data: maintenance, error: maintenanceError } = await supabase
            .from('maintenance_tasks')
            .select(`
              id,
              title,
              due_date,
              status,
              vehicle:vehicles (
                id,
                name
              )
            `)
            .in('vehicle_id', vehicleIds)
            .order('due_date', { ascending: false })
            .limit(limit || 50)

          if (maintenanceError) throw maintenanceError
          maintenanceTasks = maintenance || []
        }

        // Combine activities
        console.log('🔍 DriverActivityFeed: Combining activities...')
        const allActivities = [
          // Map bookings to activities
          ...(bookings || []).map(booking => ({
            id: `booking-${booking.id}`,
            type: "booking" as const,
            date: booking.date,
            title: `Booking #${booking.id?.slice(-5)}`,
            description: `${booking.customer_name || 'Customer'} • ${booking.pickup_location} → ${booking.dropoff_location}`,
            link: `/bookings/${booking.id}`
          })),
          
          // Map inspection details to activities
          ...(inspectionDetails || []).map(inspection => ({
            id: `inspection-${inspection.id}`,
            type: "inspection" as const,
            date: inspection.created_at || new Date().toISOString(),
            title: `Vehicle Inspection - ${inspection.model} ${inspection.year}`,
            description: `Inspected ${inspection.model} (${inspection.year})`,
            link: `/inspection-details/${inspection.id}`
          })),
          
          // Map maintenance tasks to activities
          ...maintenanceTasks.map(task => ({
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
        {/* Filters and Pagination */}
        {!limit && allActivities.length > 0 && (
          <div className="mb-6 space-y-4">
            {/* Filter Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by:</span>
              </div>
              <Select value={filterType} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="booking">Bookings</SelectItem>
                  <SelectItem value="inspection">Inspections</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Activity Count */}
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {allActivities.filter(a => filterType === "all" || a.type === filterType).length} activities
              </Badge>
              {filterType !== "all" && (
                <Badge variant="secondary">
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
          <div className="space-y-4">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                href={{pathname: activity.link}} passHref
                className="block p-3 sm:p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors" 
              >
                <div className="flex items-start gap-3 justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {activity.type === "booking" && (
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        )}
                        {activity.type === "inspection" && (
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        )}
                        {activity.type === "maintenance" && (
                          <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        )}
                        {activity.type === "vehicle_assignment" && (
                          <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm sm:text-base truncate">{activity.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end flex-shrink-0 ml-2 sm:ml-4">
                    <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(activity.date)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!limit && allActivities.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, allActivities.filter(a => filterType === "all" || a.type === filterType).length)} of {allActivities.filter(a => filterType === "all" || a.type === filterType).length} activities
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {Math.ceil(allActivities.filter(a => filterType === "all" || a.type === filterType).length / itemsPerPage)}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(allActivities.filter(a => filterType === "all" || a.type === filterType).length / itemsPerPage)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 