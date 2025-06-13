'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/lib/i18n/context'
import { formatDate } from '@/lib/utils/formatting'
import { Booking } from '@/types/bookings'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { EmptyState } from '@/components/empty-state'
import { ClipboardCheck } from 'lucide-react'

interface BookingInspection {
  id: string
  created_at: string
  vehicle_id: string
  status: string
  type: string
  date: string
  inspector_name?: string
}

interface BookingInspectionsProps {
  bookingId: string
  vehicleId: string
}

export function BookingInspections({ bookingId, vehicleId }: BookingInspectionsProps) {
  const { t } = useI18n()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [inspections, setInspections] = useState<BookingInspection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInspections() {
      if (!vehicleId) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('inspections')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) {
          console.error('Error fetching inspections:', error)
          setLoading(false)
          return
        }

        setInspections(data || [])
      } catch (err) {
        console.error('Error in fetchInspections:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInspections()
  }, [vehicleId, supabase])

  const handleViewInspection = (id: string) => {
    router.push(`/inspections/${id}`)
  }

  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    }
    
    return statusMap[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('inspections.title')}</CardTitle>
          <CardDescription>{t('inspections.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (inspections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('inspections.title')}</CardTitle>
          <CardDescription>{t('inspections.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<ClipboardCheck className="h-8 w-8 text-muted-foreground" />}
            title={t('inspections.tabs.inspectionsEmpty')}
            description={t('inspections.tabs.noInspectionsForVehicle')}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('inspections.title')}</CardTitle>
        <CardDescription>{t('inspections.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {inspections.map((inspection) => (
            <div 
              key={inspection.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
              onClick={() => handleViewInspection(inspection.id)}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t(`inspections.type.${inspection.type}`) || inspection.type}</span>
                  <Badge className={getStatusBadgeClass(inspection.status)}>
                    {t(`inspections.status.${inspection.status}`)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(inspection.date || inspection.created_at)}
                  {inspection.inspector_name && ` • ${inspection.inspector_name}`}
                </div>
              </div>
              <Button variant="ghost" size="sm">
                {t('common.viewDetails')}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 