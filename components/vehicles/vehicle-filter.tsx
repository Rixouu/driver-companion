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

export interface VehicleFilterOptions {
  searchQuery: string
  statusFilter: string
  brandFilter: string
  modelFilter: string
  categoryFilter: string
  sortBy: string
  sortOrder: string
}

interface VehicleFilterProps {
  filters: VehicleFilterOptions
  onFiltersChange: (filters: VehicleFilterOptions) => void
  totalVehicles: number
  brandOptions: { value: string; label: string }[]
  modelOptions: { value: string; label: string }[]
  categoryOptions: { value: string; label: string }[]
  className?: string
}

export function VehicleFilter({
  filters,
  onFiltersChange,
  totalVehicles,
  brandOptions,
  modelOptions,
  categoryOptions,
  className = ""
}: VehicleFilterProps) {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof VehicleFilterOptions, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      statusFilter: 'all',
      brandFilter: 'all',
      modelFilter: 'all',
      categoryFilter: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    })
  }

  const hasActiveFilters = filters.searchQuery || 
    filters.statusFilter !== 'all' || 
    filters.brandFilter !== 'all' || 
    filters.modelFilter !== 'all' || 
    filters.categoryFilter !== 'all'

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vehicles by name, plate number, brand, model..."
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
                    <SelectItem value="maintenance">In Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Brand Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <Select value={filters.brandFilter} onValueChange={(value) => handleFilterChange('brandFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brandOptions.map((brand) => (
                      <SelectItem key={brand.value} value={brand.value}>
                        {brand.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <Select value={filters.modelFilter} onValueChange={(value) => handleFilterChange('modelFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {modelOptions.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Pricing Category</label>
                <Select value={filters.categoryFilter} onValueChange={(value) => handleFilterChange('categoryFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
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
                    <SelectItem value="plate_number">Plate Number</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                    <SelectItem value="model">Model</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
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
              <div className="flex items-center gap-2 pt-2 border-t">
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
                {filters.brandFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Brand: {filters.brandFilter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleFilterChange('brandFilter', 'all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.modelFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Model: {filters.modelFilter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleFilterChange('modelFilter', 'all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.categoryFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Category: {filters.categoryFilter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleFilterChange('categoryFilter', 'all')}
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

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {totalVehicles} vehicles
        {hasActiveFilters && (
          <span className="ml-2 text-foreground">
            (filtered from total)
          </span>
        )}
      </div>
    </div>
  )
}
