"use client"

import { useState, useEffect, useCallback } from 'react'
import { DateRange } from 'react-day-picker'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { CalendarDateRangePicker } from '@/components/date-range-picker'
import { useI18n } from '@/lib/i18n/context'
import { 
  RefreshCw
} from 'lucide-react'

// Import our new components
import { useReportingData } from '@/lib/hooks/use-reporting-data'
import { useReportGeneration } from '@/lib/hooks/use-report-generation'
import { ReportingTabsList } from './reporting-tabs-list'
import { OverviewTab } from './tabs/overview-tab'
import { FinancialTab } from './tabs/financial-tab'
import { VehiclesTab } from './tabs/vehicles-tab'
import { OperationsTab } from './tabs/operations-tab'
import { ReportsTab } from './tabs/reports-tab'
import { ReportGenerationDialog } from './report-generation-dialog'

interface ComprehensiveReportingPageProps {
  initialDateRange: DateRange
}

export function ComprehensiveReportingPage({ initialDateRange }: ComprehensiveReportingPageProps) {
  const { t } = useI18n()
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange)
  const [activeTab, setActiveTab] = useState('overview')
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)

  // Use our custom hooks
  const { data: reportingData, isLoading, error, refetch } = useReportingData({
    dateRange,
    enabled: true
  })

  const { 
    isGenerating, 
    generatedReports, 
    generateReport, 
    downloadReport, 
    deleteReport,
    fetchGeneratedReports 
  } = useReportGeneration()

  // Fetch generated reports on mount
  useEffect(() => {
    fetchGeneratedReports()
  }, [fetchGeneratedReports])

  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setDateRange(newRange)
  }

  const handleGenerateReport = async (options: any) => {
    const result = await generateReport({
      ...options,
      dateRange: dateRange || { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() }
    })
    
    if (result.success) {
      setIsReportDialogOpen(false)
    }
    
    return result
  }

  const previewReport = useCallback((reportId: string) => {
    // Open preview in new tab
    window.open(`/api/reporting/preview/${reportId}`, '_blank')
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={refetch} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border/40 pb-3">
        <div className="space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Comprehensive Reports & Analytics</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              Real-time insights into your vehicle inspection business performance
            </p>
          </div>
          
          {/* Mobile/Tablet: Date picker and refresh button below title */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
            <div className="flex-1">
              <CalendarDateRangePicker
                date={dateRange}
                onSelect={handleDateRangeChange}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={refetch} 
              disabled={isLoading} 
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ReportingTabsList value={activeTab} onValueChange={setActiveTab} />
        
        <div className="mt-8">
          <TabsContent value="overview">
            <OverviewTab data={reportingData} />
          </TabsContent>
          
          <TabsContent value="financial">
            <FinancialTab data={reportingData} />
          </TabsContent>
          
          <TabsContent value="vehicles">
            <VehiclesTab data={reportingData} />
          </TabsContent>
          
          <TabsContent value="operations">
            <OperationsTab data={reportingData} />
          </TabsContent>
          
          <TabsContent value="reports">
            <ReportsTab 
              generatedReports={generatedReports}
              onGenerateReport={() => setIsReportDialogOpen(true)}
              onDownloadReport={downloadReport}
              onDeleteReport={deleteReport}
              onPreviewReport={previewReport}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Report Generation Dialog */}
      <ReportGenerationDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        onGenerate={handleGenerateReport}
        isGenerating={isGenerating}
        dateRange={dateRange}
      />
    </div>
  )
}
