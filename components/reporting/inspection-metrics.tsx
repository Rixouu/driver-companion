"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

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

const COLORS = ['#10B981', '#F59E0B', '#6B7280', '#EF4444']

export function InspectionMetrics() {
  const { t } = useI18n()
  const [stats, setStats] = useState<InspectionStats>({
    totalInspections: 0,
    passedItems: 0,
    failedItems: 0,
    totalItems: 0,
    inspectionsByType: {},
    inspectionsByStatus: {
      scheduled: 0,
      in_progress: 0,
      completed: 0
    },
    commonFailures: []
  })

  useEffect(() => {
    async function fetchStats() {
      // Fetch inspections
      const { data: inspections, error: inspectionsError } = await supabase
        .from('inspections')
        .select('*')

      if (inspectionsError) {
        console.error('Error fetching inspections:', inspectionsError)
        return
      }

      // Fetch inspection items with their categories
      const { data: items, error: itemsError } = await supabase
        .from('inspection_items')
        .select(`
          status,
          inspection_item_templates!inner (
            title,
            category
          )
        `)
        .eq('status', 'fail')

      if (itemsError) {
        console.error('Error fetching inspection items:', itemsError)
        return
      }

      const stats: InspectionStats = {
        totalInspections: inspections.length,
        passedItems: items.filter(item => item.status === 'pass').length,
        failedItems: items.filter(item => item.status === 'fail').length,
        totalItems: items.length,
        inspectionsByType: {},
        inspectionsByStatus: {
          scheduled: inspections.filter(i => i.status === 'scheduled').length,
          in_progress: inspections.filter(i => i.status === 'in_progress').length,
          completed: inspections.filter(i => i.status === 'completed').length
        },
        commonFailures: []
      }

      // Calculate inspections by type
      inspections.forEach(inspection => {
        if (inspection.type) {
          stats.inspectionsByType[inspection.type] = (stats.inspectionsByType[inspection.type] || 0) + 1
        }
      })

      // Calculate common failures by category
      const failuresByCategory = items.reduce((acc: { [key: string]: number }, item) => {
        const category = t(`inspections.categories.${item.inspection_item_templates[0].category}.name`)
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {})

      const commonFailures = Object.entries(failuresByCategory)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setStats({
        ...stats,
        commonFailures
      })
    }

    fetchStats()
  }, [])

  const passRateData = [
    { name: t('inspections.details.results.passCount', { count: '1' }), value: stats.passedItems },
    { name: t('inspections.details.results.failCount', { count: '1' }), value: stats.failedItems }
  ]

  const statusData = [
    { name: t('inspections.status.scheduled'), value: stats.inspectionsByStatus.scheduled },
    { name: t('inspections.status.in_progress'), value: stats.inspectionsByStatus.in_progress },
    { name: t('inspections.status.completed'), value: stats.inspectionsByStatus.completed }
  ]

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
                {stats.totalItems > 0 ? ((stats.passedItems / stats.totalItems) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.inspectionMetrics.passRate')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {stats.totalItems > 0 ? ((stats.failedItems / stats.totalItems) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.inspectionMetrics.failRate')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.commonFailures.length}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.inspectionMetrics.commonFailures')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <h3 className="text-sm font-medium mb-2">{t('reporting.sections.inspectionMetrics.inspectionsByStatus')}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[300px]">
            <h3 className="text-sm font-medium mb-2">{t('reporting.sections.inspectionMetrics.passRate')}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={passRateData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {passRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="h-[300px] md:col-span-2">
            <h3 className="text-sm font-medium mb-2">{t('reporting.sections.inspectionMetrics.commonFailures')}</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.commonFailures}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 