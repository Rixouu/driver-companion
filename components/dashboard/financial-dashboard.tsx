"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import { BarChart3, ArrowRight, AlertTriangle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          {t("dashboard.financial.title")}
        </CardTitle>
        <CardDescription>{t("dashboard.financial.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Top Row: Key Financial Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                ¥{(financialData.totalRevenue / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                {t("dashboard.financial.revenueOverview")}
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {financialData.totalQuotations}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {t("dashboard.financial.quoteOverview")}
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {financialData.activeBookings}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                {t("dashboard.financial.activeBookings")}
              </div>
            </div>
          </div>
          
          {/* Charts Row: Revenue + Quote Status Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            {/* Revenue Trend Chart */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">{t("dashboard.financial.revenueTrend")}</h4>
              <div className="h-40">
                {dailyRevenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyRevenueData}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.1} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 9 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis 
                        tick={{ fontSize: 9 }}
                        tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-xl text-xs">
                                <p className="font-medium text-foreground">{new Date(label).toLocaleDateString()}</p>
                                <p className="text-green-600 font-semibold">¥{payload[0].value?.toLocaleString()}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 1, r: 2.5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    {t("dashboard.financial.noData")}
                  </div>
                )}
              </div>
            </div>
            
            {/* Quote Status Chart */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">{t("dashboard.financial.quoteStatus")}</h4>
              <div className="h-40">
                {statusDistributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusDistributionData}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.1} />
                      <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 8 }} />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-xl text-xs">
                                <p className="font-medium text-foreground">{label}</p>
                                <p className="text-blue-600 font-semibold">{payload[0].value} quotes</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    {t("dashboard.financial.noData")}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom Row: Clean Metrics Display */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Average Quote */}
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">
                {t("dashboard.financial.avgQuote")}
              </div>
              <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                ¥{(financialData.avgQuoteValue / 1000).toFixed(0)}k
              </div>
            </div>
            
            {/* Approval Rate */}
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-2">
                {t("dashboard.financial.approvalRate")}
              </div>
              <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                {financialData.approvalRate}%
              </div>
            </div>
            
            {/* Conversion Rate */}
            <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-2">
                {t("dashboard.financial.conversionRate")}
              </div>
              <div className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-400">
                {financialData.conversionRate}%
              </div>
            </div>
          </div>
          
          {/* Status Summary Grid */}
          <div className="space-y-4">
            {/* Divider with text */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/40"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">Quotation Status Overview</span>
              </div>
            </div>
            
            {/* 2x2 Grid Layout */}
            <div className="grid grid-cols-2 gap-3 p-3 sm:p-4 lg:p-5 bg-muted/10 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-muted-foreground">{t("dashboard.financial.approved")}:</span>
                <span className="text-xs sm:text-sm font-semibold text-green-600">{financialData.approvedQuotes}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-muted-foreground">{t("dashboard.financial.pending")}:</span>
                <span className="text-xs sm:text-sm font-semibold text-yellow-600">{financialData.pendingQuotes}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-muted-foreground">{t("dashboard.financial.rejected")}:</span>
                <span className="text-xs sm:text-sm font-semibold text-red-600">{financialData.rejectedQuotes}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm text-muted-foreground">converted:</span>
                <span className="text-xs sm:text-sm font-semibold text-purple-600">{financialData.convertedQuotes || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="pt-2">
            <Link href="/sales/calendar" className="w-full">
              <Button variant="outline" className="w-full bg-background border-border hover:bg-muted/50">
                <span className="text-foreground">{t("dashboard.financial.viewSalesCalendar")}</span>
                <ArrowRight className="ml-2 h-4 w-4 text-foreground" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
