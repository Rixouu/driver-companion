'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, Search, X, SortAsc, SortDesc } from 'lucide-react'

export interface EventsFilterOptions {
  typeFilter: 'all' | 'quotation' | 'booking'
  statusFilter: string
  searchQuery: string
  sortBy: 'time' | 'amount' | 'customer' | 'type'
  sortOrder: 'asc' | 'desc'
  groupBy: 'none' | 'type' | 'status' | 'customer'
}

interface EventsFilterProps {
  filters: EventsFilterOptions
  onFiltersChange: (filters: EventsFilterOptions) => void
  totalEvents: number
  totalQuotations: number
  totalBookings: number
  showGrouping?: boolean
  showSorting?: boolean
  className?: string
}

export function EventsFilter({
  filters,
  onFiltersChange,
  totalEvents,
  totalQuotations,
  totalBookings,
  showGrouping = true,
  showSorting = true,
  className = ""
}: EventsFilterProps) {
  const clearFilters = () => {
    onFiltersChange({
      typeFilter: 'all',
      statusFilter: 'all',
      searchQuery: '',
      sortBy: 'time',
      sortOrder: 'asc',
      groupBy: 'none'
    })
  }

  const hasActiveFilters = filters.typeFilter !== 'all' || filters.statusFilter !== 'all' || filters.searchQuery

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Event Type</label>
            <Select 
              value={filters.typeFilter} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                typeFilter: value as 'all' | 'quotation' | 'booking'
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="quotation">Quotations</SelectItem>
                <SelectItem value="booking">Bookings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select 
              value={filters.statusFilter} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                statusFilter: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {showGrouping && (
            <div>
              <label className="text-sm font-medium mb-2 block">Group By</label>
              <Select 
                value={filters.groupBy} 
                onValueChange={(value) => onFiltersChange({
                  ...filters,
                  groupBy: value as 'none' | 'type' | 'status' | 'customer'
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No Grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="type">By Type</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
                  <SelectItem value="customer">By Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers, services..."
                value={filters.searchQuery}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  searchQuery: e.target.value
                })}
                className="pl-10 pr-10"
              />
              {filters.searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => onFiltersChange({
                    ...filters,
                    searchQuery: ''
                  })}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {showSorting && (
          <div className="flex items-center gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort by:</label>
              <Select 
                value={filters.sortBy} 
                onValueChange={(value) => onFiltersChange({
                  ...filters,
                  sortBy: value as 'time' | 'amount' | 'customer' | 'type'
                })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({
                  ...filters,
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
                })}
                className="p-2"
              >
                {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
            
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        )}
        
        {/* Results Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters ? (
              <span>Filtered results: {totalEvents} events</span>
            ) : (
              <span>Showing all {totalEvents} events</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
              {totalQuotations} Quotations
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
              {totalBookings} Bookings
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
