"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react'

interface StatusDistributionChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  title?: string
  description?: string
  height?: number
  chartType?: 'bar' | 'pie'
  showChartTypeToggle?: boolean
}

export function StatusDistributionChart({ 
  data, 
  title = "Status Distribution", 
  description = "Distribution of items by status",
  height = 300,
  chartType: initialChartType = 'bar',
  showChartTypeToggle = true
}: StatusDistributionChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>(initialChartType)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showChartTypeToggle && (
            <div className="hidden sm:flex items-center gap-1">
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="h-8 w-8 p-0"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('pie')}
                className="h-8 w-8 p-0"
              >
                <PieChartIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {showChartTypeToggle && (
          <div className="sm:hidden mt-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="h-8 w-full"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Bar
              </Button>
              <Button
                variant={chartType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('pie')}
                className="h-8 w-full"
              >
                <PieChartIcon className="h-4 w-4 mr-2" />
                Pie
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const value = payload[0].value as number
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
                        return (
                          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
                            <p className="font-medium text-foreground mb-1">{label}</p>
                            <p className="text-blue-600 font-semibold">
                              {value} ({percentage}%)
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[2, 2, 0, 0]}
                    fill="#8b5cf6"
                  />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0'
                        return (
                          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
                            <p className="font-medium text-foreground mb-1">{data.name}</p>
                            <p className="font-semibold" style={{ color: data.color }}>
                              {data.value} ({percentage}%)
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
