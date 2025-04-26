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
import { supabase } from "@/lib/supabase/client"
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
import { useParams } from 'next/navigation'

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

interface MaintenanceTask {
  cost: number | string | null
  title: string
}

// Exchange rate: 1 USD = approximately 150 JPY (as of 2023)
const USD_TO_JPY_RATE = 150;

export default function ReportingPage() {
  const { lang } = useParams()
  const language = Array.isArray(lang) ? lang[0] : lang || 'en'
  const { t: translate } = useI18n()
  
  // Enhanced translation function for reporting page
  const t = (key: string): string => {
    try {
      // Get direct translation, but handle non-string returns
      const directTranslation = translate(key);
      
      // If it's a string, return it
      if (typeof directTranslation === 'string') {
        return directTranslation;
      }
      
      // Handle special cases for nested objects
      if (key.startsWith('reporting.')) {
        // The key exists in the translation files but returned a non-string value
        // This means it's probably an object, so we need to resolve to a leaf node
        return key; // Fallback to the key itself
      }
      
      // Return the key as a fallback
      return key;
    } catch (error) {
      console.error(`Translation error for key "${key}":`, error);
      return key;
    }
  };
  
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

  // Initialize dateRange with default values
  useEffect(() => {
    if (!dateRange) {
      setDateRange(defaultDateRange)
    }
  }, [dateRange])

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
      const { data: tasks, error } = await supabase
        .from('maintenance_tasks')
        .select('cost, title')
        .gte('completed_date', dateRange?.from?.toISOString() || defaultDateRange.from.toISOString())
        .lte('completed_date', dateRange?.to?.toISOString() || defaultDateRange.to.toISOString())

      if (error) {
        console.error('Error fetching maintenance data:', error);
        return;
      }

      if (tasks) {
        const costs = tasks.reduce((acc: { total: number; scheduled: number; unscheduled: number }, task: MaintenanceTask) => {
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
          const tasksInRange = tasks.filter((task: MaintenanceTask) => {
            const cost = typeof task.cost === 'string' ? parseFloat(task.cost) : (task.cost || 0)
            // For Japanese, convert the cost to JPY before comparing with ranges
            const convertedCost = language === 'ja' ? cost * USD_TO_JPY_RATE : cost;
            return convertedCost >= range.min && convertedCost < range.max
          })

          const totalCost = tasksInRange.reduce((sum: number, task: MaintenanceTask) => {
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
    // Implementation for report download...
  }

  const handleDownloadRecentReport = (report: RecentReport) => {
    // Implementation for recent report download...
  }

  const handleResetDateRange = () => {
    setDateRange({
      from: defaultDateRange.from,
      to: defaultDateRange.to
    })
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="h-4 w-4" />
      case 'fuel':
        return <Fuel className="h-4 w-4" />
      case 'cost':
        return <BarChart3 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const handleCreateCustomReport = () => {
    setIsCustomReportDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('reporting.title')}</h1>
          <p className="text-muted-foreground">
            {t('reporting.description') || "Analyze fleet performance and generate custom reports"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={t('reporting.selectDateRange')}
          />
          <Button variant="outline" size="icon" onClick={handleResetDateRange}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-3 h-auto">
          <TabsTrigger value="overview">{t('reporting.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('reporting.tabs.analytics')}</TabsTrigger>
          <TabsTrigger value="reports">{t('reporting.tabs.reports')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">{t('reporting.sections.vehiclePerformance.distance')}</p>
                  <p className="text-xl sm:text-2xl font-bold">0 km</p>
                  <p className="text-xs sm:text-sm text-green-500">
                    ↑ 0.0% {t('reporting.fromPreviousPeriod')}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">{t('reporting.sections.fuelConsumption.title')}</p>
                  <p className="text-xl sm:text-2xl font-bold">0 L</p>
                  <p className="text-xs sm:text-sm text-green-500">
                    ↓ 0.0% {t('reporting.fromPreviousPeriod')}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">{t('reporting.sections.vehiclePerformance.efficiency')}</p>
                  <p className="text-xl sm:text-2xl font-bold">0.0 km/L</p>
                  <p className="text-xs sm:text-sm text-green-500">
                    ↑ 0.0% {t('reporting.fromPreviousPeriod')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{t('reporting.maintenanceCost')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <div className="text-2xl font-bold">{currencySymbol}0.00</div>
                <div className="text-sm text-muted-foreground">
                  {t('reporting.scheduledMaintenanceColon')} {currencySymbol}0.00
                  <br />
                  {t('reporting.unscheduledMaintenanceColon')} {currencySymbol}0.00
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('reporting.maintenanceFrequency')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-12 text-muted-foreground">{t('reporting.noDataAvailable')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('reporting.vehicleAvailability')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center py-12 text-muted-foreground">{t('reporting.noDataAvailable')}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('reporting.fuelConsumption')}</CardTitle>
              </CardHeader>
              <CardContent>
                <FuelConsumptionChart dateRange={dateRange || defaultDateRange} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('reporting.monthlyMileage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyMileageChart dateRange={dateRange || defaultDateRange} />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('reporting.vehiclePerformance')}</CardTitle>
              </CardHeader>
              <CardContent>
                <VehiclePerformance dateRange={dateRange || defaultDateRange} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('reporting.maintenanceHistoryReport')}</CardTitle>
                <CardDescription>{t('reporting.detailedMaintenanceRecords')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => handleDownloadReport('maintenance-history')}>
                  <Download className="h-4 w-4 mr-2" /> {t('reporting.downloadCsv')}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('reporting.fuelEfficiencyReport')}</CardTitle>
                <CardDescription>{t('reporting.fuelConsumptionAnalysis')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => handleDownloadReport('fuel-efficiency')}>
                  <Download className="h-4 w-4 mr-2" /> {t('reporting.downloadCsv')}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('reporting.costAnalysisReport')}</CardTitle>
                <CardDescription>{t('reporting.detailedBreakdown')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => handleDownloadReport('cost-analysis')}>
                  <Download className="h-4 w-4 mr-2" /> {t('reporting.downloadCsv')}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-muted/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{t('reporting.createCustomReport')}</CardTitle>
                <CardDescription>{t('reporting.combineDataSources')}</CardDescription>
              </div>
              <Button onClick={() => setIsCustomReportDialogOpen(true)}>
                {t('reporting.createReport')}
              </Button>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t('reporting.recentReports')}</CardTitle>
              <CardDescription>{t('reporting.recentReportsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reporting.reportName')}</TableHead>
                    <TableHead>{t('reporting.reportType')}</TableHead>
                    <TableHead>{t('reporting.date')}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getReportIcon(report.type)}
                          <span className="ml-2">{t(`reporting.reportType.${report.type}`)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{report.date}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="icon" onClick={() => handleDownloadRecentReport(report)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}