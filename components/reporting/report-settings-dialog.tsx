"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { useReportSettings, ReportSettings } from '@/lib/hooks/use-report-settings'
import { Settings, RotateCcw, Save } from 'lucide-react'

interface ReportSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportSettingsDialog({
  open,
  onOpenChange
}: ReportSettingsDialogProps) {
  const { settings, loading, updateSettings, resetToDefaults } = useReportSettings()
  const [localSettings, setLocalSettings] = useState<ReportSettings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  const handleSave = async () => {
    if (!localSettings) return

    try {
      setSaving(true)
      await updateSettings(localSettings)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      setSaving(true)
      await resetToDefaults()
      onOpenChange(false)
    } catch (error) {
      console.error('Error resetting settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSectionChange = (section: string, checked: boolean) => {
    if (!localSettings) return

    setLocalSettings(prev => ({
      ...prev!,
      default_sections: {
        ...prev!.default_sections,
        [section]: checked
      }
    }))
  }

  if (loading || !localSettings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading Report Settings</DialogTitle>
            <DialogDescription>Please wait while we load your report settings.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Report Settings
          </DialogTitle>
          <DialogDescription>
            Configure your default report generation preferences and notification settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Default Format */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultFormat">Preferred Report Format</Label>
                <Select
                  value={localSettings.default_format}
                  onValueChange={(value: 'pdf' | 'excel' | 'csv') => 
                    setLocalSettings(prev => ({ ...prev!, default_format: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF - Professional document format</SelectItem>
                    <SelectItem value="excel">Excel - Spreadsheet with charts and data</SelectItem>
                    <SelectItem value="csv">CSV - Raw data for analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Default Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default Data Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Select which sections to include by default when generating reports
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(localSettings.default_sections).map(([section, included]) => (
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

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailNotifications"
                  checked={localSettings.email_notifications}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev!, email_notifications: !!checked }))
                  }
                />
                <Label htmlFor="emailNotifications">Enable email notifications for completed reports</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoGenerate"
                  checked={localSettings.auto_generate}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({ ...prev!, auto_generate: !!checked }))
                  }
                />
                <Label htmlFor="autoGenerate">Enable automatic report generation for scheduled reports</Label>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retentionDays">Report Retention Period (Days)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="retentionDays"
                    type="number"
                    min="1"
                    max="365"
                    value={localSettings.retention_days}
                    onChange={(e) => 
                      setLocalSettings(prev => ({ 
                        ...prev!, 
                        retention_days: parseInt(e.target.value) || 90 
                      }))
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Reports older than this period will be automatically deleted
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
