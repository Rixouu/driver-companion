"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import { BarChart3, ArrowRight, AlertTriangle, TrendingUp, DollarSign, Target, Users, Calendar } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { useState, useEffect } from "react"

interface FinancialDashboardProps {
  financialData: {
    totalQuotations: number
    totalRevenue: number
    avgQuoteValue: number
    approvedQuotes: number
    pendingQuotes: number
    draftQuotes: number
    rejectedQuotes: number
    convertedQuotes: number
    approvalRate: number
    conversionRate: number
    activeBookings: number
  }
  dailyRevenueData: any[]
  statusDistributionData: any[]
  monthlyRevenueData: any[]
  isLoadingFinancial: boolean
  financialError: string | null
}

export function FinancialDashboard({
  financialData,
  dailyRevenueData,
  statusDistributionData,
  monthlyRevenueData,
  isLoadingFinancial,
  financialError
}: FinancialDashboardProps) {
  const { t } = useI18n()

  if (isLoadingFinancial) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t("dashboard.financial.title")}
          </CardTitle>
          <CardDescription>{t("dashboard.financial.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
              <div className="h-16 bg-muted animate-pulse rounded-lg"></div>
            </div>
            <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
            <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (financialError) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t("dashboard.financial.title")}
          </CardTitle>
          <CardDescription>{t("dashboard.financial.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{financialError}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">{t("dashboard.financial.title")}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">{t("dashboard.financial.description")}</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/reporting">
              View Full Report
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-8">

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Trend Chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/20">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Revenue Trend
                </CardTitle>
                <CardDescription className="text-sm">Daily revenue performance over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`¥${value.toLocaleString()}`, 'Revenue']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 3, r: 5, stroke: '#ffffff' }}
                      activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 3, fill: '#ffffff' }}
                      fill="url(#revenueGradient)"
                    />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quote Status Chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
                    <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  Quote Status Distribution
                </CardTitle>
                <CardDescription className="text-sm">Breakdown of quotation statuses</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <XAxis 
                      dataKey="status" 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Count']}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={40}>
                      {statusDistributionData.map((entry, index) => {
                        // Check both 'status' and 'name' fields, and handle different case variations
                        const status = entry.status || entry.name || '';
                        const statusLower = status.toLowerCase();
                        
                        return (
                          <Cell key={`cell-${index}`} fill={
                            statusLower === 'approved' ? '#10b981' :      // Green for approved
                            statusLower === 'rejected' ? '#ef4444' :      // Red for rejected  
                            statusLower === 'pending' ? '#f59e0b' :       // Yellow for pending
                            statusLower === 'converted' ? '#3b82f6' :     // Blue for converted
                            statusLower === 'draft' ? '#6b7280' :         // Gray for draft
                            statusLower === 'sent' ? '#8b5cf6' :          // Purple for sent
                            '#64748b'                                      // Default gray
                          } />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          
          {/* Status Overview */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <div className="p-2 rounded-md bg-slate-100 dark:bg-slate-900/20">
                  <BarChart3 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                Quotation Status Overview
              </CardTitle>
              <CardDescription className="text-sm">Current status distribution of all quotations</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Approved</p>
                    <p className="text-lg font-bold text-green-800 dark:text-green-200">{financialData.approvedQuotes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending</p>
                    <p className="text-lg font-bold text-yellow-800 dark:text-yellow-200">{financialData.pendingQuotes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Rejected</p>
                    <p className="text-lg font-bold text-red-800 dark:text-red-200">{financialData.rejectedQuotes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Converted</p>
                    <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{financialData.convertedQuotes || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
