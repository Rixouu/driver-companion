"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  Download, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  BarChart3,
  TrendingUp,
  Users,
  Car,
  Wrench,
  DollarSign,
  Clock,
  Star,
  Eye,
  Trash2,
  RefreshCw,
  Settings,
  Zap,
  Edit,
  Play
} from 'lucide-react'
import { useReportSchedules } from '@/lib/hooks/use-report-schedules'
import { ScheduleReportDialog } from '../schedule-report-dialog'
import { ReportSettingsDialog } from '../report-settings-dialog'

interface ReportsTabProps {
  generatedReports: Array<{
    id: string
    name: string
    type: string
    format: string
    createdAt: string
    downloadUrl?: string
    size?: string
    status?: 'completed' | 'generating' | 'failed'
  }>
  onGenerateReport: () => void
  onDownloadReport: (reportId: string) => void
  onDeleteReport: (reportId: string) => void
  onPreviewReport?: (reportId: string) => void
}

export function ReportsTab({ 
  generatedReports, 
  onGenerateReport, 
  onDownloadReport, 
  onDeleteReport,
  onPreviewReport
}: ReportsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [activeTab, setActiveTab] = useState('templates')
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)

  const { 
    schedules, 
    loading: schedulesLoading, 
    createSchedule, 
    updateSchedule, 
    deleteSchedule, 
    runScheduleNow 
  } = useReportSchedules()

  // Report templates for quick generation
  const reportTemplates = [
    {
      id: 'comprehensive',
      name: 'Comprehensive Business Report',
      description: 'Complete overview of all business metrics and performance',
      icon: BarChart3,
      color: 'bg-blue-500',
      sections: ['Financial', 'Vehicles', 'Operations', 'Bookings'],
      estimatedTime: '2-3 minutes'
    },
    {
      id: 'financial',
      name: 'Financial Performance Report',
      description: 'Revenue, quotations, and financial health analysis',
      icon: DollarSign,
      color: 'bg-green-500',
      sections: ['Revenue', 'Quotations', 'Costs', 'Profitability'],
      estimatedTime: '1-2 minutes'
    },
    {
      id: 'fleet',
      name: 'Fleet Management Report',
      description: 'Vehicle utilization, maintenance, and performance metrics',
      icon: Car,
      color: 'bg-purple-500',
      sections: ['Fleet Status', 'Utilization', 'Maintenance', 'Performance'],
      estimatedTime: '1-2 minutes'
    },
    {
      id: 'operations',
      name: 'Operations Report',
      description: 'Driver performance, inspections, and operational efficiency',
      icon: Users,
      color: 'bg-orange-500',
      sections: ['Drivers', 'Inspections', 'Efficiency', 'Quality'],
      estimatedTime: '1-2 minutes'
    },
    {
      id: 'maintenance',
      name: 'Maintenance Report',
      description: 'Maintenance schedules, costs, and vehicle health',
      icon: Wrench,
      color: 'bg-red-500',
      sections: ['Schedules', 'Costs', 'Health', 'Predictions'],
      estimatedTime: '1-2 minutes'
    },
    {
      id: 'trends',
      name: 'Trends & Analytics Report',
      description: 'Historical trends and predictive analytics',
      icon: TrendingUp,
      color: 'bg-indigo-500',
      sections: ['Trends', 'Forecasts', 'Insights', 'Recommendations'],
      estimatedTime: '2-3 minutes'
    }
  ]

  const handleScheduleReport = async (scheduleData: any) => {
    try {
      setIsScheduling(true)
      await createSchedule(scheduleData)
      setIsScheduleDialogOpen(false)
    } catch (error) {
      console.error('Error creating schedule:', error)
    } finally {
      setIsScheduling(false)
    }
  }

  const handleRunScheduleNow = async (scheduleId: string) => {
    try {
      await runScheduleNow(scheduleId)
    } catch (error) {
      console.error('Error running schedule:', error)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteSchedule(scheduleId)
    } catch (error) {
      console.error('Error deleting schedule:', error)
    }
  }

  const filteredReports = generatedReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || report.type === filterType
    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge 
            className="font-medium border-2 border-green-300 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:border-green-600"
          >
            Completed
          </Badge>
        )
      case 'generating':
        return (
          <Badge 
            className="font-medium border-0 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
          >
            Generating
          </Badge>
        )
      case 'failed':
        return (
          <Badge 
            className="font-medium border-0 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          >
            Failed
          </Badge>
        )
      default:
        return (
          <Badge 
            className="font-medium border-0 bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
          >
            Unknown
          </Badge>
        )
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />
      case 'excel':
        return <FileText className="h-4 w-4 text-green-500" />
      case 'csv':
        return <FileText className="h-4 w-4 text-blue-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const handlePreviewReport = (reportId: string) => {
    if (onPreviewReport) {
      onPreviewReport(reportId)
    } else {
      // Fallback: open preview in new tab
      window.open(`/api/reporting/preview/${reportId}`, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Report Center</h2>
          <p className="text-muted-foreground">
            Generate, manage, and schedule comprehensive business reports
          </p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 sm:space-y-0">
          {/* Mobile: Stacked buttons */}
          <div className="flex flex-col gap-2 sm:hidden">
            <Button onClick={onGenerateReport} className="h-12">
              <Plus className="mr-2 h-5 w-5" />
              Generate Custom Report
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="h-12"
                onClick={() => setIsSettingsDialogOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                className="h-12"
                onClick={() => setIsScheduleDialogOpen(true)}
              >
                <Zap className="mr-2 h-4 w-4" />
                Schedule
              </Button>
            </div>
          </div>

          {/* Desktop: Horizontal layout */}
          <div className="hidden sm:flex gap-4">
            <Button onClick={onGenerateReport}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Custom Report
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsSettingsDialogOpen(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Report Settings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsScheduleDialogOpen(true)}
            >
              <Zap className="mr-2 h-4 w-4" />
              Schedule Report
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Mobile: 2x2 Grid of Big Buttons */}
        <div className="block sm:hidden">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={activeTab === 'templates' ? 'default' : 'outline'}
              onClick={() => setActiveTab('templates')}
              className="h-20 flex flex-col items-center justify-center gap-2 p-4"
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm font-medium">Templates</span>
            </Button>
            <Button
              variant={activeTab === 'generated' ? 'default' : 'outline'}
              onClick={() => setActiveTab('generated')}
              className="h-20 flex flex-col items-center justify-center gap-2 p-4"
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm font-medium">Generated</span>
            </Button>
            <Button
              variant={activeTab === 'scheduled' ? 'default' : 'outline'}
              onClick={() => setActiveTab('scheduled')}
              className="h-20 flex flex-col items-center justify-center gap-2 p-4"
            >
              <Calendar className="h-6 w-6" />
              <span className="text-sm font-medium">Scheduled</span>
            </Button>
            <Button
              variant={activeTab === 'analytics' ? 'default' : 'outline'}
              onClick={() => setActiveTab('analytics')}
              className="h-20 flex flex-col items-center justify-center gap-2 p-4"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm font-medium">Analytics</span>
            </Button>
          </div>
        </div>

        {/* Desktop: Traditional Tabs */}
        <TabsList className="hidden sm:grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="generated">Generated</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Report Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Report Templates</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Choose from our pre-built report templates for instant generation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {reportTemplates.map((template) => {
              const IconComponent = template.icon
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3 p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${template.color} text-white`}>
                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {template.estimatedTime}
                      </Badge>
                    </div>
                    <CardTitle className="text-base sm:text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 p-4 sm:p-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Includes:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.sections.map((section) => (
                            <Badge key={section} variant="secondary" className="text-xs">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button 
                        className="w-full h-10 sm:h-9 group-hover:bg-primary/90" 
                        onClick={onGenerateReport}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Generated Reports Tab */}
        <TabsContent value="generated" className="space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Generated Reports</h3>
            <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
              View and manage your previously generated reports
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="min-w-[120px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="comprehensive">Comprehensive</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredReports.length > 0 ? (
            <>
              {/* Desktop List View */}
              <div className="hidden sm:block space-y-3">
                {filteredReports.map((report) => (
                  <Card 
                    key={report.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                  >
                    <div className="flex items-center p-4">
                      {/* Report Icon - Medium size */}
                      <div className="w-12 h-12 relative flex-shrink-0 mr-4">
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
                          {getFormatIcon(report.format)}
                        </div>
                      </div>
                      
                      {/* Report Info - Flexbox layout */}
                      <div className="flex-1 grid grid-cols-5 items-center gap-4">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-lg">{report.name}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{report.type}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            {report.format.toUpperCase()}
                          </Badge>
                          {report.size && (
                            <span className="text-sm text-muted-foreground">{report.size}</span>
                          )}
                        </div>
                        
                        <div className="flex justify-center">
                          {getStatusBadge(report.status || 'completed')}
                        </div>
                        
                        <div className="flex justify-center">
                          <span className="text-sm text-muted-foreground">{formatDate(report.createdAt)}</span>
                        </div>
                        
                        <div className="flex gap-2 w-full">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePreviewReport(report.id)}
                            className="flex-1 h-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDownloadReport(report.id)}
                            className="flex-1 h-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDeleteReport(report.id)}
                            className="flex-1 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="sm:hidden grid gap-4 grid-cols-1">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex flex-col space-y-4">
                        {/* Header with icon and status */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-lg flex-shrink-0">
                              {getFormatIcon(report.format)}
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <h4 className="font-semibold text-lg truncate">{report.name}</h4>
                              <p className="text-sm text-muted-foreground capitalize">{report.type}</p>
                            </div>
                          </div>
                          {getStatusBadge(report.status || 'completed')}
                        </div>

                        {/* Details row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {report.format.toUpperCase()}
                            </Badge>
                            {report.size && (
                              <span className="text-xs text-muted-foreground">{report.size}</span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">{formatDate(report.createdAt)}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePreviewReport(report.id)}
                            className="flex-1 h-8 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDownloadReport(report.id)}
                            className="flex-1 h-8 text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDeleteReport(report.id)}
                            className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="text-center py-12">
                <div className="p-3 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || filterType !== 'all' ? 'No matching reports found' : 'No Reports Generated'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Generate your first report to get started with detailed analytics'
                  }
                </p>
                <Button onClick={onGenerateReport}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled" className="space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Scheduled Reports</h3>
            <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
              Manage your automated report generation schedules
            </p>
          </div>

          {schedulesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : schedules.length > 0 ? (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h4 className="font-medium truncate">{schedule.name}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                schedule.is_active 
                                  ? 'text-green-600 border-green-200 bg-green-50' 
                                  : 'text-gray-600 border-gray-200 bg-gray-50'
                              }`}
                            >
                              {schedule.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
                            <span>Frequency: {schedule.frequency}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>Next: {schedule.next_run ? new Date(schedule.next_run).toLocaleDateString() : 'N/A'}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>Last: {schedule.last_run ? new Date(schedule.last_run).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                          <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRunScheduleNow(schedule.id)}
                          className="text-xs sm:text-sm"
                        >
                          <Play className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Run Now</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="text-xs sm:text-sm"
                        >
                          <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="text-center py-8 sm:py-12">
                <div className="p-3 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Scheduled Reports</h3>
                <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                  Set up automated reports to receive regular updates
                </p>
                <Button onClick={() => setIsScheduleDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Schedule
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Report Analytics</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Insights into your report usage and generation patterns
            </p>
          </div>

          {generatedReports.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{generatedReports.length}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {generatedReports.filter(r => {
                        const reportDate = new Date(r.createdAt)
                        const now = new Date()
                        return reportDate.getMonth() === now.getMonth() && 
                               reportDate.getFullYear() === now.getFullYear()
                      }).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Reports generated</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const typeCounts = generatedReports.reduce((acc, report) => {
                          acc[report.type] = (acc[report.type] || 0) + 1
                          return acc
                        }, {} as Record<string, number>)
                        const mostPopular = Object.entries(typeCounts).reduce((a, b) => 
                          typeCounts[a[0]] > typeCounts[b[0]] ? a : b, ['N/A', 0]
                        )
                        return mostPopular[0].charAt(0).toUpperCase() + mostPopular[0].slice(1)
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">Report type</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const reportsWithSize = generatedReports.filter(r => r.size)
                        if (reportsWithSize.length === 0) return 'N/A'
                        const totalSize = reportsWithSize.reduce((sum, r) => {
                          const size = parseFloat(r.size?.replace(' MB', '') || '0')
                          return sum + size
                        }, 0)
                        return `${(totalSize / reportsWithSize.length).toFixed(1)} MB`
                      })()}
                    </div>
                    <p className="text-xs text-muted-foreground">Per report</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Report Generation Trends</CardTitle>
                  <CardDescription>Monthly report generation activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                      <p>Chart visualization coming soon</p>
                      <p className="text-xs mt-2">
                        {generatedReports.length} reports available for analysis
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="text-center py-12">
                <div className="p-3 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
                <p className="text-muted-foreground mb-6">
                  Generate some reports to see analytics and insights
                </p>
                <Button onClick={onGenerateReport}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ScheduleReportDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        onSchedule={handleScheduleReport}
        isScheduling={isScheduling}
      />

      <ReportSettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
      />
    </div>
  )
}
