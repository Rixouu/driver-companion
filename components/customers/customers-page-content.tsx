'use client'

import { useState, useEffect } from 'react'
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
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
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
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

  // Filter states
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [selectedSegment, setSelectedSegment] = useState(filters.segment_id || 'all')
  const [sortBy, setSortBy] = useState(filters.sort_by || 'created_at')
  const [sortOrder, setSortOrder] = useState(filters.sort_order || 'desc')

  // Update URL with filters
  const updateFilters = (newFilters: Partial<CustomerListFilters>) => {
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

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    updateFilters({ search: value })
  }

  // Handle segment filter
  const handleSegmentChange = (value: string) => {
    setSelectedSegment(value)
    updateFilters({ segment_id: value === 'all' ? undefined : value })
  }

  // Handle sorting
  const handleSortChange = (field: string) => {
    const newSortOrder = field === sortBy && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortBy(field)
    setSortOrder(newSortOrder)
    updateFilters({ sort_by: field, sort_order: newSortOrder })
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
      setSelectedCustomers(new Set(customers.map(c => c.id)))
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
      toast.success(`Successfully deleted ${selectedCustomers.size} customer(s)`)
      
      // Refresh the page to update counts
      router.refresh()
    } catch (error) {
      console.error('Error deleting customers:', error)
      toast.error('Failed to delete some customers')
    } finally {
      setLoading(false)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    updateFilters({ page })
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
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold break-words">{formatCurrency(totalSpent, 'JPY')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Customer Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold break-words">{formatCurrency(avgSpent, 'JPY')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Segments</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Segment Filter */}
            <Select value={selectedSegment} onValueChange={handleSegmentChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Segments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                {segments.map((segment) => (
                  <SelectItem key={segment.id} value={segment.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full bg-gray-400" 
                        data-segment-color={segment.color}
                      />
                      {segment.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-')
              setSortBy(field)
              setSortOrder(order as 'asc' | 'desc')
              updateFilters({ sort_by: field, sort_order: order as 'asc' | 'desc' })
            }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="total_spent-desc">Highest Spender</SelectItem>
                <SelectItem value="total_spent-asc">Lowest Spender</SelectItem>
                <SelectItem value="last_activity_date-desc">Most Recent</SelectItem>
                <SelectItem value="last_activity_date-asc">Least Recent</SelectItem>
                <SelectItem value="created_at-desc">Newest</SelectItem>
                <SelectItem value="created_at-asc">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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

      {/* Customer List */}
      <div className="grid gap-4">
        {customers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  id={`customer-${customer.id}`}
                  checked={selectedCustomers.has(customer.id)}
                  onChange={() => handleSelectCustomer(customer.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1"
                  aria-label={`Select ${customer.name || 'customer'} for bulk operations`}
                />

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {customer.name || 'Unnamed Customer'}
                      </h3>
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
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/customers/${customer.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/customers/${customer.id}/edit`}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm">
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
