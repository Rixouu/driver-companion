"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Edit, User, Phone, Mail, MessageSquare, IdCard, Calendar, MapPin, Settings, MoreVertical, CheckCircle, Clock, Truck } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DriverStatusBadge } from "@/components/drivers/driver-status-badge"
import { DriverInspectionsList } from "@/components/drivers/driver-inspections-list"
import { DriverActivityFeed } from "@/components/drivers/driver-activity-feed"
import { DriverUpcomingBookings } from "@/components/drivers/driver-upcoming-bookings"
import { DriverAvailabilityManager } from "@/components/drivers/driver-availability-manager"
import { DriverBookingsList } from "@/components/drivers/driver-bookings-list"

import { Skeleton } from "@/components/ui/skeleton"
import { format as formatDate, parseISO } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Driver, DriverAvailability } from "@/types/drivers"
import type { DbInspection as Inspection } from "@/types/inspections"

interface DriverDetailsContentProps {
  initialDriver: Driver | null
  initialAvailability: DriverAvailability[]
  initialInspections: Inspection[]
  driverId: string | null
}

export function DriverDetailsContent({
  initialDriver,
  initialAvailability,
  initialInspections,
  driverId,
}: DriverDetailsContentProps) {
  const router = useRouter()
  const { t } = useI18n()

        const [driver, setDriver] = useState<Driver | null>(initialDriver)
  const [availabilityRecords, setAvailabilityRecords] = useState<DriverAvailability[]>(initialAvailability)
  const [inspections, setInspections] = useState<Inspection[]>(initialInspections)
  const [bookings, setBookings] = useState<any[]>([])
  const [inspectionDetails, setInspectionDetails] = useState<any[]>([])
  const [currentAvailabilityStatus, setCurrentAvailabilityStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const id = driverId

  const processAndSetAvailability = useCallback((currentDriver: Driver | null, records: DriverAvailability[]) => {
    const today = formatDate(new Date(), "yyyy-MM-dd")
    const now = new Date()
    const currentBookingAvailability = records.find((record: any) => {
      if (!record.start_date || !record.end_date) return false
      const startDate = parseISO(record.start_date)
      const endDate = parseISO(record.end_date)
      const isNowBetweenDates = now >= startDate && now <= endDate
      const isBookingRelated = record.notes?.includes('Assigned to booking')
      return isNowBetweenDates && isBookingRelated
    })

    const isBooking = !!currentBookingAvailability?.notes?.includes('Assigned to booking')
    const bookingNotes = currentBookingAvailability?.notes

    if (currentBookingAvailability) {
      setCurrentAvailabilityStatus(currentBookingAvailability.status)
      if (currentDriver) {
        setDriver(prevDriver => prevDriver ? { ...prevDriver, isBooking, bookingNotes } : null)
      }
    } else {
      const currentRecord = records.find(
        (record: any) => record.start_date <= today && record.end_date >= today
      )
      setCurrentAvailabilityStatus(currentRecord?.status || 'available')
       if (currentDriver) {
        setDriver(prevDriver => prevDriver ? { ...prevDriver, isBooking: false, bookingNotes: undefined } : null)
      }
    }
  }, [])

  const refreshData = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const [driverRes, availabilityRes, inspectionsRes, bookingsRes, inspectionDetailsRes] = await Promise.all([
        fetch(`/api/drivers/${id}/details`),
        fetch(`/api/drivers/${id}/availability`),
        fetch(`/api/drivers/${id}/inspections`),
        fetch(`/api/drivers/${id}/bookings`),
        fetch(`/api/drivers/${id}/inspection-details`),
      ])

      if (!driverRes.ok || !availabilityRes.ok || !inspectionsRes.ok || !bookingsRes.ok || !inspectionDetailsRes.ok) {
        throw new Error(t("drivers.messages.refreshError"))
      }

      const driverData: Driver = await driverRes.json()
      const availabilityData: DriverAvailability[] = await availabilityRes.json()
      const inspectionsData: Inspection[] = await inspectionsRes.json()
      const bookingsData = await bookingsRes.json()
      const inspectionDetailsData = await inspectionDetailsRes.json()

      setDriver(driverData)
      setAvailabilityRecords(availabilityData)
      setInspections(inspectionsData)
      setBookings(bookingsData.bookings || [])
      setInspectionDetails(inspectionDetailsData.inspectionDetails || [])
      processAndSetAvailability(driverData, availabilityData)

    } catch (error) {
      console.error(t("drivers.messages.consoleRefreshError"), error)
    } finally {
      setIsLoading(false)
    }
  }, [id, processAndSetAvailability, t])

  useEffect(() => {
    setDriver(initialDriver)
    setAvailabilityRecords(initialAvailability)
    setInspections(initialInspections)
    if (initialDriver && initialAvailability) {
      processAndSetAvailability(initialDriver, initialAvailability)
    }

    const handleDataRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.driverId === id) {
        refreshData();
      }
    };
    document.addEventListener("refresh-driver-data", handleDataRefresh);

    return () => {
      document.removeEventListener("refresh-driver-data", handleDataRefresh);
    };
  }, [id, refreshData, initialDriver, initialAvailability, initialInspections, processAndSetAvailability]);

  const handleViewFullSchedule = () => {
    setActiveTab("availability")
  }

  // Loading skeleton
  if (isLoading && !driver) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
        <div className="container max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // Driver not found
  if (!driver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{t("drivers.notFound.title")}</h2>
          <p className="text-muted-foreground mb-6">{t("drivers.notFound.description")}</p>
          <Link href="/drivers" passHref>
            <Button variant="outline">{t("common.backTo")} {t("drivers.title")}</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-card">
        <div className="container max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={driver.profile_image_url || ""} alt={driver.full_name || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {driver.first_name?.[0]}{driver.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{driver.full_name}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <p className="text-muted-foreground">{driver.email}</p>
                  <DriverStatusBadge status={currentAvailabilityStatus || driver.status || "unavailable"} />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                {t("common.call")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/drivers/${id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      {t("drivers.actions.editDriver")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Mail className="h-4 w-4 mr-2" />
                    {t("common.email")}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t("common.actions.chat")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column - Driver Info */}
                                <div className="xl:col-span-4 space-y-6">
             {/* Driver Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  {t("drivers.keyInformation.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("drivers.fields.phone")}</p>
                      <p className="text-sm text-muted-foreground">{driver.phone || t("common.notSet")}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <IdCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t("drivers.fields.licenseNumber")}</p>
                      <p className="text-sm text-muted-foreground">{driver.license_number || t("common.notSet")}</p>
                    </div>
                  </div>
                </div>
                
                {driver.license_expiry && (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{t("drivers.fields.licenseExpiry")}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(parseISO(driver.license_expiry), "PPP")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {driver.address && (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{t("drivers.fields.address")}</p>
                        <p className="text-sm text-muted-foreground">{driver.address}</p>
                      </div>
                    </div>
                  </div>
                )}

                {driver.emergency_contact && (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{t("drivers.fields.emergencyContact")}</p>
                        <p className="text-sm text-muted-foreground">{driver.emergency_contact}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{bookings?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Total Bookings</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{inspectionDetails?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Inspections</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Availability */}
            <Card>
              <CardHeader>
                <CardTitle>{t("drivers.currentStatus.title")}</CardTitle>
                <CardDescription>
                  {driver.isBooking && driver.bookingNotes ? driver.bookingNotes : 
                   currentAvailabilityStatus === 'available' ? 
                   "This driver is currently available for booking assignments." :
                   `This driver is currently ${currentAvailabilityStatus}.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={handleViewFullSchedule}>
                  <Calendar className="h-4 w-4 mr-2" />
                  {t("drivers.availability.viewFullSchedule")}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="xl:col-span-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview">{t("drivers.tabs.overview")}</TabsTrigger>
                <TabsTrigger value="availability">{t("drivers.tabs.availability")}</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="activity">{t("drivers.tabs.activityLog")}</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Upcoming Bookings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Truck className="h-5 w-5 mr-2" />
                      {t("drivers.upcomingBookings.title")}
                    </CardTitle>
                    <CardDescription>
                      {t("drivers.upcomingBookings.description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DriverUpcomingBookings driverId={id!} />
                  </CardContent>
                </Card>

                {/* Recent Inspections */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Recent Inspections
                    </CardTitle>
                    <CardDescription>
                      Latest vehicle inspections performed by this driver
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DriverInspectionsList inspections={inspections as any} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="availability">
                {id && driver && <DriverAvailabilityManager driver={driver} />}
              </TabsContent>
              
              <TabsContent value="bookings">
                {id && <DriverBookingsList driverId={id} />}
              </TabsContent>

              <TabsContent value="activity">
                {id && <DriverActivityFeed driverId={id} />}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

// Placeholder for types if not already defined globally
// export interface DriverAvailability {
//   id: string;
//   driver_id: string;
//   start_date: string;
//   end_date: string;
//   status: string; // e.g., 'available', 'unavailable', 'on_leave'
//   notes?: string;
// }

// export interface Inspection {
//   id: string;
//   vehicle_id: string;
//   driver_id?: string;
//   status: string;
//   scheduled_date?: string;
//   completed_date?: string;
//   // ... other relevant fields
// } 