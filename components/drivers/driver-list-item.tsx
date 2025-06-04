"use client"

import Link from "next/link"
import { Car, ChevronRight, MapPin, Phone, Clock, Shield, Mail } from "lucide-react"
import { DriverStatusBadge } from "./driver-status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useI18n } from "@/lib/i18n/context"
import { Badge } from "@/components/ui/badge"
import type { Driver } from "@/types/drivers"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface DriverListItemProps {
  driver: Driver
}

export function DriverListItem({ driver }: DriverListItemProps) {
  const { t } = useI18n()
  const router = useRouter()
  const currentDriver = driver as any; // Temporary cast
  const currentAvailability = currentDriver.availability_status || currentDriver.status || 'available';
  
  // Helper function to get availability color class for the border
  const getAvailabilityColorClass = () => {
    switch (currentAvailability.toLowerCase()) {
      case 'available':
        return "border-l-green-500";
      case 'unavailable':
        return "border-l-red-500";
      case 'leave':
        return "border-l-amber-500";
      case 'training':
        return "border-l-blue-500";
      default:
        return "border-l-border"; // Default border color
    }
  };

  // Handle click for better mobile touch support
  const handleItemClick = () => {
    router.push(`/drivers/${driver.id}`);
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow w-full active:bg-muted/50"
      onClick={handleItemClick} // Added onClick handler
      role="button" // Added role for accessibility
      tabIndex={0} // Added tabIndex for accessibility
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleItemClick(); }} // Keyboard accessibility
    >
      <div className="flex items-center p-4">
        <Avatar className="h-12 w-12 mr-4 border">
          <AvatarImage 
            src={driver.profile_image_url || ""} 
            alt={driver.full_name || t("drivers.emptyState.title") } 
          />
          <AvatarFallback className="text-md font-bold bg-primary text-primary-foreground">
            {driver.first_name?.[0]}{driver.last_name?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
          {/* Column 1: Name & ID */}
          <div className="truncate">
            <p className="font-medium text-base">{driver.full_name || t("drivers.emptyState.title")}</p>
            <p className="text-xs text-muted-foreground">
              {t("drivers.fields.idLabel")}: {driver.id}
            </p>
          </div>

          {/* Column 2: Contact Info */}
          <div className="truncate text-sm">
            <div className="flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{driver.email || t("common.notAvailableShort")}</span>
            </div>
            {driver.phone && (
              <div className="flex items-center gap-1.5 mt-1">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{driver.phone || t("common.notAvailableShort")}</span>
              </div>
            )}
          </div>

          {/* Column 3: License Info */}
          <div className="text-sm">
            {driver.license_number ? (
              <>
                {driver.license_number}
                {driver.license_expiry && (
                  <span className="text-xs text-muted-foreground ml-1">({t("drivers.fields.expires")}: {new Date(driver.license_expiry).toLocaleDateString()})</span>
                )}
              </>
            ) : t("common.notAvailableShort")}
          </div>

          {/* Column 4: Status Badge */}
          <div className="hidden md:block">
            <DriverStatusBadge status={driver.availability_status || driver.status || 'available'} />
          </div>
        </div>

        <Link href={`/drivers/${driver.id}`} passHref legacyBehavior>
          <Button variant="outline" size="sm" className="ml-4 hidden md:inline-flex">{t("drivers.actions.viewDetails")}</Button>
        </Link>
        <ChevronRight className="h-5 w-5 text-muted-foreground ml-2 md:hidden" />
      </div>
    </Card>
  );
} 