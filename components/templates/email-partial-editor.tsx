'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Save,
  Eye,
  Code,
  Mail,
  FileText,
  X,
  Copy,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface EmailPartialTemplate {
  id: string
  name: string
  type: 'header' | 'footer' | 'css'
  team: 'japan' | 'thailand' | 'both'
  content: string
  isActive: boolean
  lastModified: string
  variables: string[]
  preview?: string
}

interface EmailPartialEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (partial: EmailPartialTemplate) => void
  partial: EmailPartialTemplate
}

const EMAIL_PARTIAL_TYPES = [
  { value: 'header', label: 'Header', icon: Mail, description: 'Email header with logo and branding' },
  { value: 'footer', label: 'Footer', icon: FileText, description: 'Email footer with company info and links' },
  { value: 'css', label: 'CSS', icon: Code, description: 'Email styling and responsive design' }
]

const TEAMS = [
  { value: 'japan', label: 'Japan', flag: '🇯🇵' },
  { value: 'thailand', label: 'Thailand', flag: '🇹🇭' },
  { value: 'both', label: 'Both Teams', flag: '🌍' }
]

const COMMON_EMAIL_VARIABLES = [
  '{{company_name}}',
  '{{company_address}}',
  '{{company_phone}}',
  '{{company_email}}',
  '{{company_website}}',
  '{{logo_url}}',
  '{{primary_color}}',
  '{{secondary_color}}',
  '{{title}}',
  '{{subtitle}}',
  '{{customer_name}}',
  '{{language}}',
  '{{team}}',
  '{{team_footer_html}}',
  '{{contact_email}}',
  '{{support_email}}'
]

export function EmailPartialEditor({ isOpen, onClose, onSave, partial }: EmailPartialEditorProps) {
  const [formData, setFormData] = useState<EmailPartialTemplate>(partial)
  const [previewContent, setPreviewContent] = useState('')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState('content')

  useEffect(() => {
    setFormData(partial)
  }, [partial])

  useEffect(() => {
    generatePreview()
  }, [formData.content, formData.type])

  const generatePreview = () => {
    let preview = formData.content
    
    // Replace variables with sample data
    const teamData = formData.team === 'japan' 
      ? { company: 'Driver (Japan) Company Limited', address: '#47 11F TOC Bldg 7-22-17 Nishi-Gotanda, Shinagawa-Ku Tokyo Japan 141-0031' }
      : { company: 'Driver (Thailand) Company Limited', address: '580/17 Soi Ramkhamhaeng 39, Wang Thong Lang, Bangkok 10310, Thailand' }
    
    const sampleData: { [key: string]: string } = {
      '{{company_name}}': teamData.company,
      '{{company_address}}': teamData.address,
      '{{company_phone}}': '+81-3-1234-5678',
      '{{company_email}}': 'booking@japandriver.com',
      '{{company_website}}': 'www.japandriver.com',
      '{{logo_url}}': '/placeholder-logo.png',
      '{{primary_color}}': '#FF2800',
      '{{secondary_color}}': '#FF2800dd',
      '{{title}}': 'Email Template Preview',
      '{{subtitle}}': 'Testing Email Partials',
      '{{customer_name}}': 'John Doe',
      '{{language}}': 'en',
      '{{team}}': formData.team,
      '{{team_footer_html}}': `<p style="color: #1f2937;">Thank you for choosing ${teamData.company}!</p>`,
      '{{contact_email}}': 'booking@japandriver.com',
      '{{support_email}}': 'support@japandriver.com'
    }
    
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key, 'g'), value)
    })
    
    // Add dark mode friendly styling for better contrast
    if (formData.type !== 'css') {
      preview = preview.replace(
        /<([^>]+)>/g, 
        (match, tagContent) => {
          // Add dark mode text color to common elements
          if (tagContent.includes('style=')) {
            return match.replace(
              /style="([^"]*)"/g, 
              (styleMatch, styleContent) => {
                if (!styleContent.includes('color:')) {
                  return `style="${styleContent}; color: #1f2937;"` // dark gray for better contrast
                }
                return styleMatch
              }
            )
          } else if (['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].some(tag => tagContent.startsWith(tag))) {
            return match.replace('>', ' style="color: #1f2937;">')
          }
          return match
        }
      )
    }
    
    setPreviewContent(preview)
  }

  const handleSave = () => {
    onSave(formData)
  }

  const handleVariableClick = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      
      setFormData(prev => ({
        ...prev,
        content: before + variable + after
      }))
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'header': return <Mail className="h-4 w-4 text-blue-500" />
      case 'footer': return <FileText className="h-4 w-4 text-green-500" />
      case 'css': return <Code className="h-4 w-4 text-purple-500" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-4 bg-background rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {getTypeIcon(formData.type)}
            <div>
              <h2 className="text-xl font-bold">Edit Email Template</h2>
              <p className="text-sm text-muted-foreground">
                {formData.id ? 'Edit existing email template' : 'Create new email template'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)}>
              <Eye className="h-4 w-4 mr-2" />
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Form */}
          {!isPreviewMode && (
            <div className="w-1/2 p-6 overflow-auto border-r">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="variables">Variables</TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Template Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={formData.type} onValueChange={(value: 'header' | 'footer' | 'css') => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EMAIL_PARTIAL_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="team">Team</Label>
                    <Select value={formData.team} onValueChange={(value: 'japan' | 'thailand' | 'both') => 
                      setFormData(prev => ({ ...prev, team: value }))
                    }>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAMS.map((team) => (
                          <SelectItem key={team.value} value={team.value}>
                            <div className="flex items-center gap-2">
                              <span>{team.flag}</span>
                              {team.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <div>
                    <Label htmlFor="content">Template Content</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      className="mt-1 min-h-[400px] font-mono text-sm"
                      placeholder="Enter your email template content here..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Use variables like {`{{company_name}}`} for dynamic content. Click on variables in the Variables tab to insert them.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="variables" className="space-y-4">
                  <div>
                    <Label>Available Variables</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click on a variable to insert it into your template content.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {COMMON_EMAIL_VARIABLES.map((variable) => (
                        <Button
                          key={variable}
                          variant="outline"
                          size="sm"
                          onClick={() => handleVariableClick(variable)}
                          className="justify-start text-left h-auto p-2"
                        >
                          <code className="text-xs">{variable}</code>
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Right Panel - Preview */}
          <div className={`${isPreviewMode ? 'w-full' : 'w-1/2'} p-6 overflow-auto`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {formData.type === 'header' ? 'Header' : formData.type === 'footer' ? 'Footer' : 'CSS'}
                  </Badge>
                  <Badge variant="outline">
                    {formData.team === 'both' ? 'Universal' : formData.team === 'japan' ? 'Japan' : 'Thailand'}
                  </Badge>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-3 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground ml-2">Email Preview</span>
                  </div>
                </div>
                <div className="p-4 bg-white min-h-[400px]">
                  {formData.type === 'css' ? (
                    <pre className="text-sm overflow-auto text-gray-900 dark:text-gray-900">
                      <code>{previewContent}</code>
                    </pre>
                  ) : (
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: previewContent
                      }}
                      className="prose prose-sm max-w-none text-gray-900 dark:text-gray-900"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
