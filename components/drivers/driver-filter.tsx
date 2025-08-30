"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Search, Filter, ChevronDown } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface DriverFilterOptions {
  searchQuery: string
  statusFilter: string
  availabilityFilter: string
  licenseFilter: string
  sortBy: string
  sortOrder: string
}

interface DriverFilterProps {
  filters: DriverFilterOptions
  onFiltersChange: (filters: DriverFilterOptions) => void
  totalDrivers: number
  availabilityOptions: { value: string; label: string }[]
  className?: string
}

export function DriverFilter({
  filters,
  onFiltersChange,
  totalDrivers,
  availabilityOptions,
  className = ""
}: DriverFilterProps) {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof DriverFilterOptions, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      statusFilter: 'all',
      availabilityFilter: 'all',
      licenseFilter: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    })
  }

  const hasActiveFilters = filters.searchQuery || 
    filters.statusFilter !== 'all' || 
    filters.availabilityFilter !== 'all' || 
    filters.licenseFilter !== 'all'

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search drivers by name, email, license number..."
          value={filters.searchQuery}
          onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Expandable Filters */}
      <div className="border rounded-lg">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between p-4 rounded-none border-b-0"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Advanced Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).filter(v => v !== 'all' && v !== '').length} active
              </Badge>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
        
        {isExpanded && (
          <div className="p-4 border-t space-y-4">
                          {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.statusFilter} onValueChange={(value) => handleFilterChange('statusFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Availability Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Availability</label>
                <Select value={filters.availabilityFilter} onValueChange={(value) => handleFilterChange('availabilityFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Availability</SelectItem>
                    {availabilityOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* License Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">License Status</label>
                <Select value={filters.licenseFilter} onValueChange={(value) => handleFilterChange('licenseFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All License Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All License Statuses</SelectItem>
                    <SelectItem value="valid">Valid License</SelectItem>
                    <SelectItem value="expired">Expired License</SelectItem>
                    <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="license_number">License Number</SelectItem>
                    <SelectItem value="availability_status">Availability Status</SelectItem>
                    <SelectItem value="created_at">Date Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort Order</label>
                <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {filters.statusFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Status: {filters.statusFilter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleFilterChange('statusFilter', 'all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.availabilityFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Availability: {availabilityOptions.find(status => status.value === filters.availabilityFilter)?.label || filters.availabilityFilter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleFilterChange('availabilityFilter', 'all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.licenseFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    License: {filters.licenseFilter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleFilterChange('licenseFilter', 'all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={clearFilters} className="ml-auto">
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        )}
      </div>


    </div>
  )
}
