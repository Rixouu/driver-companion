'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sanitizeHtml } from '@/lib/utils/sanitize'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CountryFlag } from '@/components/ui/country-flag'
import { 
  X, 
  Save, 
  FileText
} from 'lucide-react'

interface PartialTemplate {
  id: string
  name: string
  type: 'header' | 'footer'
  documentType: 'quotation' | 'invoice'
  team: 'japan' | 'thailand' | 'both'
  content: string
  isActive: boolean
  lastModified: string
  variables: string[]
  preview?: string
}

interface PartialEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (partial: PartialTemplate) => void
  partial: PartialTemplate | null
}


export function PartialEditor({
  isOpen,
  onClose,
  onSave,
  partial
}: PartialEditorProps) {
  const { t } = useI18n()
  const [partialData, setPartialData] = useState<PartialTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'ja'>('en')
  const [previewTeam, setPreviewTeam] = useState<'japan' | 'thailand'>('japan')

  useEffect(() => {
    if (partial) {
      setPartialData(partial)
    }
  }, [partial])

  if (!isOpen) return null
  
  if (!partialData) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="absolute right-0 top-0 h-full w-full sm:w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[80vw] 2xl:w-[75vw] bg-background shadow-2xl">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading editor...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(partialData)
      onClose()
    } catch (error) {
      console.error('Error saving partial:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleBasicChange = (field: string, value: any) => {
    setPartialData(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleContentChange = (content: string) => {
    if (!partialData) return
    
    setPartialData(prev => prev ? { ...prev, content } : null)
    
    // Extract variables from content
    const variableRegex = /\{\{([^}]+)\}\}/g
    const matches = content.match(variableRegex)
    const variables = matches ? [...new Set(matches)] : []
    
    setPartialData(prev => prev ? { ...prev, variables } : null)
  }


  const generatePreview = () => {
    if (!partialData) return ''
    let preview = partialData.content
    
    // Replace variables with sample data for PDF documents
    const teamData = previewTeam === 'japan' 
      ? { company: 'Driver (Japan) Company Limited', address: '#47 11F TOC Bldg 7-22-17 Nishi-Gotanda, Shinagawa-Ku Tokyo Japan 141-0031', taxId: 'T2020001153198' }
      : { company: 'Driver (Thailand) Company Limited', address: '580/17 Soi Ramkhamhaeng 39, Wang Thong Lang, Bangkok 10310, Thailand', taxId: '0105566135845' }
    
    const sampleData: { [key: string]: string } = {
      '{{company_name}}': teamData.company,
      '{{company_address}}': teamData.address,
      '{{company_phone}}': '+81-3-1234-5678',
      '{{company_email}}': 'booking@japandriver.com',
      '{{company_website}}': 'www.japandriver.com',
      '{{logo_url}}': '/placeholder-logo.png',
      '{{current_date}}': new Date().toLocaleDateString(),
      '{{current_time}}': new Date().toLocaleTimeString(),
      '{{document_number}}': partialData.documentType === 'quotation' ? 'QUO-2025-001' : 'INV-2025-001',
      '{{quotation_number}}': 'QUO-2025-001',
      '{{invoice_number}}': 'INV-2025-001',
      '{{customer_name}}': 'John Doe',
      '{{customer_address}}': '456 Customer Ave, Bangkok, Thailand',
      '{{total_amount}}': '¥50,000',
      '{{currency}}': 'JPY',
      '{{language}}': previewLanguage,
      '{{team}}': previewTeam,
      '{{payment_terms}}': 'Net 30 days',
      '{{signature_line}}': '_________________',
      '{{footer_text}}': 'Thank you for your business!',
      '{{tax_id}}': teamData.taxId,
      '{{due_date}}': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      '{{issue_date}}': new Date().toLocaleDateString(),
      '{{contact_email}}': 'booking@japandriver.com'
    }
    
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key, 'g'), value)
    })
    
    return preview
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'header': return <FileText className="h-4 w-4 text-blue-500" />
      case 'footer': return <FileText className="h-4 w-4 text-green-500" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Editor Panel */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[80vw] 2xl:w-[75vw] bg-background shadow-2xl transform transition-all duration-300 ease-in-out animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTypeIcon(partialData.type)}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold truncate">{partialData.name}</h2>
                <p className="text-sm text-muted-foreground">Edit PDF {partialData.type} template for {partialData.documentType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 pb-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Editor */}
                <div className="space-y-4">
                  <div className="space-y-8">
                    <Label htmlFor="content">HTML Content</Label>
                    <Textarea
                      id="content"
                      value={partialData.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Enter HTML content for your partial..."
                      className="min-h-[400px] font-mono text-sm"
                    />
                  </div>
                </div>

              {/* Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Live Preview</Label>
                  <div className="flex items-center gap-2">
                    <Select value={previewLanguage} onValueChange={(value: 'en' | 'ja') => setPreviewLanguage(value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">EN</SelectItem>
                        <SelectItem value="ja">JA</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={previewTeam} onValueChange={(value: 'japan' | 'thailand') => setPreviewTeam(value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="japan">🇯🇵</SelectItem>
                        <SelectItem value="thailand">🇹🇭</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden h-[400px] flex flex-col">
                  <div className="bg-muted/50 p-3 border-b flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-muted-foreground ml-2">Preview</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white flex-1 overflow-auto">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: sanitizeHtml(generatePreview()) 
                    }}
                    className="prose prose-sm max-w-none"
                  />
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={partialData.name}
                      onChange={(e) => handleBasicChange('name', e.target.value)}
                      placeholder="Enter partial name..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={partialData.type} onValueChange={(value: 'header' | 'footer') => handleBasicChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="header">Header</SelectItem>
                        <SelectItem value="footer">Footer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="documentType">Document Type</Label>
                    <Select value={partialData.documentType} onValueChange={(value: 'quotation' | 'invoice') => handleBasicChange('documentType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quotation">Quotation</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="team">Team</Label>
                    <Select value={partialData.team} onValueChange={(value: 'japan' | 'thailand' | 'both') => handleBasicChange('team', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="japan">🇯🇵 Japan</SelectItem>
                        <SelectItem value="thailand">🇹🇭 Thailand</SelectItem>
                        <SelectItem value="both">🌍 Both Teams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={partialData.isActive}
                      onCheckedChange={(checked) => handleBasicChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive" className="text-sm font-medium">Active</Label>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {partialData.isActive ? 'This partial is currently active' : 'This partial is inactive'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
