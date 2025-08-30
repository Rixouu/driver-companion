'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, Search, X, SortAsc, SortDesc, Calendar, DollarSign, Users, Clock, ChevronDown } from 'lucide-react'
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
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers by name, email, company..."
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Expandable Filters */}
      <div className="border rounded-lg">
        <Button
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-between p-4 rounded-none border-b-0"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Advanced Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).filter(v => v !== 'all' && v !== '' && v !== undefined).length} active
              </Badge>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
        </Button>
        
        {!isCollapsed && (
          <div className="p-4 border-t space-y-4">
            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Segment Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Segment</label>
                <Select value={filters.segmentFilter} onValueChange={(value) => onFiltersChange({ ...filters, segmentFilter: value })}>
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

              {/* Created Date From */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Created From</label>
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

              {/* Created Date To */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Created To</label>
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

              {/* Min Spending */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Spending</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.spendingMin || ''}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      spendingMin: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Max Spending */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Spending</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="number"
                    placeholder="1000000"
                    value={filters.spendingMax || ''}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      spendingMax: e.target.value ? Number(e.target.value) : undefined
                    })}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Last Activity From */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Activity From</label>
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

              {/* Last Activity To */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Activity To</label>
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Sort by:</label>
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
          </div>
        )}
      </div>
    </div>
  )
}
