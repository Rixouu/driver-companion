"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { useI18n } from '@/lib/i18n/context'
import { generateEmailTemplate } from '@/lib/email/email-partials'
import { CountryFlag } from '@/components/ui/country-flag'
import { 
  X, 
  Save, 
  Eye, 
  Code, 
  Settings, 
  Mail, 
  Calendar,
  Wrench,
  Bell,
  FileText,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react'

interface EmailTemplate {
  id: string
  name: string
  type: string
  category: string
  subject: string
  html_content: string
  text_content: string
  variables: any
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface EmailTemplateEditDrawerProps {
  isOpen: boolean
  onClose: () => void
  template: EmailTemplate | null
  onSave: (template: EmailTemplate) => void
  onDelete?: (templateId: string) => void
}

export function EmailTemplateEditDrawer({ 
  isOpen, 
  onClose, 
  template, 
  onSave, 
  onDelete 
}: EmailTemplateEditDrawerProps) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('content')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isSaving, setIsSaving] = useState(false)
  const [previewScale, setPreviewScale] = useState(70)
  const [previewLanguage, setPreviewLanguage] = useState('en')
  const [previewTeam, setPreviewTeam] = useState('TH')
  const [contentMode, setContentMode] = useState<'html' | 'text'>('html')
  const [processedContent, setProcessedContent] = useState('')
  
  // Update processed content when form data, team, or language changes
  const updateProcessedContent = async () => {
    if (formData.html_content) {
      try {
        const processed = await processContent(formData.html_content)
        setProcessedContent(processed)
      } catch (error) {
        console.error('Error processing content:', error)
        setProcessedContent(formData.html_content)
      }
    }
  }
  
  // Process content with language and team variables
  const processContent = async (content: string) => {
    let processed = content
    
    // Process language conditionals - handle various patterns
    processed = processed.replace(
      /\{\{language\s*==\s*["']ja["']\s*\?\s*["']([^"']*)["']\s*:\s*["']([^"']*)["']\}\}/g,
      previewLanguage === 'ja' ? '$1' : '$2'
    )
    
    // Process LANGUAGE conditionals (uppercase)
    processed = processed.replace(
      /\{\{LANGUAGE\s*==\s*["']JA["']\s*\?\s*["']([^"']*)["']\s*:\s*["']([^"']*)["']\}\}/g,
      previewLanguage === 'ja' ? '$1' : '$2'
    )
    
    // Process language conditionals without quotes
    processed = processed.replace(
      /\{\{language\s*==\s*["']ja["']\s*\?\s*([^:}]+)\s*:\s*([^}]+)\}\}/g,
      previewLanguage === 'ja' ? '$1' : '$2'
    )
    
    // Process LANGUAGE conditionals without quotes
    processed = processed.replace(
      /\{\{LANGUAGE\s*==\s*["']JA["']\s*\?\s*([^:}]+)\s*:\s*([^}]+)\}\}/g,
      previewLanguage === 'ja' ? '$1' : '$2'
    )
    
    // Process team-specific content
    processed = processed.replace(/\{\{team\}\}/g, previewTeam)
    processed = processed.replace(/\{\{language\}\}/g, previewLanguage)
    
    // Process team partials - handle team-specific content blocks
    processed = processed.replace(
      /\{\{#if\s+team\s*==\s*["']TH["']\s*\}\}([\s\S]*?)\{\{\/if\}\}/g,
      previewTeam === 'TH' ? '$1' : ''
    )
    processed = processed.replace(
      /\{\{#if\s+team\s*==\s*["']JP["']\s*\}\}([\s\S]*?)\{\{\/if\}\}/g,
      previewTeam === 'JP' ? '$1' : ''
    )
    
    // Process team-specific conditionals
    processed = processed.replace(
      /\{\{team\s*==\s*["']TH["']\s*\?\s*["']([^"']*)["']\s*:\s*["']([^"']*)["']\}\}/g,
      previewTeam === 'TH' ? '$1' : '$2'
    )
    processed = processed.replace(
      /\{\{team\s*==\s*["']JP["']\s*\?\s*["']([^"']*)["']\s*:\s*["']([^"']*)["']\}\}/g,
      previewTeam === 'JP' ? '$1' : '$2'
    )
    
    // Process team-specific content without quotes
    processed = processed.replace(
      /\{\{team\s*==\s*["']TH["']\s*\?\s*([^:}]+)\s*:\s*([^}]+)\}\}/g,
      previewTeam === 'TH' ? '$1' : '$2'
    )
    processed = processed.replace(
      /\{\{team\s*==\s*["']JP["']\s*\?\s*([^:}]+)\s*:\s*([^}]+)\}\}/g,
      previewTeam === 'JP' ? '$1' : '$2'
    )
    
    // Process common variables with sample data
    processed = processed.replace(/\{\{customer_name\}\}/g, 'John Doe')
    processed = processed.replace(/\{\{booking_id\}\}/g, 'BK-12345')
    processed = processed.replace(/\{\{booking_date\}\}/g, new Date().toLocaleDateString())
    
    // Team-specific service names
    const serviceName = previewTeam === 'TH' ? 'Airport Transfer Thailand' : 'Japan Driver Service'
    processed = processed.replace(/\{\{service_name\}\}/g, serviceName)
    
    // Team-specific pricing
    const totalPrice = previewTeam === 'TH' 
      ? (previewLanguage === 'ja' ? '¥12,000' : '$120.00')
      : (previewLanguage === 'ja' ? '¥15,000' : '$150.00')
    processed = processed.replace(/\{\{total_price\}\}/g, totalPrice)
    
    processed = processed.replace(/\{\{vehicle_type\}\}/g, 'Sedan')
    
    // Team-specific locations
    const pickupLocation = previewTeam === 'TH' 
      ? (previewLanguage === 'ja' ? 'バンコク空港' : 'Bangkok Airport')
      : (previewLanguage === 'ja' ? '成田空港' : 'Narita Airport')
    processed = processed.replace(/\{\{pickup_location\}\}/g, pickupLocation)
    
    const dropoffLocation = previewTeam === 'TH' 
      ? (previewLanguage === 'ja' ? 'バンコク市内' : 'Bangkok City Center')
      : (previewLanguage === 'ja' ? '東京駅' : 'Tokyo Station')
    processed = processed.replace(/\{\{dropoff_location\}\}/g, dropoffLocation)
    
    processed = processed.replace(/\{\{pickup_date\}\}/g, new Date().toLocaleDateString())
    processed = processed.replace(/\{\{pickup_time\}\}/g, previewLanguage === 'ja' ? '10:00' : '10:00 AM')
    processed = processed.replace(/\{\{duration_hours\}\}/g, '2')
    processed = processed.replace(/\{\{service_days\}\}/g, '1')
    processed = processed.replace(/\{\{hours_per_day\}\}/g, '2')
    processed = processed.replace(/\{\{number_of_passengers\}\}/g, '2')
    processed = processed.replace(/\{\{number_of_bags\}\}/g, '2')
    processed = processed.replace(/\{\{flight_number\}\}/g, 'NH123')
    
    // Team-specific terminal
    const terminal = previewTeam === 'TH' 
      ? (previewLanguage === 'ja' ? 'ターミナル1' : 'Terminal 1')
      : (previewLanguage === 'ja' ? 'ターミナル2' : 'Terminal 2')
    processed = processed.replace(/\{\{terminal\}\}/g, terminal)
    
    // Team-specific confirmation notes
    const confirmationNotes = previewTeam === 'TH' 
      ? (previewLanguage === 'ja' ? '15分前に到着してください' : 'Please arrive 15 minutes early')
      : (previewLanguage === 'ja' ? '10分前に到着してください' : 'Please arrive 10 minutes early')
    processed = processed.replace(/\{\{confirmation_notes\}\}/g, confirmationNotes)
    
    processed = processed.replace(/\{\{confirmation_date\}\}/g, new Date().toLocaleDateString())
    processed = processed.replace(/\{\{quotation_id\}\}/g, 'QT-67890')
    processed = processed.replace(/\{\{approval_date\}\}/g, new Date().toLocaleDateString())
    
    // Team-specific greeting
    const greetingText = previewTeam === 'TH' 
      ? (previewLanguage === 'ja' ? 'タイでのご予約を確認いたしました。' : 'Thank you for your booking in Thailand.')
      : (previewLanguage === 'ja' ? 'お客様のご予約を確認いたしました。' : 'Thank you for your booking.')
    processed = processed.replace(/\{\{greeting_text\}\}/g, greetingText)
    
    // Process formatCurrency helper
    processed = processed.replace(/\{\{formatCurrency\s+([^}]+)\s+currency\}\}/g, (match, amount) => {
      const currency = previewLanguage === 'ja' ? '¥' : '$'
      return `${currency}${amount}`
    })
    
    // Use generateEmailTemplate to create complete styled email with header and footer
    const teamKey = previewTeam === 'TH' ? 'thailand' : 'japan'
    
    // Generate complete email template with proper styling
    const completeEmail = await generateEmailTemplate({
      customerName: 'John Doe',
      language: previewLanguage,
      team: teamKey,
      logoUrl: 'https://japandriver.com/img/driver-invoice-logo.png',
      title: 'Email Template Preview',
      subtitle: 'Template Preview',
      content: processed,
      primaryColor: '#FF2800',
      secondaryColor: '#E03E2D'
    })
    
    return completeEmail
  }
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'booking',
    subject: '',
    html_content: '',
    text_content: '',
    is_active: true,
    is_default: false
  })

  // Update form data when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        category: template.category || 'booking',
        subject: template.subject || '',
        html_content: template.html_content || '',
        text_content: template.text_content || '',
        is_active: template.is_active ?? true,
        is_default: template.is_default ?? false
      })
    }
  }, [template])

  // Update processed content when form data, team, or language changes
  useEffect(() => {
    updateProcessedContent()
  }, [formData.html_content, previewTeam, previewLanguage])

  // Handle escape key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const categories = [
    { value: 'booking', label: 'Bookings', icon: Calendar },
    { value: 'quotation', label: 'Quotations', icon: FileText },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench },
    { value: 'system', label: 'System Alerts', icon: Bell },
  ]

  const handleSave = async () => {
    if (!template) return
    
    setIsSaving(true)
    try {
      const updatedTemplate = {
        ...template,
        ...formData,
        updated_at: new Date().toISOString()
      }
      
      await onSave(updatedTemplate)
      toast({
        title: "Template updated",
        description: "Email template has been saved successfully.",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getPreviewScale = () => {
    switch (previewMode) {
      case 'mobile': return 'scale-50 origin-top'
      case 'tablet': return 'scale-75 origin-top'
      default: return 'scale-100 origin-top'
    }
  }

  if (!isOpen || !template) return null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* True Full Screen Overlay */}
      <div className="fixed inset-0 bg-background">
        <div className="flex h-screen flex-col">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-semibold text-foreground">Edit Template</h1>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        template.category === 'booking' 
                          ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700'
                          : template.category === 'quotation'
                          ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
                          : template.category === 'maintenance'
                          ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700'
                          : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700'
                      }`}
                    >
                      {template.category}
                    </Badge>
                    <Badge 
                      variant={template.is_active ? "default" : "secondary"} 
                      className={`text-xs ${
                        template.is_active 
                          ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
                          : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
                      }`}
                    >
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-sm text-foreground">
                      Updated {new Date(template.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Content Area - Scrollable */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Settings */}
            <div className="w-80 border-r border-border bg-muted/20 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4 text-foreground">Template Settings</h2>
                  
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Basic Information</h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-foreground">Template Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter template name"
                            className="h-10 text-foreground bg-background border-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject" className="text-sm font-medium text-foreground">Subject Line</Label>
                          <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Enter email subject"
                            className="h-10 text-foreground bg-background border-input"
                          />
                          <p className="text-xs text-foreground">
                            Use variables like {`{{customer_name}}`} for dynamic content
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-sm font-medium text-foreground">Category</Label>
                          <Select 
                            value={formData.category} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger className="h-10 text-foreground bg-background border-input">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-input">
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value} className="text-foreground">
                                  <div className="flex items-center gap-2">
                                    <category.icon className="h-4 w-4" />
                                    {category.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Template Settings */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-foreground uppercase tracking-wide">Template Settings</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border bg-background hover:bg-muted/50 transition-colors">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-foreground">Active Template</Label>
                            <p className="text-xs text-foreground">
                              Enable this template for sending emails
                            </p>
                          </div>
                          <Switch
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border bg-background hover:bg-muted/50 transition-colors">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium text-foreground">Default Template</Label>
                            <p className="text-xs text-foreground">
                              Use as fallback when specific templates are not found
                            </p>
                          </div>
                          <Switch
                            checked={formData.is_default}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

            </div>

            {/* Right Side - Split Layout */}
            <div className="flex-1 flex min-h-0">
              {/* HTML Content Editor */}
              <div className="flex-1 flex flex-col border-r border-border">
                <div className="border-b border-border px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      HTML Editor
                    </h3>
                    {/* Scale Controls */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-foreground">Scale:</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setPreviewScale(Math.max(30, previewScale - 10))}
                        >
                          -
                        </Button>
                        <span className="text-xs w-12 text-center text-foreground">{previewScale}%</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setPreviewScale(Math.min(150, previewScale + 10))}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-6">
                  <ScrollArea className="h-full">
                    <Textarea
                      value={formData.html_content}
                      onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                      placeholder="Enter HTML content here..."
                      className="min-h-[500px] resize-none border-0 rounded-none focus-visible:ring-0 font-mono text-sm w-full bg-background text-foreground"
                      style={{ 
                        minHeight: 'calc(100vh - 200px)',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                      }}
                    />
                  </ScrollArea>
                </div>
                <div className="px-6 py-3 border-t border-border bg-muted/30">
                  <p className="text-xs text-foreground">
                    Use HTML tags and Handlebars variables for dynamic content
                  </p>
                </div>
              </div>

              {/* Live Preview */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="border-b border-border px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </h3>
                    {/* Preview Controls */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground">Team:</span>
                        <Select value={previewTeam} onValueChange={setPreviewTeam}>
                          <SelectTrigger className="h-8 w-16 text-xs text-foreground bg-background border-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-input">
                            <SelectItem value="TH" className="text-foreground">
                              <div className="flex items-center gap-2">
                                <CountryFlag country="thailand" size="sm" />
                                <span>TH</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="JP" className="text-foreground">
                              <div className="flex items-center gap-2">
                                <CountryFlag country="japan" size="sm" />
                                <span>JP</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground">Lang:</span>
                        <Select value={previewLanguage} onValueChange={setPreviewLanguage}>
                          <SelectTrigger className="h-8 w-16 text-xs text-foreground bg-background border-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-input">
                            <SelectItem value="en" className="text-foreground">EN</SelectItem>
                            <SelectItem value="ja" className="text-foreground">JA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      
                      <div className="flex items-center gap-1">
                        <Button 
                          variant={previewMode === 'desktop' ? "default" : "outline"} 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => setPreviewMode('desktop')}
                        >
                          <Monitor className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={previewMode === 'tablet' ? "default" : "outline"} 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => setPreviewMode('tablet')}
                        >
                          <Tablet className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={previewMode === 'mobile' ? "default" : "outline"} 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => setPreviewMode('mobile')}
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-1 bg-muted/20 flex items-center justify-center overflow-auto">
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ transform: `scale(${previewScale / 100})`, transformOrigin: 'center' }}
                  >
                            {previewMode === 'desktop' ? (
                          <div className="w-full max-w-5xl">
                            {/* Desktop Mockup */}
                            <div className="bg-gray-800 rounded-2xl p-3 shadow-2xl mx-auto">
                              <div className="bg-gray-100 rounded-xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
                                    <div className="bg-gray-300 h-8 flex items-center justify-between px-4 flex-shrink-0">
                                      <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                      </div>
                                      <div className="text-xs text-gray-600 font-medium">Email Preview</div>
                                      <div className="w-16"></div>
                                    </div>
                                    <div className="p-4 flex-1 overflow-auto">
                                      <div 
                                        className="w-full bg-white rounded-lg p-4"
                                        dangerouslySetInnerHTML={{ 
                                          __html: processedContent
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : previewMode === 'tablet' ? (
                          <div className="w-full max-w-md">
                            {/* Tablet Mockup - Optimized for complete email visibility */}
                            <div className="bg-gray-800 rounded-3xl p-1.5 shadow-2xl mx-auto">
                              <div className="bg-gray-100 rounded-2xl overflow-hidden flex flex-col w-[350px] mx-auto" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
                                    <div className="bg-gray-300 h-5 flex items-center justify-center flex-shrink-0">
                                      <div className="w-12 h-1 bg-gray-400 rounded-full"></div>
                                    </div>
                                    <div className="p-1.5 flex-1 overflow-auto">
                                      <div 
                                        className="w-full bg-white rounded-lg p-1.5"
                                        style={{ 
                                          transform: 'scale(0.6)', 
                                          transformOrigin: 'top left', 
                                          width: '167%',
                                          fontSize: '10px',
                                          lineHeight: '1.0',
                                          minHeight: '100%',
                                          maxWidth: '100%'
                                        }}
                                        dangerouslySetInnerHTML={{ 
                                          __html: processedContent
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                          <div className="w-full max-w-[280px]">
                            {/* Mobile Mockup */}
                            <div className="bg-gray-800 rounded-3xl p-1 shadow-2xl mx-auto">
                              <div className="bg-gray-100 rounded-2xl overflow-hidden flex flex-col w-[240px] mx-auto" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
                                    <div className="bg-gray-300 h-6 flex items-center justify-center flex-shrink-0">
                                      <div className="w-10 h-1 bg-gray-400 rounded-full"></div>
                                    </div>
                                    <div className="p-1 flex-1 overflow-auto">
                                      <div 
                                        className="w-full bg-white rounded-lg p-1"
                                        style={{ 
                                          transform: 'scale(0.42)', 
                                          transformOrigin: 'top left', 
                                          width: '238%',
                                          fontSize: '6px',
                                          lineHeight: '0.75',
                                          minHeight: '100%',
                                          maxWidth: '100%'
                                        }}
                                        dangerouslySetInnerHTML={{ 
                                          __html: processedContent
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="border-t border-border px-6 py-4 bg-background/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-foreground">
                Last saved {new Date().toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={onClose} className="h-10 px-6 text-foreground border-border hover:bg-muted">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="h-10 px-6">
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Template
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
