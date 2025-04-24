"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, User, Key, Car, FileText, Clock } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { format as formatDate } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Driver } from "@/types"

export default function DriverDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const [driver, setDriver] = useState<Driver | null>(null)
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

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/drivers" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("common.backTo")} {t("drivers.title")}
            </Link>
          </Button>
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
    )
  }

  if (!driver) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/drivers" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("common.backTo")} {t("drivers.title")}
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{t("drivers.notFound.title")}</h2>
          <p className="text-muted-foreground mb-6">{t("drivers.notFound.description")}</p>
          <Button asChild>
            <Link href="/drivers">{t("common.backTo")} {t("drivers.title")}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/drivers" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("common.backTo")} {t("drivers.title")}
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href={`/drivers/${id}/edit`} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            {t("drivers.actions.editDriver")}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        <div className="w-full lg:w-1/3">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={driver.profile_image_url || ""} alt={driver.full_name || ""} />
                <AvatarFallback className="text-lg">
                  {driver.first_name?.[0]}{driver.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{driver.full_name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <DriverStatusBadge status={driver.status} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{t("drivers.fields.email")}</p>
                    <p>{driver.email}</p>
                  </div>
                </div>

                {driver.phone && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{t("drivers.fields.phone")}</p>
                      <p>{driver.phone}</p>
                    </div>
                  </div>
                )}

                {driver.license_number && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Key className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{t("drivers.fields.licenseNumber")}</p>
                      <p>{driver.license_number}</p>
                      {driver.license_expiry && (
                        <p className="text-sm text-muted-foreground">
                          {t("drivers.fields.expires")}: {formatDate(new Date(driver.license_expiry), "PPP")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {driver.address && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{t("drivers.fields.address")}</p>
                      <p className="whitespace-pre-wrap">{driver.address}</p>
                    </div>
                  </div>
                )}

                {driver.emergency_contact && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{t("drivers.fields.emergencyContact")}</p>
                      <p>{driver.emergency_contact}</p>
                    </div>
                  </div>
                )}

                {driver.notes && (
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{t("drivers.fields.notes")}</p>
                      <p className="whitespace-pre-wrap">{driver.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {t("common.created")}: {formatDate(new Date(driver.created_at), "PPP")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-2/3">
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("drivers.tabs.overview")}
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
  )
} 