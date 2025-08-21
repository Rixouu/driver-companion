'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, Search, X, SortAsc, SortDesc, Calendar, Car, User } from 'lucide-react'

export interface InspectionFilterOptions {
  statusFilter: string
  vehicleFilter: string
  inspectorFilter: string
  searchQuery: string
  sortBy: 'date' | 'vehicle' | 'inspector' | 'type' | 'status'
  sortOrder: 'asc' | 'desc'
  dateRange: 'all' | 'today' | 'week' | 'month'
}

interface InspectionFilterProps {
  filters: InspectionFilterOptions
  onFiltersChange: (filters: InspectionFilterOptions) => void
  totalInspections: number
  totalScheduled: number
  totalCompleted: number
  totalFailed: number
  className?: string
}

export function InspectionFilter({
  filters,
  onFiltersChange,
  totalInspections,
  totalScheduled,
  totalCompleted,
  totalFailed,
  className = ""
}: InspectionFilterProps) {
  const clearFilters = () => {
    onFiltersChange({
      statusFilter: 'all',
      vehicleFilter: 'all',
      inspectorFilter: 'all',
      searchQuery: '',
      sortBy: 'date',
      sortOrder: 'desc',
      dateRange: 'all'
    })
  }

  const hasActiveFilters = filters.statusFilter !== 'all' || 
                          filters.vehicleFilter !== 'all' || 
                          filters.inspectorFilter !== 'all' || 
                          filters.searchQuery || 
                          filters.dateRange !== 'all'

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Inspection Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Vehicle Filter</label>
            <Select 
              value={filters.vehicleFilter} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                vehicleFilter: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                <SelectItem value="car">Cars</SelectItem>
                <SelectItem value="truck">Trucks</SelectItem>
                <SelectItem value="van">Vans</SelectItem>
                <SelectItem value="bus">Buses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Inspector</label>
            <Select 
              value={filters.inspectorFilter} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                inspectorFilter: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Inspectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Inspectors</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Select 
              value={filters.dateRange} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                dateRange: value as 'all' | 'today' | 'week' | 'month'
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search vehicles, plates, inspectors..."
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
          
          <div>
            <label className="text-sm font-medium mb-2 block">Sort by</label>
            <div className="flex gap-2">
              <Select 
                value={filters.sortBy} 
                onValueChange={(value) => onFiltersChange({
                  ...filters,
                  sortBy: value as 'date' | 'vehicle' | 'inspector' | 'type' | 'status'
                })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="inspector">Inspector</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
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
          </div>
        </div>
        
        {hasActiveFilters && (
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All Filters
            </Button>
          </div>
        )}
        
        {/* Results Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters ? (
              <span>Filtered results: {totalInspections} inspections</span>
            ) : (
              <span>Showing all {totalInspections} inspections</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
              {totalScheduled} Scheduled
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
              {totalCompleted} Completed
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">
              {totalFailed} Failed
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
