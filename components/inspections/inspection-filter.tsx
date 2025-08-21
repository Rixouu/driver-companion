'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, Search, X, SortAsc, SortDesc, Calendar, Car, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n/context'

export interface InspectionFilterOptions {
  statusFilter: string
  vehicleModelFilter: string // Changed from vehicleFilter to vehicleModelFilter
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
  const { t } = useI18n()
  const [vehicleModels, setVehicleModels] = useState<string[]>([])
  const [inspectors, setInspectors] = useState<Array<{id: string, full_name: string}>>([])

  // Fetch vehicle models and inspectors from the database
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        // Fetch vehicle models instead of brands
        const modelsResponse = await fetch('/api/vehicles/models')
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json()
          setVehicleModels(modelsData)
        }

        // Fetch inspectors from profiles table (since inspector_id links to profiles)
        const inspectorsResponse = await fetch('/api/inspectors')
        if (inspectorsResponse.ok) {
          const inspectorsData = await inspectorsResponse.json()
          console.log('🔍 [INSPECTION_FILTER] Received inspectors:', {
            count: inspectorsData.length,
            sample: inspectorsData.slice(0, 3)
          })
          setInspectors(inspectorsData)
        } else {
          console.error('Failed to fetch inspectors:', inspectorsResponse.status)
        }
      } catch (error) {
        console.error('Error fetching filter data:', error)
      }
    }

    fetchFilterData()
  }, [])

  const clearFilters = () => {
    onFiltersChange({
      statusFilter: 'all',
      vehicleModelFilter: 'all',
      inspectorFilter: 'all',
      searchQuery: '',
      sortBy: 'date',
      sortOrder: 'desc',
      dateRange: 'all'
    })
  }

  const hasActiveFilters = filters.statusFilter !== 'all' || 
                          filters.vehicleModelFilter !== 'all' || 
                          filters.inspectorFilter !== 'all' || 
                          filters.searchQuery || 
                          filters.dateRange !== 'all'

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {t("inspections.filters.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t("inspections.filters.status")}</label>
            <Select 
              value={filters.statusFilter} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                statusFilter: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("inspections.filters.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("inspections.filters.allStatuses")}</SelectItem>
                <SelectItem value="scheduled">{t("inspections.status.scheduled")}</SelectItem>
                <SelectItem value="in_progress">{t("inspections.status.in_progress")}</SelectItem>
                <SelectItem value="completed">{t("inspections.status.completed")}</SelectItem>
                <SelectItem value="cancelled">{t("inspections.status.cancelled")}</SelectItem>
                <SelectItem value="failed">{t("inspections.status.failed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">{t("inspections.filters.vehicleBrand")}</label>
            <Select 
              value={filters.vehicleModelFilter} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                vehicleModelFilter: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("inspections.filters.allBrands")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("inspections.filters.allBrands")}</SelectItem>
                {vehicleModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">{t("inspections.filters.inspector")}</label>
            <Select 
              value={filters.inspectorFilter} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                inspectorFilter: value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("inspections.filters.allInspectors")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("inspections.filters.allInspectors")}</SelectItem>
                {inspectors.length > 0 ? (
                  inspectors.map((inspector) => (
                    <SelectItem key={inspector.id} value={inspector.id}>
                      {inspector.full_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="debug" disabled>
                    Debug: {inspectors.length} inspectors loaded
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">{t("inspections.filters.dateRange")}</label>
            <Select 
              value={filters.dateRange} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                dateRange: value as 'all' | 'today' | 'week' | 'month'
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("inspections.filters.allDates")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("inspections.filters.allDates")}</SelectItem>
                <SelectItem value="today">{t("inspections.filters.today")}</SelectItem>
                <SelectItem value="week">{t("inspections.filters.thisWeek")}</SelectItem>
                <SelectItem value="month">{t("inspections.filters.thisMonth")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t("inspections.filters.search")}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t("inspections.filters.searchPlaceholder")}
                value={filters.searchQuery}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  searchQuery: e.target.value
                })}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">{t("inspections.filters.sortBy")}</label>
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
                  <SelectItem value="date">{t("inspections.filters.sortOptions.date")}</SelectItem>
                  <SelectItem value="vehicle">{t("inspections.filters.sortOptions.vehicle")}</SelectItem>
                  <SelectItem value="inspector">{t("inspections.filters.sortOptions.inspector")}</SelectItem>
                  <SelectItem value="type">{t("inspections.filters.sortOptions.type")}</SelectItem>
                  <SelectItem value="status">{t("inspections.filters.sortOptions.status")}</SelectItem>
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
                title={t("inspections.filters.sortOrder")}
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
              {t("inspections.filters.clearAllFilters")}
            </Button>
          </div>
        )}
        
        {/* Results Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters ? (
              <span>{t("inspections.filters.filteredResults", { count: totalInspections })}</span>
            ) : (
              <span>{t("inspections.filters.showingAll", { count: totalInspections })}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
              {totalScheduled} {t("inspections.status.scheduled")}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
              {totalCompleted} {t("inspections.status.completed")}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">
              {totalFailed} {t("inspections.status.failed")}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
