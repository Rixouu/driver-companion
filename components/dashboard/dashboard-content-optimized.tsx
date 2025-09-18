"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import {
  Car,
  Wrench,
  ClipboardCheck,
  Calendar,
  FileText,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"
import type { DbVehicle, DbInspection, DbMaintenanceTask } from "@/types"
import { useState, useEffect } from "react"
import { getBookings } from "@/app/actions/bookings"
import { Booking } from "@/types/bookings"

// Lazy load heavy dashboard components
import { 
  LazyFinancialDashboard, 
  LazyActivityFeed, 
  LazyUpcomingBookings, 
  LazyRecentQuotations 
} from "./lazy-components"

interface DashboardContentProps {
  stats: {
    totalVehicles: number
    activeVehicles: number
    maintenanceTasks: number
    inspections: number
    vehiclesInMaintenance: number
    scheduledInspections: number
    inProgressInspections: number
    completedInspections: number
    pendingTasks: number
    inProgressTasks: number
    completedTasks: number
  }
  recentInspections: DbInspection[]
  upcomingInspections: DbInspection[]
  recentMaintenance: DbMaintenanceTask[]
  upcomingMaintenance: DbMaintenanceTask[]
  inProgressItems: {
    inspections: DbInspection[]
    maintenance: DbMaintenanceTask[]
  }
  vehicles: DbVehicle[]
}

export function DashboardContentOptimized({
  stats,
  recentInspections,
  upcomingInspections,
  recentMaintenance,
  upcomingMaintenance,
  inProgressItems,
  vehicles
}: DashboardContentProps) {
  const { t } = useI18n()
  
  // State for upcoming bookings
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [bookingsError, setBookingsError] = useState<string | null>(null)
  
  // State for expiring quotations
  const [expiringQuotations, setExpiringQuotations] = useState<any[]>([])
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(true)
  const [recentQuotations, setRecentQuotations] = useState<any[]>([])
  const [isLoadingRecentQuotations, setIsLoadingRecentQuotations] = useState(true)
  const [quotationsError, setQuotationsError] = useState<string | null>(null)
  
  // Financial data state
  const [financialData, setFinancialData] = useState({
    totalQuotations: 0,
    totalRevenue: 0,
    avgQuoteValue: 0,
    approvedQuotes: 0,
    pendingQuotes: 0,
    draftQuotes: 0,
    rejectedQuotes: 0,
    convertedQuotes: 0,
    approvalRate: 0,
    conversionRate: 0,
    activeBookings: 0
  })
  
  const [dailyRevenueData, setDailyRevenueData] = useState<any[]>([])
  const [statusDistributionData, setStatusDistributionData] = useState<any[]>([])
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([])
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(true)
  const [financialError, setFinancialError] = useState<string | null>(null)

  // Fetch bookings with pending and assigned statuses
  useEffect(() => {
    async function fetchUpcomingBookings() {
      try {
        setIsLoadingBookings(true)
        const { bookings } = await getBookings({
          limit: 10,
          page: 1
        }, false)
        
        // Filter for pending, assigned, and confirmed bookings
        const filteredBookings = bookings.filter(
          booking => booking.status === 'pending' || booking.status === 'assigned' || booking.status === 'confirmed'
        )
        
        // Sort by date (most recent first)
        filteredBookings.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time || '00:00'}`)
          const dateB = new Date(`${b.date} ${b.time || '00:00'}`)
          return dateA.getTime() - dateB.getTime() // Ascending order (upcoming first)
        })
        
        setUpcomingBookings(filteredBookings.slice(0, 3)) // Limit to 3 bookings
        setBookingsError(null)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        setBookingsError(t('dashboard.bookings.loadError'))
        setUpcomingBookings([])
      } finally {
        setIsLoadingBookings(false)
      }
    }
    
    fetchUpcomingBookings()
  }, [])
  
  // Fetch expiring quotations (expiring within 7 days)
  useEffect(() => {
    async function fetchExpiringQuotations() {
      try {
        setIsLoadingQuotations(true)
        // Get current date and 7 days from now
        const today = new Date()
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        // Fetch quotations that are sent but not yet approved/rejected and expiring soon
        const response = await fetch('/api/quotations?status=sent&limit=5')
        if (!response.ok) throw new Error('Failed to fetch quotations')
        
        const data = await response.json()
        
        // Filter for quotations expiring within 7 days
        const expiring = data.quotations?.filter((quotation: any) => {
          if (!quotation.expiry_date) return false
          const expiryDate = new Date(quotation.expiry_date)
          return expiryDate >= today && expiryDate <= weekFromNow
        }) || []
        
        // Sort by expiry date (soonest first)
        expiring.sort((a: any, b: any) => {
          const dateA = new Date(a.expiry_date)
          const dateB = new Date(b.expiry_date)
          return dateA.getTime() - dateB.getTime()
        })
        
        setExpiringQuotations(expiring.slice(0, 3))
      } catch (error) {
        console.error('Error fetching expiring quotations:', error)
        setExpiringQuotations([])
      } finally {
        setIsLoadingQuotations(false)
      }
    }
    
    fetchExpiringQuotations()
  }, [])

  // Fetch financial data
  useEffect(() => {
    async function fetchFinancialData() {
      try {
        setIsLoadingFinancial(true)
        setFinancialError(null)
        
        // Fetch financial metrics
        const response = await fetch('/api/dashboard/financial-metrics')
        if (response.ok) {
          const data = await response.json()
          setFinancialData(data.metrics)
          setDailyRevenueData(data.dailyRevenue)
          setStatusDistributionData(data.statusDistribution)
          setMonthlyRevenueData(data.monthlyRevenue)
        } else {
          throw new Error('Failed to fetch financial data')
        }
      } catch (error) {
        console.error('Error fetching financial data:', error)
        setFinancialError('Failed to load financial data')
        // No fallback data - let the UI handle empty states
        setFinancialData({
          totalQuotations: 0,
          totalRevenue: 0,
          avgQuoteValue: 0,
          approvedQuotes: 0,
          pendingQuotes: 0,
          draftQuotes: 0,
          rejectedQuotes: 0,
          convertedQuotes: 0,
          approvalRate: 0,
          conversionRate: 0,
          activeBookings: 0
        })
        setDailyRevenueData([])
        setStatusDistributionData([])
      } finally {
        setIsLoadingFinancial(false)
      }
    }
    
    fetchFinancialData()
  }, [])
  
  // FETCH_RECENT_QUOTATIONS
  useEffect(() => {
    async function fetchRecentQuotations() {
      try {
        setIsLoadingRecentQuotations(true)
        const response = await fetch('/api/quotations?limit=3')
        if (!response.ok) throw new Error('Failed to fetch quotations')
        const data = await response.json()
        setRecentQuotations(data.quotations || [])
        setQuotationsError(null)
      } catch (error) {
        console.error('Error fetching quotations:', error)
        setRecentQuotations([])
        setQuotationsError(t('common.error'))
      } finally {
        setIsLoadingRecentQuotations(false)
      }
    }
    fetchRecentQuotations()
  }, [])

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.description")}</p>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.quickActions.title")}</CardTitle>
          <CardDescription>{t("dashboard.quickActions.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/bookings/new" className="col-span-1">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 dark:hover:bg-purple-900/20 dark:hover:text-purple-400 dark:hover:border-purple-800 transition-colors"
              >
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-center text-sm font-medium">{t("dashboard.quickActions.createBooking")}</span>
              </Button>
            </Link>
            <Link href="/maintenance/schedule" className="col-span-1">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 dark:hover:border-amber-800 transition-colors"
              >
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <Wrench className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-center text-sm font-medium">{t("dashboard.quickActions.scheduleMaintenance")}</span>
              </Button>
            </Link>
            <Link href="/inspections/create" className="col-span-1">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:hover:bg-green-900/20 dark:hover:text-green-400 dark:hover:border-green-800 transition-colors"
              >
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <ClipboardCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-center text-sm font-medium">{t("dashboard.quickActions.scheduleInspection")}</span>
              </Button>
            </Link>
            <Link href="/quotations/create" className="col-span-1">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-colors"
              >
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-center text-sm font-medium">{t("dashboard.quickActions.createQuotation")}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* Expiring Quotations Alert */}
      {!isLoadingQuotations && expiringQuotations.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              {t("dashboard.expiringQuotations.title")}
            </CardTitle>
            <CardDescription>{t("dashboard.expiringQuotations.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringQuotations.map((quotation) => (
                <Link key={quotation.id} href={`/quotations/${quotation.id}`}>
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg border hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span className="font-medium">
                          {quotation.title || t("quotations.details.untitled", { defaultValue: "Untitled" })} - {quotation.customer_name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("dashboard.expiringQuotations.amount")}: {quotation.currency || 'JPY'} {quotation.total_amount?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded">
                        {(() => {
                          const daysLeft = Math.ceil((new Date(quotation.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          return daysLeft === 1 
                            ? t("dashboard.expiringQuotations.expiringTomorrow")
                            : t("dashboard.expiringQuotations.expiringInDays", { days: daysLeft })
                        })()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              <div className="pt-2">
                <Link href="/quotations?status=sent">
                  <Button variant="outline" size="sm" className="w-full">
                    {t("dashboard.expiringQuotations.viewAll")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main Dashboard Content - Two Column Layout */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Financial Dashboard - LEFT SIDE */}
        <LazyFinancialDashboard
          financialData={financialData}
          dailyRevenueData={dailyRevenueData}
          statusDistributionData={statusDistributionData}
          monthlyRevenueData={monthlyRevenueData}
          isLoadingFinancial={isLoadingFinancial}
          financialError={financialError}
        />

        {/* Activity Feed - RIGHT SIDE */}
        <LazyActivityFeed
          recentInspections={recentInspections}
          upcomingInspections={upcomingInspections}
          recentMaintenance={recentMaintenance}
          upcomingMaintenance={upcomingMaintenance}
          recentQuotations={recentQuotations}
          upcomingBookings={upcomingBookings}
        />
      </div>
      
      {/* Bottom Row - Two Column Layout */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Upcoming Bookings */}
        <LazyUpcomingBookings
          upcomingBookings={upcomingBookings}
          isLoadingBookings={isLoadingBookings}
          bookingsError={bookingsError}
        />
        
        {/* Recent Quotations */}
        <LazyRecentQuotations
          recentQuotations={recentQuotations}
          isLoadingRecentQuotations={isLoadingRecentQuotations}
          quotationsError={quotationsError}
        />
      </div>
    </div>
  );
}
