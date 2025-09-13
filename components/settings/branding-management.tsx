"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useI18n } from '@/lib/i18n/context'
import { Save, RefreshCw, Palette, Image, Mail, Code, Eye, Monitor, Globe, Flag } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface AppSetting {
  key: string
  value: string
  description: string
}

export function BrandingManagement() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [settings, setSettings] = useState<AppSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_logo: '',
    support_email: '',
    from_email: '',
    email_header_template: '',
    email_footer_template: '',
    email_css_styling: '',
    primary_color: '#E03E2D',
    secondary_color: '#F45C4C',
    text_color: '#32325D',
    background_color: '#F2F4F6',
    button_color: '#E03E2D',
    border_color: '#e2e8f0',
    selected_team: 'japan',
    selected_language: 'en'
  })
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Load from your app_settings table
      const response = await fetch('/api/admin/app-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        
        // Convert to form data
        const settingsMap = data.reduce((acc: any, setting: AppSetting) => {
          acc[setting.key] = setting.value
          return acc
        }, {})
        
        setFormData({
          company_name: settingsMap.company_name || 'Driver Japan',
          company_logo: settingsMap.company_logo || 'https://japandriver.com/img/driver-invoice-logo.png',
          support_email: settingsMap.support_email || 'booking@japandriver.com',
          from_email: settingsMap.from_email || 'Driver Japan <booking@japandriver.com>',
          email_header_template: settingsMap.email_header_template || '',
          email_footer_template: settingsMap.email_footer_template || '',
          email_css_styling: settingsMap.email_css_styling || '',
          primary_color: settingsMap.primary_color || '#E03E2D',
          secondary_color: settingsMap.secondary_color || '#F45C4C',
          text_color: settingsMap.text_color || '#32325D',
          background_color: settingsMap.background_color || '#F2F4F6',
          button_color: settingsMap.button_color || '#E03E2D',
          border_color: settingsMap.border_color || '#e2e8f0',
          selected_team: settingsMap.selected_team || 'japan',
          selected_language: settingsMap.selected_language || 'en'
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save settings')

      await loadSettings()
      toast({
        title: 'Success',
        description: 'Branding settings saved successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save branding settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setFormData({
      company_name: 'Driver Japan',
      company_logo: 'https://japandriver.com/img/driver-invoice-logo.png',
      support_email: 'booking@japandriver.com',
      from_email: 'Driver Japan <booking@japandriver.com>',
      email_header_template: '',
      email_footer_template: '',
      email_css_styling: '',
      primary_color: '#E03E2D',
      secondary_color: '#F45C4C',
      text_color: '#32325D',
      background_color: '#F2F4F6',
      button_color: '#E03E2D',
      border_color: '#e2e8f0',
      selected_team: 'japan',
      selected_language: 'en'
    })
  }

  const generateEmailPreview = () => {
    // Process header template to replace variables with actual values
    let headerHtml = formData.email_header_template || `
      <tr>
        <td style="background:linear-gradient(135deg,{{primary_color}} 0%,{{secondary_color}} 100%);">
          <table width="100%" role="presentation">
            <tr>
              <td align="center" style="padding:24px;">
                <table cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:50%; width:64px; height:64px; margin:0 auto 12px;">
                  <tr><td align="center" valign="middle" style="text-align:center;">
                      <img src="{{company_logo}}" width="48" height="48" alt="Driver logo" style="display:block; margin:0 auto;">
                  </td></tr>
                </table>
                <h1 style="margin:0; font-size:24px; color:#FFF; font-weight:600;">
                  {{title}}
                </h1>
                <p style="margin:4px 0 0; font-size:14px; color:rgba(255,255,255,0.85);">
                  {{subtitle}}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `

    // Replace variables with actual values for preview
    headerHtml = headerHtml
      .replace(/\{\{primary_color\}\}/g, formData.primary_color)
      .replace(/\{\{secondary_color\}\}/g, formData.secondary_color)
      .replace(/\{\{company_logo\}\}/g, formData.company_logo)
      .replace(/\{\{title\}\}/g, formData.company_name || 'Sample Email')
      .replace(/\{\{subtitle\}\}/g, 'Professional Transportation Services')
      .replace(/\{\{team\}\}/g, formData.selected_team === 'japan' ? 'Japan' : 'Thailand')
      .replace(/\{\{language\}\}/g, formData.selected_language === 'en' ? 'English' : '日本語')

    // Process footer template to replace variables with actual values
    let footerHtml = formData.email_footer_template || `
      <tr>
        <td style="padding:32px 24px; background:{{background_color}}; border-top:1px solid {{border_color}};">
          <div style="text-align:center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: {{text_color}};">
              Thank you for your business!
            </p>
            <p style="margin: 0 0 5px 0; font-size: 13px; color: {{text_color}};">
              If you have any questions about this invoice, please contact us at {{support_email}}
            </p>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">
              {{company_name}} • www.japandriver.com
            </p>
          </div>
        </td>
      </tr>
    `

    // Replace variables with actual values for preview
    footerHtml = footerHtml
      .replace(/\{\{background_color\}\}/g, formData.background_color)
      .replace(/\{\{border_color\}\}/g, formData.border_color)
      .replace(/\{\{text_color\}\}/g, formData.text_color)
      .replace(/\{\{support_email\}\}/g, formData.support_email)
      .replace(/\{\{company_name\}\}/g, formData.company_name)
      .replace(/\{\{team\}\}/g, formData.selected_team === 'japan' ? 'Japan' : 'Thailand')
      .replace(/\{\{language\}\}/g, formData.selected_language === 'en' ? 'English' : '日本語')

    const customCss = formData.email_css_styling || ''

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Email Preview</title>
        <style>
          body, table, td, a {
            -webkit-text-size-adjust:100%;
            -ms-text-size-adjust:100%;
            font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif;
          }
          table, td { mso-table-lspace:0; mso-table-rspace:0; }
          img { border:0; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
          table { border-collapse:collapse!important; }
          body { margin:0; padding:0; width:100%!important; background:#F2F4F6; }
          .container { background:#FFFFFF; border-radius:8px; overflow:hidden; max-width: 600px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .greeting { color:#32325D; margin:24px 24px 16px; line-height:1.4; font-size: 14px; }
          .info-block { background:#f8f9fa; padding:20px; border-radius:8px; margin:20px 0; }
          .info-block h3 { margin:0 0 12px 0; color:#32325D; }
          .info-block p { margin:0; color:#525f7f; }
          .info-block strong { color: #32325D; }
          .button { background-color: ${formData.button_color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .info-block { background: ${formData.background_color}; color: ${formData.text_color}; }
          .info-block h3 { color: ${formData.text_color}; }
          .info-block p { color: ${formData.text_color}; }
          .info-block strong { color: ${formData.text_color}; }
          body { background: ${formData.background_color} !important; color: ${formData.text_color} !important; }
          .container { background: #FFFFFF !important; color: ${formData.text_color} !important; }
          .greeting { color: ${formData.text_color} !important; }
          ${customCss}
        </style>
      </head>
      <body style="background:#F2F4F6; margin:0; padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td align="center" style="padding:24px;">
              <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation">
                ${headerHtml}
                <tr>
                  <td style="padding:32px 24px;">
                    <div class="greeting">
                      <p>Hello John Doe,</p>
                      <p>This is a preview of how your email template will look with your current branding settings.</p>
                      
                      <div class="info-block">
                        <h3>Sample Content Block</h3>
                        <p>This demonstrates how your content will appear with the selected styling.</p>
                        <p><strong>Company:</strong> ${formData.company_name}</p>
                        <p><strong>Support:</strong> ${formData.support_email}</p>
                      </div>
                      
                      <div style="text-align: center; margin: 20px 0;">
                        <a href="#" class="button">Sample Button</a>
                      </div>
                    </div>
                  </td>
                </tr>
                ${footerHtml}
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading branding settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div className="border-b border-border pb-3 sm:pb-4 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight">Email Branding & Templates</h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
            Customize your email templates, headers, footers, and styling
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 ml-6">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Mobile Action Buttons */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        <Button variant="outline" onClick={handleReset} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Responsive Tab Navigation */}
      <div className="space-y-4">
        {/* Mobile Dropdown */}
        <div className="sm:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Basic Info
                </div>
              </SelectItem>
              <SelectItem value="header">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Header
                </div>
              </SelectItem>
              <SelectItem value="footer">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Footer
                </div>
              </SelectItem>
              <SelectItem value="css">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  CSS Styling
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Button Tabs */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'basic'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Image className="h-4 w-4" />
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('header')}
              className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'header'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code className="h-4 w-4" />
              Header
            </button>
            <button
              onClick={() => setActiveTab('footer')}
              className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'footer'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code className="h-4 w-4" />
              Footer
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                activeTab === 'css'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Palette className="h-4 w-4" />
              CSS Styling
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'basic' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Basic company details displayed in emails and documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Driver Japan"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_logo">Logo URL</Label>
                  <Input
                    id="company_logo"
                    value={formData.company_logo}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_logo: e.target.value }))}
                    placeholder="https://japandriver.com/img/driver-invoice-logo.png"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selected_team">Team</Label>
                  <Select value={formData.selected_team} onValueChange={(value) => setFormData(prev => ({ ...prev, selected_team: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="japan">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          Japan
                        </div>
                      </SelectItem>
                      <SelectItem value="thailand">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          Thailand
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="selected_language">Language</Label>
                  <Select value={formData.selected_language} onValueChange={(value) => setFormData(prev => ({ ...prev, selected_language: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          English
                        </div>
                      </SelectItem>
                      <SelectItem value="ja">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          日本語
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Email addresses used in notifications and support
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={formData.support_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, support_email: e.target.value }))}
                    placeholder="booking@japandriver.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from_email">From Email (with name)</Label>
                  <Input
                    id="from_email"
                    value={formData.from_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, from_email: e.target.value }))}
                    placeholder="Driver Japan <booking@japandriver.com>"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'header' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Header Template Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Email Header Template
                </CardTitle>
                <CardDescription>
                  Customize the header HTML for all email templates. Leave empty to use default.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <MonacoEditor
                    height="400px"
                    language="html"
                    value={formData.email_header_template}
                    onChange={(value) => setFormData(prev => ({ ...prev, email_header_template: value || '' }))}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      automaticLayout: true,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Available variables: {`{{company_name}}, {{company_logo}}, {{primary_color}}, {{secondary_color}}, {{title}}, {{subtitle}}`}
                </p>
              </CardContent>
            </Card>

            {/* Header Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Header Settings
                </CardTitle>
                <CardDescription>
                  Configure team and language for header templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="header_team">Team</Label>
                  <Select value={formData.selected_team} onValueChange={(value) => setFormData(prev => ({ ...prev, selected_team: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="japan">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          Japan
                        </div>
                      </SelectItem>
                      <SelectItem value="thailand">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          Thailand
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="header_language">Language</Label>
                  <Select value={formData.selected_language} onValueChange={(value) => setFormData(prev => ({ ...prev, selected_language: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          English
                        </div>
                      </SelectItem>
                      <SelectItem value="ja">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          日本語
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="header_title">Header Title</Label>
                  <Input
                    id="header_title"
                    value={formData.company_name || 'Driver Japan'}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Company Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="header_subtitle">Header Subtitle</Label>
                  <Input
                    id="header_subtitle"
                    value="Professional Transportation Services"
                    placeholder="Subtitle text"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'footer' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Footer Template Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Email Footer Template
                </CardTitle>
                <CardDescription>
                  Customize the footer HTML for all email templates. Leave empty to use default.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <MonacoEditor
                    height="400px"
                    language="html"
                    value={formData.email_footer_template}
                    onChange={(value) => setFormData(prev => ({ ...prev, email_footer_template: value || '' }))}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      automaticLayout: true,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Available variables: {`{{company_name}}, {{support_email}}, {{primary_color}}, {{secondary_color}}, {{team}}, {{language}}`}
                </p>
              </CardContent>
            </Card>

            {/* Footer Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Footer Settings
                </CardTitle>
                <CardDescription>
                  Configure team and language for footer templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="footer_team">Team</Label>
                  <Select value={formData.selected_team} onValueChange={(value) => setFormData(prev => ({ ...prev, selected_team: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="japan">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          Japan
                        </div>
                      </SelectItem>
                      <SelectItem value="thailand">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          Thailand
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_language">Language</Label>
                  <Select value={formData.selected_language} onValueChange={(value) => setFormData(prev => ({ ...prev, selected_language: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          English
                        </div>
                      </SelectItem>
                      <SelectItem value="ja">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          日本語
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_company">Company Name</Label>
                  <Input
                    id="footer_company"
                    value={formData.company_name || 'Driver Japan'}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Company Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_support">Support Email</Label>
                  <Input
                    id="footer_support"
                    value={formData.support_email || 'booking@japandriver.com'}
                    onChange={(e) => setFormData(prev => ({ ...prev, support_email: e.target.value }))}
                    placeholder="support@company.com"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'css' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Color Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Settings
                </CardTitle>
                <CardDescription>
                  Configure the main colors used in email templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-12 h-10"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="flex-1"
                      placeholder="#E03E2D"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-12 h-10"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="flex-1"
                      placeholder="#F45C4C"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text_color">Text Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="text_color"
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                      className="w-12 h-10"
                    />
                    <Input
                      value={formData.text_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                      className="flex-1"
                      placeholder="#32325D"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="background_color"
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="w-12 h-10"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                      className="flex-1"
                      placeholder="#F2F4F6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="button_color">Button Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="button_color"
                      type="color"
                      value={formData.button_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))}
                      className="w-12 h-10"
                    />
                    <Input
                      value={formData.button_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, button_color: e.target.value }))}
                      className="flex-1"
                      placeholder="#E03E2D"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border_color">Border Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="border_color"
                      type="color"
                      value={formData.border_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, border_color: e.target.value }))}
                      className="w-12 h-10"
                    />
                    <Input
                      value={formData.border_color}
                      onChange={(e) => setFormData(prev => ({ ...prev, border_color: e.target.value }))}
                      className="flex-1"
                      placeholder="#e2e8f0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom CSS Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Custom CSS
                </CardTitle>
                <CardDescription>
                  Add additional CSS styles. Colors above will be automatically applied.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <MonacoEditor
                    height="400px"
                    language="css"
                    value={formData.email_css_styling}
                    onChange={(value) => setFormData(prev => ({ ...prev, email_css_styling: value || '' }))}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      automaticLayout: true,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Email clients have limited CSS support. Use inline styles when possible.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Enhanced Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Email Preview
          </CardTitle>
          <CardDescription>
            Live preview of your email template with current branding settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-gray-50">
            <div className="p-4 border-b bg-muted/50">
              <div className="flex items-center gap-3">
                <img 
                  src={formData.company_logo} 
                  alt="Company Logo" 
                  className="h-6 w-6 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <span className="font-semibold text-gray-900">
                  {formData.company_name}
                </span>
                <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  <Monitor className="h-3 w-3" />
                  Email Preview
                </div>
              </div>
            </div>
            <div className="p-4">
              <iframe
                srcDoc={generateEmailPreview()}
                className="w-full h-[600px] border-0"
                title="Email Preview"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}