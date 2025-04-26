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

// Types
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

// Type guard to check if an object matches MaintenanceTask structure
function isMaintenanceTask(obj: any): obj is MaintenanceTask {
  return (
    obj &&
    typeof obj === 'object' &&
    'cost' in obj &&
    'title' in obj &&
    typeof obj.title === 'string'
  );
}

// Exchange rate
const USD_TO_JPY_RATE = 150;

export default function ReportingPage() {
  const { lang } = useParams();
  const language = Array.isArray(lang) ? lang[0] : lang || 'en';
  const { t } = useI18n();
  
  // Safer translation function that ensures string return values
  const safeT = (key: string, params?: Record<string, string | undefined>): string => {
    try {
      const result = t(key, params);
      if (typeof result !== 'string') {
        // If we're getting an object instead of a string, return a fallback
        return typeof params?.defaultValue === 'string' ? params.defaultValue : key.split('.').pop() || key;
      }
      return result;
    } catch (error) {
      console.warn(`Translation error for key: ${key}`, error);
      return typeof params?.defaultValue === 'string' ? params.defaultValue : key.split('.').pop() || key;
    }
  };

  // State
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [maintenanceCosts, setMaintenanceCosts] = useState({
    total: 0,
    scheduled: 0,
    unscheduled: 0
  });
  const [costDistribution, setCostDistribution] = useState<Array<{
    range: string;
    count: number;
    total: number;
  }>>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [customReportOptions, setCustomReportOptions] = useState<CustomReportOptions>({
    name: "",
    reportType: "combined",
    includeVehicles: true,
    includeMaintenance: true,
    includeFuel: true,
    includeCosts: true
  });
  const [isCustomReportDialogOpen, setIsCustomReportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Default values
  const today = new Date();
  const defaultDateRange = {
    from: addMonths(today, -1),
    to: today
  } as const;

  // Get the currency symbol based on language
  const currencySymbol = language === 'ja' ? '¥' : '$';

  // Initialize dateRange with default values
  useEffect(() => {
    if (!dateRange) {
      setDateRange(defaultDateRange);
    }
  }, []);

  // Fetch mock recent reports
  useEffect(() => {
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
    ];
    setRecentReports(mockRecentReports);
  }, []);

  // Fetch maintenance data
  useEffect(() => {
    async function fetchMaintenanceData() {
      if (!dateRange?.from || !dateRange?.to) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('maintenance_tasks')
          .select('cost, title')
          .gte('completed_date', dateRange.from.toISOString())
          .lte('completed_date', dateRange.to.toISOString());

        if (error) {
          console.error('Error fetching maintenance data:', error);
          setMaintenanceCosts({ total: 0, scheduled: 0, unscheduled: 0 });
          setCostDistribution([]);
          return;
        }

        // Process data only if it's a valid array
        if (Array.isArray(data)) {
          const validTasks = data.filter(isMaintenanceTask);
          
          // Calculate costs
          const costs = validTasks.reduce((acc, task) => {
            const cost = typeof task.cost === 'string' ? parseFloat(task.cost) : (Number(task.cost) || 0);
            const isScheduled = task.title.toLowerCase().includes('scheduled') || 
                              task.title.toLowerCase().includes('routine') ||
                              task.title.toLowerCase().includes('planned');
            
            return {
              total: acc.total + cost,
              scheduled: acc.scheduled + (isScheduled ? cost : 0),
              unscheduled: acc.unscheduled + (isScheduled ? 0 : cost)
            };
          }, { total: 0, scheduled: 0, unscheduled: 0 });

          // Apply currency conversion if needed
          const conversionRate = language === 'ja' ? USD_TO_JPY_RATE : 1;
          setMaintenanceCosts({
            total: costs.total * conversionRate,
            scheduled: costs.scheduled * conversionRate,
            unscheduled: costs.unscheduled * conversionRate
          });

          // Calculate cost distribution based on ranges
          const ranges = language === 'ja' 
            ? [
                { min: 0, max: 15000, label: '¥0-15,000' },
                { min: 15000, max: 75000, label: '¥15,000-75,000' },
                { min: 75000, max: 150000, label: '¥75,000-150,000' },
                { min: 150000, max: 300000, label: '¥150,000-300,000' },
                { min: 300000, max: Infinity, label: '¥300,000+' }
              ]
            : [
                { min: 0, max: 100, label: '$0-100' },
                { min: 100, max: 500, label: '$100-500' },
                { min: 500, max: 1000, label: '$500-1000' },
                { min: 1000, max: 2000, label: '$1000-2000' },
                { min: 2000, max: Infinity, label: '$2000+' }
              ];

          const distribution = ranges.map(range => {
            const tasksInRange = validTasks.filter(task => {
              const cost = typeof task.cost === 'string' ? parseFloat(task.cost) : (Number(task.cost) || 0);
              const convertedCost = language === 'ja' ? cost * USD_TO_JPY_RATE : cost;
              return convertedCost >= range.min && convertedCost < range.max;
            });

            const totalCost = tasksInRange.reduce((sum, task) => {
              const cost = typeof task.cost === 'string' ? parseFloat(task.cost) : (Number(task.cost) || 0);
              return sum + (cost * conversionRate);
            }, 0);

            return {
              range: range.label,
              count: tasksInRange.length,
              total: totalCost
            };
          }).filter(item => item.count > 0);

          setCostDistribution(distribution);
        } else {
          setMaintenanceCosts({ total: 0, scheduled: 0, unscheduled: 0 });
          setCostDistribution([]);
        }
      } catch (err) {
        console.error('Error processing maintenance data:', err);
        setMaintenanceCosts({ total: 0, scheduled: 0, unscheduled: 0 });
        setCostDistribution([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMaintenanceData();
  }, [dateRange, language]);

  // Handlers
  const handleDownloadReport = (reportType: string) => {
    console.log(`Downloading report: ${reportType}`);
    // Implementation for actual download would go here
  };

  const handleDownloadRecentReport = (report: RecentReport) => {
    console.log(`Downloading recent report: ${report.name}`);
    // Implementation for actual download would go here
  };

  const handleResetDateRange = () => {
    setDateRange({
      from: defaultDateRange.from,
      to: defaultDateRange.to
    });
  };

  const handleCreateCustomReport = () => {
    console.log('Creating custom report with options:', customReportOptions);
    setIsCustomReportDialogOpen(false);
  };

  // UI helpers
  const getReportIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      case 'fuel':
        return <Fuel className="h-4 w-4" />;
      case 'cost':
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Format numbers with the appropriate currency
  const formatCurrency = (value: number) => {
    return `${currencySymbol}${value.toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{safeT('reporting.title', { defaultValue: 'Reports & Analytics' })}</h1>
          <p className="text-muted-foreground">
            {safeT('reporting.description', { defaultValue: 'View detailed reports and analytics for your vehicle fleet' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={safeT('common.selectDateRange', { defaultValue: 'Select date range' })}
          />
          <Button variant="outline" size="icon" onClick={handleResetDateRange}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-3 h-auto">
          <TabsTrigger value="overview">{safeT('reporting.sections.overview', { defaultValue: 'Overview' })}</TabsTrigger>
          <TabsTrigger value="analytics">{safeT('reporting.sections.analytics', { defaultValue: 'Analytics' })}</TabsTrigger>
          <TabsTrigger value="reports">{safeT('reporting.sections.reports.title', { defaultValue: 'Reports' })}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">{safeT('reporting.sections.vehiclePerformance.distance', { defaultValue: 'Distance (km)' })}</p>
                  <p className="text-xl sm:text-2xl font-bold">0 km</p>
                  <p className="text-xs sm:text-sm text-green-500">
                    ↑ 0.0% {safeT('reporting.fromPreviousPeriod', { defaultValue: 'from previous period' })}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">{safeT('reporting.sections.fuelConsumption.title', { defaultValue: 'Fuel Consumption' })}</p>
                  <p className="text-xl sm:text-2xl font-bold">0 L</p>
                  <p className="text-xs sm:text-sm text-green-500">
                    ↓ 0.0% {safeT('reporting.fromPreviousPeriod', { defaultValue: 'from previous period' })}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">{safeT('reporting.sections.vehiclePerformance.efficiency', { defaultValue: 'Efficiency (km/L)' })}</p>
                  <p className="text-xl sm:text-2xl font-bold">0.0 km/L</p>
                  <p className="text-xs sm:text-sm text-green-500">
                    ↑ 0.0% {safeT('reporting.fromPreviousPeriod', { defaultValue: 'from previous period' })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{safeT('reporting.sections.maintenanceMetrics.costOverTime', { defaultValue: 'Maintenance Cost' })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <div className="text-2xl font-bold">{formatCurrency(maintenanceCosts.total)}</div>
                <div className="text-sm text-muted-foreground">
                  {safeT('reporting.sections.maintenanceMetrics.scheduledCost', { defaultValue: 'Scheduled Maintenance' })}: {formatCurrency(maintenanceCosts.scheduled)}
                  <br />
                  {safeT('reporting.sections.maintenanceMetrics.unscheduledCost', { defaultValue: 'Unscheduled Maintenance' })}: {formatCurrency(maintenanceCosts.unscheduled)}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{safeT('reporting.sections.maintenanceFrequency.title', { defaultValue: 'Maintenance Frequency' })}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">{safeT('common.loading', { defaultValue: 'Loading...' })}</p>
                  </div>
                ) : costDistribution.length > 0 ? (
                  <MaintenanceFrequencyChart />
                ) : (
                  <p className="text-center py-12 text-muted-foreground">{safeT('reporting.noData', { defaultValue: 'No data available' })}</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{safeT('reporting.sections.vehicleAvailability.title', { defaultValue: 'Vehicle Availability' })}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">{safeT('common.loading', { defaultValue: 'Loading...' })}</p>
                  </div>
                ) : (
                  <p className="text-center py-12 text-muted-foreground">{safeT('reporting.noData', { defaultValue: 'No data available' })}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{safeT('reporting.sections.fuelConsumption.title', { defaultValue: 'Fuel Consumption Trend' })}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">{safeT('common.loading', { defaultValue: 'Loading...' })}</p>
                  </div>
                ) : (
                  <FuelConsumptionChart dateRange={dateRange || defaultDateRange} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{safeT('reporting.sections.monthlyMileage.title', { defaultValue: 'Monthly Mileage Trend' })}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">{safeT('common.loading', { defaultValue: 'Loading...' })}</p>
                  </div>
                ) : (
                  <MonthlyMileageChart dateRange={dateRange || defaultDateRange} />
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid md:grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{safeT('reporting.sections.vehiclePerformance.title', { defaultValue: 'Vehicle Performance' })}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">{safeT('common.loading', { defaultValue: 'Loading...' })}</p>
                  </div>
                ) : (
                  <VehiclePerformance dateRange={dateRange || defaultDateRange} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{safeT('reporting.sections.reports.maintenance', { defaultValue: 'Maintenance History Report' })}</CardTitle>
                <CardDescription>{safeT('reporting.sections.reports.maintenanceDescription', { defaultValue: 'Detailed maintenance records for each vehicle' })}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => handleDownloadReport('maintenance-history')}>
                  <Download className="h-4 w-4 mr-2" /> 
                  {safeT('reporting.sections.reports.downloadCSV', { defaultValue: 'Download CSV' })}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{safeT('reporting.sections.reports.fuel', { defaultValue: 'Fuel Efficiency Report' })}</CardTitle>
                <CardDescription>{safeT('reporting.sections.reports.fuelDescription', { defaultValue: 'Fuel consumption and efficiency analysis' })}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => handleDownloadReport('fuel-efficiency')}>
                  <Download className="h-4 w-4 mr-2" /> 
                  {safeT('reporting.sections.reports.downloadCSV', { defaultValue: 'Download CSV' })}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{safeT('reporting.sections.reports.cost', { defaultValue: 'Cost Analysis Report' })}</CardTitle>
                <CardDescription>{safeT('reporting.sections.reports.costDescription', { defaultValue: 'Detailed breakdown of all vehicle-related costs' })}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => handleDownloadReport('cost-analysis')}>
                  <Download className="h-4 w-4 mr-2" /> 
                  {safeT('reporting.sections.reports.downloadCSV', { defaultValue: 'Download CSV' })}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-muted/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{safeT('reporting.sections.reports.customReport', { defaultValue: 'Custom Report' })}</CardTitle>
                <CardDescription>{safeT('reporting.sections.reports.customReportDescription', { defaultValue: 'Combine data from multiple sources into a single report' })}</CardDescription>
              </div>
              <Button onClick={() => setIsCustomReportDialogOpen(true)}>
                {safeT('reporting.sections.reports.generateReport', { defaultValue: 'Generate Report' })}
              </Button>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{safeT('reporting.sections.reports.recentReports', { defaultValue: 'Recent Reports' })}</CardTitle>
              <CardDescription>{safeT('common.recentActivity', { defaultValue: 'Your recently generated reports' })}</CardDescription>
            </CardHeader>
            <CardContent>
              {recentReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{safeT('reporting.sections.reports.reportName', { defaultValue: 'Report Name' })}</TableHead>
                      <TableHead>{safeT('reporting.sections.reports.reportType', { defaultValue: 'Report Type' })}</TableHead>
                      <TableHead>{safeT('common.date', { defaultValue: 'Date' })}</TableHead>
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
                            <span className="ml-2">
                              {report.type === 'maintenance' && safeT('reporting.sections.vehiclePerformance.maintenance', { defaultValue: 'Maintenance' })}
                              {report.type === 'fuel' && safeT('reporting.sections.vehiclePerformance.fuel', { defaultValue: 'Fuel' })}
                              {report.type === 'cost' && safeT('common.cost', { defaultValue: 'Cost' })}
                            </span>
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
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">{safeT('common.noResults', { defaultValue: 'No reports found' })}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Custom Report Dialog */}
      <Dialog open={isCustomReportDialogOpen} onOpenChange={setIsCustomReportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {safeT('reporting.sections.reports.customReport', { defaultValue: 'Custom Report' })}
            </DialogTitle>
            <DialogDescription>
              {safeT('reporting.sections.reports.customReportDescription', { defaultValue: 'Combine data from multiple sources into a single report' })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="report-name" className="col-span-4">
                {safeT('reporting.sections.reports.reportName', { defaultValue: 'Report Name' })}
              </Label>
              <Input
                id="report-name"
                value={customReportOptions.name}
                onChange={(e) => setCustomReportOptions({ ...customReportOptions, name: e.target.value })}
                className="col-span-4"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="report-type" className="col-span-4">
                {safeT('reporting.sections.reports.reportType', { defaultValue: 'Report Type' })}
              </Label>
              <Select
                value={customReportOptions.reportType}
                onValueChange={(value) => setCustomReportOptions({ ...customReportOptions, reportType: value })}
              >
                <SelectTrigger className="col-span-4">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">Combined</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="cost">Cost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="mb-2">
                {safeT('reporting.sections.reports.includeData', { defaultValue: 'Include Data' })}
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vehicle-info"
                  checked={customReportOptions.includeVehicles}
                  onCheckedChange={(checked) => 
                    setCustomReportOptions({ ...customReportOptions, includeVehicles: checked as boolean })
                  }
                />
                <label
                  htmlFor="vehicle-info"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {safeT('reporting.sections.reports.vehicleInformation', { defaultValue: 'Vehicle Information' })}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="maintenance-data"
                  checked={customReportOptions.includeMaintenance}
                  onCheckedChange={(checked) => 
                    setCustomReportOptions({ ...customReportOptions, includeMaintenance: checked as boolean })
                  }
                />
                <label
                  htmlFor="maintenance-data"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {safeT('reporting.sections.reports.maintenanceData', { defaultValue: 'Maintenance Data' })}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fuel-data"
                  checked={customReportOptions.includeFuel}
                  onCheckedChange={(checked) => 
                    setCustomReportOptions({ ...customReportOptions, includeFuel: checked as boolean })
                  }
                />
                <label
                  htmlFor="fuel-data"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {safeT('reporting.sections.reports.fuelData', { defaultValue: 'Fuel Data' })}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cost-analysis"
                  checked={customReportOptions.includeCosts}
                  onCheckedChange={(checked) => 
                    setCustomReportOptions({ ...customReportOptions, includeCosts: checked as boolean })
                  }
                />
                <label
                  htmlFor="cost-analysis"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {safeT('reporting.sections.reports.costAnalysis', { defaultValue: 'Cost Analysis' })}
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomReportDialogOpen(false)}>
              {safeT('reporting.sections.reports.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" onClick={handleCreateCustomReport}>
              {safeT('reporting.sections.reports.generateReport', { defaultValue: 'Generate Report' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}