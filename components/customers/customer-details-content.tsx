'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CustomerDetails } from '@/types/customers'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  FileText,
  BookOpen,
  Activity,
  CreditCard
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatting'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ActivityCard } from './activity-card'

interface CustomerDetailsContentProps {
  customer: CustomerDetails
}

export function CustomerDetailsContent({ customer }: CustomerDetailsContentProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [quotationSort, setQuotationSort] = useState('created_at-desc')
  const [quotationPage, setQuotationPage] = useState(0)

  // Sort and paginate quotations
  const sortedQuotations = useMemo(() => {
    if (!customer.recent_quotations) return []
    
    const sorted = [...customer.recent_quotations].sort((a, b) => {
      const [field, order] = quotationSort.split('-')
      const isDesc = order === 'desc'
      
      switch (field) {
        case 'created_at':
          const aTime = a.created_at && !isNaN(new Date(a.created_at).getTime()) ? new Date(a.created_at).getTime() : 0
          const bTime = b.created_at && !isNaN(new Date(b.created_at).getTime()) ? new Date(b.created_at).getTime() : 0
          return isDesc ? bTime - aTime : aTime - bTime
        case 'amount':
          return isDesc ? b.amount - a.amount : a.amount - b.amount
        case 'quote_number':
          return isDesc ? b.quote_number - a.quote_number : a.quote_number - b.quote_number
        default:
          return 0
      }
    })
    
    return sorted
  }, [customer.recent_quotations, quotationSort])

  const paginatedQuotations = useMemo(() => {
    const start = quotationPage * 10
    return sortedQuotations.slice(start, start + 10)
  }, [sortedQuotations, quotationPage])

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
              {customer.segment_name && (
                <Badge 
                  variant="outline"
                  className={cn(
                    customer.segment_name === 'VIP' && 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                    customer.segment_name === 'Corporate' && 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
                    customer.segment_name === 'Regular' && 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
                    customer.segment_name === 'Occasional' && 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                  )}
                >
                  {customer.segment_name}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mobile Optimized Information Grid */}
            <div className="grid grid-cols-1 gap-4">
              {/* Contact Information */}
              <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border/40">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground min-w-[80px]">Email:</span>
                    <span className="break-all">{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground min-w-[80px]">Phone:</span>
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground min-w-[80px]">Address:</span>
                      <span className="break-words">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Customer Details */}
              <div className="space-y-3 p-3 bg-muted/20 rounded-lg border border-border/40">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Customer Details
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground min-w-[100px]">Customer Since:</span>
                    <span>
                      {customer.created_at && !isNaN(new Date(customer.created_at).getTime()) 
                        ? format(new Date(customer.created_at), 'MMM dd, yyyy')
                        : 'Unknown'
                      }
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground min-w-[100px]">Last Activity:</span>
                    <span>
                      {customer.last_activity_date && !isNaN(new Date(customer.last_activity_date).getTime()) 
                        ? formatDistanceToNow(new Date(customer.last_activity_date), { addSuffix: true })
                        : 'No recent activity'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {customer.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                  <p className="text-sm">{customer.notes}</p>
                </div>
              </>
            )}

            {/* Billing Address */}
            {(customer.billing_company_name || customer.billing_street_name || customer.billing_city) && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Billing Address</h4>
                  <div className="space-y-1">
                    {customer.billing_company_name && (
                      <p className="text-sm font-medium">{customer.billing_company_name}</p>
                    )}
                    {customer.billing_street_number && customer.billing_street_name && (
                      <p className="text-sm">
                        {customer.billing_street_number} {customer.billing_street_name}
                      </p>
                    )}
                    {(customer.billing_city || customer.billing_state || customer.billing_postal_code) && (
                      <p className="text-sm">
                        {[customer.billing_city, customer.billing_state, customer.billing_postal_code]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {customer.billing_country && (
                      <p className="text-sm">{customer.billing_country}</p>
                    )}
                    {customer.billing_tax_number && (
                      <p className="text-sm text-muted-foreground">
                        Tax ID: {customer.billing_tax_number}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800 overflow-hidden">
                <div className="text-lg font-bold text-green-600 dark:text-green-400 break-words leading-tight min-w-0 px-2">
                  {formatCurrency(customer.total_spent, 'JPY')}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 font-medium mt-1">Total Lifetime Value</div>
              </div>
              
              {/* Average Order Value - Full Width */}
              {customer.spending.average_order_value > 0 && (
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-xl font-bold text-orange-600 dark:text-orange-400 break-words leading-tight">
                    {formatCurrency(customer.spending.average_order_value, 'JPY')}
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-1">Average Order Value</div>
                </div>
              )}
              
              {/* Quotations and Bookings - 2 Columns */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{customer.quotation_count}</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Quotations</div>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{customer.booking_count}</div>
                  <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">Bookings</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs - Mobile and tablet optimized */}
      <div className="border border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg p-1 sm:p-2 mb-4 sm:mb-6 shadow-sm">
        {/* Mobile Dropdown Navigation */}
        <div className="block sm:hidden mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Overview
                </div>
              </SelectItem>
              <SelectItem value="quotations">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Quotations
                </div>
              </SelectItem>
              <SelectItem value="bookings">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Bookings
                </div>
              </SelectItem>
              <SelectItem value="spending">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Spending
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden sm:block">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-row w-full h-auto items-center justify-start rounded-lg border border-border/60 bg-muted/30 backdrop-blur p-1 gap-1">
              <TabsTrigger 
                value="overview" 
                className="relative flex-none h-12 px-4 rounded-lg border border-border/40 bg-background/80 text-foreground font-medium shadow-sm transition-all duration-200 hover:bg-muted/50 hover:border-border/60 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">Overview</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="quotations" 
                className="relative flex-none h-12 px-4 rounded-lg border border-border/40 bg-background/80 text-foreground font-medium shadow-sm transition-all duration-200 hover:bg-muted/50 hover:border-border/60 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Quotations</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="bookings" 
                className="relative flex-none h-12 px-4 rounded-lg border border-border/40 bg-background/80 text-foreground font-medium shadow-sm transition-all duration-200 hover:bg-muted/50 hover:border-border/60 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-sm font-medium">Bookings</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="spending" 
                className="relative flex-none h-12 px-4 rounded-lg border border-border/40 bg-background/80 text-foreground font-medium shadow-sm transition-all duration-200 hover:bg-muted/50 hover:border-border/60 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-medium">Spending</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Quotations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Quotations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.recent_quotations && customer.recent_quotations.length > 0 ? (
                    <div className="space-y-4">
                      {customer.recent_quotations.slice(0, 5).map((quotation) => (
                        <ActivityCard
                          key={quotation.id}
                          id={quotation.id}
                          type="quotation"
                          number={quotation.quote_number?.toString() || ''}
                          serviceName={quotation.service_type || ''}
                          date={quotation.created_at || ''}
                          amount={(quotation as any).total_amount || quotation.amount}
                          currency={quotation.currency}
                          status={quotation.status}
                        />
                      ))}
                      {customer.recent_quotations.length > 5 && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/quotations?customer_id=${customer.id}`}>
                            View All Quotations
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No quotations yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Recent Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.recent_bookings && customer.recent_bookings.length > 0 ? (
                    <div className="space-y-4">
                      {customer.recent_bookings.slice(0, 5).map((booking) => (
                        <ActivityCard
                          key={booking.id}
                          id={booking.id}
                          type="booking"
                          number={(booking as any).wp_id || booking.id.slice(-6)}
                          serviceName={booking.service_name || ''}
                          date={booking.date || booking.created_at || ''}
                          amount={(booking as any).price_amount}
                          currency={(booking as any).price_currency || 'JPY'}
                          status={booking.status}
                        />
                      ))}
                      {customer.recent_bookings.length > 5 && (
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/bookings?customer_id=${customer.id}`}>
                            View All Bookings
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No bookings yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quotations Tab */}
          <TabsContent value="quotations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Customer Quotations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="sort-quotations" className="text-sm font-medium">Sort By</Label>
                      <Select value={quotationSort} onValueChange={setQuotationSort}>
                        <SelectTrigger id="sort-quotations">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at-desc">Newest First</SelectItem>
                          <SelectItem value="created_at-asc">Oldest First</SelectItem>
                          <SelectItem value="amount-desc">Highest Amount</SelectItem>
                          <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                          <SelectItem value="quote_number-desc">Quote # Desc</SelectItem>
                          <SelectItem value="quote_number-asc">Quote # Asc</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Quotations List */}
                  {customer.recent_quotations && customer.recent_quotations.length > 0 ? (
                    <div className="space-y-3">
                      {customer.recent_quotations
                        .sort((a, b) => {
                          switch (quotationSort) {
                            case 'created_at-desc':
                              const bTime = b.created_at && !isNaN(new Date(b.created_at).getTime()) ? new Date(b.created_at).getTime() : 0
                              const aTime = a.created_at && !isNaN(new Date(a.created_at).getTime()) ? new Date(a.created_at).getTime() : 0
                              return bTime - aTime;
                            case 'created_at-asc':
                              const aTimeAsc = a.created_at && !isNaN(new Date(a.created_at).getTime()) ? new Date(a.created_at).getTime() : 0
                              const bTimeAsc = b.created_at && !isNaN(new Date(b.created_at).getTime()) ? new Date(b.created_at).getTime() : 0
                              return aTimeAsc - bTimeAsc;
                            case 'amount-desc':
                              return b.amount - a.amount;
                            case 'amount-asc':
                              return a.amount - b.amount;
                            case 'quote_number-desc':
                              return String(b.quote_number).localeCompare(String(a.quote_number));
                            case 'quote_number-asc':
                              return String(a.quote_number).localeCompare(String(b.quote_number));
                            default:
                              return 0;
                          }
                        })
                        .map((quotation) => (
                          <ActivityCard
                            key={quotation.id}
                            id={quotation.id}
                            type="quotation"
                            number={quotation.quote_number?.toString() || ''}
                            serviceName={quotation.service_type || ''}
                            date={quotation.created_at || ''}
                            amount={(quotation as any).total_amount || quotation.amount}
                            currency={quotation.currency}
                            status={quotation.status}
                            className="hover:bg-muted/50 transition-colors"
                          />
                        ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No quotations found for this customer</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Customer Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customer.recent_bookings && customer.recent_bookings.length > 0 ? (
                    <div className="space-y-3">
                      {customer.recent_bookings.map((booking) => (
                        <ActivityCard
                          key={booking.id}
                          id={booking.id}
                          type="booking"
                          number={(booking as any).wp_id || booking.id.slice(-6)}
                          serviceName={booking.service_name || ''}
                          date={booking.date || booking.created_at || ''}
                          amount={(booking as any).price_amount}
                          currency={(booking as any).price_currency || 'JPY'}
                          status={booking.status}
                          className="hover:bg-muted/50 transition-colors"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No bookings found for this customer</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spending Tab */}
          <TabsContent value="spending" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quotation Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Quotation Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(customer.spending.quotations.by_status)
                      .filter(([_, amount]) => amount > 0)
                      .sort(([_, a], [__, b]) => b - a)
                      .map(([status, amount]) => (
                        <div key={status} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              status === 'paid' && "bg-green-500",
                              status === 'approved' && "bg-blue-500",
                              status === 'rejected' && "bg-red-500",
                              status === 'draft' && "bg-gray-500",
                              status === 'sent' && "bg-yellow-500",
                              status === 'expired' && "bg-red-500",
                              status === 'converted' && "bg-purple-500"
                            )} />
                            <span className="capitalize font-medium">{status}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {formatCurrency(amount, 'JPY')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {((amount / customer.spending.quotations.total_amount) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Booking Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Booking Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Booking Counts */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {customer.spending.bookings.completed_count}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Completed</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                          {customer.spending.bookings.pending_count}
                        </div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Pending</div>
                      </div>
                    </div>

                    {/* Last Transaction */}
                    {customer.spending.last_transaction_date && (
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">Last Transaction</div>
                            <div className="text-xs text-muted-foreground">
                              {customer.spending.last_transaction_date && !isNaN(new Date(customer.spending.last_transaction_date).getTime()) 
                                ? formatDistanceToNow(new Date(customer.spending.last_transaction_date), { addSuffix: true })
                                : 'No recent transaction'
                              }
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">Total Bookings</div>
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {customer.spending.bookings.count}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
