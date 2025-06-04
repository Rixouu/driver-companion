"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { getDictionary } from "@/lib/i18n/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { InspectionCharts } from "./inspection-charts"
import type { Database } from "@/types/supabase"
import { DatabaseError } from "@/lib/errors/app-error"

interface Inspection {
  id: string
  status: string | null
  type: string | null
}

interface InspectionItem {
  status: string | null
  inspection_item_templates: {
    inspection_categories: {
      type: string | null
    } | null
  } | null
}

interface InspectionStats {
  totalInspections: number
  passedItems: number
  failedItems: number
  totalItems: number
  inspectionsByType: {
    [key: string]: number
  }
  inspectionsByStatus: {
    scheduled: number
    in_progress: number
    completed: number
  }
  commonFailures: {
    category: string
    count: number
  }[]
}

const PIE_CHART_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6B7280']

async function fetchInspectionStats(t: (key: string, params?: any) => string): Promise<InspectionStats> {
  const supabase = await getSupabaseServerClient()

  const { data: inspectionsData, error: inspectionsError } = await supabase
    .from('inspections')
    .select('id, status, type')
    .returns<Inspection[]>()

  if (inspectionsError) {
    console.error('Error fetching inspections:', inspectionsError)
    throw new DatabaseError('Failed to fetch inspections', inspectionsError.stack)
  }

  const { data: itemsData, error: itemsError } = await supabase
    .from('inspection_items')
    .select(`
      status,
      inspection_item_templates!inner (
        inspection_categories!inner ( type )
      )
    `)
    .returns<InspectionItem[]>()

  if (itemsError) {
    console.error('Error fetching inspection items:', itemsError)
    throw new DatabaseError('Failed to fetch inspection items', itemsError.stack)
  }

  const inspections = inspectionsData || []
  const items = itemsData || []

  const stats: InspectionStats = {
    totalInspections: inspections.length,
    passedItems: items.filter(item => item.status === 'pass').length,
    failedItems: items.filter(item => item.status === 'fail').length,
    totalItems: items.length,
    inspectionsByType: {},
    inspectionsByStatus: {
      scheduled: inspections.filter(i => i.status === 'scheduled').length,
      in_progress: inspections.filter(i => i.status === 'in_progress').length,
      completed: inspections.filter(i => i.status === 'completed').length,
    },
    commonFailures: [],
  }

  inspections.forEach(inspection => {
    if (inspection.type) {
      stats.inspectionsByType[inspection.type] = (stats.inspectionsByType[inspection.type] || 0) + 1
    }
  })

  const failuresByCategory = items
    .filter(item => item.status === 'fail')
    .reduce((acc: { [key: string]: number }, item) => {
      const categoryType = item.inspection_item_templates?.inspection_categories?.type
      if (categoryType) {
        const translatedCategory = t(`inspections.categories.${categoryType}.name`)
        acc[translatedCategory] = (acc[translatedCategory] || 0) + 1
      }
      return acc
    }, {})

  stats.commonFailures = Object.entries(failuresByCategory)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return stats
}

export async function InspectionMetrics() {
  const { t } = await getDictionary()
  let stats: InspectionStats
  let fetchError = false

  try {
    stats = await fetchInspectionStats(t)
  } catch (error) {
    console.error("[InspectionMetrics] Error fetching stats:", error)
    stats = {
      totalInspections: 0,
      passedItems: 0,
      failedItems: 0,
      totalItems: 0,
      inspectionsByType: {},
      inspectionsByStatus: { scheduled: 0, in_progress: 0, completed: 0 },
      commonFailures: [],
    }
    fetchError = true
  }

  const passRateData = [
    { name: t('inspections.details.results.passCount', { count: stats.passedItems.toString() }), value: stats.passedItems },
    { name: t('inspections.details.results.failCount', { count: stats.failedItems.toString() }), value: stats.failedItems },
  ]

  const statusData = [
    { name: t('inspections.status.scheduled'), value: stats.inspectionsByStatus.scheduled },
    { name: t('inspections.status.in_progress'), value: stats.inspectionsByStatus.in_progress },
    { name: t('inspections.status.completed'), value: stats.inspectionsByStatus.completed },
  ]

  if (fetchError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('reporting.sections.inspectionMetrics.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{t('errors.dataLoadingError') || 'Could not load inspection metrics data.'}</p>
        </CardContent>
      </Card>
    )
  }
  
  const totalItemsForRate = stats.passedItems + stats.failedItems

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reporting.sections.inspectionMetrics.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalInspections}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.inspectionMetrics.totalInspections')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {totalItemsForRate > 0 ? ((stats.passedItems / totalItemsForRate) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.inspectionMetrics.passRate')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {totalItemsForRate > 0 ? ((stats.failedItems / totalItemsForRate) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.inspectionMetrics.failRate')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.commonFailures.reduce((sum, item) => sum + item.count, 0)}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.inspectionMetrics.totalFailedItemsInTopCategories')}
              </p>
            </CardContent>
          </Card>
        </div>
        <InspectionCharts 
          statusData={statusData} 
          passRateData={passRateData}
          commonFailuresData={stats.commonFailures}
          inspectionsByStatusTitle={t('reporting.sections.inspectionMetrics.inspectionsByStatus')}
          passRateTitle={t('reporting.sections.inspectionMetrics.overallPassFailRate')}
          commonFailuresTitle={t('reporting.sections.inspectionMetrics.commonFailuresByTranslatedCategory')}
          pieColors={PIE_CHART_COLORS}
        />
      </CardContent>
    </Card>
  )
} 