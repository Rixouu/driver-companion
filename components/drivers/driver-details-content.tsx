"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation" // No longer using useParams here
import Link from "next/link"
import { ArrowLeft, Edit, User, Key, Car, FileText, Clock, Calendar, MapPin, IdCard, Phone, Mail, MessageSquare } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// Removed service imports: getDriverById, getDriverInspections, getDriverAvailability, isDriverAvailable
// These will be handled by the Server Component or API routes for refresh
import { DriverStatusBadge } from "@/components/drivers/driver-status-badge"
import { DriverVehicles } from "@/components/drivers/driver-vehicles"
import { DriverInspectionsList } from "@/components/drivers/driver-inspections-list"
import { DriverActivityFeed } from "@/components/drivers/driver-activity-feed"
import { DriverUpcomingBookings } from "@/components/drivers/driver-upcoming-bookings"
import { DriverAvailabilityManager } from "@/components/drivers/driver-availability-manager"
import { DriverAvailabilitySection } from "@/components/drivers/driver-availability-section"
import { Skeleton } from "@/components/ui/skeleton"
import { format as formatDate, parseISO } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import type { Driver, DriverAvailability } from "@/types/drivers" // Assuming DriverAvailability type exists or can be created
import type { DbInspection as Inspection } from "@/types/inspections" // Changed to DbInspection

interface DriverDetailsContentProps {
  initialDriver: Driver | null
  initialAvailability: DriverAvailability[] // Define or import this type
  initialInspections: Inspection[] // Define or import this type
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
  const { theme } = useTheme()

  const [driver, setDriver] = useState<Driver | null>(initialDriver)
  const [availabilityRecords, setAvailabilityRecords] = useState<DriverAvailability[]>(initialAvailability)
  const [inspections, setInspections] = useState<Inspection[]>(initialInspections)
  const [currentAvailabilityStatus, setCurrentAvailabilityStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Initial load handled by server, this is for client actions
  const [activeTab, setActiveTab] = useState("overview")

  const id = driverId; // Use prop

  // Function to process availability data and update state
  const processAndSetAvailability = useCallback((currentDriver: Driver | null, records: DriverAvailability[]) => {
    const today = formatDate(new Date(), "yyyy-MM-dd");
    const now = new Date();
    const currentBookingAvailability = records.find((record: any) => {
      if (!record.start_date || !record.end_date) return false;
      const startDate = parseISO(record.start_date);
      const endDate = parseISO(record.end_date);
      const isNowBetweenDates = now >= startDate && now <= endDate;
      const isBookingRelated = record.notes?.includes('Assigned to booking');
      return isNowBetweenDates && isBookingRelated;
    });

    const isBooking = !!currentBookingAvailability?.notes?.includes('Assigned to booking');
    const bookingNotes = currentBookingAvailability?.notes;

    if (currentBookingAvailability) {
      setCurrentAvailabilityStatus(currentBookingAvailability.status);
      if (currentDriver) {
        setDriver(prevDriver => prevDriver ? { ...prevDriver, isBooking, bookingNotes } : null);
      }
    } else {
      const currentRecord = records.find(
        (record: any) => record.start_date <= today && record.end_date >= today
      );
      setCurrentAvailabilityStatus(currentRecord?.status || 'available');
       if (currentDriver) {
        setDriver(prevDriver => prevDriver ? { ...prevDriver, isBooking: false, bookingNotes: undefined } : null);
      }
    }
  }, []);


  useEffect(() => {
    setDriver(initialDriver);
    setAvailabilityRecords(initialAvailability);
    setInspections(initialInspections);
    if (initialDriver && initialAvailability) {
      processAndSetAvailability(initialDriver, initialAvailability);
    }
  }, [initialDriver, initialAvailability, initialInspections, processAndSetAvailability]);


  // Client-side data refresh function (if needed, e.g., after an update)
  const refreshData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [driverRes, availabilityRes, inspectionsRes] = await Promise.all([
        fetch(`/api/drivers/${id}/details`),
        fetch(`/api/drivers/${id}/availability`),
        fetch(`/api/drivers/${id}/inspections`),
      ]);

      if (!driverRes.ok || !availabilityRes.ok || !inspectionsRes.ok) {
        // Simplified error handling, consider more granular messages
        throw new Error(t("drivers.messages.refreshError"));
      }

      const driverData: Driver = await driverRes.json();
      const availabilityData: DriverAvailability[] = await availabilityRes.json();
      const inspectionsData: Inspection[] = await inspectionsRes.json();

      setDriver(driverData);
      setAvailabilityRecords(availabilityData);
      setInspections(inspectionsData);
      processAndSetAvailability(driverData, availabilityData);

    } catch (error) {
      console.error(t("drivers.messages.consoleRefreshError"), error);
      // Handle error (e.g., show toast)
    } finally {
      setIsLoading(false);
    }
  }, [id, processAndSetAvailability, t]);


  const handleViewFullSchedule = () => {
    setActiveTab("availability")
  }

  const getCardClasses = () => {
    return ""; // Standard card styling
  }

  // Skeleton for client-side loading (e.g. during refreshData)
  if (isLoading && !driver) { // Show full page skeleton only if refreshing and somehow driver became null
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!driver) { // This case should ideally be handled by the server component with notFound()
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{t("drivers.notFound.title")}</h2>
          <p className="text-muted-foreground mb-6">{t("drivers.notFound.description")}</p>
          <Link href="/drivers" passHref>
            <Button variant="ghost" size="sm">{t("common.backTo")} {t("drivers.title")}</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // The rest of the JSX from DriverDetailsPage, adapted to use props and state from this component
  // Ensure all 'id' references use the driverId prop or the 'id' const derived from it.
  // Ensure 't' function is used for translations.
  // Ensure 'driver', 'inspections', 'currentAvailabilityStatus', 'activeTab' are used from state.
  // Ensure 'refreshData' is passed to components like DriverVehicles if they need to trigger a refresh.

  return (
    <div className="container px-4 py-6 mx-auto w-full max-w-screen-2xl">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <Link href="/drivers" passHref>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 mb-2 sm:mb-0">
            <ArrowLeft className="h-4 w-4" />
            {t("common.backTo")} {t("drivers.title")}
          </Button>
        </Link>
        {id && (
          <Link href={`/drivers/${id}/edit`} passHref>
            <Button size="sm" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              {t("drivers.actions.editDriver")}
            </Button>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          {/* Driver Info Card */}
          <Card className={getCardClasses()}>
            <CardContent className="p-6 flex flex-col items-center">
              <Avatar className="h-20 w-20 bg-primary mb-4 mt-2">
                <AvatarImage src={driver.profile_image_url || ""} alt={driver.full_name || ""} />
                <AvatarFallback className="text-lg font-bold text-white">
                  {driver.first_name?.[0]}{driver.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold tracking-tight text-center mb-1">{driver.full_name}</h2>
              <p className="text-sm text-muted-foreground text-center mb-1">{driver.email}</p>
              {driver.phone && <p className="text-sm text-muted-foreground text-center mb-4">{driver.phone}</p>}
              
              <div className="w-full space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("drivers.fields.email")}</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm break-all">{driver.email}</p>
                  </div>
                </div>
                
                {driver.phone && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{t("drivers.fields.phone")}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">{driver.phone}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2 w-full mt-5">
                 {/* Example: Action buttons (these would need actual functionality) */}
                <Button variant="outline" size="sm" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1 sm:px-2">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" /> {t("common.call")}
                </Button>
                <Button variant="outline" size="sm" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1 sm:px-2">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4" /> {t("common.text")}
                </Button>
                <Button variant="outline" size="sm" className="flex items-center justify-center gap-1 text-xs sm:text-sm px-1 sm:px-2">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" /> {t("common.actions.chat")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* NEW Driver Status Card */}
          <Card className={getCardClasses()}>
            <CardHeader>
              <CardTitle>{t("drivers.currentStatus.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <DriverStatusBadge status={currentAvailabilityStatus || driver.status || "unavailable"} />
              {driver.isBooking && driver.bookingNotes && (
                <p className="text-sm text-muted-foreground mt-2">{driver.bookingNotes}</p>
              )}
            </CardContent>
          </Card>

          {/* Driver Status Card - Simplified, needs DriverStatusBadge component */}
          <Card className={getCardClasses()}>
            <CardHeader>
              <CardTitle>{t("drivers.status.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {driverId && currentAvailabilityStatus && <DriverStatusBadge status={currentAvailabilityStatus} />}
            </CardContent>
          </Card>
          
          {/* Key Information Card - Simplified */}
          <Card className={getCardClasses()}>
            <CardHeader>
                <CardTitle>{t("drivers.keyInformation.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                    <IdCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-xs text-muted-foreground">{t("drivers.fields.licenseNumber")}</p>
                        <p className="text-sm font-medium">{driver.license_number || t("common.notSet")}</p>
                    </div>
                </div>
                {driver.license_expiry && (
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">{t("drivers.fields.licenseExpiry")}</p>
                            <p className="text-sm font-medium">{formatDate(parseISO(driver.license_expiry), "PPP")}</p>
                        </div>
                    </div>
                )}
                {/* Add more fields like address, etc. */}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
              <TabsTrigger value="overview">{t("drivers.tabs.overview")}</TabsTrigger>
              <TabsTrigger value="availability">{t("drivers.tabs.availability")}</TabsTrigger>
              <TabsTrigger value="vehicles">{t("drivers.tabs.assignedVehicles")}</TabsTrigger>
              <TabsTrigger value="activity">{t("drivers.tabs.activityLog")}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-6">
                <DriverAvailabilitySection 
                  driverId={id!} 
                  onViewFullSchedule={handleViewFullSchedule} 
                />
                <DriverUpcomingBookings driverId={id!} />
                <DriverInspectionsList inspections={inspections as any} />
              </div>
            </TabsContent>

            <TabsContent value="availability">
              {id && driver && <DriverAvailabilityManager driver={driver} />}
            </TabsContent>
            
            <TabsContent value="vehicles">
              {id && driver && <DriverVehicles driverId={id} assignedVehicles={driver.assigned_vehicles} onUnassignSuccess={refreshData} />}
            </TabsContent>

            <TabsContent value="activity">
              {id && <DriverActivityFeed driverId={id} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
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