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
import { Textarea } from '@/components/ui/textarea'
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
import { Calendar, Clock, Mail, Settings } from 'lucide-react'

interface ScheduleReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSchedule: (options: any) => Promise<any>
  isScheduling: boolean
  dateRange?: DateRange
}

export function ScheduleReportDialog({
  open,
  onOpenChange,
  onSchedule,
  isScheduling,
  dateRange
}: ScheduleReportDialogProps) {
  const { t } = useI18n()
  
  const [scheduleOptions, setScheduleOptions] = useState({
    name: '',
    description: '',
    report_type: 'comprehensive',
    format: 'pdf',
    frequency: 'weekly',
    day_of_week: 1, // Monday
    day_of_month: 1,
    time_of_day: '09:00',
    recipients: [] as string[],
    options: {
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
    }
  })

  const [emailInput, setEmailInput] = useState('')

  const handleSchedule = async () => {
    if (!scheduleOptions.name.trim()) {
      return
    }

    try {
      await onSchedule(scheduleOptions)
    } catch (error) {
      console.error('Error scheduling report:', error)
    }
  }

  const handleSectionChange = (section: string, checked: boolean) => {
    setScheduleOptions(prev => ({
      ...prev,
      options: {
        ...prev.options,
        sections: {
          ...prev.options.sections,
          [section]: checked
        }
      }
    }))
  }

  const addRecipient = () => {
    if (emailInput.trim() && !scheduleOptions.recipients.includes(emailInput.trim())) {
      setScheduleOptions(prev => ({
        ...prev,
        recipients: [...prev.recipients, emailInput.trim()]
      }))
      setEmailInput('')
    }
  }

  const removeRecipient = (email: string) => {
    setScheduleOptions(prev => ({
      ...prev,
      recipients: prev.recipients.filter(e => e !== email)
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

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ]

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Automated Report
          </DialogTitle>
          <DialogDescription>
            Set up automated report generation with your preferred schedule and settings
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
                <Label htmlFor="scheduleName">Schedule Name</Label>
                <Input
                  id="scheduleName"
                  value={scheduleOptions.name}
                  onChange={(e) => setScheduleOptions(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Weekly Financial Summary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduleDescription">Description (Optional)</Label>
                <Textarea
                  id="scheduleDescription"
                  value={scheduleOptions.description}
                  onChange={(e) => setScheduleOptions(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this scheduled report"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select
                    value={scheduleOptions.report_type}
                    onValueChange={(value) => setScheduleOptions(prev => ({ ...prev, report_type: value }))}
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
                    value={scheduleOptions.format}
                    onValueChange={(value) => setScheduleOptions(prev => ({ ...prev, format: value }))}
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

          {/* Schedule Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedule Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={scheduleOptions.frequency}
                    onValueChange={(value) => setScheduleOptions(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeOfDay">Time of Day</Label>
                  <Input
                    id="timeOfDay"
                    type="time"
                    value={scheduleOptions.time_of_day}
                    onChange={(e) => setScheduleOptions(prev => ({ ...prev, time_of_day: e.target.value }))}
                  />
                </div>
              </div>

              {scheduleOptions.frequency === 'weekly' && (
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Day of Week</Label>
                  <Select
                    value={scheduleOptions.day_of_week.toString()}
                    onValueChange={(value) => setScheduleOptions(prev => ({ ...prev, day_of_week: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(scheduleOptions.frequency === 'monthly' || scheduleOptions.frequency === 'quarterly') && (
                <div className="space-y-2">
                  <Label htmlFor="dayOfMonth">Day of Month</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={scheduleOptions.day_of_month}
                    onChange={(e) => setScheduleOptions(prev => ({ ...prev, day_of_month: parseInt(e.target.value) }))}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                />
                <Button type="button" onClick={addRecipient} disabled={!emailInput.trim()}>
                  Add
                </Button>
              </div>

              {scheduleOptions.recipients.length > 0 && (
                <div className="space-y-2">
                  <Label>Recipients ({scheduleOptions.recipients.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {scheduleOptions.recipients.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => removeRecipient(email)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    checked={scheduleOptions.options.includeCharts}
                    onCheckedChange={(checked) => setScheduleOptions(prev => ({ 
                      ...prev, 
                      options: { ...prev.options, includeCharts: !!checked }
                    }))}
                  />
                  <Label htmlFor="includeCharts">Include Charts and Visualizations</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDetails"
                    checked={scheduleOptions.options.includeDetails}
                    onCheckedChange={(checked) => setScheduleOptions(prev => ({ 
                      ...prev, 
                      options: { ...prev.options, includeDetails: !!checked }
                    }))}
                  />
                  <Label htmlFor="includeDetails">Include Detailed Data Tables</Label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Data Sections</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(scheduleOptions.options.sections).map(([section, included]) => (
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
            onClick={handleSchedule} 
            disabled={isScheduling || !scheduleOptions.name.trim()}
          >
            {isScheduling ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating Schedule...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Create Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
