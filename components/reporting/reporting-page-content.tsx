"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, RotateCcw, FileText, BarChart3, Fuel, Wrench, Clock, Calendar, Filter, ChevronRight, PlusCircle } from "lucide-react"
import { CalendarDateRangePicker } from "@/components/date-range-picker"
import { getSupabaseClient } from "@/lib/supabase/client"
import { addMonths, format, parseISO } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useParams, useRouter } from 'next/navigation'
import { CostPerKmChart } from "@/components/reporting/cost-per-km-chart"
import { CostPerKmDataPoint } from "@/app/(dashboard)/reporting/page"
import { createCustomReportAction } from "@/app/(dashboard)/reporting/actions"
import { useToast } from "@/components/ui/use-toast"

// Server data type for recent reports (matches what ReportingPageServer provides)
interface RecentReportServerData {
  id: string;
  name: string;
  type: string;
  created_at: string; // ISO string from Supabase
  downloadUrl: string | null;
}

// Client-side display type
interface RecentReport {
  id: string;
  name: string;
  type: string;
  date: string; // Formatted string
  downloadUrl: string | null;
}

interface CustomReportOptions {
  name: string
  reportType: string
  includeVehicles: boolean
  includeMaintenance: boolean
  includeFuel: boolean
  includeCosts: boolean
}

// Define prop types for initial data
interface ReportingPageContentProps {
  initialDateRange: DateRange;
  initialRecentReports: RecentReportServerData[];
  initialCostPerKmData?: CostPerKmDataPoint[];
}

export default function ReportingPageContent({
  initialDateRange,
  initialRecentReports,
  initialCostPerKmData,
}: ReportingPageContentProps) {
  const params = useParams();
  const router = useRouter(); // For updating URL
  const langParam = params?.lang;
  const language = Array.isArray(langParam) ? langParam[0] : langParam || 'en';
  const { toast } = useToast();
  const { t } = useI18n();
  
  const safeT = (key: string, params?: Record<string, string | undefined>): string => {
    try {
      const result = t(key, params);
      if (typeof result !== 'string') {
        return typeof params?.defaultValue === 'string' ? params.defaultValue : key.split('.').pop() || key;
      }
      return result;
    } catch (error) {
      console.warn(`Translation error for key: ${key}`, error);
      return typeof params?.defaultValue === 'string' ? params.defaultValue : key.split('.').pop() || key;
    }
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange);
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
  const [isLoading, setIsLoading] = useState(false); // Keep for client-side actions if any
  const [costPerKmData, setCostPerKmData] = useState<CostPerKmDataPoint[]>(initialCostPerKmData || []);

  const today = new Date(); // Keep for default calculations if needed
  const defaultDateRangeProp = { // Renamed to avoid conflict if used
    from: addMonths(today, -1),
    to: today
  } as const;

  // Use initialRecentReports prop to set state
  useEffect(() => {
    if (initialRecentReports && Array.isArray(initialRecentReports)) {
      const reports: RecentReport[] = initialRecentReports.map(
        (serverReport: RecentReportServerData): RecentReport => {
          return {
            id: serverReport.id,
            name: serverReport.name,
            type: serverReport.type,
            downloadUrl: serverReport.downloadUrl,
            date: format(parseISO(serverReport.created_at), 'MMM d, yyyy')
          };
        }
      );
      setRecentReports(reports);
    } else {
      setRecentReports([]);
    }
  }, [initialRecentReports]);

  // Use initialCostPerKmData prop to set state
  useEffect(() => {
    if (initialCostPerKmData) {
      setCostPerKmData(initialCostPerKmData);
    }
  }, [initialCostPerKmData]);

  // Update dateRange state and push to router to trigger server refetch
  const handleDateRangeSelect = (newRange: DateRange | undefined) => {
    if (newRange?.from && newRange?.to) {
      setDateRange(newRange); // Update local state for immediate UI feedback
      const currentPath = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('from', format(newRange.from, 'yyyy-MM-dd'));
      searchParams.set('to', format(newRange.to, 'yyyy-MM-dd'));
      router.push(`${currentPath}?${searchParams.toString()}` as any); // HACK: Cast to any to bypass strict RouteImpl typing if issues persist
    }
  };
  
  const handleDownloadReport = (reportType: string) => {
    console.log(`Downloading report: ${reportType}`);
  };

  const handleDownloadRecentReport = (report: RecentReport) => {
    console.log(`Downloading recent report: ${report.name}`);
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    } else {
      // TODO: Implement toast notification for missing URL
      console.warn("Download URL is missing for this report.");
    }
  };

  const handleResetDateRange = () => {
    const newRange = {
      from: addMonths(today, -1), // Use fresh default
      to: today
    };
    setDateRange(newRange);
    const currentPath = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('from', format(newRange.from, 'yyyy-MM-dd'));
    searchParams.set('to', format(newRange.to, 'yyyy-MM-dd'));
    router.push(`${currentPath}?${searchParams.toString()}` as any); // HACK: Cast to any to bypass strict RouteImpl typing if issues persist
  };

  const handleCreateCustomReport = async () => {
    setIsLoading(true);
    const result = await createCustomReportAction(customReportOptions, dateRange);
    setIsLoading(false);

    if (result.success && result.report) {
      setIsCustomReportDialogOpen(false);
      // Optionally, update recentReports state to include the new report immediately
      // Or rely on page revalidation triggered by the server action
      setRecentReports(prevReports => [
        {
          id: result.report!.id,
          name: result.report!.name,
          type: result.report!.type,
          date: format(parseISO(result.report!.created_at), 'MMM d, yyyy'),
          downloadUrl: result.report!.downloadUrl,
        },
        ...prevReports,
      ]);
      toast({
        title: safeT('reporting.notifications.reportGenerating', {defaultValue: "Report Generation Started"}),
        description: safeT('reporting.notifications.reportWillAppear', {defaultValue: "Your report is being generated and will appear in the recent reports list shortly."}),
      });
    } else {
      toast({
        title: safeT('reporting.notifications.reportErrorTitle', {defaultValue: "Error Generating Report"}),
        description: result.error || safeT('reporting.notifications.reportErrorDescription', {defaultValue: "An unexpected error occurred."}),
        variant: "destructive",
      });
    }
  };

  const getReportIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'maintenance':
      case 'maintenance_detail':
        return <Wrench className="h-4 w-4" />;
      case 'fuel':
      case 'fuel_log':
        return <Fuel className="h-4 w-4" />;
      case 'cost':
      case 'cost_analysis':
        return <BarChart3 className="h-4 w-4" />;
      case 'vehicle_summary':
        return <Calendar className="h-4 w-4" />;
      default: // combined, etc.
        return <FileText className="h-4 w-4" />;
    }
  };

  // Initialize dateRange from props only once
  useEffect(() => {
    setDateRange(initialDateRange);
  }, [initialDateRange]);

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
          <CalendarDateRangePicker
            date={dateRange}
            onSelect={handleDateRangeSelect} // Use new handler
          />
          <Button variant="outline" size="icon" onClick={handleResetDateRange}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="grid grid-cols-1 h-auto">
          <TabsTrigger value="reports">{safeT('reporting.sections.reports.title', { defaultValue: 'Reports' })}</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{safeT('reporting.sections.reports.generate.title', { defaultValue: 'Generate Custom Report' })}</CardTitle>
              <CardDescription>{safeT('reporting.sections.reports.generate.description', { defaultValue: 'Create and download custom reports based on your selected criteria.' })}</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isCustomReportDialogOpen} onOpenChange={setIsCustomReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {safeT('reporting.sections.reports.generate.button', { defaultValue: 'Create New Report' })}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{safeT('reporting.sections.reports.generate.dialog.title', { defaultValue: 'Create Custom Report' })}</DialogTitle>
                    <DialogDescription>{safeT('reporting.sections.reports.generate.dialog.description', { defaultValue: 'Configure the options for your new report.' })}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="customReportName">{safeT('reporting.sections.reports.customReport.nameLabel', { defaultValue: 'Report Name' })}</Label>
                      <Input
                        id="customReportName"
                        value={customReportOptions.name}
                        onChange={(e) => setCustomReportOptions({ ...customReportOptions, name: e.target.value })}
                        placeholder={safeT('reporting.sections.reports.customReport.namePlaceholder', { defaultValue: 'e.g., Q4 Maintenance Summary' })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customReportType">{safeT('reporting.sections.reports.customReport.reportTypeLabel', { defaultValue: 'Report Type' })}</Label>
                      <Select
                        value={customReportOptions.reportType}
                        onValueChange={(value) => setCustomReportOptions({ ...customReportOptions, reportType: value })}
                      >
                        <SelectTrigger id="customReportType">
                          <SelectValue placeholder={safeT('reporting.sections.reports.customReport.selectTypePlaceholder', { defaultValue: 'Select report type' })} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="combined">{safeT('reporting.sections.reports.customReport.typeCombined', { defaultValue: 'Combined' })}</SelectItem>
                          <SelectItem value="vehicle_summary">{safeT('reporting.sections.reports.customReport.typeVehicleSummary', { defaultValue: 'Vehicle Summary' })}</SelectItem>
                          <SelectItem value="maintenance_detail">{safeT('reporting.sections.reports.customReport.typeMaintenanceDetail', { defaultValue: 'Maintenance Detail' })}</SelectItem>
                          <SelectItem value="fuel_log">{safeT('reporting.sections.reports.customReport.typeFuelLog', { defaultValue: 'Fuel Log' })}</SelectItem>
                          <SelectItem value="cost_analysis">{safeT('reporting.sections.reports.customReport.typeCostAnalysis', { defaultValue: 'Cost Analysis' })}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{safeT('reporting.sections.reports.customReport.includeDataLabel', { defaultValue: 'Include Data:' })}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="includeVehicles" 
                            checked={customReportOptions.includeVehicles} 
                            onCheckedChange={(checked) => setCustomReportOptions({...customReportOptions, includeVehicles: !!checked})}
                          />
                          <Label htmlFor="includeVehicles">{safeT('reporting.sections.reports.customReport.includeVehiclesLabel', { defaultValue: 'Vehicles' })}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="includeMaintenance" 
                            checked={customReportOptions.includeMaintenance} 
                            onCheckedChange={(checked) => setCustomReportOptions({...customReportOptions, includeMaintenance: !!checked})}
                          />
                          <Label htmlFor="includeMaintenance">{safeT('reporting.sections.reports.customReport.includeMaintenanceLabel', { defaultValue: 'Maintenance' })}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="includeFuel" 
                            checked={customReportOptions.includeFuel} 
                            onCheckedChange={(checked) => setCustomReportOptions({...customReportOptions, includeFuel: !!checked})}
                          />
                          <Label htmlFor="includeFuel">{safeT('reporting.sections.reports.customReport.includeFuelLabel', { defaultValue: 'Fuel Logs' })}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="includeCosts" 
                            checked={customReportOptions.includeCosts} 
                            onCheckedChange={(checked) => setCustomReportOptions({...customReportOptions, includeCosts: !!checked})}
                          />
                          <Label htmlFor="includeCosts">{safeT('reporting.sections.reports.customReport.includeCostsLabel', { defaultValue: 'Cost Data' })}</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCustomReportDialogOpen(false)}>{safeT('common.cancel', { defaultValue: 'Cancel' })}</Button>
                    <Button onClick={handleCreateCustomReport} disabled={isLoading}>
                      {isLoading ? safeT('common.loading', {defaultValue: 'Generating...'}) : safeT('reporting.sections.reports.generate.dialog.createButton', { defaultValue: 'Create Report' })}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{safeT('reporting.sections.reports.recent.title', { defaultValue: 'Recent Reports' })}</CardTitle>
              <CardDescription>{safeT('reporting.sections.reports.recent.description', { defaultValue: 'Access your recently generated reports.' })}</CardDescription>
            </CardHeader>
            <CardContent>
              {recentReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{safeT('reporting.sections.reports.recent.table.name', { defaultValue: 'Report Name' })}</TableHead>
                      <TableHead>{safeT('reporting.sections.reports.recent.table.type', { defaultValue: 'Type' })}</TableHead>
                      <TableHead>{safeT('reporting.sections.reports.recent.table.date', { defaultValue: 'Date Generated' })}</TableHead>
                      <TableHead className="text-right">{safeT('reporting.sections.reports.recent.table.actions', { defaultValue: 'Actions' })}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium flex items-center">
                          {getReportIcon(report.type)}
                          <span className="ml-2">{report.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.type}</Badge>
                        </TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadRecentReport(report)} disabled={!report.downloadUrl}>
                            <Download className="mr-2 h-4 w-4" />
                            {safeT('common.download', { defaultValue: 'Download' })}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {safeT('reporting.sections.reports.recent.empty', { defaultValue: 'No recent reports found.' })}
                </p>
              )}
            </CardContent>
          </Card>

          {costPerKmData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{safeT('reporting.sections.vehiclePerformance.costPerKm', { defaultValue: 'Cost per Kilometer' })}</CardTitle>
                 <CardDescription>{safeT('reporting.sections.vehiclePerformance.costPerKmDescription', {defaultValue: 'Analyze fuel and maintenance costs per kilometer for each vehicle.'})}</CardDescription>
              </CardHeader>
              <CardContent>
                <CostPerKmChart initialData={costPerKmData} dateRange={dateRange || defaultDateRangeProp} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 