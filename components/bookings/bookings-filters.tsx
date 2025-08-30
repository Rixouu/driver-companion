'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, Search, X, SortAsc, SortDesc, Calendar, User, Car, ChevronDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { BookingStatus } from './status-filter'

export interface BookingFilterOptions {
  statusFilter: string
  searchQuery: string
  sortBy: 'date' | 'customer' | 'service' | 'booking_id'
  sortOrder: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
  customerFilter?: string
  driverFilter?: string
}

interface BookingFiltersProps {
  filters: BookingFilterOptions
  onFiltersChange: (filters: BookingFilterOptions) => void
  totalBookings: number
  className?: string
}

export function BookingFilters({
  filters,
  onFiltersChange,
  totalBookings,
  className = ""
}: BookingFiltersProps) {
  const { t } = useI18n()

  const clearFilters = () => {
    onFiltersChange({
      statusFilter: 'all',
      searchQuery: '',
      sortBy: 'date',
      sortOrder: 'desc',
      dateFrom: undefined,
      dateTo: undefined,
      customerFilter: '',
      driverFilter: 'all'
    })
  }

  const hasActiveFilters = filters.statusFilter !== 'all' || 
                          filters.searchQuery || 
                          filters.dateFrom || 
                          filters.dateTo || 
                          filters.customerFilter || 
                          filters.driverFilter !== 'all'

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {t('bookings.filters.title') || 'Advanced Filters'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Status Filter */}
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
              {t('bookings.filters.status') || 'Status'}
            </label>
            <Select 
              value={filters.statusFilter} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                statusFilter: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('bookings.filters.allStatuses') || 'All Statuses'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('bookings.filters.allStatuses') || 'All Statuses'}</SelectItem>
                <SelectItem value="confirmed">{t('bookings.status.confirmed') || 'Confirmed'}</SelectItem>
                <SelectItem value="assigned">{t('bookings.status.assigned') || 'Assigned'}</SelectItem>
                <SelectItem value="pending">{t('bookings.status.pending') || 'Pending'}</SelectItem>
                <SelectItem value="completed">{t('bookings.status.completed') || 'Completed'}</SelectItem>
                <SelectItem value="cancelled">{t('bookings.status.cancelled') || 'Cancelled'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Range Filters */}
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
              {t('bookings.filters.dateFrom') || 'From Date'}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  dateFrom: e.target.value || undefined
                })}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('bookings.filters.dateTo') || 'To Date'}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  dateTo: e.target.value || undefined
                })}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Customer Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('bookings.filters.customer') || 'Customer'}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('bookings.filters.customerPlaceholder') || 'Search customers...'}
                value={filters.customerFilter || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  customerFilter: e.target.value
                })}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Driver Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('bookings.filters.driver') || 'Driver Assignment'}
            </label>
            <Select 
              value={filters.driverFilter || 'all'} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                driverFilter: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('bookings.filters.allDrivers') || 'All Drivers'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('bookings.filters.allDrivers') || 'All Drivers'}</SelectItem>
                <SelectItem value="assigned">{t('bookings.filters.assigned') || 'Assigned'}</SelectItem>
                <SelectItem value="unassigned">{t('bookings.filters.unassigned') || 'Unassigned'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('bookings.filters.search') || 'Search'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('bookings.filters.searchPlaceholder') || 'Search services, vehicles...'}
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
        
        {/* Sorting and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm font-medium">{t('bookings.filters.sortBy') || 'Sort by:'}</label>
            <Select 
              value={filters.sortBy} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                sortBy: value as 'date' | 'customer' | 'service' | 'booking_id'
              })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">{t('bookings.filters.sortDate') || 'Date'}</SelectItem>
                <SelectItem value="customer">{t('bookings.filters.sortCustomer') || 'Customer'}</SelectItem>
                <SelectItem value="service">{t('bookings.filters.sortService') || 'Service'}</SelectItem>
                <SelectItem value="booking_id">{t('bookings.filters.sortBookingId') || 'Booking ID'}</SelectItem>
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
              {t('bookings.filters.clearFilters') || 'Clear Filters'}
            </Button>
          )}
        </div>
        
        {/* Results Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pt-2 border-t">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {hasActiveFilters ? (
              <span>{t('bookings.filters.filteredResults', { count: totalBookings }) || `Filtered results: ${totalBookings} bookings`}</span>
            ) : (
              <span>{t('bookings.filters.showingAll', { count: totalBookings }) || `Showing all ${totalBookings} bookings`}</span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700 text-xs sm:text-sm">
              {totalBookings} {t('bookings.filters.bookings') || 'Bookings'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
