"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock, MapPin, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface UnassignedBooking {
  id: string;
  wp_id: string;
  date: string;
  time: string;
  customer_name: string;
  service_name: string;
  service_type?: string;
  pickup_location?: string;
  dropoff_location?: string;
  duration_hours?: number;
  price_formatted?: string;
  status: string;
}

interface UnassignedBookingsProps {
  startDate: string;
  endDate: string;
  onAssign: (bookingId: string, driverId: string) => void;
}

export function UnassignedBookings({
  startDate,
  endDate,
  onAssign,
}: UnassignedBookingsProps) {
  const [bookings, setBookings] = useState<UnassignedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnassignedBookings();
  }, [startDate, endDate]);

  async function fetchUnassignedBookings() {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .is("driver_id", null)
        .not("status", "in", '("cancelled","completed")')
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) throw error;

      setBookings(data || []);
    } catch (err) {
      console.error("Error fetching unassigned bookings:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-muted-foreground">
          <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No unassigned bookings found</p>
          <p className="text-sm mt-2">All bookings in this period have been assigned</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {bookings.length} Unassigned {bookings.length === 1 ? "Booking" : "Bookings"}
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bookings.map((booking) => (
          <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{booking.customer_name}</div>
                  <div className="text-sm text-muted-foreground">{booking.wp_id}</div>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {booking.status}
                </Badge>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(booking.date).toLocaleDateString()} at {booking.time}
                  </span>
                </div>

                <div className="font-medium text-primary">
                  {booking.service_name}
                </div>

                {booking.pickup_location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">From</div>
                      <div className="truncate">{booking.pickup_location}</div>
                    </div>
                  </div>
                )}

                {booking.dropoff_location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">To</div>
                      <div className="truncate">{booking.dropoff_location}</div>
                    </div>
                  </div>
                )}

                {booking.price_formatted && (
                  <div className="text-lg font-semibold text-primary">
                    {booking.price_formatted}
                  </div>
                )}
              </div>

              {/* Action */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  // Open assignment modal or navigate
                  window.location.href = `/bookings/${booking.id}`;
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Driver
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

