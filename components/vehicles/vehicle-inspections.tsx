"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { ClipboardCheck, Filter, CalendarRange, X, Search, Clock, User, Truck, Eye, Calendar } from "lucide-react"
import { DateRange } from "react-day-picker"
import Link from "next/link"

interface VehicleInspectionsProps {
  vehicle: DbVehicle
}

export function VehicleInspections({ vehicle }: VehicleInspectionsProps) {
  const { t } = useI18n()
  const [inspections, setInspections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inspectorInfo, setInspectorInfo] = useState<Record<string, any>>({})
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch inspector information for multiple inspectors at once with caching
  const fetchInspectorInfoBatch = useCallback(async (inspectorIds: string[]) => {
    const uniqueIds = [...new Set(inspectorIds.filter(id => id))]
    if (uniqueIds.length === 0) return {}
    
    try {
      const response = await fetch('/api/drivers/inspector-info-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspector_ids: uniqueIds }),
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.drivers || {}
      }
    } catch (error) {
      console.warn('Failed to fetch inspector info batch:', error)
    }
    return {}
  }, [])

  useEffect(() => {
    let isMounted = true
    
    async function loadInspections() {
      if (!vehicle.id) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vehicles/${vehicle.id}/inspections`)
        if (!isMounted) return
        
        if (response.ok) {
          const data = await response.json()
          const inspectionsData = data.inspections || []
          
          // Only fetch inspector info if we have inspections
          if (inspectionsData.length > 0) {
            const inspectorIds = inspectionsData
              .map((inspection: any) => inspection.inspector_id)
              .filter((id: any) => id)
            
            if (inspectorIds.length > 0) {
              const driversData = await fetchInspectorInfoBatch(inspectorIds)
              if (!isMounted) return
              
              // Map inspector names to inspection IDs
              const inspectorMap: Record<string, any> = {}
              inspectionsData.forEach((inspection: any) => {
                if (inspection.inspector_id && driversData[inspection.inspector_id]) {
                  const driver = driversData[inspection.inspector_id]
                  inspectorMap[inspection.id] = `${driver.first_name} ${driver.last_name}`.trim()
                }
              })
              setInspectorInfo(inspectorMap)
            }
          }
          
          setInspections(inspectionsData)
        }
      } catch (error) {
        console.error('Failed to load inspections:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInspections()
    
    return () => {
      isMounted = false
    }
  }, [vehicle.id, fetchInspectorInfoBatch])

  // Filter inspections based on selections - optimized for performance
  const filteredInspections = useMemo(() => {
    if (!inspections.length) return []
    
    // Early return if no filters are active
    if (typeFilter === 'all' && statusFilter === 'all' && !dateRange?.from && !searchTerm) {
      return inspections
    }
    
    return inspections.filter(inspection => {
      // Type filter
      if (typeFilter !== 'all' && inspection.type !== typeFilter) {
        return false
      }
      
      // Status filter
      if (statusFilter !== 'all' && inspection.status !== statusFilter) {
        return false
      }
      
      // Date range filter
      if (dateRange?.from) {
        const inspectionDate = new Date(inspection.date)
        const from = new Date(dateRange.from)
        const to = dateRange.to ? new Date(dateRange.to) : from
        
        if (inspectionDate < from || inspectionDate > to) {
          return false
        }
      }
      
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const typeLower = inspection.type?.toLowerCase() || ''
        if (!typeLower.includes(searchLower)) {
          return false
        }
      }
      
      return true
    })
  }, [inspections, typeFilter, statusFilter, dateRange, searchTerm])

  // Get unique inspection types and statuses for filters - optimized
  const uniqueTypes = useMemo(() => {
    if (!inspections.length) return []
    const types = new Set<string>()
    for (const inspection of inspections) {
      if (inspection.type) types.add(inspection.type)
    }
    return Array.from(types).sort()
  }, [inspections])

  const uniqueStatuses = useMemo(() => {
    if (!inspections.length) return []
    const statuses = new Set<string>()
    for (const inspection of inspections) {
      if (inspection.status) statuses.add(inspection.status)
    }
    return Array.from(statuses).sort()
  }, [inspections])

  const hasActiveFilters = useMemo(() => 
    typeFilter !== 'all' || statusFilter !== 'all' || dateRange?.from || searchTerm
  , [typeFilter, statusFilter, dateRange, searchTerm])

  const getStatusColor = useCallback((status: string) => {
    const statusLower = status?.toLowerCase()
    switch (statusLower) {
      case 'completed':
      case 'complete':
        return 'bg-green-600 text-white border-green-700'
      case 'in_progress':
      case 'in progress':
      case 'progress':
        return 'bg-blue-600 text-white border-blue-700'
      case 'pending':
        return 'bg-yellow-600 text-white border-yellow-700'
      case 'failed':
      case 'fail':
        return 'bg-red-600 text-white border-red-700'
      default:
        return 'bg-gray-600 text-white border-gray-700'
    }
  }, [])

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
          <CardTitle className="text-base sm:text-lg">Inspections</CardTitle>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          {/* Skeleton loading for better perceived performance */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full p-5 rounded-lg border border-border/50 bg-card animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 bg-muted rounded-full w-32"></div>
                    <div className="h-6 bg-muted rounded-full w-20"></div>
                  </div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-48"></div>
                  <div className="h-4 bg-muted rounded w-40"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (inspections.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
          <div className="space-y-4">
            <div>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                Inspections
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Vehicle inspection history and records
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium text-lg">No Inspections Found</p>
            <p className="text-sm text-muted-foreground mt-1">This vehicle has no inspection records.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (filteredInspections.length === 0 && hasActiveFilters) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
          <div className="space-y-4">
            <div>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                Inspections
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Vehicle inspection history and records
              </p>
            </div>
            
            {/* Filter Controls - Memoized for performance */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Date Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                        </>
                      ) : (
                        dateRange.from.toLocaleDateString()
                      )
                    ) : (
                      "Filter by date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              
              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type: string) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Additional Filters Row */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status: string) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inspection types..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Clear Filters Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTypeFilter('all')
                  setStatusFilter('all')
                  setDateRange(undefined)
                  setSearchTerm('')
                }}
                className="px-3"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium text-lg">No inspections match your filters</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or clearing them to see more results</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
        <div className="space-y-4">
          <div>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
              Inspections
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Vehicle inspection history and records
            </p>
          </div>
          
          {/* Filter Controls */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarRange className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                      </>
                    ) : (
                      dateRange.from.toLocaleDateString()
                    )
                  ) : (
                    "Filter by date"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            
            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type: string) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Additional Filters Row */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map((status: string) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inspection types..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTypeFilter('all')
                  setStatusFilter('all')
                  setDateRange(undefined)
                  setSearchTerm('')
                }}
                className="px-3"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 sm:pt-6">
        {/* Filter Results Info */}
        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>
                Showing {filteredInspections.length} of {inspections.length} inspections
                {typeFilter !== 'all' && ` (${typeFilter} type)`}
                {statusFilter !== 'all' && ` (${statusFilter} status)`}
                {dateRange?.from && ' for selected date range'}
              </span>
            </div>
          </div>
        )}

        {/* Inspections List - Full Width */}
        <div className="space-y-4">
          {filteredInspections.map((inspection: any) => (
            <div key={inspection.id} className="w-full p-5 rounded-lg border border-border/50 bg-card hover:bg-muted/30 hover:border-border transition-colors">
              {/* Top Row - Labels and Action Button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Daily Checklist Label */}
                  <div className="px-3 py-1 rounded-full border border-border bg-muted/20">
                    <span className="text-sm text-foreground">
                      {inspection.type || 'Inspection'} ({vehicle.brand || 'Toyota'})
                    </span>
                  </div>
                  {/* Status Badge */}
                  <Badge className={getStatusColor(inspection.status)}>
                    {inspection.status}
                  </Badge>
                </div>
                {/* View Button */}
                <Button asChild variant="outline" size="sm">
                  <Link href={`/inspections/${inspection.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </Button>
              </div>

              {/* Middle Row - Date and Time */}
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-foreground">
                  {new Date(inspection.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
                <span className="mx-2 text-muted-foreground">•</span>
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  {inspection.created_at ? 
                    new Date(inspection.created_at).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    }) : 
                    new Date(inspection.date).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })
                  }
                </span>
              </div>

              {/* Bottom Row - Inspector Information */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-foreground">
                  Inspector: {inspectorInfo[inspection.id] || 'Not assigned'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 