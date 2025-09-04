"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface RevenueChartProps {
  data: Array<{
    date: string
    value: number
    label?: string
  }>
  title?: string
  description?: string
  height?: number
  showTrend?: boolean
}

export function RevenueChart({ 
  data, 
  title = "Revenue Trend", 
  description = "Daily revenue over time",
  height = 300,
  showTrend = true
}: RevenueChartProps) {
  // Calculate trend
  const trend = data.length > 1 ? 
    ((data[data.length - 1]?.value || 0) - (data[0]?.value || 0)) / (data[0]?.value || 1) * 100 : 0
  
  const isPositiveTrend = trend >= 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showTrend && data.length > 1 && (
            <div className={`flex items-center gap-1 text-sm ${
              isPositiveTrend ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositiveTrend ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        {showTrend && data.length > 1 && (
          <div className="sm:hidden mt-3">
            <div className={`flex items-center gap-1 text-sm ${
              isPositiveTrend ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositiveTrend ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
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
                          <p className="text-green-600 font-semibold">
                            ¥{payload[0].value?.toLocaleString()}
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
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 1, r: 3 }}
                  activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
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
