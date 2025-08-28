'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

interface CustomerDetailsContentProps {
  customer: CustomerDetails
}

export function CustomerDetailsContent({ customer }: CustomerDetailsContentProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [quotationSortBy, setQuotationSortBy] = useState('created_at-desc')
  const [quotationPage, setQuotationPage] = useState(0)

  // Sort and paginate quotations
  const sortedQuotations = useMemo(() => {
    if (!customer.recent_quotations) return []
    
    const sorted = [...customer.recent_quotations].sort((a, b) => {
      const [field, order] = quotationSortBy.split('-')
      const isDesc = order === 'desc'
      
      switch (field) {
        case 'created_at':
          return isDesc 
            ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'amount':
          return isDesc ? b.amount - a.amount : a.amount - b.amount
        case 'quote_number':
          return isDesc ? b.quote_number - a.quote_number : a.quote_number - b.quote_number
        default:
          return 0
      }
    })
    
    return sorted
  }, [customer.recent_quotations, quotationSortBy])

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span>{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Address:</span>
                    <span>{customer.address}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Customer Since:</span>
                  <span>{format(new Date(customer.created_at), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Activity:</span>
                  <span>{formatDistanceToNow(new Date(customer.last_activity_date), { addSuffix: true })}</span>
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

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
        </TabsList>

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
                  <div className="space-y-3">
                    {customer.recent_quotations.slice(0, 5).map((quotation) => (
                      <div key={quotation.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Quote #{quotation.quote_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {quotation.service_type} • {format(new Date(quotation.created_at), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(quotation.amount, quotation.currency)}</div>
                          <Badge 
                            variant="outline"
                            className={cn(
                              quotation.status === 'paid' && 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
                              quotation.status === 'approved' && 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
                              quotation.status === 'rejected' && 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
                              quotation.status === 'draft' && 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
                              quotation.status === 'sent' && 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                              quotation.status === 'expired' && 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                            )}
                          >
                            {quotation.status}
                          </Badge>
                        </div>
                      </div>
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
                  <div className="space-y-3">
                    {customer.recent_bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{booking.service_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(booking.date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <Badge variant={booking.status === 'completed' ? 'default' : booking.status === 'confirmed' ? 'secondary' : 'outline'}>
                          {booking.status}
                        </Badge>
                      </div>
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
              <div className="flex items-center justify-between">
                <CardTitle>All Quotations</CardTitle>
                <div className="flex items-center gap-2">
                  {/* Sort Options */}
                  <Select value={quotationSortBy} onValueChange={setQuotationSortBy}>
                    <SelectTrigger className="w-[180px]">
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
            </CardHeader>
            <CardContent>
              {customer.recent_quotations && customer.recent_quotations.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {paginatedQuotations.map((quotation) => (
                      <div key={quotation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <div className="font-medium">Quote #{quotation.quote_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {quotation.service_type} • {format(new Date(quotation.created_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-medium">{formatCurrency(quotation.amount, quotation.currency)}</div>
                          <Badge 
                            variant="outline"
                            className={cn(
                              quotation.status === 'paid' && 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
                              quotation.status === 'approved' && 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
                              quotation.status === 'rejected' && 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
                              quotation.status === 'draft' && 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
                              quotation.status === 'sent' && 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                              quotation.status === 'expired' && 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
                              quotation.status === 'converted' && 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                            )}
                          >
                            {quotation.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {customer.recent_quotations.length > 10 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {Math.min(quotationPage * 10, customer.recent_quotations.length)} of {customer.recent_quotations.length} quotations
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuotationPage(Math.max(0, quotationPage - 1))}
                          disabled={quotationPage === 0}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {quotationPage + 1} of {Math.ceil(customer.recent_quotations.length / 10)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuotationPage(quotationPage + 1)}
                          disabled={quotationPage >= Math.ceil(customer.recent_quotations.length / 10) - 1}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No quotations</h3>
                  <p className="text-muted-foreground">This customer hasn't received any quotations yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.recent_bookings && customer.recent_bookings.length > 0 ? (
                <div className="space-y-2">
                  {customer.recent_bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div>
                        <div className="font-medium">{booking.service_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(booking.date), 'MMM dd, yyyy')} • Created {format(new Date(booking.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                      <Badge variant={booking.status === 'completed' ? 'default' : booking.status === 'confirmed' ? 'secondary' : 'outline'}>
                        {booking.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No bookings</h3>
                  <p className="text-muted-foreground">This customer hasn't made any bookings yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Spending Analysis Tab */}
        <TabsContent value="spending" className="space-y-6">
          {/* Revenue Overview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Revenue Card */}
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Total Revenue</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(customer.spending.quotations.total_amount, 'JPY')}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    From {customer.spending.quotations.count} quotations
                  </div>
                </div>
                
                {/* Average Order Value Card */}
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Avg Order Value</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(customer.spending.quotations.total_amount / Math.max(customer.spending.quotations.count, 1), 'JPY')}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Per quotation
                  </div>
                </div>
                
                {/* Total Bookings Card */}
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Total Bookings</div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {customer.spending.bookings.count}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {customer.spending.bookings.completed_count} completed
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
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
                            status === 'expired' && "bg-orange-500",
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
                            {formatDistanceToNow(new Date(customer.spending.last_transaction_date), { addSuffix: true })}
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
  )
}
