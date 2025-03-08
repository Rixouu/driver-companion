"use client"

import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface FleetStats {
  total: number
  active: number
  maintenance: number
  inactive: number
}

const COLORS = ['#10B981', '#F59E0B', '#6B7280', '#EF4444']

export function FleetOverview() {
  const { t } = useI18n()
  const [stats, setStats] = useState<FleetStats>({
    total: 0,
    active: 0,
    maintenance: 0,
    inactive: 0
  })

  useEffect(() => {
    async function fetchStats() {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('status')

      if (error) {
        console.error('Error fetching fleet stats:', error)
        return
      }

      const stats = vehicles.reduce((acc, vehicle) => {
        acc.total++
        switch (vehicle.status) {
          case 'active':
            acc.active++
            break
          case 'maintenance':
            acc.maintenance++
            break
          case 'inactive':
            acc.inactive++
            break
        }
        return acc
      }, { total: 0, active: 0, maintenance: 0, inactive: 0 })

      setStats(stats)
    }

    fetchStats()
  }, [])

  const chartData = [
    { name: t('vehicles.status.active'), value: stats.active },
    { name: t('vehicles.status.maintenance'), value: stats.maintenance },
    { name: t('vehicles.status.inactive'), value: stats.inactive }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reporting.sections.fleetOverview.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.fleetOverview.totalVehicles')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.fleetOverview.activeVehicles')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.maintenance}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.fleetOverview.inMaintenance')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">
                {t('reporting.sections.fleetOverview.inactive')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 