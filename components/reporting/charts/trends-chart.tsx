"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TrendingUp, BarChart3 } from 'lucide-react'

interface TrendsChartProps {
  data: Array<{
    date: string
    value: number
    label?: string
  }>
  title?: string
  description?: string
  height?: number
  chartType?: 'line' | 'area'
  showChartTypeToggle?: boolean
  color?: string
  yAxisFormatter?: (value: number) => string
}

export function TrendsChart({ 
  data, 
  title = "Trends", 
  description = "Data trends over time",
  height = 300,
  chartType: initialChartType = 'line',
  showChartTypeToggle = true,
  color = '#3b82f6',
  yAxisFormatter = (value) => value.toString()
}: TrendsChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area'>(initialChartType)

  // Calculate trend
  const trend = data.length > 1 ? 
    ((data[data.length - 1]?.value || 0) - (data[0]?.value || 0)) / Math.max(data[0]?.value || 1, 1) * 100 : 0
  
  const isPositiveTrend = trend >= 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {showChartTypeToggle && (
              <div className="flex items-center gap-1">
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  className="h-8 w-8 p-0"
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
                <Button
                  variant={chartType === 'area' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('area')}
                  className="h-8 w-8 p-0"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            )}
            {data.length > 1 && (
              <div className={`flex items-center gap-1 text-sm ${
                isPositiveTrend ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-4 w-4 ${!isPositiveTrend ? 'rotate-180' : ''}`} />
                <span>{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
        <div className="sm:hidden mt-3">
          <div className="grid grid-cols-2 gap-2">
            {showChartTypeToggle ? (
              <>
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  className="h-8 w-full"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Line
                </Button>
                <Button
                  variant={chartType === 'area' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('area')}
                  className="h-8 w-full"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Area
                </Button>
              </>
            ) : data.length > 1 ? (
              <>
                <div className={`flex items-center gap-1 text-sm ${
                  isPositiveTrend ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-4 w-4 ${!isPositiveTrend ? 'rotate-180' : ''}`} />
                  <span>{Math.abs(trend).toFixed(1)}%</span>
                </div>
                <div></div>
              </>
            ) : (
              <>
                <div></div>
                <div></div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={yAxisFormatter}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
                            <p className="font-medium text-foreground mb-1">
                              {new Date(label).toLocaleDateString('en', { 
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                            <p className="font-semibold" style={{ color }}>
                              {payload[0].value}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, strokeWidth: 1, r: 3 }}
                    activeDot={{ r: 5, stroke: color, strokeWidth: 2 }}
                  />
                </LineChart>
              ) : (
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={yAxisFormatter}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
                            <p className="font-medium text-foreground mb-1">
                              {new Date(label).toLocaleDateString('en', { 
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                            <p className="font-semibold" style={{ color }}>
                              {payload[0].value}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={color}
                    fill={color}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
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
