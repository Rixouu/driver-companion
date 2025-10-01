'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { 
  getTemplateTypeBadgeClasses,
  getTemplateLocationBadgeClasses,
  getTemplateTeamBadgeClasses
} from '@/lib/utils/styles'
import { CountryFlag } from '@/components/ui/country-flag'
import { 
  FileText, 
  Download, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  CheckSquare, 
  Send 
} from 'lucide-react'

interface RealPDFTemplate {
  id: string
  name: string
  type: 'quotation' | 'invoice'
  status: string
  variant: string
  location: 'server' | 'client'
  filePath: string
  functionName: string
  description: string
  team: 'japan' | 'thailand' | 'both'
  hasSignature: boolean
  hasStatusBadge: boolean
  isActive: boolean
  lastModified: string
  config: {
    statuses: string[]
    showSignature: boolean
    showStatusBadge: boolean
    showTeamInfo: boolean
    showLanguageToggle: boolean
    styling: {
      primaryColor: string
      fontFamily: string
      fontSize: string
    }
    features: string[]
  }
}

interface RealPDFTemplatePreviewProps {
  isOpen: boolean
  onClose: () => void
  template: RealPDFTemplate | null
}

const STATUS_OPTIONS = [
  { value: 'send', label: 'Send', icon: Send },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'approved', label: 'Approved', icon: CheckCircle },
  { value: 'rejected', label: 'Rejected', icon: XCircle },
  { value: 'paid', label: 'Paid', icon: DollarSign },
  { value: 'converted', label: 'Converted', icon: CheckSquare },
]

export function RealPDFTemplatePreview({
  isOpen,
  onClose,
  template
}: RealPDFTemplatePreviewProps) {
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'ja'>('en')
  const [previewTeam, setPreviewTeam] = useState<'japan' | 'thailand'>('japan')
  const [previewStatus, setPreviewStatus] = useState<string>('pending')
  const [previewHTML, setPreviewHTML] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadPreview = async () => {
      if (template) {
        setLoading(true)
        try {
          console.log('Loading preview for template:', template.id, 'Language:', previewLanguage, 'Team:', previewTeam, 'Status:', previewStatus)
          const response = await fetch(`/api/admin/preview-template/${template.id}?language=${previewLanguage}&team=${previewTeam}&status=${previewStatus}`)
          console.log('Preview response status:', response.status, response.ok)
          
          if (response.ok) {
            const htmlContent = await response.text()
            console.log('Preview HTML length:', htmlContent.length)
            setPreviewHTML(htmlContent)
          } else {
            const errorText = await response.text()
            console.error('Preview API error:', response.status, errorText)
            setPreviewHTML(`<div style="padding: 20px; color: red;">Error loading preview: ${response.status} - ${errorText}</div>`)
          }
        } catch (error) {
          console.error('Error loading preview:', error)
          setPreviewHTML(`<div style="padding: 20px; color: red;">Error loading preview: ${error}</div>`)
        } finally {
          setLoading(false)
        }
      }
    }
    loadPreview()
  }, [template, previewLanguage, previewTeam, previewStatus])

  const handleDownload = async () => {
    if (!template) return
    
    try {
      const response = await fetch(`/api/admin/download-template/${template.id}`)
      if (!response.ok) throw new Error('Failed to download')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (!isOpen || !template) return null



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[95vh] p-0 flex flex-col [&>button]:hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {template.name}
              </DialogTitle>
              <DialogDescription className="text-base">
                {template.description}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Controls */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Language:</label>
              <Select value={previewLanguage} onValueChange={(value: 'en' | 'ja') => setPreviewLanguage(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Team:</label>
              <Select value={previewTeam} onValueChange={(value: 'japan' | 'thailand') => setPreviewTeam(value)}>
                <SelectTrigger className="w-32">
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
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <Select value={previewStatus} onValueChange={setPreviewStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => {
                    const StatusIcon = status.icon
                    return (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={getTemplateTypeBadgeClasses(template.type)}>
                {template.type}
              </Badge>
              <Badge className={getTemplateLocationBadgeClasses(template.location)}>
                {template.location}
              </Badge>
              <Badge className={getTemplateTeamBadgeClasses(template.team)}>
                {template.team}
              </Badge>
              {template.hasSignature && (
                <Badge variant="outline">Signature</Badge>
              )}
              {template.hasStatusBadge && (
                <Badge variant="outline">Status Badge</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full w-full bg-gray-100 rounded-lg p-4">
            <div className="rounded-lg overflow-hidden shadow-lg h-full w-full bg-white">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p>Loading preview...</p>
                  </div>
                </div>
              ) : (
                <iframe
                  srcDoc={previewHTML}
                  className="w-full h-full border-0"
                  title="PDF Template Preview"
                  sandbox="allow-same-origin"
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
