"use client"

import Link from "next/link"
import { Car, ChevronRight, MapPin, Phone, Clock, Shield } from "lucide-react"
import { DriverStatusBadge } from "./driver-status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useI18n } from "@/lib/i18n/context"
import { Badge } from "@/components/ui/badge"
import type { Driver } from "@/types"

interface DriverListItemProps {
  driver: Driver
}

export function DriverListItem({ driver }: DriverListItemProps) {
  const { t } = useI18n()
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

  return (
    <Link
      href={`/drivers/${currentDriver.id}`}
      // Apply border color and keep other text black/muted
      className={`flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-l-4 ${getAvailabilityColorClass()}`}>
      <div className="flex items-center gap-4 flex-grow">
        <Avatar className="h-12 w-12 border-2 border-primary/10">
          <AvatarImage src={currentDriver.profile_image_url || ""} alt={currentDriver.full_name || ""} />
          <AvatarFallback className="text-base bg-primary/10 text-primary-foreground">
            {currentDriver.first_name?.[0]}{currentDriver.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
          <div>
            <h3 className="font-medium text-foreground">{currentDriver.full_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {currentDriver.license_number && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>ID: {currentDriver.license_number}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{currentDriver.phone || 'N/A'}</span>
            </div>
            {/* Commented out: Location */}
            {/* {currentDriver.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{currentDriver.location}</span>
              </div>
            )} */}
          </div>
          
          <div className="hidden md:flex flex-col">
            {/* Commented out: Assigned Vehicles */}
            {/* {currentDriver.assigned_vehicles && currentDriver.assigned_vehicles.length > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span>{currentDriver.assigned_vehicles.map(v => v.name).join(", ")}</span>
              </div>
            )} */}
            {/* Commented out: Upcoming Booking */}
            {/* {currentDriver.upcoming_booking && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>Next: {new Date(currentDriver.upcoming_booking.date).toLocaleDateString()}</span>
              </div>
            )} */}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <DriverStatusBadge status={currentAvailability} />
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Link>
  );
} 