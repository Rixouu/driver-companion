"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Car, MoreVertical, UnlinkIcon } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { unassignVehicleFromDriver } from "@/lib/services/drivers"

interface DriverVehicleListProps {
  vehicles: Array<{
    id: string
    name: string
    plate_number: string
    image_url?: string
    brand?: string
    model?: string
  }>
  driverId: string
}

export function DriverVehicleList({ vehicles, driverId }: DriverVehicleListProps) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showUnassignDialog, setShowUnassignDialog] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  async function handleUnassign() {
    if (!selectedVehicleId) return

    try {
      setIsLoading(true)
      await unassignVehicleFromDriver(selectedVehicleId)
      
      toast({
        title: t("drivers.messages.unassignSuccess"),
        description: t("drivers.messages.unassignSuccessDescription"),
      })
      
      // Reload the page to reflect changes
      window.location.reload()
    } catch (error) {
      console.error("Error unassigning vehicle:", error)
      toast({
        title: t("drivers.messages.unassignError"),
        description: t("drivers.messages.unassignErrorDescription"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowUnassignDialog(false)
    }
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/30 rounded-lg">
        <Car className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium mb-1">{t("drivers.assignedVehicles.empty.title")}</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          {t("drivers.assignedVehicles.empty.description")}
        </p>
        <Button asChild>
          <Link href={`/drivers/${driverId}/assign-vehicle`} >
            {t("drivers.actions.assignVehicle")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("vehicles.fields.name")}</TableHead>
            <TableHead>{t("vehicles.fields.plateNumber")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("vehicles.fields.brand")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("vehicles.fields.model")}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-md">
                    {vehicle.image_url ? (
                      <Image
                        src={vehicle.image_url}
                        alt={vehicle.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Car className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/vehicles/${vehicle.id}`}
                      className="font-medium hover:underline" >
                      {vehicle.name}
                    </Link>
                  </div>
                </div>
              </TableCell>
              <TableCell>{vehicle.plate_number}</TableCell>
              <TableCell className="hidden md:table-cell">{vehicle.brand || "-"}</TableCell>
              <TableCell className="hidden md:table-cell">{vehicle.model || "-"}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/vehicles/${vehicle.id}`} >
                        {t("vehicles.actions.viewDetails")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => {
                        setSelectedVehicleId(vehicle.id)
                        setShowUnassignDialog(true)
                      }}
                    >
                      <UnlinkIcon className="h-4 w-4 mr-2" />
                      {t("drivers.actions.unassignVehicle")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <AlertDialog open={showUnassignDialog} onOpenChange={setShowUnassignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("drivers.actions.unassignVehicle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("drivers.unassignVehicle.confirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUnassignDialog(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnassign}
              disabled={isLoading}
            >
              {isLoading ? t("common.loading") : t("drivers.actions.unassignVehicle")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 