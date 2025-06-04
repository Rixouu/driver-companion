"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"
import { formatDate } from "@/lib/utils/formatting"
import {
  Car,
  Wrench,
  ClipboardCheck,
  Gauge,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Calendar,
  History,
  Play,
  ArrowRight,
  BarChart3,
  Bell,
  CheckSquare,
  Fuel,
  RotateCw,
  Sparkles,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  Timer,
  FileText
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { DbVehicle, DbInspection, DbMaintenanceTask } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { fadeIn, sliderVariants, withDelay } from "@/lib/utils/animations"
import { getBookings } from "@/app/actions/bookings"
import { Booking } from "@/types/bookings"

interface DashboardContentProps {
  stats: {
    totalVehicles: number
    activeVehicles: number
    maintenanceTasks: number
    inspections: number
    vehiclesInMaintenance: number
    scheduledInspections: number
    inProgressInspections: number
    completedInspections: number
    pendingTasks: number
    inProgressTasks: number
    completedTasks: number
  }
  recentInspections: DbInspection[]
  upcomingInspections: DbInspection[]
  recentMaintenance: DbMaintenanceTask[]
  upcomingMaintenance: DbMaintenanceTask[]
  inProgressItems: {
    inspections: DbInspection[]
    maintenance: DbMaintenanceTask[]
  }
  vehicles: DbVehicle[]
}

export function DashboardContent({
  stats,
  recentInspections,
  upcomingInspections,
  recentMaintenance,
  upcomingMaintenance,
  inProgressItems,
  vehicles
}: DashboardContentProps) {
  const { t } = useI18n()
  const [checklistCompleted, setChecklistCompleted] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0)
  
  // State for upcoming bookings
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [bookingsError, setBookingsError] = useState<string | null>(null)

  // Fetch bookings with pending and assigned statuses
  useEffect(() => {
    async function fetchUpcomingBookings() {
      try {
        setIsLoadingBookings(true)
        const { bookings } = await getBookings({
          limit: 10,
          page: 1
        }, false)
        
        // Filter for pending and confirmed bookings
        const filteredBookings = bookings.filter(
          booking => booking.status === 'pending' || booking.status === 'confirmed'
        )
        
        // Sort by date (most recent first)
        filteredBookings.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time || '00:00'}`)
          const dateB = new Date(`${b.date} ${b.time || '00:00'}`)
          return dateA.getTime() - dateB.getTime() // Ascending order (upcoming first)
        })
        
        setUpcomingBookings(filteredBookings.slice(0, 3)) // Limit to 3 bookings
        setBookingsError(null)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        setBookingsError(t('dashboard.bookings.loadError'))
        setUpcomingBookings([])
      } finally {
        setIsLoadingBookings(false)
      }
    }
    
    fetchUpcomingBookings()
  }, [])

  // Function to handle checkbox changes
  const handleCheckboxChange = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Function to handle checklist completion
  const handleCompleteChecklist = () => {
    setChecklistCompleted(true)
    // In a real app, you would save this to the database
  }

  // Vehicle navigation functions
  const nextVehicle = () => {
    if (vehicles.length > 0) {
      setCurrentVehicleIndex((currentVehicleIndex + 1) % vehicles.length)
    }
  }

  // Function to navigate to previous vehicle
  const prevVehicle = () => {
    if (vehicles.length > 0) {
      setCurrentVehicleIndex((currentVehicleIndex - 1 + vehicles.length) % vehicles.length)
    }
  }

  // Check if all items are checked
  const allItemsChecked = Object.values(checkedItems).filter(Boolean).length >= 5

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.description")}
        </p>
      </div>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.quickActions.title")}</CardTitle>
          <CardDescription>{t("dashboard.quickActions.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/vehicles/new" className="col-span-1">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <Car className="h-6 w-6" />
                <span className="text-center">{t("dashboard.quickActions.addVehicle")}</span>
              </Button>
            </Link>
            <Link href="/maintenance/schedule" className="col-span-1">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <Wrench className="h-6 w-6" />
                <span className="text-center">{t("dashboard.quickActions.scheduleMaintenance")}</span>
              </Button>
            </Link>
            <Link href="/inspections/create" className="col-span-1">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <ClipboardCheck className="h-6 w-6" />
                <span className="text-center">{t("dashboard.quickActions.scheduleInspection")}</span>
              </Button>
            </Link>
            <Link href="/quotations/create" className="col-span-1">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <FileText className="h-6 w-6" />
                <span className="text-center">{t("dashboard.quickActions.createQuotation")}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      {/* Main Dashboard Content - Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Vehicle Stats - LEFT SIDE */}
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              {t("dashboard.vehicleStats.title")}
            </CardTitle>
            <CardDescription>{t("dashboard.vehicleStats.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <EmptyState icon={Car} message={t("vehicles.noVehicles")} />
            ) : (
              <div className="space-y-4">
                {/* Featured Vehicle with Navigation Arrows */}
                <div className="relative">
                  {vehicles.length > 1 && (
                    <>
                      <button 
                        onClick={prevVehicle}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-primary hover:text-primary-foreground p-2 rounded-full shadow-md transition-all duration-200 backdrop-blur"
                        aria-label={t("dashboard.vehicleStats.previousVehicle")}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={nextVehicle}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-primary hover:text-primary-foreground p-2 rounded-full shadow-md transition-all duration-200 backdrop-blur"
                        aria-label={t("dashboard.vehicleStats.nextVehicle")}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={currentVehicleIndex}
                      variants={sliderVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="w-full"
                    >
                      <Link
                        href={`/vehicles/${vehicles[currentVehicleIndex]?.id}`}
                        key={vehicles[currentVehicleIndex]?.id}>
                        <div className="rounded-lg border overflow-hidden hover:bg-accent transition-colors">
                          <div className="aspect-video relative bg-muted">
                            {vehicles[currentVehicleIndex]?.image_url ? (
                              <Image
                                src={vehicles[currentVehicleIndex].image_url}
                                alt={vehicles[currentVehicleIndex].name}
                                fill
                                priority
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg">{vehicles[currentVehicleIndex]?.name}</h3>
                              {vehicles.length > 1 && (
                                <span className="text-xs text-muted-foreground">
                                  {currentVehicleIndex + 1} / {vehicles.length}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {vehicles[currentVehicleIndex]?.brand} {vehicles[currentVehicleIndex]?.model} • {vehicles[currentVehicleIndex]?.year}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bookings - RIGHT SIDE */}
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t("dashboard.upcomingBookings.title")}
            </CardTitle>
            <CardDescription>{t("dashboard.upcomingBookings.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBookings ? (
              <div className="flex justify-center items-center py-6">
                <RotateCw className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">{t("common.loading")}</span>
              </div>
            ) : bookingsError ? (
              <div className="text-center py-6">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{bookingsError}</p>
              </div>
            ) : upcomingBookings.length === 0 ? (
              <EmptyState 
                icon={Calendar} 
                message={t("dashboard.upcomingBookings.empty.message")} 
              />
            ) : (
              <div className="space-y-4">
                {upcomingBookings.slice(0, 3).map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
                
                <div className="pt-2">
                  <Link href="/bookings">
                    <Button variant="outline" className="w-full">
                      {t("dashboard.upcomingBookings.viewAll")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t("dashboard.activityFeed.title")}
          </CardTitle>
          <CardDescription>{t("dashboard.activityFeed.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent">
                <History className="mr-2 h-4 w-4" />
                {t("common.status.recent")}
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                <Calendar className="mr-2 h-4 w-4" />
                {t("common.status.upcoming")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-4">
              {recentMaintenance.length === 0 && recentInspections.length === 0 ? (
                <EmptyState icon={History} message={t("dashboard.activityFeed.noRecent")} />
              ) : (
                <div className="space-y-4">
                  {recentMaintenance.slice(0, 3).map((task) => (
                    <MaintenanceTaskCard key={task.id} task={task} />
                  ))}
                  {recentInspections.slice(0, 3).map((inspection) => (
                    <InspectionCard key={inspection.id} inspection={inspection} />
                  ))}
                </div>
              )}
              {(recentMaintenance.length > 0 || recentInspections.length > 0) && (
                <div className="flex justify-center mt-4">
                  <Link
                    href={recentMaintenance.length > recentInspections.length ? "/maintenance" : "/inspections"}>
                    <Button variant="outline">
                      {t("dashboard.activityFeed.viewAll")}
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingMaintenance.length === 0 && upcomingInspections.length === 0 ? (
                <EmptyState icon={Calendar} message={t("dashboard.activityFeed.noUpcoming")} />
              ) : (
                <div className="space-y-4">
                  {upcomingMaintenance.slice(0, 3).map((task) => (
                    <MaintenanceTaskCard key={task.id} task={task} />
                  ))}
                  {upcomingInspections.slice(0, 3).map((inspection) => (
                    <InspectionCard key={inspection.id} inspection={inspection} />
                  ))}
                </div>
              )}
              {(upcomingMaintenance.length > 0 || upcomingInspections.length > 0) && (
                <div className="flex justify-center mt-4">
                  <Link
                    href={upcomingMaintenance.length > upcomingInspections.length ? "/maintenance" : "/inspections"}>
                    <Button variant="outline">
                      {t("dashboard.activityFeed.viewAll")}
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function MaintenanceTaskCard({ task }: { task: DbMaintenanceTask }) {
  const { t } = useI18n()
  return (
    <Link href={`/maintenance/${task.id}`}>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <p className="font-medium">{task.title}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {task.vehicle?.name} • {task.status === 'completed' ? t('common.status.completed') : t('maintenance.details.scheduledFor', { date: formatDate(task.due_date) })}
          </p>
        </div>
        <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'secondary'}>
          {t(`maintenance.status.${task.status}`)}
        </Badge>
      </div>
    </Link>
  );
}

function InspectionCard({ inspection }: { inspection: DbInspection }) {
  const { t } = useI18n()
  
  // Get full inspection type name
  const getFullTypeName = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'routine':
        return t('inspections.type.routine')
      case 'safety':
        return t('inspections.type.safety')
      case 'maintenance':
        return t('inspections.type.maintenance')
      default:
        return t('inspections.defaultType')
    }
  }
  
  return (
    <Link href={`/inspections/${inspection.id}`}>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <p className="font-medium">{getFullTypeName(inspection.type)}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {inspection.vehicle?.name} • {inspection.status === 'completed' ? t('common.status.completed') : t('inspections.details.scheduledFor', { date: formatDate(inspection.date) })}
          </p>
        </div>
        <Badge variant={inspection.status === 'completed' ? 'success' : inspection.status === 'in_progress' ? 'warning' : 'secondary'}>
          {t(`inspections.status.${inspection.status}`)}
        </Badge>
      </div>
    </Link>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const { t } = useI18n()
  
  return (
    <Link 
      href={`/bookings/${booking.id}`}
      className="block"
    >
      <div className="p-3 border rounded-md hover:border-primary transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-medium block">
                {booking.customer_name || t("bookings.unnamed", { defaultValue: "Unnamed Customer" })}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatDate(booking.date)} • {booking.time || '00:00'}</span>
              </div>
            </div>
          </div>
          <Badge 
            variant={booking.status === 'pending' ? 'outline' : 'secondary'} 
            className={`ml-2 ${
              booking.status === 'pending' 
                ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                : booking.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : ''
            }`}
          >
            {t(`bookings.status.${booking.status}`)}
          </Badge>
        </div>
        
        <div className="flex flex-col space-y-1 pl-10">
          {booking.pickup_location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate max-w-[200px]">
                {booking.pickup_location}
              </span>
            </div>
          )}
          {booking.service_name && (
            <div className="flex items-center gap-2 text-sm">
              <Car className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate max-w-[200px]">
                {booking.service_name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
} 