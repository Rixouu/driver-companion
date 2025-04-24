"use client"

import Link from "next/link"
import { Car, ChevronRight } from "lucide-react"
import { DriverStatusBadge } from "./driver-status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useI18n } from "@/lib/i18n/context"
import type { Driver } from "@/types"

interface DriverListItemProps {
  driver: Driver
}

export function DriverListItem({ driver }: DriverListItemProps) {
  const { t } = useI18n()

  return (
    <Link
      href={`/drivers/${driver.id}`}
      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={driver.profile_image_url || ""} alt={driver.full_name || ""} />
          <AvatarFallback>
            {driver.first_name?.[0]}{driver.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{driver.full_name}</h3>
          <p className="text-sm text-muted-foreground">{driver.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {driver.assigned_vehicles && driver.assigned_vehicles.length > 0 && (
          <div className="hidden md:flex items-center gap-1 text-sm">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("drivers.assignedVehicles.count", { count: String(driver.assigned_vehicles.length) })}</span>
          </div>
        )}
        <DriverStatusBadge status={driver.status} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  )
} 