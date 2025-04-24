"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Car, X } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { assignMultipleVehiclesToDriver, getDriverById, unassignVehicleFromDriver } from "@/lib/services/drivers"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { MultiVehicleSelector } from "@/components/vehicles/multi-vehicle-selector"
import { DriverStatusBadge } from "@/components/drivers/driver-status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"
import type { Driver } from "@/types"
import { Label } from "@/components/ui/label"

// Define the Vehicle type
interface Vehicle {
  id: string
  name: string
  plate_number: string
  brand?: string
  model?: string
  image_url?: string
}

export default function AssignVehiclePage() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const { toast } = useToast()
  const [driver, setDriver] = useState<Driver | null>(null)
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])
  const [vehiclesToUnassign, setVehiclesToUnassign] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUnassigning, setIsUnassigning] = useState(false)
  const [confirmUnassignOpen, setConfirmUnassignOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("assign")

  const hasAssignedVehicles = driver?.assigned_vehicles && driver.assigned_vehicles.length > 0
  const assignedVehicles = driver?.assigned_vehicles as Vehicle[] || []

  useEffect(() => {
    async function loadDriver() {
      try {
        setIsLoading(true)
        const data = await getDriverById(id as string)
        setDriver(data)
        
        if (data?.assigned_vehicles && data.assigned_vehicles.length > 0) {
          // Keep the default "assign" tab
        } else {
          setActiveTab("assign")
        }
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
    if (selectedVehicleIds.length === 0) {
      toast({
        title: t("drivers.messages.noVehicleSelected"),
        description: t("drivers.messages.noVehicleSelectedDescription"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await assignMultipleVehiclesToDriver(id as string, selectedVehicleIds)
      
      toast({
        title: t("drivers.messages.assignSuccess"),
        description: selectedVehicleIds.length > 1 
          ? t("drivers.messages.multipleAssignSuccessDescription", { count: `${selectedVehicleIds.length}` }) 
          : t("drivers.messages.assignSuccessDescription"),
      })
      
      // Refresh the driver data to update the assigned vehicles list
      const updatedDriver = await getDriverById(id as string)
      setDriver(updatedDriver)
      setSelectedVehicleIds([])
    } catch (error) {
      console.error("Error assigning vehicles:", error)
      toast({
        title: t("drivers.messages.assignError"),
        description: t("drivers.messages.assignErrorDescription"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUnassign() {
    if (vehiclesToUnassign.length === 0) {
      toast({
        title: t("drivers.messages.noVehicleSelected"),
        description: t("drivers.messages.noVehicleSelectedToUnassign"),
        variant: "destructive",
      })
      return
    }

    try {
      setIsUnassigning(true)
      setConfirmUnassignOpen(false)
      
      // Unassign each vehicle individually
      for (const vehicleId of vehiclesToUnassign) {
        await unassignVehicleFromDriver(vehicleId)
      }
      
      toast({
        title: t("drivers.messages.unassignSuccess"),
        description: vehiclesToUnassign.length > 1 
          ? t("drivers.messages.multipleUnassignSuccessDescription", { count: `${vehiclesToUnassign.length}` }) 
          : t("drivers.messages.unassignSuccessDescription"),
      })
      
      // Refresh the driver data to update the assigned vehicles list
      const updatedDriver = await getDriverById(id as string)
      setDriver(updatedDriver)
      setVehiclesToUnassign([])
    } catch (error) {
      console.error("Error unassigning vehicles:", error)
      toast({
        title: t("drivers.messages.unassignError"),
        description: t("drivers.messages.unassignErrorDescription"),
        variant: "destructive",
      })
    } finally {
      setIsUnassigning(false)
    }
  }

  function toggleUnassignVehicle(vehicleId: string) {
    setVehiclesToUnassign(prev => 
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    )
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
              <AvatarImage src={driver?.profile_image_url || ""} alt={driver?.full_name || ""} />
              <AvatarFallback className="text-base">
                {driver?.first_name?.[0]}{driver?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{t("drivers.actions.manageVehiclesFor", { name: driver?.full_name })}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <DriverStatusBadge status={driver?.status || "active"} />
              </div>
            </div>
          </div>
          <CardDescription>{t("drivers.manageVehicles.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assign">
                {t("drivers.tabs.assignVehicles")}
              </TabsTrigger>
              <TabsTrigger 
                value="unassign" 
                disabled={!hasAssignedVehicles}
              >
                {t("drivers.tabs.unassignVehicles")}
                {hasAssignedVehicles && (
                  <Badge variant="secondary" className="ml-2">
                    {assignedVehicles.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="assign" className="mt-4 space-y-4">
              <MultiVehicleSelector
                value={selectedVehicleIds}
                onChange={setSelectedVehicleIds}
                excludedVehicleIds={driver.assigned_vehicles?.map(v => v.id) || []}
                showAvailableOnly
              />
              
              {selectedVehicleIds.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="text-sm font-medium mr-2 flex items-center">
                    {t("drivers.assignVehicle.selectedVehicles", { count: `${selectedVehicleIds.length}` })}:
                  </div>
                  {selectedVehicleIds.length > 0 && (
                    <Badge variant="secondary">{selectedVehicleIds.length}</Badge>
                  )}
                </div>
              )}
              
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
                  disabled={isSubmitting || selectedVehicleIds.length === 0}
                >
                  <Car className="mr-2 h-4 w-4" />
                  {selectedVehicleIds.length > 1
                    ? t("drivers.actions.assignMultipleVehicles", { count: `${selectedVehicleIds.length}` })
                    : t("drivers.actions.assignVehicle")
                  }
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="unassign" className="mt-4 space-y-4">
              {hasAssignedVehicles ? (
                <>
                  <div className="space-y-3">
                    {assignedVehicles.map((vehicle: Vehicle) => (
                      <div
                        key={vehicle.id}
                        className={`flex items-center gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer ${
                          vehiclesToUnassign.includes(vehicle.id) ? "border-destructive bg-destructive/5" : ""
                        }`}
                        onClick={() => toggleUnassignVehicle(vehicle.id)}
                      >
                        <Checkbox 
                          checked={vehiclesToUnassign.includes(vehicle.id)} 
                          onCheckedChange={() => toggleUnassignVehicle(vehicle.id)}
                          id={`unassign-${vehicle.id}`}
                        />
                        {vehicle.image_url ? (
                          <div className="relative h-12 w-12 rounded-md overflow-hidden">
                            <Image
                              src={vehicle.image_url}
                              alt={vehicle.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                            <Car className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <Label htmlFor={`unassign-${vehicle.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{vehicle.name}</div>
                          <div className="text-sm text-muted-foreground space-x-1">
                            <span>{vehicle.plate_number}</span>
                            {vehicle.brand && (
                              <>
                                <span>•</span>
                                <span>{vehicle.brand}</span>
                              </>
                            )}
                            {vehicle.model && (
                              <>
                                <span>•</span>
                                <span>{vehicle.model}</span>
                              </>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  {vehiclesToUnassign.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <div className="text-sm font-medium mr-2 flex items-center">
                        {t("drivers.unassignVehicle.selectedVehicles", { count: `${vehiclesToUnassign.length}` })}:
                      </div>
                      {vehiclesToUnassign.length > 0 && (
                        <Badge variant="destructive">{vehiclesToUnassign.length}</Badge>
                      )}
                    </div>
                  )}
                  
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
                      variant="destructive"
                      onClick={() => setConfirmUnassignOpen(true)}
                      disabled={isUnassigning || vehiclesToUnassign.length === 0}
                    >
                      <X className="mr-2 h-4 w-4" />
                      {vehiclesToUnassign.length > 1
                        ? t("drivers.actions.unassignMultipleVehicles", { count: `${vehiclesToUnassign.length}` })
                        : t("drivers.actions.unassignVehicle")
                      }
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 border rounded-md bg-muted/30">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">
                    {t("drivers.unassignVehicle.noVehicles")}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                    {t("drivers.unassignVehicle.noVehiclesDescription")}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("assign")}
                  >
                    {t("drivers.actions.assignVehicle")}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <AlertDialog open={confirmUnassignOpen} onOpenChange={setConfirmUnassignOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {vehiclesToUnassign.length > 1
                ? t("drivers.unassignVehicle.confirmMultiple", { count: String(vehiclesToUnassign.length) })
                : t("drivers.unassignVehicle.confirm")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("drivers.unassignVehicle.confirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnassign}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("drivers.actions.unassignVehicle")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 