"use client"

import Link from "next/link"
import { Car, Mail, Phone, Calendar } from "lucide-react"
import { DriverStatusBadge } from "./driver-status-badge"
import { DriverAvailabilityBadge } from "./driver-availability-badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import type { Driver } from "@/types"

interface DriverCardProps {
  driver: Driver
}

export function DriverCard({ driver }: DriverCardProps) {
  const { t } = useI18n()

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/drivers/${driver.id}`} className="block h-full" ><span className="flex items-center gap-2">
        <div className="h-full flex flex-col">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={driver.profile_image_url || ""} alt={driver.full_name || ""} />
                <AvatarFallback className="text-base">
                  {driver.first_name?.[0]}{driver.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">{driver.full_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <DriverStatusBadge status={driver.status} />
                  <DriverAvailabilityBadge driverId={driver.id} />
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {driver.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{driver.email}</span>
                </div>
              )}
              {driver.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{driver.phone}</span>
                </div>
              )}
              {driver.assigned_vehicles && driver.assigned_vehicles.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Car className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">{t("drivers.assignedVehicles.count", { count: String(driver.assigned_vehicles.length) })}</p>
                    <p className="truncate">{driver.assigned_vehicles.map(v => v.name).join(", ")}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t py-3 px-6 bg-muted/30">
            <Button variant="ghost" size="sm" className="w-full">
              {t("drivers.actions.viewDetails")}
            </Button>
          </CardFooter>
        </div>
      </span></Link>
    </Card>
  );
} 