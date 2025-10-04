"use client";

import { useState } from "react";
import { DayShiftData, ShiftBooking } from "@/types/shifts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, MapPin, User, DollarSign, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingCellProps {
  driverId: string;
  date: string;
  data?: DayShiftData;
  onBookingClick?: (booking: ShiftBooking) => void;
  onCellClick?: (driverId: string, date: string) => void;
}

// Color mapping for booking status
const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    confirmed: "bg-green-500",
    pending: "bg-yellow-500",
    in_progress: "bg-blue-500",
    completed: "bg-emerald-600",
    cancelled: "bg-gray-400",
    no_show: "bg-red-500",
  };
  return statusMap[status.toLowerCase()] || "bg-gray-300";
};

const getStatusBadgeClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    confirmed: "bg-green-100 text-green-800 hover:bg-green-200",
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    completed: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    cancelled: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    no_show: "bg-red-100 text-red-800 hover:bg-red-200",
  };
  return statusMap[status.toLowerCase()] || "bg-gray-100 text-gray-800";
};

export function BookingCell({
  driverId,
  date,
  data,
  onBookingClick,
  onCellClick,
}: BookingCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Empty cell
  if (!data || !data.bookings || data.bookings.length === 0) {
    return (
      <div 
        className="h-full p-2 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onCellClick?.(driverId, date)}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const { bookings, booking_count, total_hours, total_revenue } = data;

  // Single booking - show inline
  if (bookings.length === 1) {
    const booking = bookings[0];
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div 
            className={cn(
              "h-full p-2 cursor-pointer hover:shadow-md transition-all",
              "border-l-4",
              getStatusColor(booking.status)
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <div className="space-y-1">
              <div className="text-xs font-medium truncate">
                {booking.customer_name}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {booking.time} • {booking.service_name}
              </div>
              {booking.price_formatted && (
                <div className="text-[10px] font-medium text-primary">
                  {booking.price_formatted}
                </div>
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <BookingDetails 
            booking={booking} 
            onViewClick={() => {
              setIsOpen(false);
              onBookingClick?.(booking);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Multiple bookings - show summary
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className="h-full p-2 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1 flex-wrap">
              {bookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.booking_id}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    getStatusColor(booking.status)
                  )}
                />
              ))}
              {bookings.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{bookings.length - 3}
                </span>
              )}
            </div>
            <div className="text-xs font-medium">
              {booking_count} {booking_count === 1 ? "booking" : "bookings"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {total_hours}h • ¥{total_revenue.toLocaleString()}
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Bookings ({booking_count})</h4>
            <div className="text-sm text-muted-foreground">
              {total_hours}h • ¥{total_revenue.toLocaleString()}
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {bookings.map((booking) => (
              <BookingDetails 
                key={booking.booking_id}
                booking={booking}
                compact
                onViewClick={() => {
                  setIsOpen(false);
                  onBookingClick?.(booking);
                }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Booking details component
function BookingDetails({ 
  booking, 
  compact = false,
  onViewClick 
}: { 
  booking: ShiftBooking; 
  compact?: boolean;
  onViewClick?: () => void;
}) {
  return (
    <div className={cn("space-y-2", compact && "p-2 border rounded-lg hover:bg-muted/50")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {booking.customer_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {booking.wp_id}
          </div>
        </div>
        <Badge className={getStatusBadgeClass(booking.status)} variant="secondary">
          {booking.status}
        </Badge>
      </div>

      {/* Details */}
      {!compact && (
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
            <div>
              <div className="font-medium">{booking.time}</div>
              {booking.duration_hours && (
                <div className="text-muted-foreground">{booking.duration_hours} hours</div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
            <div className="font-medium">{booking.service_name}</div>
          </div>

          {(booking.pickup_location || booking.dropoff_location) && (
            <div className="flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <div className="space-y-0.5">
                {booking.pickup_location && (
                  <div className="text-muted-foreground truncate">
                    From: {booking.pickup_location}
                  </div>
                )}
                {booking.dropoff_location && (
                  <div className="text-muted-foreground truncate">
                    To: {booking.dropoff_location}
                  </div>
                )}
              </div>
            </div>
          )}

          {booking.price_formatted && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="font-medium text-primary">{booking.price_formatted}</div>
            </div>
          )}

          {booking.vehicle_make && booking.vehicle_model && (
            <div className="text-muted-foreground">
              Vehicle: {booking.vehicle_make} {booking.vehicle_model}
            </div>
          )}
        </div>
      )}

      {/* Action */}
      {!compact && onViewClick && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onViewClick}
        >
          View Details
        </Button>
      )}
    </div>
  );
}

