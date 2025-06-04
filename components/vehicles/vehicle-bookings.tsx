"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import { DbVehicle } from "@/types"
import { useQuery } from "@tanstack/react-query"
import { Calendar, MapPin, Clock, User, Eye } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface VehicleBookingsProps {
  vehicle: DbVehicle
}

interface Booking {
  id: string
  booking_id: string
  customer_name: string
  customer_email: string
  pickup_date: string
  pickup_time: string
  pickup_location: string
  dropoff_location: string
  status: string
  service_name: string
  created_at: string
}

async function fetchVehicleBookings(vehicleId: string): Promise<Booking[]> {
  const response = await fetch(`/api/vehicles/${vehicleId}/bookings`)
  if (!response.ok) {
    throw new Error('Failed to fetch vehicle bookings')
  }
  return response.json()
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function VehicleBookings({ vehicle }: VehicleBookingsProps) {
  const { t } = useI18n()

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['vehicleBookings', vehicle.id],
    queryFn: () => fetchVehicleBookings(vehicle.id),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('vehicles.tabs.vehicleBookings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('vehicles.tabs.vehicleBookings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('common.error')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t('vehicles.tabs.vehicleBookings')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!bookings || bookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('vehicles.tabs.noBookingsForVehicle')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{booking.booking_id}</span>
                    <Badge variant="outline" className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/bookings/${booking.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      {t('common.view')}
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.customer_name || t('bookings.unnamed')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {booking.pickup_date && format(new Date(booking.pickup_date), 'MMM d, yyyy')}
                        {booking.pickup_time && ` at ${booking.pickup_time}`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">
                        {booking.pickup_location}
                      </span>
                    </div>
                    {booking.dropoff_location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">
                          → {booking.dropoff_location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {booking.service_name && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-sm text-muted-foreground">
                      {booking.service_name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 