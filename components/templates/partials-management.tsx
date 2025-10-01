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
import { PartialEditor } from './partial-editor'
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
  X
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

const PARTIAL_TYPES = [
  { value: 'header', label: 'Header', icon: FileText, description: 'Document header with logo and company info' },
  { value: 'footer', label: 'Footer', icon: FileText, description: 'Document footer with signatures and terms' }
]

const DOCUMENT_TYPES = [
  { value: 'quotation', label: 'Quotation', icon: FileText, color: 'blue' },
  { value: 'invoice', label: 'Invoice', icon: FileText, color: 'green' }
]

const TEAMS = [
  { value: 'japan', label: 'Japan', flag: '🇯🇵', color: 'red' },
  { value: 'thailand', label: 'Thailand', flag: '🇹🇭', color: 'orange' },
  { value: 'both', label: 'Both Teams', flag: '🌍', color: 'indigo' }
]

const COMMON_VARIABLES = [
  '{{company_name}}',
  '{{company_address}}',
  '{{company_phone}}',
  '{{company_email}}',
  '{{company_website}}',
  '{{logo_url}}',
  '{{current_date}}',
  '{{current_time}}',
  '{{document_number}}',
  '{{customer_name}}',
  '{{customer_address}}',
  '{{total_amount}}',
  '{{currency}}',
  '{{language}}',
  '{{team}}'
]

export function PartialsManagement() {
  const { t } = useI18n()
  const [partials, setPartials] = useState<PartialTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPartial, setSelectedPartial] = useState<PartialTemplate | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterDocumentType, setFilterDocumentType] = useState('all')
  const [filterTeam, setFilterTeam] = useState('all')
  const [activeTab, setActiveTab] = useState('headers')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'ja'>('en')
  const [previewTeam, setPreviewTeam] = useState<'japan' | 'thailand'>('japan')

  // Load partials from database
  const loadPartials = async () => {
    try {
      setLoading(true)
      console.log('Loading partials...')
      const response = await fetch('/api/templates/partials')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded partials:', data)
        setPartials(data)
      } else {
        const errorText = await response.text()
        console.error('Failed to load partials:', response.status, errorText)
        setPartials([])
      }
    } catch (error) {
      console.error('Error loading partials:', error)
      setPartials([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPartials()
  }, [])

  const filteredPartials = partials.filter(partial => {
    const matchesSearch = partial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partial.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || partial.type === filterType
    const matchesDocumentType = filterDocumentType === 'all' || partial.documentType === filterDocumentType
    const matchesTeam = filterTeam === 'all' || partial.team === filterTeam || partial.team === 'both'
    
    return matchesSearch && matchesType && matchesDocumentType && matchesTeam
  })

  const handleEdit = (partial: PartialTemplate) => {
    console.log('Editing partial:', partial)
    setSelectedPartial(partial)
    setIsEditModalOpen(true)
  }

  const handlePreview = (partial: PartialTemplate) => {
    setSelectedPartial(partial)
    setIsPreviewOpen(true)
  }

  const handleCreate = () => {
    const newPartial: PartialTemplate = {
      id: Date.now().toString(),
      name: 'New Partial',
      type: 'header',
      documentType: 'quotation',
      team: 'both',
      content: '',
      isActive: true,
      lastModified: new Date().toISOString(),
      variables: []
    }
    setSelectedPartial(newPartial)
    setIsEditModalOpen(true)
  }

  const handleSave = async (partial: PartialTemplate) => {
    try {
      const response = await fetch('/api/templates/partials', {
        method: partial.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partial),
      })
      
      if (response.ok) {
        await loadPartials() // Reload from database
        setIsEditModalOpen(false)
        setSelectedPartial(null)
      } else {
        console.error('Failed to save partial:', response.statusText)
      }
    } catch (error) {
      console.error('Error saving partial:', error)
    }
  }

  const handleDelete = async (partial: PartialTemplate) => {
    if (confirm('Are you sure you want to delete this partial?')) {
      try {
        const response = await fetch(`/api/templates/partials/${partial.id}`, {
          method: 'DELETE',
        })
        
        if (response.ok) {
          await loadPartials() // Reload from database
        } else {
          console.error('Failed to delete partial:', response.statusText)
        }
      } catch (error) {
        console.error('Error deleting partial:', error)
      }
    }
  }

  const handleDuplicate = (partial: PartialTemplate) => {
    const duplicated: PartialTemplate = {
      ...partial,
      id: Date.now().toString(),
      name: `${partial.name} (Copy)`,
      lastModified: new Date().toISOString()
    }
    setPartials(prev => [...prev, duplicated])
  }

  const generatePreviewContent = (partial: PartialTemplate) => {
    let preview = partial.content
    
    // Replace variables with sample data for PDF documents
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
      '{{current_date}}': new Date().toLocaleDateString(),
      '{{current_time}}': new Date().toLocaleTimeString(),
      '{{document_number}}': partial.documentType === 'quotation' ? 'QUO-2025-001' : 'INV-2025-001',
      '{{quotation_number}}': 'QUO-2025-001',
      '{{invoice_number}}': 'INV-2025-001',
      '{{customer_name}}': 'John Doe',
      '{{customer_address}}': '456 Customer Ave, Bangkok, Thailand',
      '{{total_amount}}': '¥50,000',
      '{{currency}}': 'JPY',
      '{{language}}': 'en',
      '{{team}}': partial.team,
      '{{payment_terms}}': 'Net 30 days',
      '{{signature_line}}': '_________________',
      '{{footer_text}}': 'Thank you for your business!',
      '{{tax_id}}': teamData.taxId,
      '{{due_date}}': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      '{{issue_date}}': new Date().toLocaleDateString(),
      '{{contact_email}}': 'booking@japandriver.com',
      '{{primary_color}}': '#FF2800',
      '{{secondary_color}}': '#FF2800dd',
      '{{title}}': partial.documentType === 'quotation' ? 'Quotation' : 'Invoice',
      '{{subtitle}}': 'Document Preview'
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

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'quotation': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300'
      case 'invoice': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-300'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-300'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">PDF Partials Management</h2>
        <p className="text-muted-foreground">
          Manage header and footer templates for quotation and invoice PDF documents
        </p>
      </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Partial
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Partials</Label>
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
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="document-filter">Document</Label>
              <Select value={filterDocumentType} onValueChange={setFilterDocumentType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Documents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  <SelectItem value="quotation">Quotations</SelectItem>
                  <SelectItem value="invoice">Invoices</SelectItem>
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

      {/* Partials Grid */}
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
                      {partial.type === 'header' ? 'Document header template' : 'Document footer template'}
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
              <div className="flex items-center gap-2 mb-4">
                <Badge className={getDocumentTypeColor(partial.documentType)}>
                  {partial.documentType}
                </Badge>
                <Badge className={getTeamColor(partial.team)}>
                  <CountryFlag country={partial.team} size="sm" className="mr-1" />
                  {partial.team}
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
            <p>Loading partials...</p>
          </CardContent>
        </Card>
      ) : filteredPartials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Partials Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || filterType !== 'all' || filterDocumentType !== 'all' || filterTeam !== 'all'
                ? 'No partials found matching your search criteria'
                : 'No partials found. Create your first partial to get started.'}
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Partial
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Editor Modal */}
      {isEditModalOpen && selectedPartial && (
        <PartialEditor
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
                    <span className="text-xs text-muted-foreground ml-2">Preview</span>
                  </div>
                </div>
                <div className="p-4 bg-white min-h-[400px]">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: generatePreviewContent(selectedPartial)
                    }}
                    className="prose prose-sm max-w-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
