"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ExternalLink, Calendar as CalendarIcon } from "lucide-react"

import { getDriverBookings } from "@/app/actions/bookings"
import { Booking } from "@/types/bookings"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, getStatusBadgeClasses } from "@/lib/utils/styles"
import { useI18n } from "@/lib/i18n/context"

interface DriverBookingsListProps {
  driverId: string
}

export function DriverBookingsList({ driverId }: DriverBookingsListProps) {
  const { t } = useI18n()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadBookings() {
      setIsLoading(true)
      const { bookings, error } = await getDriverBookings(driverId, {
        upcoming: undefined, // Fetch all bookings (past and future)
        limit: 100,
      })
      
      if (!error) {
        // Sort bookings by date, most recent first
        const sortedBookings = bookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setBookings(sortedBookings);
      }
      setIsLoading(false)
    }
    loadBookings()
  }, [driverId])

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="sm:hidden">
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="hidden sm:block">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-muted-foreground">
        <CalendarIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3" />
        <h3 className="text-base sm:text-lg font-medium">{t("drivers.bookingHistory.empty.title")}</h3>
        <p className="text-xs sm:text-sm">{t("drivers.bookingHistory.empty.description")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile-optimized card view */}
      <div className="sm:hidden space-y-3">
        {bookings.map((booking) => (
          <div key={booking.supabase_id || booking.id} className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1 truncate">
                  {booking.service_name || 'No service name'}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span>{format(new Date(booking.date), "MMM d, yyyy")}</span>
                  <span>•</span>
                  <span>{booking.time || 'TBD'}</span>
                </div>
                {booking.customer_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    Customer: {booking.customer_name}
                  </p>
                )}
              </div>
              <Badge variant="outline" className={cn(getStatusBadgeClasses(booking.status), "capitalize text-xs flex-shrink-0")}>
                {booking.status}
              </Badge>
            </div>
            
            {/* Bottom Action Buttons - 50/50 Layout */}
            <div className="flex gap-2 w-full">
              <Button asChild variant="ghost" size="sm" className="h-8 flex-1">
                <Link href={`/bookings/${booking.id}`}>
                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                  View Details
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block">
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">{t("drivers.bookingHistory.table.dateTime")}</TableHead>
                <TableHead className="text-xs sm:text-sm">{t("drivers.bookingHistory.table.service")}</TableHead>
                <TableHead className="hidden md:table-cell text-xs sm:text-sm">{t("drivers.bookingHistory.table.customer")}</TableHead>
                <TableHead className="text-xs sm:text-sm">{t("drivers.bookingHistory.table.status")}</TableHead>
                <TableHead className="text-right text-xs sm:text-sm">{t("drivers.bookingHistory.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.supabase_id || booking.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-xs sm:text-sm">
                    <div className="flex flex-col">
                      <span>{format(new Date(booking.date), "PPP")}</span>
                      <span className="text-muted-foreground text-xs">{booking.time}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs sm:text-sm">
                    {booking.service_name || 'No service name'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                    {booking.customer_name || 'No customer name'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(getStatusBadgeClasses(booking.status), "capitalize text-xs sm:text-sm")}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                      <Link href={`/bookings/${booking.wp_id || booking.id}`}>
                        {t("drivers.bookingHistory.viewButton")}
                        <ExternalLink className="ml-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
} 