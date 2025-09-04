"use client"

import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n/context'
import { FileText, Download, BarChart3, Settings } from 'lucide-react'

interface ReportGenerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (options: any) => Promise<any>
  isGenerating: boolean
  dateRange?: DateRange
}

export function ReportGenerationDialog({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
  dateRange
}: ReportGenerationDialogProps) {
  const { t } = useI18n()
  
  const [reportOptions, setReportOptions] = useState({
    name: '',
    type: 'comprehensive',
    format: 'pdf',
    includeCharts: true,
    includeDetails: true,
    sections: {
      financial: true,
      vehicles: true,
      drivers: true,
      inspections: true,
      maintenance: true,
      bookings: true
    }
  })

  const handleGenerate = async () => {
    if (!reportOptions.name.trim()) {
      return
    }

    try {
      await onGenerate(reportOptions)
    } catch (error) {
      console.error('Error generating report:', error)
    }
  }

  const handleSectionChange = (section: string, checked: boolean) => {
    setReportOptions(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: checked
      }
    }))
  }

  const reportTypes = [
    { value: 'comprehensive', label: 'Comprehensive Report', description: 'All data and analytics' },
    { value: 'financial', label: 'Financial Report', description: 'Revenue, quotations, and financial metrics' },
    { value: 'vehicle', label: 'Vehicle Report', description: 'Vehicle performance and utilization' },
    { value: 'driver', label: 'Driver Report', description: 'Driver performance and activity' },
    { value: 'inspection', label: 'Inspection Report', description: 'Inspection results and trends' },
    { value: 'maintenance', label: 'Maintenance Report', description: 'Maintenance tasks and costs' }
  ]

  const formats = [
    { value: 'pdf', label: 'PDF', description: 'Professional document format' },
    { value: 'excel', label: 'Excel', description: 'Spreadsheet with charts and data' },
    { value: 'csv', label: 'CSV', description: 'Raw data for analysis' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Custom Report
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive report with your selected data and analytics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  value={reportOptions.name}
                  onChange={(e) => setReportOptions(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Q4 2024 Business Report"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select
                    value={reportOptions.type}
                    onValueChange={(value) => setReportOptions(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportFormat">Format</Label>
                  <Select
                    value={reportOptions.format}
                    onValueChange={(value) => setReportOptions(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          <div>
                            <div className="font-medium">{format.label}</div>
                            <div className="text-sm text-muted-foreground">{format.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Report Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={reportOptions.includeCharts}
                    onCheckedChange={(checked) => setReportOptions(prev => ({ ...prev, includeCharts: !!checked }))}
                  />
                  <Label htmlFor="includeCharts" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Include Charts and Visualizations
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDetails"
                    checked={reportOptions.includeDetails}
                    onCheckedChange={(checked) => setReportOptions(prev => ({ ...prev, includeDetails: !!checked }))}
                  />
                  <Label htmlFor="includeDetails" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Include Detailed Data Tables
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(reportOptions.sections).map(([section, included]) => (
                  <div key={section} className="flex items-center space-x-2">
                    <Checkbox
                      id={section}
                      checked={included}
                      onCheckedChange={(checked) => handleSectionChange(section, !!checked)}
                    />
                    <Label htmlFor={section} className="capitalize">
                      {section}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Date Range Info */}
          {dateRange && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">
                  <strong>Date Range:</strong> {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !reportOptions.name.trim()}
          >
            {isGenerating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
