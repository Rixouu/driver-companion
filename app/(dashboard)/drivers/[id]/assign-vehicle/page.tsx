"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Car } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { assignVehicleToDriver, getDriverById } from "@/lib/services/drivers"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { VehicleSelector } from "@/components/vehicles/vehicle-selector"
import { DriverStatusBadge } from "@/components/drivers/driver-status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Driver } from "@/types"

export default function AssignVehiclePage() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const { toast } = useToast()
  const [driver, setDriver] = useState<Driver | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadDriver() {
      try {
        setIsLoading(true)
        const data = await getDriverById(id as string)
        setDriver(data)
      } catch (error) {
        console.error("Error loading driver:", error)
        toast({
          title: t("drivers.messages.loadError"),
          description: t("drivers.messages.loadErrorDescription"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadDriver()
    }
  }, [id, t, toast])

  async function handleAssign() {
    if (!selectedVehicleId) {
      toast({
        title: t("drivers.messages.noVehicleSelected"),
        description: t("drivers.messages.noVehicleSelectedDescription"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await assignVehicleToDriver(id as string, selectedVehicleId)
      
      toast({
        title: t("drivers.messages.assignSuccess"),
        description: t("drivers.messages.assignSuccessDescription"),
      })
      
      router.push(`/drivers/${id}`)
    } catch (error) {
      console.error("Error assigning vehicle:", error)
      toast({
        title: t("drivers.messages.assignError"),
        description: t("drivers.messages.assignErrorDescription"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/drivers/${id}`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("common.backTo")} {t("drivers.driverDetails")}
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-32 mt-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!driver) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/drivers" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("common.backTo")} {t("drivers.title")}
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("drivers.notFound.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("drivers.notFound.description")}</p>
            <Button asChild>
              <Link href="/drivers">{t("common.backTo")} {t("drivers.title")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/drivers/${id}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("common.backTo")} {t("drivers.driverDetails")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={driver.profile_image_url || ""} alt={driver.full_name || ""} />
              <AvatarFallback className="text-base">
                {driver.first_name?.[0]}{driver.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{t("drivers.actions.assignVehicleTo", { name: driver.full_name })}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <DriverStatusBadge status={driver.status} />
              </div>
            </div>
          </div>
          <CardDescription>{t("drivers.assignVehicle.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <VehicleSelector
            value={selectedVehicleId}
            onChange={setSelectedVehicleId}
            excludedVehicleIds={driver.assigned_vehicles?.map(v => v.id) || []}
            showAvailableOnly
          />
          
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              asChild
            >
              <Link href={`/drivers/${id}`}>
                {t("common.cancel")}
              </Link>
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isSubmitting || !selectedVehicleId}
            >
              <Car className="mr-2 h-4 w-4" />
              {t("drivers.actions.assignVehicle")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 