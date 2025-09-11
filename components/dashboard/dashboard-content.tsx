"use client"

import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"
import { formatDate } from "@/lib/utils/formatting"
import {
  Car,
  Wrench,
  ClipboardCheck,
  Gauge,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Calendar,
  History,
  Play,
  ArrowRight,
  BarChart3,
  Bell,
  CheckSquare,
  Fuel,
  RotateCw,
  Sparkles,
  ThumbsUp,

  MapPin,
  User,
  Timer,
  FileText
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { DbVehicle, DbInspection, DbMaintenanceTask } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { fadeIn, withDelay } from "@/lib/utils/animations"
import { getBookings } from "@/app/actions/bookings"
import { Booking } from "@/types/bookings"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'


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

function getQuotationStatusBadge(status: string, t: (key: string, options?: any) => string) {
  switch (status) {
    case 'draft':
      return (
        <Badge variant="outline" className="text-gray-500 border-gray-400 bg-gray-50 dark:bg-gray-900/20">
          {t('quotations.status.draft')}
        </Badge>
      );
    case 'sent':
      return (
        <Badge variant="outline" className="text-blue-500 border-blue-400 bg-blue-50 dark:bg-blue-900/20">
          {t('quotations.status.sent')}
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="text-green-500 border-green-400 bg-green-50 dark:bg-green-900/20">
          {t('quotations.status.approved')}
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className="text-red-500 border-red-400 bg-red-50 dark:bg-red-900/20">
          {t('quotations.status.rejected')}
        </Badge>
      );
    case 'converted':
      return (
        <Badge variant="outline" className="text-purple-500 border-purple-400 bg-purple-50 dark:bg-purple-900/20">
          {t('quotations.status.converted')}
        </Badge>
      );
    case 'paid':
      return (
        <Badge variant="outline" className="text-green-600 border-green-400 bg-green-50 dark:bg-green-900/20">
          {t('quotations.status.paid')}
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-400 bg-orange-50 dark:bg-orange-900/20">
          {t('quotations.status.expired')}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-gray-500 border-gray-400">
          {status}
        </Badge>
      );
  }
}

function getBookingStatusBadge(status: string, t: (key: string, options?: any) => string) {
    switch (status) {
      case 'completed':
      case 'confirmed':
        return <Badge variant="outline" className="text-green-500 border-green-400 bg-green-50 dark:bg-green-900/20">{t(`bookings.status.${status}`)}</Badge>;
      case 'assigned':
        return <Badge variant="outline" className="text-blue-600 border-blue-400 bg-blue-50 dark:bg-blue-900/20">{t(`bookings.status.${status}`)}</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">{t(`bookings.status.${status}`)}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-500 border-red-400 bg-red-50 dark:bg-red-900/20">{t(`bookings.status.${status}`)}</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500 border-gray-400">{t(`bookings.status.${status}`)}</Badge>;
    }
}

function getMaintenanceStatusBadge(status: string, t: (key: string, options?: any) => string) {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-500 border-green-400 bg-green-50 dark:bg-green-900/20">{t(`maintenance.status.${status}`)}</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">{t(`maintenance.status.${status}`)}</Badge>;
      case 'scheduled':
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-900/20">{t(`maintenance.status.${status}`)}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-500 border-red-400 bg-red-50 dark:bg-red-900/20">{t(`maintenance.status.${status}`)}</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500 border-gray-400">{t(`maintenance.status.${status}`)}</Badge>;
    }
}

function getInspectionStatusBadge(status: string, t: (key: string, options?: any) => string) {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-500 border-green-400 bg-green-50 dark:bg-green-900/20">{t(`inspections.status.${status}`)}</Badge>;
      case 'inProgress':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">{t(`inspections.status.inProgress`)}</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-500 border-red-400 bg-red-50 dark:bg-red-900/20">{t(`inspections.status.${status}`)}</Badge>;
      case 'scheduled':
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-900/20">{t(`inspections.status.${status}`)}</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500 border-gray-400">{t(`inspections.status.${status}`)}</Badge>;
    }
}

export function DashboardContent({
  stats,
  recentInspections,
  upcomingInspections,
  recentMaintenance,
  upcomingMaintenance,
  inProgressItems,
  vehicles
}: DashboardContentProps) {
  const { t } = useI18n()
  const [checklistCompleted, setChecklistCompleted] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  
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

  // Function to handle checkbox changes
  const handleCheckboxChange = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Function to handle checklist completion
  const handleCompleteChecklist = () => {
    setChecklistCompleted(true)
    // In a real app, you would save this to the database
  }



  // Check if all items are checked
  const allItemsChecked = Object.values(checkedItems).filter(Boolean).length >= 5

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
                      <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700">
                        {(() => {
                          const daysLeft = Math.ceil((new Date(quotation.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                          return daysLeft === 1 
                            ? t("dashboard.expiringQuotations.expiringTomorrow")
                            : t("dashboard.expiringQuotations.expiringInDays", { days: daysLeft })
                        })()}
                      </Badge>
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
        {/* Advanced Financial Dashboard - LEFT SIDE */}
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t("dashboard.financial.title")}
            </CardTitle>
            <CardDescription>{t("dashboard.financial.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFinancial ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
                  <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
                </div>
                <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
                <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
              </div>
            ) : financialError ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{financialError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Top Row: Key Financial Metrics */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                      ¥{(financialData.totalRevenue / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {t("dashboard.financial.revenueOverview")}
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {financialData.totalQuotations}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {t("dashboard.financial.quoteOverview")}
                    </div>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                      {financialData.activeBookings}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      {t("dashboard.financial.activeBookings")}
                    </div>
                  </div>
                </div>
                
                {/* Charts Row: Revenue + Quote Status Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  {/* Revenue Trend Chart */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">{t("dashboard.financial.revenueTrend")}</h4>
                    <div className="h-40">
                      {dailyRevenueData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dailyRevenueData}>
                            <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.1} />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 9 }}
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis 
                              tick={{ fontSize: 9 }}
                              tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-xl text-xs">
                                      <p className="font-medium text-foreground">{new Date(label).toLocaleDateString()}</p>
                                      <p className="text-green-600 font-semibold">¥{payload[0].value?.toLocaleString()}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              dot={{ fill: '#10b981', strokeWidth: 1, r: 2.5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          {t("dashboard.financial.noData")}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Quote Status Chart */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">{t("dashboard.financial.quoteStatus")}</h4>
                    <div className="h-40">
                      {statusDistributionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statusDistributionData}>
                            <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.1} />
                            <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                            <YAxis tick={{ fontSize: 8 }} />
                            <Tooltip 
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-xl text-xs">
                                      <p className="font-medium text-foreground">{label}</p>
                                      <p className="text-blue-600 font-semibold">{payload[0].value} quotes</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                          {t("dashboard.financial.noData")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Bottom Row: Clean Metrics Display */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {/* Average Quote */}
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">
                      {t("dashboard.financial.avgQuote")}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                      ¥{(financialData.avgQuoteValue / 1000).toFixed(0)}k
                    </div>
                  </div>
                  
                  {/* Approval Rate */}
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-2">
                      {t("dashboard.financial.approvalRate")}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                      {financialData.approvalRate}%
                    </div>
                  </div>
                  
                  {/* Conversion Rate */}
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-2">
                      {t("dashboard.financial.conversionRate")}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">
                      {financialData.conversionRate}%
                    </div>
                  </div>
                </div>
                
                {/* Status Summary Grid */}
                <div className="space-y-4">
                  {/* Divider with text */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/40"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background px-3 text-muted-foreground">Quotation Status Overview</span>
                    </div>
                  </div>
                  
                  {/* 2x2 Grid Layout */}
                  <div className="grid grid-cols-2 gap-3 p-3 sm:p-4 lg:p-5 bg-muted/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs sm:text-sm text-muted-foreground">{t("dashboard.financial.approved")}:</span>
                      <span className="text-xs sm:text-sm font-semibold text-green-600">{financialData.approvedQuotes}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs sm:text-sm text-muted-foreground">{t("dashboard.financial.pending")}:</span>
                      <span className="text-xs sm:text-sm font-semibold text-yellow-600">{financialData.pendingQuotes}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs sm:text-sm text-muted-foreground">{t("dashboard.financial.rejected")}:</span>
                      <span className="text-xs sm:text-sm font-semibold text-red-600">{financialData.rejectedQuotes}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs sm:text-sm text-muted-foreground">converted:</span>
                      <span className="text-xs sm:text-sm font-semibold text-purple-600">{financialData.convertedQuotes || 0}</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="pt-2">
                  <Link href="/sales/calendar" className="w-full">
                    <Button variant="outline" className="w-full bg-background border-border hover:bg-muted/50">
                      <span className="text-foreground">{t("dashboard.financial.viewSalesCalendar")}</span>
                      <ArrowRight className="ml-2 h-4 w-4 text-foreground" />
                    </Button>
                  </Link>
                </div>
              </div>
              )}
          </CardContent>
        </Card>

        {/* Activity Feed - RIGHT SIDE */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {t("dashboard.activityFeed.title")}
            </CardTitle>
            <CardDescription>{t("dashboard.activityFeed.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="recent" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recent">
                  <History className="mr-2 h-4 w-4" />
                  {t("common.status.recent")}
                </TabsTrigger>
                <TabsTrigger value="upcoming">
                  <Calendar className="mr-2 h-4 w-4" />
                  {t("common.status.upcoming")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-4">
                {recentMaintenance.length === 0 && recentInspections.length === 0 && recentQuotations.length === 0 ? (
                  <EmptyState icon={History} message={t("dashboard.activityFeed.noRecent")} />
                ) : (
                  <div className="space-y-4">
                    {/* Show mix of recent activities - prioritize quotations, then inspections, then maintenance */}
                    {recentQuotations.slice(0, 2).map((quotation: any) => (
                      <QuotationCard key={quotation.id} quotation={quotation} />
                    ))}
                    {recentInspections.slice(0, 2).map((inspection) => (
                      <InspectionCard key={inspection.id} inspection={inspection} />
                    ))}
                    {recentMaintenance.slice(0, 1).map((task) => (
                      <MaintenanceTaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
                {(recentMaintenance.length > 0 || recentInspections.length > 0 || recentQuotations.length > 0) && (
                  <div className="mt-4">
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full">
                        {t("dashboard.activityFeed.viewAll")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingMaintenance.length === 0 && upcomingInspections.length === 0 && upcomingBookings.length === 0 ? (
                  <EmptyState icon={Calendar} message={t("dashboard.activityFeed.noUpcoming")} />
                ) : (
                  <div className="space-y-4">
                    {/* Show mix of upcoming activities - prioritize bookings, then inspections, then maintenance */}
                    {upcomingBookings.slice(0, 2).map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                    {upcomingInspections.slice(0, 2).map((inspection) => (
                      <InspectionCard key={inspection.id} inspection={inspection} />
                    ))}
                    {upcomingMaintenance.slice(0, 1).map((task) => (
                      <MaintenanceTaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
                {(upcomingMaintenance.length > 0 || upcomingInspections.length > 0 || upcomingBookings.length > 0) && (
                  <div className="mt-4">
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full">
                        {t("dashboard.activityFeed.viewAll")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Upcoming Bookings */}
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
        {/* Recent Quotations */}
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t('quotations.title')}
            </CardTitle>
            <CardDescription>{t('quotations.listDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRecentQuotations ? (
              <div className="flex justify-center items-center py-6">
                <RotateCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : quotationsError ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                {quotationsError}
              </div>
            ) : recentQuotations.length === 0 ? (
              <EmptyState icon={FileText} message={t('quotations.placeholder')} />
            ) : (
              <div className="space-y-4">
                {recentQuotations.slice(0, 4).map((quotation: any) => (
                  <QuotationCard key={quotation.id} quotation={quotation} />
                ))}
                <div className="pt-2">
                  <Link href="/quotations">
                    <Button variant="outline" className="w-full">
                      {t('quotations.viewAll')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      

    </div>
  );
}

// Helper Components
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

function MaintenanceTaskCard({ task }: { task: DbMaintenanceTask }) {
  const { t } = useI18n()
  return (
    <Link href={`/maintenance/${task.id}`} className="block">
      <div className="p-3 sm:p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
              <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded w-fit">
                  MAINTENANCE
                </span>
                <h4 className="font-semibold text-sm text-foreground truncate">
                  {task.title}
                </h4>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground truncate">
                  {task.vehicle?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {task.status === 'completed' ? t('common.status.completed') : t('maintenance.details.scheduledFor', { date: formatDate(task.due_date) })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            {getMaintenanceStatusBadge(task.status, t)}
          </div>
        </div>
      </div>
    </Link>
  );
}

function InspectionCard({ inspection }: { inspection: DbInspection }) {
  const { t } = useI18n()
  
  // Get full inspection type name
  const getFullTypeName = (type: string) => {
    switch(type?.toLowerCase()) {
      case 'routine':
        return t('inspections.type.routine')
      case 'safety':
        return t('inspections.type.safety')
      case 'maintenance':
        return t('inspections.type.maintenance')
      case 'daily':
        return t('inspections.type.daily')
      default:
        return String(t('inspections.defaultType')) || 'Routine'
    }
  }
  
  return (
    <Link href={`/inspections/${inspection.id}`} className="block">
      <div className="p-3 sm:p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex-shrink-0">
              <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded w-fit">
                  INSPECTION
                </span>
                <h4 className="font-semibold text-sm text-foreground truncate">
                  {getFullTypeName(inspection.type)}
                </h4>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground truncate">
                  {inspection.vehicle?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {inspection.status === 'completed' ? t('common.status.completed') : t('inspections.details.scheduledFor', { date: formatDate(inspection.date) })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            {getInspectionStatusBadge(inspection.status, t)}
          </div>
        </div>
      </div>
    </Link>
  );
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
                <h4 className="font-semibold text-sm text-foreground truncate">
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

function QuotationCard({ quotation }: { quotation: any }) {
  const { t } = useI18n()
  return (
    <Link href={`/quotations/${quotation.id}`} className="block">
      <div className="p-3 sm:p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Top row: Status badge and quotation type */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded w-fit">
                QUOTATION
              </span>
              <div className="flex-shrink-0">
                {getQuotationStatusBadge(quotation.status, t)}
              </div>
            </div>
            
            {/* Quotation title */}
            <h4 className="font-semibold text-sm text-foreground truncate mb-1">
              {quotation.title || t('quotations.details.untitled', { defaultValue: 'Untitled' })}
            </h4>
            
            {/* Customer name */}
            <p className="text-xs text-muted-foreground mb-2 truncate">
              {quotation.customer_name || t('bookings.unnamed')}
            </p>
            
            {/* Amount */}
            {quotation.total_amount && (
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {quotation.currency || 'JPY'} {Number(quotation.total_amount).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
} 