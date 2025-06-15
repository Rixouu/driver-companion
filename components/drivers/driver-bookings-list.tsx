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

interface DriverBookingsListProps {
  driverId: string
}

export function DriverBookingsList({ driverId }: DriverBookingsListProps) {
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
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CalendarIcon className="h-10 w-10 mx-auto mb-3" />
        <h3 className="text-lg font-medium">No Bookings Found</h3>
        <p className="text-sm">This driver has no assigned bookings.</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking History</CardTitle>
        <CardDescription>A list of all bookings assigned to this driver.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.supabase_id || booking.id}>
                  <TableCell className="font-medium">
                    {format(new Date(booking.date), "PPP")}
                    <span className="text-muted-foreground text-xs block">{booking.time}</span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{booking.service_name}</TableCell>
                  <TableCell className="hidden md:table-cell">{booking.customer_name}</TableCell>
                  <TableCell>
                    <Badge variant={booking.status === 'completed' ? 'success' : booking.status === 'cancelled' ? 'destructive' : 'secondary'}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/bookings/${booking.id}`}>
                        View
                        <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 