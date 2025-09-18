"use client"

import { lazy, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3, Bell, History, Calendar } from "lucide-react"

// Lazy load heavy dashboard components
const FinancialDashboard = lazy(() => 
  import("./financial-dashboard").then(mod => ({ default: mod.FinancialDashboard }))
)

const ActivityFeed = lazy(() => 
  import("./activity-feed").then(mod => ({ default: mod.ActivityFeed }))
)

const UpcomingBookings = lazy(() => 
  import("./upcoming-bookings").then(mod => ({ default: mod.UpcomingBookings }))
)

const RecentQuotations = lazy(() => 
  import("./recent-quotations").then(mod => ({ default: mod.RecentQuotations }))
)

// Loading skeletons
function FinancialDashboardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Financial Dashboard
        </CardTitle>
        <CardDescription>Loading financial data...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityFeedSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Activity Feed
        </CardTitle>
        <CardDescription>Loading recent activity...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UpcomingBookingsSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Bookings
        </CardTitle>
        <CardDescription>Loading bookings...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function RecentQuotationsSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Recent Quotations
        </CardTitle>
        <CardDescription>Loading quotations...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// Main lazy components with Suspense boundaries
export function LazyFinancialDashboard(props: any) {
  return (
    <Suspense fallback={<FinancialDashboardSkeleton />}>
      <FinancialDashboard {...props} />
    </Suspense>
  )
}

export function LazyActivityFeed(props: any) {
  return (
    <Suspense fallback={<ActivityFeedSkeleton />}>
      <ActivityFeed {...props} />
    </Suspense>
  )
}

export function LazyUpcomingBookings(props: any) {
  return (
    <Suspense fallback={<UpcomingBookingsSkeleton />}>
      <UpcomingBookings {...props} />
    </Suspense>
  )
}

export function LazyRecentQuotations(props: any) {
  return (
    <Suspense fallback={<RecentQuotationsSkeleton />}>
      <RecentQuotations {...props} />
    </Suspense>
  )
}
