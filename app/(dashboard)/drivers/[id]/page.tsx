"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, User, Key, Car, FileText, Clock, Calendar, MapPin, IdCard, Phone, Mail, MessageSquare } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getDriverById, getDriverInspections } from "@/lib/services/drivers"
import { DriverStatusBadge } from "@/components/drivers/driver-status-badge"
import { DriverVehicles } from "@/components/drivers/driver-vehicles"
import { DriverInspectionsList } from "@/components/drivers/driver-inspections-list"
import { DriverActivityFeed } from "@/components/drivers/driver-activity-feed"
import { DriverUpcomingBookings } from "@/components/drivers/driver-upcoming-bookings"
import { DriverAvailabilityManager } from "@/components/drivers/driver-availability-manager"
import { DriverAvailabilitySection } from "@/components/drivers/driver-availability-section"
import { Skeleton } from "@/components/ui/skeleton"
import { format as formatDate } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import type { Driver as AppDriver } from "@/types"
import type { Driver as DriverType } from "@/types/drivers"

export default function DriverDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const { theme } = useTheme()
  const [driver, setDriver] = useState<AppDriver | null>(null)
  const [inspections, setInspections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadDriverData() {
      try {
        setIsLoading(true)
        const driverData = await getDriverById(id as string)
        
        // Try to get inspections but handle the case where driver_id column doesn't exist
        try {
          const inspectionsData = await getDriverInspections(id as string)
          setInspections(inspectionsData)
        } catch (inspectionError) {
          console.error("Error loading driver inspections:", inspectionError)
          // Set empty inspections array if there's an error
          setInspections([])
        }
        
        setDriver(driverData)
      } catch (error) {
        console.error("Error loading driver data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadDriverData()
    }
  }, [id])

  // Card styles based on theme - matching the Recent Activity block
  const getCardClasses = () => {
    // Use the standard Card component styling without custom background
    return "";
  }

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/drivers">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("common.backTo")} {t("drivers.title")}
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{t("drivers.notFound.title")}</h2>
          <p className="text-muted-foreground mb-6">{t("drivers.notFound.description")}</p>
          <Link href="/drivers">
            <Button variant="ghost" size="sm">
              {t("common.backTo")} {t("drivers.title")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate driver since date
  const driverSinceDate = driver.created_at ? 
    `Driver since ${formatDate(new Date(driver.created_at), "MMMM yyyy")}` : 
    "";

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <Link href="/drivers">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("common.backTo")} {t("drivers.title")}
          </Button>
        </Link>
        <Link href={`/drivers/${id}/edit`}>
          <Button size="sm" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            {t("drivers.actions.editDriver")}
          </Button>
        </Link>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        <div className="w-full lg:w-1/3 space-y-6">
          {/* Driver Info Card */}
          <Card className={getCardClasses()}>
            <CardContent className="p-6 flex flex-col items-center">
              <Avatar className="h-20 w-20 bg-[#FF7E00] mb-4 mt-2">
                <AvatarImage src={driver.profile_image_url || ""} alt={driver.full_name || ""} />
                <AvatarFallback className="text-lg text-white">
                  {driver.first_name?.[0]}{driver.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold mb-1">{driver.full_name}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t("drivers.since", { date: formatDate(new Date(driver.created_at), "MMMM yyyy") })}</p>
              
              <div className="w-full space-y-4">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm text-muted-foreground">{t("drivers.fields.email")}</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p>{driver.email}</p>
                  </div>
                </div>
                
                {driver.phone && (
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm text-muted-foreground">{t("drivers.fields.phone")}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p>{driver.phone}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2 w-full mt-5">
                <Button variant="outline" className="flex items-center justify-center gap-1 border-gray-700 hover:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-800">
                  <Phone className="h-4 w-4" /> {t("common.call")}
                </Button>
                <Button variant="outline" className="flex items-center justify-center gap-1 border-gray-700 hover:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-800">
                  <Mail className="h-4 w-4" /> {t("common.text")}
                </Button>
                <Button variant="outline" className="flex items-center justify-center gap-1 border-gray-700 hover:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-800">
                  <MessageSquare className="h-4 w-4" /> {t("common.line")}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Driver Details Card */}
          <Card className={getCardClasses()}>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">{t("drivers.driverDetails")}</h3>
              
              {driver.license_number && (
                <div className="space-y-1 mb-4">
                  <p className="text-sm text-muted-foreground">{t("drivers.fields.licenseNumber")}</p>
                  <div className="flex items-center gap-2">
                    <IdCard className="h-4 w-4 text-gray-400" />
                    <p>{driver.license_number}</p>
                  </div>
                  {driver.license_expiry && (
                    <p className="text-xs text-muted-foreground">
                      {t("drivers.fields.expires")}: {formatDate(new Date(driver.license_expiry), "MMMM do, yyyy")}
                    </p>
                  )}
                </div>
              )}
              
              {driver.address && (
                <div className="space-y-1 mb-4">
                  <p className="text-sm text-muted-foreground">{t("drivers.fields.address")}</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                    <p className="whitespace-pre-wrap">{driver.address}</p>
                  </div>
                </div>
              )}
              
              {driver.emergency_contact && (
                <div className="space-y-1 mb-4">
                  <p className="text-sm text-muted-foreground">{t("drivers.fields.emergencyContact")}</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p>{driver.emergency_contact}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t("drivers.fields.status")}</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <DriverStatusBadge status={driver.status} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Availability Section */}
          <DriverAvailabilitySection driverId={driver.id} />
        </div>

        <div className="w-full lg:w-2/3">
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("drivers.tabs.overview")}
              </TabsTrigger>
              <TabsTrigger value="availability" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t("drivers.tabs.availability")}
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("drivers.tabs.activity")}
              </TabsTrigger>
              <TabsTrigger value="inspections" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("drivers.tabs.inspections")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DriverVehicles 
                driverId={driver.id}
                assignedVehicles={driver.assigned_vehicles}
              />

              <DriverUpcomingBookings 
                driverId={driver.id}
                limit={5}
              />

              <Card>
                <CardHeader>
                  <CardTitle>{t("drivers.recentActivity.title")}</CardTitle>
                  <CardDescription>{t("drivers.recentActivity.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <DriverActivityFeed driverId={driver.id} limit={5} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="availability" className="space-y-6">
              {driver && (
                <DriverAvailabilityManager 
                  driver={{
                    id: driver.id,
                    name: driver.full_name || "",
                    email: driver.email,
                    phone: driver.phone,
                    license_number: driver.license_number,
                    status: driver.status
                  }} 
                />
              )}
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>{t("drivers.activityHistory.title")}</CardTitle>
                  <CardDescription>{t("drivers.activityHistory.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <DriverActivityFeed driverId={driver.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inspections">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t("drivers.inspections.title")}</CardTitle>
                      <CardDescription>{t("drivers.inspections.description")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <DriverInspectionsList inspections={inspections} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 