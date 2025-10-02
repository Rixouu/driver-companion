'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { CountryFlag } from '@/components/ui/country-flag'
import { EmailPartialEditor } from './email-partial-editor'
import { 
  FileText, 
  Edit, 
  Eye, 
  Save,
  Settings,
  Code,
  Palette,
  Globe,
  Building2,
  RefreshCw,
  CheckCircle,
  Clock,
  DollarSign,
  Send,
  XCircle,
  CheckSquare,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  X,
  Mail,
  Type,
  Styling
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

const EMAIL_PARTIAL_TYPES = [
  { value: 'header', label: 'Header', icon: Mail, description: 'Email header with logo and branding' },
  { value: 'footer', label: 'Footer', icon: FileText, description: 'Email footer with company info and links' },
  { value: 'css', label: 'CSS', icon: Code, description: 'Email styling and responsive design' }
]

const TEAMS = [
  { value: 'japan', label: 'Japan', flag: '🇯🇵', color: 'red' },
  { value: 'thailand', label: 'Thailand', flag: '🇹🇭', color: 'orange' },
  { value: 'both', label: 'Both Teams', flag: '🌍', color: 'indigo' }
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

export function EmailPartialsManagement() {
  const { t } = useI18n()
  const [partials, setPartials] = useState<EmailPartialTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [selectedPartial, setSelectedPartial] = useState<EmailPartialTemplate | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterTeam, setFilterTeam] = useState('all')
  const [activeTab, setActiveTab] = useState('headers')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'ja'>('en')
  const [previewTeam, setPreviewTeam] = useState<'japan' | 'thailand'>('japan')

  // Load email partials from database
  const loadPartials = async () => {
    try {
      setLoading(true)
      console.log('Loading email partials...')
      const response = await fetch('/api/templates/partials?documentType=email')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded email partials:', data)
        setPartials(data)
        setHasLoaded(true)
      } else {
        const errorText = await response.text()
        console.error('Failed to load email partials:', response.status, errorText)
        setPartials([])
      }
    } catch (error) {
      console.error('Error loading email partials:', error)
      setPartials([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasLoaded) {
      loadPartials()
    }
  }, [hasLoaded])

  const filteredPartials = partials.filter(partial => {
    const matchesSearch = partial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partial.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || partial.type === filterType
    const matchesTeam = filterTeam === 'all' || partial.team === filterTeam || partial.team === 'both'
    
    return matchesSearch && matchesType && matchesTeam
  })

  const handleEdit = (partial: EmailPartialTemplate) => {
    console.log('Editing email partial:', partial)
    setSelectedPartial(partial)
    setIsEditModalOpen(true)
  }

  const handlePreview = (partial: EmailPartialTemplate) => {
    setSelectedPartial(partial)
    setIsPreviewOpen(true)
  }

  const handleCreate = () => {
    const newPartial: EmailPartialTemplate = {
      id: Date.now().toString(),
      name: 'New Email Partial',
      type: 'header',
      team: 'both',
      content: '',
      isActive: true,
      lastModified: new Date().toISOString(),
      variables: []
    }
    setSelectedPartial(newPartial)
    setIsEditModalOpen(true)
  }

  const handleSave = async (partial: EmailPartialTemplate) => {
    try {
      const response = await fetch('/api/templates/partials', {
        method: partial.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...partial,
          documentType: 'email' // Ensure it's always email
        }),
      })
      
      if (response.ok) {
        await loadPartials() // Reload from database
        setIsEditModalOpen(false)
        setSelectedPartial(null)
      } else {
        console.error('Failed to save email partial:', response.statusText)
      }
    } catch (error) {
      console.error('Error saving email partial:', error)
    }
  }

  const handleDelete = async (partial: EmailPartialTemplate) => {
    if (confirm('Are you sure you want to delete this email partial?')) {
      try {
        const response = await fetch(`/api/templates/partials/${partial.id}`, {
          method: 'DELETE',
        })
        
        if (response.ok) {
          await loadPartials() // Reload from database
        } else {
          console.error('Failed to delete email partial:', response.statusText)
        }
      } catch (error) {
        console.error('Error deleting email partial:', error)
      }
    }
  }

  const handleDuplicate = (partial: EmailPartialTemplate) => {
    const duplicated: EmailPartialTemplate = {
      ...partial,
      id: Date.now().toString(),
      name: `${partial.name} (Copy)`,
      lastModified: new Date().toISOString()
    }
    setPartials(prev => [...prev, duplicated])
  }

  const generatePreviewContent = (partial: EmailPartialTemplate) => {
    let preview = partial.content
    
    // Replace variables with sample data for email templates
    const teamData = partial.team === 'japan' 
      ? { company: 'Driver (Japan) Company Limited', address: '#47 11F TOC Bldg 7-22-17 Nishi-Gotanda, Shinagawa-Ku Tokyo Japan 141-0031', taxId: 'T2020001153198' }
      : { company: 'Driver (Thailand) Company Limited', address: '580/17 Soi Ramkhamhaeng 39, Wang Thong Lang, Bangkok 10310, Thailand', taxId: '0105566135845' }
    
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
      '{{team}}': partial.team,
      '{{team_footer_html}}': `<p style="color: #1f2937;">Thank you for choosing ${teamData.company}!</p>`,
      '{{contact_email}}': 'booking@japandriver.com',
      '{{support_email}}': 'support@japandriver.com'
    }
    
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key, 'g'), value)
    })
    
    // Add dark mode friendly styling for better contrast
    if (partial.type !== 'css') {
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
    
    return preview
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'header': return <Mail className="h-4 w-4 text-blue-500" />
      case 'footer': return <FileText className="h-4 w-4 text-green-500" />
      case 'css': return <Code className="h-4 w-4 text-purple-500" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'japan': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-300'
      case 'thailand': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300'
      case 'both': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'header': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300'
      case 'footer': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-300'
      case 'css': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Templates Management</h2>
          <p className="text-muted-foreground">
            Manage email header, footer, and CSS templates for different teams
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Email Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Email Templates</Label>
              <Input
                id="search"
                placeholder="Search by name or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="sm:w-48">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="header">Headers</SelectItem>
                  <SelectItem value="footer">Footers</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="team-filter">Team</Label>
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="japan">🇯🇵 Japan</SelectItem>
                  <SelectItem value="thailand">🇹🇭 Thailand</SelectItem>
                  <SelectItem value="both">🌍 Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Partials Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {filteredPartials.map((partial) => (
          <Card key={partial.id} className="hover:shadow-lg transition-all duration-200 group border-2 hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getTypeIcon(partial.type)}
                  <div>
                    <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {partial.name}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {partial.type === 'header' ? 'Email header template' : 
                       partial.type === 'footer' ? 'Email footer template' : 
                       'Email CSS styling template'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {partial.isActive && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className={getTypeColor(partial.type)}>
                  {partial.type === 'header' ? 'Header' : partial.type === 'footer' ? 'Footer' : 'CSS'}
                </Badge>
                <Badge className={getTeamColor(partial.team)}>
                  <CountryFlag country={partial.team} size="sm" className="mr-1" />
                  {partial.team === 'both' ? 'Universal' : partial.team === 'japan' ? 'Japan' : 'Thailand'}
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(partial)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(partial)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>

            </CardHeader>
          </Card>
        ))}
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p>Loading email templates...</p>
          </CardContent>
        </Card>
      ) : filteredPartials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Email Templates Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || filterType !== 'all' || filterTeam !== 'all'
                ? 'No email templates found matching your search criteria'
                : 'No email templates found. Create your first email template to get started.'}
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Email Template
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Editor Modal */}
      {isEditModalOpen && selectedPartial && (
        <EmailPartialEditor
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedPartial(null)
          }}
          onSave={handleSave}
          partial={selectedPartial}
        />
      )}

      {/* Preview Modal */}
      {isPreviewOpen && selectedPartial && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsPreviewOpen(false)} />
          <div className="absolute inset-4 bg-background rounded-lg shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">{selectedPartial.name}</h2>
                <p className="text-sm text-muted-foreground">Preview {selectedPartial.type} template</p>
              </div>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
            <div className="flex-1 p-6 overflow-auto">
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
                  {selectedPartial.type === 'css' ? (
                    <pre className="text-sm overflow-auto text-gray-900 dark:text-gray-900">
                      <code>{generatePreviewContent(selectedPartial)}</code>
                    </pre>
                  ) : (
                    <div 
                      className="prose prose-sm max-w-none text-gray-900 dark:text-gray-900"
                      dangerouslySetInnerHTML={{ 
                        __html: generatePreviewContent(selectedPartial)
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
