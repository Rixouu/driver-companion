"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import { formatDate } from "@/lib/utils/formatting"
import { Calendar, ArrowRight, AlertTriangle, RotateCw, User, Clock, MapPin } from "lucide-react"
import { Booking } from "@/types/bookings"

interface UpcomingBookingsProps {
  upcomingBookings: Booking[]
  isLoadingBookings: boolean
  bookingsError: string | null
}

function getBookingStatusBadge(status: string, t: (key: string, options?: any) => string) {
  switch (status) {
    case 'completed':
    case 'confirmed':
      return <Badge variant="outline" className="text-green-800 border-green-400 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">{t(`bookings.status.${status}`)}</Badge>;
    case 'assigned':
      return <Badge variant="outline" className="text-blue-800 border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">{t(`bookings.status.${status}`)}</Badge>;
    case 'pending':
      return <Badge variant="outline" className="text-yellow-800 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700">{t(`bookings.status.${status}`)}</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="text-red-800 border-red-400 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">{t(`bookings.status.${status}`)}</Badge>;
    default:
      return <Badge variant="outline" className="text-gray-800 border-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">{t(`bookings.status.${status}`)}</Badge>;
  }
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function BookingCard({ booking }: { booking: Booking }) {
  const { t } = useI18n()
  
  return (
    <Link 
      href={`/bookings/${booking.id}`}
      className="block"
    >
      <div className="p-3 sm:p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded w-fit">
                  BOOKING
                </span>
                <h4 className="font-semibold text-sm text-muted-foreground truncate">
                  {booking.customer_name || t("bookings.unnamed", { defaultValue: "Unnamed Customer" })}
                </h4>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{formatDate(booking.date)} • {booking.time || '00:00'}</span>
                </div>
                {booking.pickup_location && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">
                      {booking.pickup_location}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            {getBookingStatusBadge(booking.status, t)}
          </div>
        </div>
      </div>
    </Link>
  )
}

export function UpcomingBookings({
  upcomingBookings,
  isLoadingBookings,
  bookingsError
}: UpcomingBookingsProps) {
  const { t } = useI18n()

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {t("dashboard.upcomingBookings.title")}
        </CardTitle>
        <CardDescription>{t("dashboard.upcomingBookings.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingBookings ? (
          <div className="flex justify-center items-center py-6">
            <RotateCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">{t("common.loading")}</span>
          </div>
        ) : bookingsError ? (
          <div className="text-center py-6">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{bookingsError}</p>
          </div>
        ) : upcomingBookings.length === 0 ? (
          <EmptyState 
            icon={Calendar} 
            message={t("dashboard.upcomingBookings.empty.message")} 
          />
        ) : (
          <div className="space-y-4">
            {upcomingBookings.slice(0, 3).map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
            
            <div className="pt-2">
              <Link href="/bookings">
                <Button variant="outline" className="w-full">
                  {t("dashboard.upcomingBookings.viewAll")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
