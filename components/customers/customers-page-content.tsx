'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination } from '@/components/pagination'
import { 
  CustomerWithAnalytics, 
  CustomerSegment, 
  CustomerListFilters 
} from '@/types/customers'
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin,
  CalendarDays,
  TrendingUp,
  Eye,
  Edit,
  Download,
  Trash2,
  Check
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { formatCurrency } from '@/lib/utils/formatting'
import { cn } from '@/lib/utils'
import { CustomerFilters, CustomerFilterOptions } from './customer-filters'

interface CustomersPageContentProps {
  initialCustomers: CustomerWithAnalytics[]
  segments: CustomerSegment[]
  totalCount: number
  totalPages: number
  currentPage: number
  filters: CustomerListFilters
}

export function CustomersPageContent({
  initialCustomers,
  segments,
  totalCount,
  totalPages,
  currentPage,
  filters
}: CustomersPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<CustomerWithAnalytics[]>(initialCustomers)
  const [loading, setLoading] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Enhanced filter states
  const [filterOptions, setFilterOptions] = useState<CustomerFilterOptions>({
    segmentFilter: filters.segment_id || 'all',
    searchQuery: filters.search || '',
    sortBy: (filters.sort_by as any) || 'created_at',
    sortOrder: (filters.sort_order as 'asc' | 'desc') || 'desc',
    dateFrom: undefined,
    dateTo: undefined,
    spendingMin: undefined,
    spendingMax: undefined,
    activityFrom: undefined,
    activityTo: undefined
  })

  // Filtered customers based on current filter options
  const filteredCustomers = useMemo(() => {
    let filtered = [...customers]

    // Filter by segment
    if (filterOptions.segmentFilter !== 'all') {
      filtered = filtered.filter(customer => customer.segment_id === filterOptions.segmentFilter)
    }

    // Filter by search query
    if (filterOptions.searchQuery) {
      const query = filterOptions.searchQuery.toLowerCase()
      filtered = filtered.filter(customer => 
        customer.name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query)
      )
    }

    // Filter by created date range
    if (filterOptions.dateFrom) {
      const fromDate = new Date(filterOptions.dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(customer => 
        new Date(customer.created_at) >= fromDate
      )
    }
    if (filterOptions.dateTo) {
      const toDate = new Date(filterOptions.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(customer => 
        new Date(customer.created_at) <= toDate
      )
    }

    // Filter by spending range
    if (filterOptions.spendingMin !== undefined) {
      filtered = filtered.filter(customer => 
        customer.total_spent >= filterOptions.spendingMin!
      )
    }
    if (filterOptions.spendingMax !== undefined) {
      filtered = filtered.filter(customer => 
        customer.total_spent <= filterOptions.spendingMax!
      )
    }

    // Filter by last activity date range
    if (filterOptions.activityFrom) {
      const fromDate = new Date(filterOptions.activityFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(customer => {
        const lastActivity = customer.last_activity_date || customer.created_at
        return new Date(lastActivity) >= fromDate
      })
    }
    if (filterOptions.activityTo) {
      const toDate = new Date(filterOptions.activityTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(customer => {
        const lastActivity = customer.last_activity_date || customer.created_at
        return new Date(lastActivity) <= toDate
      })
    }

    // Sort customers
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (filterOptions.sortBy) {
        case 'name':
          aValue = a.name || ''
          bValue = b.name || ''
          break
        case 'email':
          aValue = a.email || ''
          bValue = b.email || ''
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'total_spent':
          aValue = a.total_spent
          bValue = b.total_spent
          break
        case 'last_activity':
          aValue = new Date(a.last_activity_date || a.created_at)
          bValue = new Date(b.last_activity_date || b.created_at)
          break
        default:
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
      }

      if (filterOptions.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [customers, filterOptions])

  // Update URL with enhanced filters
  const updateFilters = (newFilters: Partial<CustomerFilterOptions>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update parameters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value.toString())
      } else {
        params.delete(key)
      }
    })

    // Reset to page 1 when filters change (except for page changes)
    if (!('page' in newFilters)) {
      params.set('page', '1')
    }

    router.push(`/customers?${params.toString()}`)
  }

  // Handle filter changes
  const handleFiltersChange = (newFilters: CustomerFilterOptions) => {
    setFilterOptions(newFilters)
    
    // Update URL with new filters
    const urlParams = new URLSearchParams()
    if (newFilters.segmentFilter !== 'all') urlParams.set('segment_id', newFilters.segmentFilter)
    if (newFilters.searchQuery) urlParams.set('search', newFilters.searchQuery)
    if (newFilters.dateFrom) urlParams.set('dateFrom', newFilters.dateFrom)
    if (newFilters.dateTo) urlParams.set('dateTo', newFilters.dateTo)
    if (newFilters.spendingMin !== undefined) urlParams.set('spendingMin', newFilters.spendingMin.toString())
    if (newFilters.spendingMax !== undefined) urlParams.set('spendingMax', newFilters.spendingMax.toString())
    if (newFilters.activityFrom) urlParams.set('activityFrom', newFilters.activityFrom)
    if (newFilters.activityTo) urlParams.set('activityTo', newFilters.activityTo)
    if (newFilters.sortBy !== 'created_at') urlParams.set('sort_by', newFilters.sortBy)
    if (newFilters.sortOrder !== 'desc') urlParams.set('sort_order', newFilters.sortOrder)
    
    urlParams.set('page', '1')
    router.push(`/customers?${urlParams.toString()}`)
  }

  // Handle sorting
  const handleSortChange = (field: string) => {
    const newSortOrder = field === filterOptions.sortBy && filterOptions.sortOrder === 'asc' ? 'desc' : 'asc'
    handleFiltersChange({
      ...filterOptions,
      sortBy: field as any,
      sortOrder: newSortOrder
    })
  }

  // Handle multi-select
  const handleSelectCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers)
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId)
    } else {
      newSelected.add(customerId)
    }
    setSelectedCustomers(newSelected)
    setSelectAll(newSelected.size === customers.length)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCustomers(new Set())
      setSelectAll(false)
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)))
      setSelectAll(true)
    }
  }

  // Export customers to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'City', 'Total Spent', 'Quotations', 'Bookings', 'Last Activity']
    const csvContent = [
      headers.join(','),
      ...customers.map(customer => [
        customer.name || 'N/A',
        customer.email,
        customer.phone || 'N/A',
        customer.billing_company_name || 'N/A',
        customer.billing_city || 'N/A',
        customer.total_spent,
        customer.quotation_count,
        customer.booking_count,
        new Date(customer.last_activity_date).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Delete selected customers
  const deleteSelectedCustomers = async () => {
    if (selectedCustomers.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedCustomers.size} customer(s)?`)) return
    
    setLoading(true)
    try {
      const deletePromises = Array.from(selectedCustomers).map(id => 
        fetch(`/api/customers/${id}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      // Remove deleted customers from state
      setCustomers(prev => prev.filter(c => !selectedCustomers.has(c.id)))
      setSelectedCustomers(new Set())
      setSelectAll(false)
      
      // Show success message
      console.log(`Successfully deleted ${selectedCustomers.size} customer(s)`)
      
      // Refresh the page to update counts
      router.refresh()
    } catch (error) {
      console.error('Error deleting customers:', error)
      console.log('Failed to delete some customers')
    } finally {
      setLoading(false)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/customers?${params.toString()}`)
  }

  // Get segment color
  const getSegmentColor = (segmentName: string | null | undefined) => {
    const segment = segments.find(s => s.name === segmentName)
    return segment?.color || '#6b7280'
  }

  // Calculate stats
  const totalSpent = customers.reduce((sum, customer) => sum + customer.total_spent, 0)
  const avgSpent = totalCount > 0 ? totalSpent / totalCount : 0

  return (
    <div className="space-y-6">
      {/* Stats Overview - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Customers - Blue */}
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Total Customers</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCount.toLocaleString()}</div>
          </CardContent>
        </Card>

        {/* Total Revenue - Green */}
        <Card className="relative overflow-hidden border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">Total Revenue</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-xl font-bold break-words text-green-600 dark:text-green-400">{formatCurrency(totalSpent, 'JPY')}</div>
          </CardContent>
        </Card>

        {/* Avg Customer Value - Orange */}
        <Card className="relative overflow-hidden border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Avg Customer Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold break-words text-orange-600 dark:text-orange-400">{formatCurrency(avgSpent, 'JPY')}</div>
          </CardContent>
        </Card>

        {/* Active Segments - Purple */}
        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Segments</CardTitle>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{segments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <CustomerFilters
        filters={filterOptions}
        onFiltersChange={handleFiltersChange}
        totalCustomers={filteredCustomers.length}
        segments={segments}
      />

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="select-all-customers"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label="Select all customers for bulk operations"
                />
                <label htmlFor="select-all-customers" className="text-sm text-muted-foreground">
                  Select All
                </label>
              </div>

              {/* Multi-select Actions */}
              {selectedCustomers.size > 0 && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteSelectedCustomers}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete ({selectedCustomers.size})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomers(new Set())
                      setSelectAll(false)
                    }}
                  >
                    Clear Selection
                  </Button>
                </>
              )}
            </div>

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer List - Mobile Optimized */}
      <div className="grid gap-3 sm:gap-4">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md hover:bg-muted/30 transition-all duration-200 group cursor-pointer">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                {/* Checkbox and Header Row - Mobile Optimized */}
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:flex-1 min-w-0">
                  {/* Checkbox - Prevent click propagation */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      id={`customer-${customer.id}`}
                      checked={selectedCustomers.has(customer.id)}
                      onChange={() => handleSelectCustomer(customer.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      aria-label={`Select ${customer.name || 'customer'} for bulk operations`}
                    />
                  </div>

                  {/* Main Content - Make clickable */}
                  <Link 
                    href={`/customers/${customer.id}`} 
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="p-2 sm:p-4 -m-2 sm:-m-4 rounded-lg transition-colors">
                      {/* Header Row - Mobile Stacked */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg truncate group-hover:text-primary transition-colors">
                            {customer.name || 'Unnamed Customer'}
                          </h3>
                          {customer.segment_name && (
                            <Badge 
                              variant="outline"
                              className={cn(
                                "text-xs sm:text-sm",
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
                      </div>

                      {/* Contact Info - Mobile Stacked */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{customer.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats Row - Mobile Stacked */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium">{formatCurrency(customer.total_spent, 'JPY')}</span>
                            <span className="text-muted-foreground">spent</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium">{customer.quotation_count}</span>
                            <span className="text-muted-foreground">quotes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="font-medium">{customer.booking_count}</span>
                            <span className="text-muted-foreground">bookings</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(customer.last_activity_date), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex items-center gap-2 flex-shrink-0 justify-end sm:justify-start" onClick={(e) => e.stopPropagation()}>
                  <Button asChild size="sm" variant="outline" className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                    <Link href={`/customers/${customer.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">View</span>
                      <span className="sm:hidden">👁</span>
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                    <Link href={`/customers/${customer.id}/edit`}>
                      <Edit className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                      <span className="sm:hidden">✏️</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {customers.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No customers found</h3>
                <p className="text-muted-foreground mb-4">
                  {filters.search || filters.segment_id 
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by adding your first customer"
                  }
                </p>
                <Button asChild>
                  <Link href="/customers/new">
                    Add Customer
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
