"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/context"
import { DbVehicle, MaintenanceTask, Inspection } from "@/types"
import { useState, useEffect } from "react"
import { Calendar, Wrench, ClipboardCheck, Filter, Eye } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"

interface VehicleHistoryProps {
  vehicle: DbVehicle
}

// Updated to match the API response structure
type HistoryBooking = {
  id: string
  booking_id: string
  customer_name: string | null
  pickup_date: string
  status: string
  service_name: string
  created_at: string | null
  record_type: 'booking'
}

type HistoryMaintenanceTask = MaintenanceTask & { record_type: 'maintenance' };
type HistoryInspection = Inspection & { record_type: 'inspection' };
type HistoryItem = HistoryMaintenanceTask | HistoryInspection | HistoryBooking;

// Helper function to get consistent timestamp for sorting
function getItemTimestamp(item: HistoryItem): number {
  if (item.record_type === 'booking') {
    return new Date(item.pickup_date || item.created_at || 0).getTime()
  } else if (item.record_type === 'maintenance') {
    return new Date(item.created_at).getTime()
  } else {
    return new Date(item.date).getTime()
  }
}

const getStatusColor = (status: string, type: string) => {
  if (type === 'booking') {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'in_progress':
    case 'in progress':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'pending':
    case 'scheduled':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'cancelled':
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function VehicleHistory({ vehicle }: VehicleHistoryProps) {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get filter from URL params
  useEffect(() => {
    const filterParam = searchParams.get('filter')
    if (filterParam && ['maintenance', 'inspection', 'booking'].includes(filterParam)) {
      setTypeFilter(filterParam)
    }
  }, [searchParams])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [maintenanceRes, inspectionsRes, bookingsRes] = await Promise.all([
        fetch(`/api/vehicles/${vehicle.id}/maintenance/overview`).then(res => res.ok ? res.json() : { tasks: [] }),
        fetch(`/api/vehicles/${vehicle.id}/inspections`).then(res => res.ok ? res.json() : []),
        fetch(`/api/vehicles/${vehicle.id}/bookings`).then(res => res.ok ? res.json() : [])
      ])

      const maintenanceTasks: HistoryMaintenanceTask[] = (maintenanceRes.tasks || []).map((task: any) => ({
        ...task,
        record_type: 'maintenance' as const
      }))

      const inspections: HistoryInspection[] = (inspectionsRes || []).map((inspection: any) => ({
        ...inspection,
        record_type: 'inspection' as const
      }))

      const bookings: HistoryBooking[] = (bookingsRes || []).map((booking: any) => ({
        ...booking,
        record_type: 'booking' as const
      }))

      // Combine and sort by timestamp
      const allItems: HistoryItem[] = [
        ...maintenanceTasks,
        ...inspections,
        ...bookings
      ].sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a))

      setHistoryItems(allItems)
    } catch (err) {
      console.error('Error loading vehicle history:', err)
      setError('Failed to load vehicle history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [vehicle.id])

  const filteredItems = historyItems.filter(item => 
    typeFilter === 'all' || item.record_type === typeFilter
  )

  const getItemUrl = (item: HistoryItem) => {
    if (item.record_type === 'maintenance') {
      return `/maintenance/${item.id}`
    } else if (item.record_type === 'inspection') {
      return `/inspections/${item.id}`
    } else {
      return `/bookings/${item.id}`
    }
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-blue-600" />
      case 'inspection':
        return <ClipboardCheck className="h-4 w-4 text-green-600" />
      case 'booking':
        return <Calendar className="h-4 w-4 text-purple-600" />
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />
    }
  }

  const getItemTitle = (item: HistoryItem) => {
    if (item.record_type === 'maintenance') {
      return item.title
    } else if (item.record_type === 'inspection') {
      return `${item.type || 'General'} Inspection`
    } else {
      return `Booking #${item.booking_id} - ${item.customer_name || 'Unknown Customer'}`
    }
  }

  const getItemDate = (item: HistoryItem) => {
    if (item.record_type === 'booking') {
      return format(new Date(item.pickup_date || item.created_at || 0), 'MMM d, yyyy')
    } else if (item.record_type === 'maintenance') {
      return format(new Date(item.created_at), 'MMM d, yyyy')
    } else {
      return format(new Date(item.date), 'MMM d, yyyy')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('vehicles.tabs.allHistory')}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('vehicles.tabs.filterBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('vehicles.tabs.allTypes')}</SelectItem>
                <SelectItem value="maintenance">{t('vehicles.tabs.maintenance')}</SelectItem>
                <SelectItem value="inspection">{t('vehicles.tabs.inspection')}</SelectItem>
                <SelectItem value="booking">{t('vehicles.tabs.booking')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadData} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        ) : !filteredItems || filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {typeFilter === 'all' 
                ? t('vehicles.tabs.historyEmpty')
                : `No ${typeFilter} history found`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={`${item.record_type}-${item.id}`}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getItemIcon(item.record_type)}
                    <div>
                      <h3 className="font-medium text-sm">{getItemTitle(item)}</h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.record_type} • {getItemDate(item)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(item.status, item.record_type)}>
                      {item.status}
                    </Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link href={getItemUrl(item) as any}>
                        <Eye className="h-4 w-4 mr-1" />
                        {t('common.view')}
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Additional details based on type */}
                {item.record_type === 'maintenance' && (
                  <div className="text-sm text-muted-foreground">
                    {item.description && item.description.length > 100 
                      ? `${item.description.substring(0, 100)}...`
                      : item.description
                    }
                  </div>
                )}
                
                {item.record_type === 'booking' && (
                  <div className="text-sm text-muted-foreground">
                    {item.service_name && `Service: ${item.service_name}`}
                  </div>
                )}

                {item.record_type === 'inspection' && item.notes && (
                  <div className="text-sm text-muted-foreground">
                    {item.notes.length > 100 
                      ? `${item.notes.substring(0, 100)}...`
                      : item.notes
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 