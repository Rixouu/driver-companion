'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { CountryFlag } from '@/components/ui/country-flag'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  X, 
  Save, 
  Settings,
  Palette,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  Send,
  XCircle,
  CheckSquare
} from 'lucide-react'

interface RealPDFTemplate {
  id: string
  name: string
  type: 'quotation' | 'invoice'
  description: string
  team: 'japan' | 'thailand' | 'both'
  isActive: boolean
  lastModified: string
  config: {
    showTeamInfo: boolean
    showLanguageToggle: boolean
    statusConfigs: {
      [status: string]: {
        showSignature: boolean
        showStatusBadge: boolean
        statusBadgeColor: string
        statusBadgeName: string
      }
    }
    styling: {
      primaryColor: string
      fontFamily: string
      fontSize: string
    }
  }
}

interface SimplePDFTemplateEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (template: RealPDFTemplate) => void
  template: RealPDFTemplate | null
}

const STATUS_OPTIONS = [
  { value: 'send', label: 'Send', icon: Send, color: 'bg-blue-100 text-blue-800' },
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800' },
  { value: 'paid', label: 'Paid', icon: DollarSign, color: 'bg-emerald-100 text-emerald-800' },
  { value: 'converted', label: 'Converted', icon: CheckSquare, color: 'bg-purple-100 text-purple-800' }
]

export function SimplePDFTemplateEditor({
  isOpen,
  onClose,
  onSave,
  template
}: SimplePDFTemplateEditorProps) {
  const { t } = useI18n()
  const [templateData, setTemplateData] = useState<RealPDFTemplate | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (template) {
      const defaultStatusConfigs = {
        send: { showSignature: false, showStatusBadge: true, statusBadgeColor: '#3B82F6', statusBadgeName: 'SENT' },
        pending: { showSignature: false, showStatusBadge: true, statusBadgeColor: '#F59E0B', statusBadgeName: 'PENDING' },
        approved: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#10B981', statusBadgeName: 'APPROVED' },
        rejected: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#EF4444', statusBadgeName: 'REJECTED' },
        paid: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#10B981', statusBadgeName: 'PAID' },
        converted: { showSignature: true, showStatusBadge: true, statusBadgeColor: '#8B5CF6', statusBadgeName: 'CONVERTED' }
      }
      
      const initializedTemplate = {
        ...template,
        config: {
          ...template.config,
          statusConfigs: template.config.statusConfigs || defaultStatusConfigs,
          styling: {
            primaryColor: '#FF2600',
            fontFamily: 'Noto Sans Thai, Noto Sans, sans-serif',
            fontSize: '14px',
            ...template.config.styling
          }
        }
      }
      setTemplateData(initializedTemplate)
    }
  }, [template])

  if (!isOpen || !templateData) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(templateData)
      onClose()
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleBasicChange = (field: string, value: any) => {
    setTemplateData(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleConfigChange = (field: string, value: any) => {
    setTemplateData(prev => prev ? {
      ...prev,
      config: {
        ...prev.config,
        [field]: value
      }
    } : null)
  }

  const handleStylingChange = (field: string, value: any) => {
    setTemplateData(prev => prev ? {
      ...prev,
      config: {
        ...prev.config,
        styling: {
          ...prev.config.styling,
          [field]: value
        }
      }
    } : null)
  }


  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Slider Panel */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] 2xl:w-[50vw] bg-background shadow-2xl transform transition-all duration-300 ease-in-out animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate">{templateData.name}</h2>
              <p className="text-sm text-muted-foreground">Edit PDF template settings</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-80px)] overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Template name, type, and basic settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Name */}
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Template Name</Label>
                  <Input
                    id="name"
                    value={templateData.name}
                    onChange={(e) => handleBasicChange('name', e.target.value)}
                    placeholder="Enter template name..."
                    className="mt-1"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={templateData.description}
                    onChange={(e) => handleBasicChange('description', e.target.value)}
                    placeholder="Enter description..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                    <Select value={templateData.type} onValueChange={(value) => handleBasicChange('type', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quotation">Quotation</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                    <Select value={templateData.location} onValueChange={(value) => handleBasicChange('location', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="team" className="text-sm font-medium">Team</Label>
                    <Select value={templateData.team} onValueChange={(value) => handleBasicChange('team', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="japan">
                          <div className="flex items-center gap-2">
                            <CountryFlag country="japan" size="sm" />
                            <span>Japan</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="thailand">
                          <div className="flex items-center gap-2">
                            <CountryFlag country="thailand" size="sm" />
                            <span>Thailand</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="both">
                          <div className="flex items-center gap-2">
                            <CountryFlag country="both" size="sm" />
                            <span>Both</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div>
                    <Label htmlFor="isActive" className="text-sm font-medium">Active Template</Label>
                    <p className="text-xs text-muted-foreground">Enable this template for use</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={templateData.isActive}
                    onCheckedChange={(checked) => handleBasicChange('isActive', checked)}
                  />
                </div>
              </CardContent>
            </Card>


            {/* Styling Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Styling Configuration
                </CardTitle>
                <CardDescription>
                  Customize the visual appearance of the template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary_color">Primary Color (Brand Color)</Label>
                    <Input
                      id="primary_color"
                      type="color"
                      value={templateData.config.styling?.primaryColor || '#FF2600'}
                      onChange={(e) => handleStylingChange('primaryColor', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This is the main brand color used throughout the PDF (e.g., #FF2600 for Driver red)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="font_family">Font Family</Label>
                    <Select 
                      value={templateData.config.styling?.fontFamily || 'Noto Sans Thai, Noto Sans, sans-serif'} 
                      onValueChange={(value) => handleStylingChange('fontFamily', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Noto Sans Thai, Noto Sans, sans-serif">Noto Sans Thai</SelectItem>
                        <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                        <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="font_size">Font Size</Label>
                    <Input
                      id="font_size"
                      value={templateData.config.styling?.fontSize || '14px'}
                      onChange={(e) => handleStylingChange('fontSize', e.target.value)}
                      placeholder="14px"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Global Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Global Settings
                </CardTitle>
                <CardDescription>
                  Settings that apply to all statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showTeamInfo"
                      checked={templateData.config.showTeamInfo}
                      onCheckedChange={(checked) => handleConfigChange('showTeamInfo', checked)}
                    />
                    <Label htmlFor="showTeamInfo">Show Team Information</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showLanguageToggle"
                      checked={templateData.config.showLanguageToggle}
                      onCheckedChange={(checked) => handleConfigChange('showLanguageToggle', checked)}
                    />
                    <Label htmlFor="showLanguageToggle">Show Language Toggle</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status-Specific Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Status Configuration
                </CardTitle>
                <CardDescription>
                  Configure what appears for each status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {STATUS_OPTIONS.map((statusOption) => {
                    const status = statusOption.value
                    const statusConfig = templateData.config.statusConfigs?.[status] || {
                      showSignature: false,
                      showStatusBadge: false,
                      statusBadgeColor: '#6B7280',
                      statusBadgeName: status.toUpperCase()
                    }
                    
                    return (
                      <div key={status} className="p-4 border rounded-lg space-y-4 bg-muted/20">
                        {/* Status Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <statusOption.icon className="h-5 w-5" />
                            <h5 className="font-semibold capitalize">{statusOption.label}</h5>
                          </div>
                          <Badge variant="outline" className="capitalize text-xs">{status}</Badge>
                        </div>
                        
                        {/* Controls */}
                        <div className="space-y-4">
                          {/* Toggle Controls */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`${status}-signature`} className="text-sm font-medium">Signature</Label>
                              <Switch
                                id={`${status}-signature`}
                                checked={statusConfig.showSignature}
                                onCheckedChange={(checked) => {
                                  const newConfigs = {
                                    ...templateData.config.statusConfigs,
                                    [status]: { ...statusConfig, showSignature: checked }
                                  }
                                  handleConfigChange('statusConfigs', newConfigs)
                                }}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`${status}-badge`} className="text-sm font-medium">Status Badge</Label>
                              <Switch
                                id={`${status}-badge`}
                                checked={statusConfig.showStatusBadge}
                                onCheckedChange={(checked) => {
                                  const newConfigs = {
                                    ...templateData.config.statusConfigs,
                                    [status]: { ...statusConfig, showStatusBadge: checked }
                                  }
                                  handleConfigChange('statusConfigs', newConfigs)
                                }}
                              />
                            </div>
                          </div>
                          
                          {/* Badge Configuration */}
                          {statusConfig.showStatusBadge && (
                            <div className="space-y-3 pt-3 border-t">
                              <div>
                                <Label htmlFor={`${status}-badge-name`} className="text-xs font-medium text-muted-foreground">Badge Name</Label>
                                <Input
                                  id={`${status}-badge-name`}
                                  value={statusConfig.statusBadgeName}
                                  onChange={(e) => {
                                    const newConfigs = {
                                      ...templateData.config.statusConfigs,
                                      [status]: { ...statusConfig, statusBadgeName: e.target.value }
                                    }
                                    handleConfigChange('statusConfigs', newConfigs)
                                  }}
                                  className="h-8 text-sm mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`${status}-badge-color`} className="text-xs font-medium text-muted-foreground">Badge Color</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Input
                                    id={`${status}-badge-color`}
                                    type="color"
                                    value={statusConfig.statusBadgeColor}
                                    onChange={(e) => {
                                      const newConfigs = {
                                        ...templateData.config.statusConfigs,
                                        [status]: { ...statusConfig, statusBadgeColor: e.target.value }
                                      }
                                      handleConfigChange('statusConfigs', newConfigs)
                                    }}
                                    className="h-8 w-12 p-1 rounded"
                                  />
                                  <Input
                                    value={statusConfig.statusBadgeColor}
                                    onChange={(e) => {
                                      const newConfigs = {
                                        ...templateData.config.statusConfigs,
                                        [status]: { ...statusConfig, statusBadgeColor: e.target.value }
                                      }
                                      handleConfigChange('statusConfigs', newConfigs)
                                    }}
                                    className="h-8 text-sm flex-1"
                                    placeholder="#FF0000"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}
