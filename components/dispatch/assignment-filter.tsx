"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Search, Filter, ChevronDown, Calendar, User, Car } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface AssignmentFilterOptions {
  searchQuery: string
  statusFilter: string
  dateFilter: string
  serviceFilter: string
  assignmentFilter: string
  sortBy: string
  sortOrder: string
}

interface AssignmentFilterProps {
  filters: AssignmentFilterOptions
  onFiltersChange: (filters: AssignmentFilterOptions) => void
  totalBookings: number
  serviceOptions: { value: string; label: string }[]
  className?: string
}

export function AssignmentFilter({
  filters,
  onFiltersChange,
  totalBookings,
  serviceOptions: propServiceOptions,
  className = ""
}: AssignmentFilterProps) {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)
  const [serviceOptions, setServiceOptions] = useState<{ value: string; label: string }[]>([])
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([])

  // Fetch service and status options from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const supabase = createClient()
        
        // Fetch service types from service_types table
        const { data: services } = await supabase
          .from('service_types')
          .select('id, name')
          .eq('is_active', true)
        
        if (services) {
          const serviceOptions = services.map((service: any) => ({
            value: service.id,
            label: service.name
          }))
          setServiceOptions(serviceOptions)
        }

        // Fetch status options
        const { data: statuses } = await supabase
          .from('bookings')
          .select('status')
        
        if (statuses) {
          const uniqueStatuses = [...new Set(statuses.map((s: any) => s.status))].map((status: string) => ({
            value: status,
            label: status.charAt(0).toUpperCase() + status.slice(1)
          }))
          setStatusOptions(uniqueStatuses)
        }
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }

    fetchOptions()
  }, [])

  const handleFilterChange = (key: keyof AssignmentFilterOptions, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      statusFilter: 'all',
      dateFilter: 'all',
      serviceFilter: 'all',
      assignmentFilter: 'all',
      sortBy: 'date',
      sortOrder: 'desc'
    })
  }

  const hasActiveFilters = filters.searchQuery || 
    filters.statusFilter !== 'all' || 
    filters.dateFilter !== 'all' || 
    filters.serviceFilter !== 'all' || 
    filters.assignmentFilter !== 'all'

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bookings by customer, booking ID, service type..."
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
                <label className="text-sm font-medium">Booking Status</label>
                <Select value={filters.statusFilter} onValueChange={(value) => handleFilterChange('statusFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={filters.dateFilter} onValueChange={(value) => handleFilterChange('dateFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="thisWeek">This Week</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="nextWeek">Next Week</SelectItem>
                    <SelectItem value="nextMonth">Next Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Service Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Type</label>
                <Select value={filters.serviceFilter} onValueChange={(value) => handleFilterChange('serviceFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {serviceOptions.map((service) => (
                      <SelectItem key={service.value} value={service.value}>
                        {service.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignment Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Assignment Status</label>
                <Select value={filters.assignmentFilter} onValueChange={(value) => handleFilterChange('assignmentFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Assignments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignments</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    <SelectItem value="driver_only">Driver Only</SelectItem>
                    <SelectItem value="vehicle_only">Vehicle Only</SelectItem>
                    <SelectItem value="fully_assigned">Fully Assigned</SelectItem>
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
                    <SelectItem value="date">Pickup Date</SelectItem>
                    <SelectItem value="time">Pickup Time</SelectItem>
                    <SelectItem value="customer">Customer Name</SelectItem>
                    <SelectItem value="service">Service Type</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
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
                {filters.dateFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Date: {filters.dateFilter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleFilterChange('dateFilter', 'all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.serviceFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Service: {filters.serviceFilter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleFilterChange('serviceFilter', 'all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.assignmentFilter !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Assignment: {filters.assignmentFilter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => handleFilterChange('assignmentFilter', 'all')}
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
