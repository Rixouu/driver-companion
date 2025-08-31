"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Calendar, ClipboardCheck } from "lucide-react"

interface VehicleOverviewContentProps {
  vehicleId: string
}

// Upcoming Bookings Content Component - Fetches real data
export function UpcomingBookingsContent({ vehicleId }: VehicleOverviewContentProps) {
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    async function loadBookings() {
      if (!vehicleId) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vehicles/${vehicleId}/bookings`)
        if (!isMounted) return
        
        if (response.ok) {
          const data = await response.json()
          // Filter for upcoming bookings (future dates)
          const upcoming = (data.bookings || []).filter((booking: any) => {
            if (!booking.date) return false
            const bookingDate = new Date(booking.date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return bookingDate >= today
          })
          setBookings(upcoming)
        }
      } catch (error) {
        console.error('Failed to load bookings:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadBookings()
    
    return () => {
      isMounted = false
    }
  }, [vehicleId])

  const getStatusColor = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
    }
  }, [])

  // Memoize the displayed bookings for performance
  const displayedBookings = useMemo(() => bookings.slice(0, 5), [bookings])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Skeleton loading for better perceived performance */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card animate-pulse">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </div>
            <div className="h-6 bg-muted rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-muted/30 rounded-lg p-8 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-foreground font-medium text-lg">No Upcoming Bookings</p>
        <p className="text-sm text-muted-foreground mt-1">This vehicle has no upcoming bookings scheduled.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {displayedBookings.map((booking: any) => (
        <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
          <div className="flex-1">
            <p className="font-medium text-foreground">{booking.customer_name || 'Unknown Customer'}</p>
            <p className="text-sm text-muted-foreground">{booking.service_name || 'Service'}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(booking.date).toLocaleDateString()} at {booking.time || 'TBD'}
            </p>
          </div>
          <Badge variant="outline" className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
        </div>
      ))}
      {bookings.length > 5 && (
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            Showing 5 of {bookings.length} upcoming bookings
          </p>
        </div>
      )}
    </div>
  )
}

// Recent Inspections Content Component - Fetches real data
export function RecentInspectionsContent({ vehicleId }: VehicleOverviewContentProps) {
  const [inspections, setInspections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    async function loadInspections() {
      if (!vehicleId) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vehicles/${vehicleId}/inspections`)
        if (!isMounted) return
        
        if (response.ok) {
          const data = await response.json()
          // Sort by date (most recent first) and take last 5
          const recent = (data.inspections || [])
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
          setInspections(recent)
        }
      } catch (error) {
        console.error('Failed to load inspections:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInspections()
    
    return () => {
      isMounted = false
    }
  }, [vehicleId])

  const getStatusColor = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700'
    }
  }, [])

  // Memoize the inspections data for performance
  const hasInspections = useMemo(() => inspections.length > 0, [inspections])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Skeleton loading for better perceived performance */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card animate-pulse">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-28"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </div>
            <div className="h-6 bg-muted rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  if (inspections.length === 0) {
    return (
      <div className="bg-muted/30 rounded-lg p-8 text-center">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-foreground font-medium text-lg">No Recent Inspections</p>
        <p className="text-sm text-muted-foreground mt-1">This vehicle has no inspections recorded.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {inspections.map((inspection: any) => (
        <div key={inspection.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
          <div className="flex-1">
            <p className="font-medium text-foreground">{inspection.type || 'Inspection'}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(inspection.date).toLocaleDateString()}
            </p>
            {inspection.notes && (
              <p className="text-xs text-muted-foreground truncate">{inspection.notes}</p>
            )}
          </div>
          <Badge variant="outline" className={getStatusColor(inspection.status)}>
            {inspection.status}
          </Badge>
        </div>
      ))}
      {hasInspections && (
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">
            View all inspections →
          </p>
        </div>
      )}
    </div>
  )
}
