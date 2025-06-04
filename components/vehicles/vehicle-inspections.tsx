"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useI18n } from "@/lib/i18n/context"
import { DbVehicle } from "@/types"
import { useQuery } from "@tanstack/react-query"
import { ClipboardCheck, Calendar as CalendarIcon, User, Eye, Filter, CalendarRange, X } from "lucide-react"
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns"
import Link from "next/link"
import { useState } from "react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

interface VehicleInspectionsProps {
  vehicle: DbVehicle
}

interface Inspection {
  id: string
  date: string
  type: string
  status: string
  inspector_name?: string
  inspector_email?: string
  created_at: string
  items_count?: number
  failed_items_count?: number
}

async function fetchVehicleInspections(vehicleId: string): Promise<Inspection[]> {
  const response = await fetch(`/api/vehicles/${vehicleId}/inspections`)
  if (!response.ok) {
    throw new Error('Failed to fetch vehicle inspections')
  }
  return response.json()
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'daily':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'routine':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'safety':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'maintenance':
      return 'bg-green-50 text-green-700 border-green-200'
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

export function VehicleInspections({ vehicle }: VehicleInspectionsProps) {
  const { t } = useI18n()
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  const { data: inspections, isLoading, error } = useQuery({
    queryKey: ['vehicleInspections', vehicle.id],
    queryFn: () => fetchVehicleInspections(vehicle.id),
  })

  const filteredInspections = inspections?.filter(inspection => {
    if (typeFilter !== 'all' && inspection.type !== typeFilter) {
      return false
    }
    
    if (dateRange?.from) {
      const inspectionDate = parseISO(inspection.date)
      const from = startOfDay(dateRange.from)
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
      
      if (!isWithinInterval(inspectionDate, { start: from, end: to })) {
        return false
      }
    }
    
    return true
  })

  const inspectionTypes = ['daily', 'routine', 'safety', 'maintenance']

  const clearDateFilter = () => {
    setDateRange(undefined)
  }

  const hasActiveFilters = typeFilter !== 'all' || dateRange?.from

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {t('vehicles.tabs.vehicleInspections')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {t('vehicles.tabs.vehicleInspections')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('common.error')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            {t('vehicles.tabs.vehicleInspections')}
          </CardTitle>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarRange className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d, yyyy")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    "Filter by date"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('vehicles.tabs.filterBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('vehicles.tabs.allTypes')}</SelectItem>
                {inspectionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`inspections.type.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setTypeFilter('all')
                  clearDateFilter()
                }}
                className="px-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!filteredInspections || filteredInspections.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-muted-foreground">
                {hasActiveFilters 
                  ? "No inspections match your filters"
                  : t('vehicles.tabs.noInspectionsForVehicle')
                }
              </p>
              {hasActiveFilters && (
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or clearing them to see more results
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {hasActiveFilters && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                Showing {filteredInspections.length} of {inspections?.length || 0} inspections
                {typeFilter !== 'all' && ` (${typeFilter} type)`}
                {dateRange?.from && ' for selected date range'}
              </div>
            )}
            {filteredInspections.map((inspection) => (
              <div
                key={inspection.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={getTypeColor(inspection.type)}>
                      {t(`inspections.type.${inspection.type}`) || inspection.type}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(inspection.status)}>
                      {t(`inspections.status.${inspection.status}`) || inspection.status}
                    </Badge>
                    {inspection.failed_items_count && inspection.failed_items_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {inspection.failed_items_count} failed items
                      </Badge>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/inspections/${inspection.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      {t('common.view')}
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {inspection.date && format(new Date(inspection.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {inspection.inspector_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{inspection.inspector_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {inspection.items_count && (
                      <div className="text-muted-foreground">
                        {inspection.items_count} items inspected
                      </div>
                    )}
                    {inspection.type === 'daily' && (
                      <div className="text-xs text-muted-foreground">
                        {t('vehicles.tabs.dailyInspections')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 