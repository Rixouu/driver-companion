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
import { getQuotationUrl } from '@/lib/utils/quotation-url'
import type { User } from "@supabase/supabase-js"

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
  user: User | null
}

export function DashboardContentOptimized({
  stats,
  recentInspections,
  upcomingInspections,
  recentMaintenance,
  upcomingMaintenance,
  inProgressItems,
  vehicles,
  user
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

  // Fetch bookings - show recent and upcoming bookings
  useEffect(() => {
    async function fetchUpcomingBookings() {
      try {
        setIsLoadingBookings(true)
        const { bookings } = await getBookings({
          limit: 20,
          page: 1
        }, false)
        
        // Get today's date for filtering
        const today = new Date().toISOString().split('T')[0]
        
        // Filter for upcoming bookings (confirmed, assigned, pending) or recent completed bookings
        const filteredBookings = bookings.filter(booking => {
          // Show upcoming bookings with active statuses
          if (['pending', 'assigned', 'confirmed'].includes(booking.status)) {
            return true
          }
          // Show recent completed bookings (last 7 days) for reference
          if (booking.status === 'completed' && booking.date && booking.date >= today) {
            return true
          }
          return false
        })
        
        // Sort by date (upcoming first, then recent)
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
      {/* Clean Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {user?.user_metadata?.full_name 
            ? `Hi, ${user.user_metadata.full_name}` 
            : user?.email 
              ? `Hi, ${user.email.split('@')[0]}` 
              : t("dashboard.title")
          }
        </h1>
        <p className="text-muted-foreground">{t("dashboard.description")}</p>
      </div>

      {/* Quick Actions - Clean Grid with Colored Icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/bookings/new">
          <Card className="h-24 border hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-sm">{t("dashboard.quickActions.createBooking")}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/maintenance/schedule">
          <Card className="h-24 border hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/20">
                <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-sm">{t("dashboard.quickActions.scheduleMaintenance")}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inspections/create">
          <Card className="h-24 border hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/20">
                <ClipboardCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-sm">{t("dashboard.quickActions.scheduleInspection")}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/quotations/create">
          <Card className="h-24 border hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/20">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-sm">{t("dashboard.quickActions.createQuotation")}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
      
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
                <Link key={quotation.id} href={getQuotationUrl(quotation) as any}>
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
      
        {/* Key Metrics - Enhanced Cards with Colors */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <Card className="border border-emerald-200 dark:border-emerald-800 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t("dashboard.summaryCards.totalRevenue")}</p>
                  <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                    ¥{(financialData.totalRevenue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{t("dashboard.summaryCards.plus12_5")}</p>
                </div>
                <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/20">
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">¥</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Quotations */}
          <Card className="border border-blue-200 dark:border-blue-800 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t("dashboard.summaryCards.totalQuotations")}</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                    {financialData.totalQuotations}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{t("dashboard.summaryCards.plus8_2")}</p>
                </div>
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Quote */}
          <Card className="border border-purple-200 dark:border-purple-800 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">{t("dashboard.summaryCards.avgQuoteValue")}</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    ¥{(financialData.avgQuoteValue / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{t("dashboard.summaryCards.plus5_1")}</p>
                </div>
                <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/20">
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">¥</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="border border-orange-200 dark:border-orange-800 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">{t("dashboard.summaryCards.conversionRate")}</p>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                    {financialData.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{t("dashboard.summaryCards.plus2_3")}</p>
                </div>
                <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/20">
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Section */}
        <div className="space-y-8">
          {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Financial Dashboard - Takes 2 columns */}
          <div className="lg:col-span-2">
            <LazyFinancialDashboard
              financialData={financialData}
              dailyRevenueData={dailyRevenueData}
              statusDistributionData={statusDistributionData}
              monthlyRevenueData={monthlyRevenueData}
              isLoadingFinancial={isLoadingFinancial}
              financialError={financialError}
            />
          </div>

          {/* Activity Feed - Takes 1 column */}
          <div className="space-y-6">
            <LazyActivityFeed
              recentInspections={recentInspections}
              upcomingInspections={upcomingInspections}
              recentMaintenance={recentMaintenance}
              upcomingMaintenance={upcomingMaintenance}
              recentQuotations={recentQuotations}
              upcomingBookings={upcomingBookings}
            />
          </div>
        </div>

        {/* Bottom Row - Upcoming Bookings & Quotations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
{t("dashboard.upcomingBookingsAndQuotations.title")}
            </CardTitle>
            <CardDescription className="text-sm">{t("dashboard.upcomingBookingsAndQuotations.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Bookings Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/20">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold">{t("dashboard.upcomingBookingsAndQuotations.upcomingBookings.title")}</h3>
                </div>
                <div className="space-y-0">
                  {isLoadingBookings ? (
                    <div className="space-y-2">
                      <div className="h-16 bg-muted animate-pulse rounded"></div>
                      <div className="h-16 bg-muted animate-pulse rounded"></div>
                    </div>
                  ) : bookingsError ? (
                    <p className="text-sm text-muted-foreground">{bookingsError}</p>
                  ) : upcomingBookings.length > 0 ? (
                    upcomingBookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="py-4 border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/20">
                            <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                {t("dashboard.upcomingBookingsAndQuotations.upcomingBookings.booking")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {booking.date ? new Date(booking.date).toLocaleDateString() : 'No date'}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {booking.customer_name || 'Unnamed'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.pickup_location}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("dashboard.upcomingBookingsAndQuotations.upcomingBookings.noBookings")}</p>
                  )}
                </div>
              </div>

              {/* Recent Quotations Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-purple-100 dark:bg-purple-900/20">
                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold">{t("dashboard.upcomingBookingsAndQuotations.recentQuotations.title")}</h3>
                </div>
                <div className="space-y-0">
                  {isLoadingRecentQuotations ? (
                    <div className="space-y-2">
                      <div className="h-16 bg-muted animate-pulse rounded"></div>
                      <div className="h-16 bg-muted animate-pulse rounded"></div>
                    </div>
                  ) : quotationsError ? (
                    <p className="text-sm text-muted-foreground">{quotationsError}</p>
                  ) : recentQuotations.length > 0 ? (
                    recentQuotations.slice(0, 3).map((quotation) => (
                      <div key={quotation.id} className="py-4 border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/20">
                            <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                {t("dashboard.upcomingBookingsAndQuotations.recentQuotations.quotation")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {quotation.created_at ? new Date(quotation.created_at).toLocaleDateString() : 'No date'}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {quotation.customer_name || 'Unnamed'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ¥{quotation.total_amount?.toLocaleString() || '0'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("dashboard.upcomingBookingsAndQuotations.recentQuotations.noQuotations")}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
