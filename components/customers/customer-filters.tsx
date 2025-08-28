'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, Search, X, SortAsc, SortDesc, Calendar, DollarSign, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { CustomerSegment } from '@/types/customers'

export interface CustomerFilterOptions {
  segmentFilter: string
  searchQuery: string
  sortBy: 'name' | 'email' | 'created_at' | 'total_spent' | 'last_activity'
  sortOrder: 'asc' | 'desc'
  dateFrom?: string
  dateTo?: string
  spendingMin?: number
  spendingMax?: number
  activityFrom?: string
  activityTo?: string
}

interface CustomerFiltersProps {
  filters: CustomerFilterOptions
  onFiltersChange: (filters: CustomerFilterOptions) => void
  totalCustomers: number
  segments: CustomerSegment[]
  className?: string
}

export function CustomerFilters({
  filters,
  onFiltersChange,
  totalCustomers,
  segments,
  className = ""
}: CustomerFiltersProps) {
  const { t } = useI18n()
  const [isCollapsed, setIsCollapsed] = useState(true)

  const clearFilters = () => {
    onFiltersChange({
      segmentFilter: 'all',
      searchQuery: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      dateFrom: undefined,
      dateTo: undefined,
      spendingMin: undefined,
      spendingMax: undefined,
      activityFrom: undefined,
      activityTo: undefined
    })
  }

  const hasActiveFilters = filters.segmentFilter !== 'all' || 
                          filters.searchQuery || 
                          filters.dateFrom || 
                          filters.dateTo || 
                          filters.spendingMin !== undefined || 
                          filters.spendingMax !== undefined ||
                          filters.activityFrom ||
                          filters.activityTo

  const getActiveFiltersSummary = () => {
    const activeFilters = []
    if (filters.segmentFilter !== 'all') {
      const segment = segments.find(s => s.id === filters.segmentFilter)
      if (segment) activeFilters.push(segment.name)
    }
    if (filters.searchQuery) activeFilters.push(`"${filters.searchQuery}"`)
    if (filters.dateFrom) activeFilters.push(`From ${filters.dateFrom}`)
    if (filters.dateTo) activeFilters.push(`To ${filters.dateTo}`)
    if (filters.spendingMin !== undefined) activeFilters.push(`Min $${filters.spendingMin}`)
    if (filters.spendingMax !== undefined) activeFilters.push(`Max $${filters.spendingMax}`)
    if (filters.activityFrom) activeFilters.push(`Activity from ${filters.activityFrom}`)
    if (filters.activityTo) activeFilters.push(`Activity to ${filters.activityTo}`)
    return activeFilters
  }

  return (
    <Card className={className}>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </div>
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          )}
        </CardTitle>

      </CardHeader>
      
      {/* Show active filters summary when collapsed */}
      {isCollapsed && hasActiveFilters && (
        <div className="px-6 pb-4">
          <div className="text-sm text-muted-foreground">
            Active filters: {getActiveFiltersSummary().join(', ')}
          </div>
        </div>
      )}
      
      {!isCollapsed && (
        <CardContent className="pt-6 space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Segment Filter */}
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
              Customer Segment
            </label>
            <Select 
              value={filters.segmentFilter} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                segmentFilter: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Segments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                {segments.map((segment) => (
                  <SelectItem key={segment.id} value={segment.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: segment.color || '#6b7280' }}
                      />
                      {segment.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Created Date Range Filters */}
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
              Created From
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
              Created To
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
          {/* Spending Range Filters */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Min Spending
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="number"
                placeholder="0"
                value={filters.spendingMin || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  spendingMin: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Max Spending
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="number"
                placeholder="∞"
                value={filters.spendingMax || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  spendingMax: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers by name or email..."
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

        {/* Last Activity Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Last Activity From
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="date"
                value={filters.activityFrom || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  activityFrom: e.target.value || undefined
                })}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Last Activity To
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="date"
                value={filters.activityTo || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  activityTo: e.target.value || undefined
                })}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        
        {/* Sorting and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm font-medium">Sort by:</label>
            <Select 
              value={filters.sortBy} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                sortBy: value as 'name' | 'email' | 'created_at' | 'total_spent' | 'last_activity'
              })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="total_spent">Total Spent</SelectItem>
                <SelectItem value="last_activity">Last Activity</SelectItem>
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
        
        {/* Results Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pt-2 border-t">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {hasActiveFilters ? (
              <span>Filtered results: {totalCustomers} customers</span>
            ) : (
              <span>Showing all {totalCustomers} customers</span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700 text-xs sm:text-sm">
              {totalCustomers} Customers
            </Badge>
          </div>
                  </div>
        </CardContent>
      )}
    </Card>
  )
}
