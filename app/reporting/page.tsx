"use client"

import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, RotateCcw, FileText, BarChart3, Fuel, Wrench, Clock, Calendar, Filter, ChevronRight, PlusCircle } from "lucide-react"
import { DateRangePicker } from "@/components/date-range-picker"
import { FuelConsumptionChart } from "@/components/reporting/fuel-consumption-chart"
import { MaintenanceCostChart } from "@/components/reporting/maintenance-cost-chart"
import { VehiclePerformance } from "@/components/reporting/vehicle-performance"
import { supabase } from "@/lib/supabase"
import { addMonths, format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/reporting/overview"
import { MonthlyMileageChart } from "@/components/reporting/monthly-mileage-chart"
import { VehicleAvailabilityChart } from "@/components/reporting/vehicle-availability-chart"
import { MaintenanceFrequencyChart } from "@/components/reporting/maintenance-frequency-chart"
import { CostPerKmChart } from "@/components/reporting/cost-per-km-chart"
import { useI18n } from "@/lib/i18n/context"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface RecentReport {
  id: string
  name: string
  type: string
  date: string
  downloadUrl: string
}

interface CustomReportOptions {
  name: string
  reportType: string
  includeVehicles: boolean
  includeMaintenance: boolean
  includeFuel: boolean
  includeCosts: boolean
}

// Exchange rate: 1 USD = approximately 150 JPY (as of 2023)
const USD_TO_JPY_RATE = 150;

export default function ReportingPage() {
  const { t, language } = useI18n()
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [maintenanceCosts, setMaintenanceCosts] = useState<{
    total: number
    scheduled: number
    unscheduled: number
  }>({
    total: 0,
    scheduled: 0,
    unscheduled: 0
  })
  const [costDistribution, setCostDistribution] = useState<Array<{
    range: string
    count: number
    total: number
  }>>([])
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [customReportOptions, setCustomReportOptions] = useState<CustomReportOptions>({
    name: "",
    reportType: "combined",
    includeVehicles: true,
    includeMaintenance: true,
    includeFuel: true,
    includeCosts: true
  })
  const [isCustomReportDialogOpen, setIsCustomReportDialogOpen] = useState(false)

  const today = new Date()
  const defaultDateRange = {
    from: addMonths(today, -1),
    to: today
  } as const

  // Get the currency symbol based on language
  const currencySymbol = language === 'ja' ? '¥' : '$';

  useEffect(() => {
    // Simulate fetching recent reports
    const mockRecentReports = [
      {
        id: '1',
        name: 'Maintenance History - Fleet',
        type: 'maintenance',
        date: format(addMonths(new Date(), -0.1), 'MMM d, yyyy'),
        downloadUrl: '#'
      },
      {
        id: '2',
        name: 'Fuel Efficiency - Q2',
        type: 'fuel',
        date: format(addMonths(new Date(), -0.5), 'MMM d, yyyy'),
        downloadUrl: '#'
      },
      {
        id: '3',
        name: 'Cost Analysis - Monthly',
        type: 'cost',
        date: format(addMonths(new Date(), -0.2), 'MMM d, yyyy'),
        downloadUrl: '#'
      }
    ]
    setRecentReports(mockRecentReports)
  }, [])

  useEffect(() => {
    async function fetchMaintenanceData() {
      const { data: tasks } = await supabase
        .from('maintenance_tasks')
        .select('cost, title')
        .gte('completed_date', dateRange?.from?.toISOString() || defaultDateRange.from.toISOString())
        .lte('completed_date', dateRange?.to?.toISOString() || defaultDateRange.to.toISOString())

      if (tasks) {
        const costs = tasks.reduce((acc, task) => {
          const cost = typeof task.cost === 'string' ? parseFloat(task.cost) : (task.cost || 0)
          const isScheduled = task.title.toLowerCase().includes('scheduled') || 
                            task.title.toLowerCase().includes('routine') ||
                            task.title.toLowerCase().includes('planned')
          
          return {
            total: acc.total + cost,
            scheduled: acc.scheduled + (isScheduled ? cost : 0),
            unscheduled: acc.unscheduled + (isScheduled ? 0 : cost)
          }
        }, { total: 0, scheduled: 0, unscheduled: 0 })

        // Apply currency conversion if language is Japanese
        const conversionRate = language === 'ja' ? USD_TO_JPY_RATE : 1;
        setMaintenanceCosts({
          total: costs.total * conversionRate,
          scheduled: costs.scheduled * conversionRate,
          unscheduled: costs.unscheduled * conversionRate
        })

        // Calculate cost distribution
        const ranges = [
          { min: 0, max: 100, label: '$0-100' },
          { min: 100, max: 500, label: '$100-500' },
          { min: 500, max: 1000, label: '$500-1000' },
          { min: 1000, max: 2000, label: '$1000-2000' },
          { min: 2000, max: Infinity, label: '$2000+' }
        ]

        // If language is Japanese, adjust the ranges
        const japaneseRanges = language === 'ja' ? [
          { min: 0, max: 15000, label: '¥0-15,000' },
          { min: 15000, max: 75000, label: '¥15,000-75,000' },
          { min: 75000, max: 150000, label: '¥75,000-150,000' },
          { min: 150000, max: 300000, label: '¥150,000-300,000' },
          { min: 300000, max: Infinity, label: '¥300,000+' }
        ] : ranges;

        const selectedRanges = language === 'ja' ? japaneseRanges : ranges;

        const distribution = selectedRanges.map(range => {
          const tasksInRange = tasks.filter(task => {
            const cost = typeof task.cost === 'string' ? parseFloat(task.cost) : (task.cost || 0)
            // For Japanese, convert the cost to JPY before comparing with ranges
            const convertedCost = language === 'ja' ? cost * USD_TO_JPY_RATE : cost;
            return convertedCost >= range.min && convertedCost < range.max
          })

          const totalCost = tasksInRange.reduce((sum, task) => {
            const cost = typeof task.cost === 'string' ? parseFloat(task.cost) : (task.cost || 0)
            // Apply currency conversion if language is Japanese
            return sum + (cost * conversionRate)
          }, 0)

          return {
            range: range.label,
            count: tasksInRange.length,
            total: totalCost
          }
        }).filter(item => item.count > 0)

        setCostDistribution(distribution)
      }
    }

    fetchMaintenanceData()
  }, [dateRange, defaultDateRange.from, defaultDateRange.to, language])

  const handleDownloadReport = async (reportType: string) => {
    const endDate = dateRange?.to || new Date()
    const startDate = dateRange?.from || addMonths(endDate, -1)

    let data: any[] = []
    let filename = ''

    switch (reportType) {
      case 'maintenance':
        const { data: maintenanceData } = await supabase
          .from('maintenance_tasks')
          .select('*, vehicles(name)')
          .gte('completed_date', startDate.toISOString())
          .lte('completed_date', endDate.toISOString())
        data = maintenanceData || []
        filename = 'maintenance-history.csv'
        break
      case 'fuel':
        const { data: fuelData } = await supabase
          .from('fuel_logs')
          .select('*, vehicles(name)')
          .gte('date', startDate.toISOString())
          .lte('date', endDate.toISOString())
        data = fuelData || []
        filename = 'fuel-efficiency.csv'
        break
      case 'cost':
        const [maintenance, fuel] = await Promise.all([
          supabase
            .from('maintenance_tasks')
            .select('*, vehicles(name)')
            .gte('completed_date', startDate.toISOString())
            .lte('completed_date', endDate.toISOString()),
          supabase
            .from('fuel_logs')
            .select('*, vehicles(name)')
            .gte('date', startDate.toISOString())
            .lte('date', endDate.toISOString())
        ])
        data = [
          ...(maintenance.data || []).map(item => ({ ...item, type: 'maintenance' })),
          ...(fuel.data || []).map(item => ({ ...item, type: 'fuel' }))
        ]
        filename = 'cost-analysis.csv'
        break
      case 'combined':
        // Custom combined report
        const [customMaintenance, customFuel] = await Promise.all([
          customReportOptions.includeMaintenance ? 
            supabase
              .from('maintenance_tasks')
              .select('*, vehicles(name)')
              .gte('completed_date', startDate.toISOString())
              .lte('completed_date', endDate.toISOString()) : 
            { data: [] },
          customReportOptions.includeFuel ? 
            supabase
              .from('fuel_logs')
              .select('*, vehicles(name)')
              .gte('date', startDate.toISOString())
              .lte('date', endDate.toISOString()) : 
            { data: [] }
        ])
        
        data = [
          ...(customMaintenance.data || []).map(item => ({ ...item, category: 'maintenance' })),
          ...(customFuel.data || []).map(item => ({ ...item, category: 'fuel' }))
        ]
        
        filename = `custom-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
        break
    }

    if (data.length > 0) {
      const headers = Object.keys(data[0]).join(',')
      const rows = data.map(item => Object.values(item).join(','))
      const csv = [headers, ...rows].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      // If this was a custom report, add it to recent reports
      if (reportType === 'combined') {
        const newReport: RecentReport = {
          id: Date.now().toString(),
          name: customReportOptions.name || `Custom Report - ${format(new Date(), 'MMM d, yyyy')}`,
          type: 'custom',
          date: format(new Date(), 'MMM d, yyyy'),
          downloadUrl: '#'
        }
        
        setRecentReports(prev => [newReport, ...prev])
        setIsCustomReportDialogOpen(false)
      }
    }
  }
  
  const handleDownloadRecentReport = (report: RecentReport) => {
    // Determine report type and download
    handleDownloadReport(report.type)
  }

  const handleResetDateRange = () => {
    setDateRange(defaultDateRange)
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="h-4 w-4 mr-2" />
      case 'fuel':
        return <Fuel className="h-4 w-4 mr-2" />
      case 'cost':
        return <BarChart3 className="h-4 w-4 mr-2" />
      case 'custom':
        return <FileText className="h-4 w-4 mr-2" />
      default:
        return <FileText className="h-4 w-4 mr-2" />
    }
  }
  
  const handleCreateCustomReport = () => {
    if (!customReportOptions.name) {
      customReportOptions.name = `Custom Report - ${format(new Date(), 'MMM d, yyyy')}`
    }
    
    handleDownloadReport('combined')
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('reporting.title')}</h2>
            <p className="text-sm text-muted-foreground">{t('reporting.description')}</p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker defaultDateRange={defaultDateRange} onDateChange={setDateRange} />
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleResetDateRange}
              title={t('reporting.filters.reset')}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t('reporting.sections.overview')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('reporting.sections.analytics')}</TabsTrigger>
            <TabsTrigger value="reports">{t('reporting.sections.reports.title')}</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab - For quick glance at key metrics */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Overview dateRange={dateRange || defaultDateRange} />
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t('reporting.sections.maintenanceMetrics.totalCost')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currencySymbol}{maintenanceCosts.total.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('reporting.sections.maintenanceMetrics.scheduledCost')}: {currencySymbol}{maintenanceCosts.scheduled.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('reporting.sections.maintenanceMetrics.unscheduledCost')}: {currencySymbol}{maintenanceCosts.unscheduled.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('reporting.sections.maintenanceFrequency.title')}</CardTitle>
                  <CardDescription>{t('reporting.sections.maintenanceFrequency.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <MaintenanceFrequencyChart dateRange={dateRange || defaultDateRange} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('reporting.sections.vehicleAvailability.title')}</CardTitle>
                  <CardDescription>{t('reporting.sections.vehicleAvailability.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <VehicleAvailabilityChart dateRange={dateRange || defaultDateRange} />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('reporting.sections.vehiclePerformance.title')}</CardTitle>
                <CardDescription>{t('reporting.sections.vehiclePerformance.description')}</CardDescription>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <VehiclePerformance dateRange={dateRange || defaultDateRange} />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Analytics Tab - For detailed analysis */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('reporting.sections.fuelConsumption.title')}</CardTitle>
                  <CardDescription>{t('reporting.sections.fuelConsumption.description')}</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <FuelConsumptionChart dateRange={dateRange || defaultDateRange} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('reporting.sections.monthlyMileage.title')}</CardTitle>
                  <CardDescription>{t('reporting.sections.monthlyMileage.description')}</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <MonthlyMileageChart dateRange={dateRange || defaultDateRange} />
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('reporting.sections.maintenanceCosts.title')}</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('reporting.sections.maintenanceCosts.range')}</TableHead>
                        <TableHead>{t('reporting.sections.maintenanceCosts.count')}</TableHead>
                        <TableHead className="text-right">{t('reporting.sections.maintenanceCosts.total')}</TableHead>
                        <TableHead className="text-right">{t('reporting.sections.maintenanceCosts.average')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costDistribution.length > 0 ? (
                        costDistribution.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.range.replace('$', currencySymbol)}</TableCell>
                            <TableCell>{item.count}</TableCell>
                            <TableCell className="text-right">{currencySymbol}{item.total.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{currencySymbol}{(item.total / item.count).toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            {t('reporting.noData')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('reporting.sections.costPerKm.title')}</CardTitle>
                  <CardDescription>{t('reporting.sections.costPerKm.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <CostPerKmChart dateRange={dateRange || defaultDateRange} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Reports Tab - For downloading reports */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b">
                  <CardTitle>{t('reporting.sections.reports.maintenance')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('reporting.sections.reports.maintenanceDescription')}
                  </p>
                  <div className="space-y-3">
                    <Button 
                      className="w-full"
                      onClick={() => handleDownloadReport('maintenance')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('reporting.sections.reports.downloadCSV')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b">
                  <CardTitle>{t('reporting.sections.reports.fuel')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('reporting.sections.reports.fuelDescription')}
                  </p>
                  <div className="space-y-3">
                    <Button 
                      className="w-full"
                      onClick={() => handleDownloadReport('fuel')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('reporting.sections.reports.downloadCSV')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b">
                  <CardTitle>{t('reporting.sections.reports.cost')}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('reporting.sections.reports.costDescription')}
                  </p>
                  <div className="space-y-3">
                    <Button 
                      className="w-full"
                      onClick={() => handleDownloadReport('cost')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('reporting.sections.reports.downloadCSV')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Custom Report Section */}
            <div className="mt-8">
              <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <PlusCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">{t('reporting.sections.reports.createCustomReport')}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('reporting.sections.reports.customReportDescription')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Dialog open={isCustomReportDialogOpen} onOpenChange={setIsCustomReportDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="md:w-auto w-full">
                          {t('reporting.sections.reports.createCustomReport')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>{t('reporting.sections.reports.createCustomReport')}</DialogTitle>
                          <DialogDescription>
                            {t('reporting.sections.reports.customReportDescription')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="report-name">{t('reporting.sections.reports.reportName')}</Label>
                            <Input
                              id="report-name"
                              placeholder={t('reporting.sections.reports.reportName')}
                              value={customReportOptions.name}
                              onChange={(e) => setCustomReportOptions({
                                ...customReportOptions,
                                name: e.target.value
                              })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>{t('reporting.sections.reports.reportType')}</Label>
                            <Select 
                              value={customReportOptions.reportType}
                              onValueChange={(value) => setCustomReportOptions({
                                ...customReportOptions,
                                reportType: value
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('reporting.sections.reports.reportType')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="combined">{t('reporting.sections.reports.customReport')}</SelectItem>
                                <SelectItem value="maintenance">{t('reporting.sections.reports.maintenance')}</SelectItem>
                                <SelectItem value="fuel">{t('reporting.sections.reports.fuel')}</SelectItem>
                                <SelectItem value="cost">{t('reporting.sections.reports.cost')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>{t('reporting.sections.reports.includeData')}</Label>
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="include-vehicles" 
                                  checked={customReportOptions.includeVehicles}
                                  onCheckedChange={(checked) => setCustomReportOptions({
                                    ...customReportOptions,
                                    includeVehicles: checked as boolean
                                  })}
                                />
                                <label
                                  htmlFor="include-vehicles"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {t('reporting.sections.reports.vehicleInformation')}
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="include-maintenance" 
                                  checked={customReportOptions.includeMaintenance}
                                  onCheckedChange={(checked) => setCustomReportOptions({
                                    ...customReportOptions,
                                    includeMaintenance: checked as boolean
                                  })}
                                />
                                <label
                                  htmlFor="include-maintenance"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {t('reporting.sections.reports.maintenanceData')}
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="include-fuel" 
                                  checked={customReportOptions.includeFuel}
                                  onCheckedChange={(checked) => setCustomReportOptions({
                                    ...customReportOptions,
                                    includeFuel: checked as boolean
                                  })}
                                />
                                <label
                                  htmlFor="include-fuel"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {t('reporting.sections.reports.fuelData')}
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="include-costs" 
                                  checked={customReportOptions.includeCosts}
                                  onCheckedChange={(checked) => setCustomReportOptions({
                                    ...customReportOptions,
                                    includeCosts: checked as boolean
                                  })}
                                />
                                <label
                                  htmlFor="include-costs"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {t('reporting.sections.reports.costAnalysis')}
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsCustomReportDialogOpen(false)}>
                            {t('reporting.sections.reports.cancel')}
                          </Button>
                          <Button onClick={handleCreateCustomReport}>
                            {t('reporting.sections.reports.generateReport')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Reports Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                  {t('reporting.sections.reports.recentReports')}
                </h3>
              </div>
              
              <Card className="border-0 shadow-sm">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('reporting.sections.reports.title')}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t('common.status.type')}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t('inspections.fields.date')}</TableHead>
                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentReports.length > 0 ? (
                        recentReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                {getReportIcon(report.type)}
                                <span className="truncate">{report.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 sm:hidden">
                                <span className="capitalize">{report.type}</span> • {report.date}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge 
                                variant="outline" 
                                className={`capitalize ${
                                  report.type === 'maintenance' ? 'border-primary text-primary' : 
                                  report.type === 'fuel' ? 'border-blue-500 text-blue-500' : 
                                  report.type === 'cost' ? 'border-green-500 text-green-500' :
                                  'border-gray-500 text-gray-500'
                                }`}
                              >
                                {report.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{report.date}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2"
                                onClick={() => handleDownloadRecentReport(report)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            {t('reporting.noData')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
} 