"use client"

import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"

interface DriverStatusBadgeProps {
  status: string;
  isBooking?: boolean;
  notes?: string;
}

export function DriverStatusBadge({ status, isBooking, notes }: DriverStatusBadgeProps) {
  const { t } = useI18n()
  
  // Check if it's a booking based on notes or explicit flag
  const isBookingStatus = isBooking || (notes?.includes('Assigned to booking'));

  const getVariant = () => {
    // If it's a booking, use a custom "booking" variant
    if (isBookingStatus) {
      return "booking";
    }
    
    switch (status?.toLowerCase()) {
      case "available":
      case "active": // For backward compatibility
        return "success"
      case "unavailable":
      case "inactive": // For backward compatibility
        return "destructive"
      case "leave":
      case "on_leave": // For backward compatibility
        return "warning"
      case "training":
        return "info"
      default:
        return "secondary"
    }
  }

  // Map old status values to new ones for translation
  const getTranslationKey = () => {
    // If it's a booking, return "Booking"
    if (isBookingStatus) {
      return "booking";
    }
    
    switch (status?.toLowerCase()) {
      case "active":
        return "available"
      case "inactive":
        return "unavailable"
      case "on_leave":
        return "leave"
      default:
        return status
    }
  }

  // Add inline styles for the "booking" variant which might not be defined in the Badge component
  const getCustomStyles = () => {
    if (getVariant() === "booking") {
      return "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200";
    }
    return "";
  }

  return (
    <Badge 
      variant={getVariant() as any}
      className={getCustomStyles()}
    >
      {isBookingStatus 
        ? t("common.booking") 
        : t(`drivers.status.${getTranslationKey()}`)}
    </Badge>
  );
}
