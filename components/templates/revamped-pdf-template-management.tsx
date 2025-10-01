'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Edit, 
  Eye, 
  Download,
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
  Minimize2
} from 'lucide-react'
import { SimplePDFTemplateEditor } from './simple-pdf-template-editor'
import { RealPDFTemplatePreview } from './real-pdf-template-preview'

// Define the real PDF template types based on your actual system
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
    features: string[]
  }
}

// Templates are loaded from the database via the API

export function RevampedPDFTemplateManagement() {
  const { t } = useI18n()
  const [templates, setTemplates] = useState<RealPDFTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<RealPDFTemplate | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterTeam, setFilterTeam] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('templates')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'ja'>('en')
  const [previewTeam, setPreviewTeam] = useState<'japan' | 'thailand'>('japan')

  // Load templates from database
  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/pdf-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      } else {
        console.error('Failed to load templates from API')
        setTemplates([])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const handleEdit = (template: RealPDFTemplate) => {
    setSelectedTemplate(template)
    setIsEditModalOpen(true)
  }

  const handlePreview = (template: RealPDFTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewOpen(true)
  }

  const handleSaveTemplate = async (updatedTemplate: RealPDFTemplate) => {
    try {
      // Update local state immediately for UI responsiveness
      setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t))
      
      // Save to database
      const response = await fetch(`/api/admin/pdf-templates/${updatedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTemplate)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save template')
      }
      
      const result = await response.json()
      console.log('Template saved successfully to database:', result.message)
      
      setIsEditModalOpen(false)
      setSelectedTemplate(null)
      
    } catch (error) {
      console.error('Error saving template:', error)
      // Revert local state on error
      setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? selectedTemplate! : t))
      alert(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDownload = async (template: RealPDFTemplate) => {
    try {
      const response = await fetch(`/api/admin/download-template/${template.id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Failed to download template')
      }
    } catch (error) {
      console.error('Error downloading template:', error)
    }
  }

  const handleRefresh = () => {
    console.log('Refreshing templates from codebase...')
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || template.type === filterType
    const matchesTeam = filterTeam === 'all' || template.team === filterTeam || template.team === 'both'
    const matchesStatus = filterStatus === 'all' || template.status === filterStatus || template.status === 'all'
    
    return matchesSearch && matchesType && matchesTeam && matchesStatus
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quotation': return <FileText className="h-4 w-4" />
      case 'invoice': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quotation': return 'bg-blue-100 text-blue-800'
      case 'invoice': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLocationColor = (location: string) => {
    switch (location) {
      case 'server': return 'bg-purple-100 text-purple-800'
      case 'client': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'japan': return 'bg-red-100 text-red-800'
      case 'thailand': return 'bg-orange-100 text-orange-800'
      case 'both': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'send': return <Send className="h-3 w-3" />
      case 'pending': return <Clock className="h-3 w-3" />
      case 'approved': return <CheckCircle className="h-3 w-3" />
      case 'rejected': return <XCircle className="h-3 w-3" />
      case 'paid': return <DollarSign className="h-3 w-3" />
      case 'converted': return <CheckSquare className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'send': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'paid': return 'bg-emerald-100 text-emerald-800'
      case 'converted': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const generatePreviewHTML = (template: RealPDFTemplate) => {
    const isJapanese = previewLanguage === 'ja'
    const teamInfo = previewTeam === 'japan' 
      ? {
          companyName: 'Driver (Japan) Company Limited',
          address: ['#47 11F TOC Bldg 7-22-17 Nishi-Gotanda', 'Shinagawa-Ku Tokyo Japan 141-0031'],
          taxId: 'Tax ID: T2020001153198'
        }
      : {
          companyName: 'Driver (Thailand) Company Limited',
          address: ['580/17 Soi Ramkhamhaeng 39', 'Wang Thong Lang, Bangkok 10310, Thailand'],
          taxId: 'Tax ID: 0105566135845'
        }

    // Get the appropriate status for preview
    const previewStatus = template.type === 'quotation' ? 'converted' : 'paid'

    if (template.type === 'quotation') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; 
              margin: 0; 
              padding: 16px; 
              background: #f8fafc;
            }
            .container { 
              max-width: 100%; 
              margin: 0 auto; 
            }
            .document {
              font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; 
              color: #111827; 
              padding: 24px; 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              background: white;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .brand-line {
              border-top: 3px solid #FF2600; 
              width: 100%; 
              margin-bottom: 24px;
            }
            .logo-section {
              text-align: left; 
              margin: 24px 0; 
              margin-bottom: 32px;
            }
            .header-section {
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 32px;
              gap: 24px;
            }
            .header-left {
              flex: 1;
            }
            .header-right {
              text-align: right; 
              flex: 1;
            }
            .document-title {
              margin: 0 0 16px 0; 
              font-size: 28px; 
              font-weight: bold; 
              color: #111827;
            }
            .document-info {
              margin: 0 0 8px 0; 
              color: #111827; 
              font-size: 14px;
            }
            .status-badge {
              display: inline-block; 
              padding: 8px 16px; 
              background: #8b5cf6; 
              color: white; 
              border-radius: 6px; 
              font-size: 12px; 
              font-weight: bold; 
              text-transform: uppercase; 
              margin-top: 16px;
            }
            .company-name {
              margin: 0 0 8px 0; 
              font-size: 18px; 
              color: #111827; 
              font-weight: 600;
            }
            .company-address {
              margin: 0 0 4px 0; 
              color: #111827; 
              font-size: 13px;
            }
            .section-title {
              margin: 0 0 12px 0; 
              color: #374151; 
              font-size: 16px; 
              font-weight: bold;
            }
            .section-content {
              margin-bottom: 24px;
            }
            .info-row {
              margin: 0 0 6px 0; 
              font-size: 14px;
            }
            .info-label {
              font-weight: 600;
            }
            .price-row {
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px;
              font-size: 14px;
            }
            .price-total {
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px; 
              border-top: 2px solid #e5e7eb; 
              padding-top: 12px;
              font-weight: bold;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="document">
              <!-- Brand line -->
              <div class="brand-line"></div>
              
              <!-- Logo -->
              <div class="logo-section">
                <img src="data:image/png;base64,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" alt="Driver Logo" style="height: 60px;">
              </div>
              
              <!-- Header -->
              <div class="header-section">
                <div class="header-left">
                  <h1 class="document-title">
                    ${isJapanese ? '見積書' : 'QUOTATION'}
                  </h1>
                  <p class="document-info">
                    ${isJapanese ? '見積書番号' : 'Quotation #'}: QUO-JPDR-000001
                  </p>
                  <p class="document-info">
                    ${isJapanese ? '見積書発行日' : 'Quotation Date'}: 9/30/2025
                  </p>
                  <div class="status-badge">
                    ✓ ${isJapanese ? '変換済み' : 'CONVERTED'}
                  </div>
                </div>
                <div class="header-right">
                  <h2 class="company-name">${teamInfo.companyName}</h2>
                  ${teamInfo.address.map(line => `<p class="company-address">${line}</p>`).join('')}
                  <p class="company-address">${teamInfo.taxId}</p>
                </div>
              </div>
              
              <!-- Billing Address -->
              <div class="section-content">
                <h3 class="section-title">
                  ${isJapanese ? '請求先住所' : 'BILLING ADDRESS'}:
                </h3>
                <p class="info-row">John Doe</p>
                <p class="info-row">john.doe@example.com</p>
                <p class="info-row">0800553516</p>
              </div>
              
              <!-- Service Details -->
              <div class="section-content">
                <h3 class="section-title">
                  ${isJapanese ? 'サービス詳細' : 'SERVICE DETAILS'}:
                </h3>
                <p class="info-row">
                  <span class="info-label">${isJapanese ? 'サービス種別' : 'Service Type'}:</span> 
                  ${isJapanese ? 'チャーターサービス' : 'Charter Services'}
                </p>
                <p class="info-row">
                  <span class="info-label">${isJapanese ? '車両' : 'Vehicle'}:</span> 
                  Mercedes V-class Black Suites
                </p>
                <p class="info-row">
                  <span class="info-label">${isJapanese ? '乗車場所' : 'Pickup'}:</span> 
                  ${isJapanese ? '成田空港' : 'Narita Airport'}
                </p>
                <p class="info-row">
                  <span class="info-label">${isJapanese ? '降車場所' : 'Dropoff'}:</span> 
                  ${isJapanese ? '東京駅' : 'Tokyo Station'}
                </p>
              </div>
              
              <!-- Price Details -->
              <div class="section-content">
                <h3 class="section-title">
                  ${isJapanese ? '料金詳細' : 'PRICE DETAILS'}:
                </h3>
                
                <!-- Service Items -->
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 6px;">
                    <div>
                      <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 4px;">
                        Mercedes V-class Black Suites (品川 300 い 4058)
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '時間料金 (4時間/日)' : 'Hourly Rate (4 hours / day)'}: ¥92,000
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '日数' : 'Number of Days'}: × 3
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '乗車日' : 'Pickup Date'}: 30/09/2025
                      </div>
                      <div style="font-size: 12px; color: #666;">
                        ${isJapanese ? '乗車時間' : 'Pickup Time'}: 09:00:00
                      </div>
                    </div>
                    <div style="font-weight: bold; font-size: 16px; color: #111827;">
                      ¥276,000
                    </div>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 6px;">
                    <div>
                      <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 4px;">
                        Airport Transfer Haneda - Toyota Alphard Executive Lounge (品川 300 い 4077)
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        1 ${isJapanese ? '時間' : 'hour(s)'}
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '乗車日' : 'Pickup Date'}: 10/10/2025
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '乗車時間' : 'Pickup Time'}: 05:05:00
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '基本料金' : 'Base Price'}: ¥138,000
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '時間調整 (25%)' : 'Time Adjustment (25%)'}: +¥34,500
                      </div>
                      <div style="font-size: 12px; color: #666;">
                        ${isJapanese ? '深夜料金 (22:00-06:00)' : 'Overtime (22:00-06:00)'}
                      </div>
                    </div>
                    <div style="font-weight: bold; font-size: 16px; color: #111827;">
                      ¥172,500
                    </div>
                  </div>
                </div>
                
                <!-- Summary -->
                <div style="border-top: 2px solid #e5e7eb; padding-top: 16px;">
                  <div class="price-row">
                    <span>${isJapanese ? 'サービス小計' : 'Services Subtotal'}:</span>
                    <span>¥448,500</span>
                  </div>
                  <div class="price-row">
                    <span>${isJapanese ? '小計' : 'Subtotal'}:</span>
                    <span>¥448,500</span>
                  </div>
                  <div class="price-row" style="color: #dc2626;">
                    <span>${isJapanese ? 'プロモーション: TIERA' : 'Promotion: TIERA'}:</span>
                    <span>-¥134,550</span>
                  </div>
                  <div class="price-row">
                    <span>${isJapanese ? '税金 (10%)' : 'Tax (10%)'}:</span>
                    <span>+¥31,395</span>
                  </div>
                  <div class="price-total" style="border-top: 3px solid #FF2600; padding-top: 16px; margin-top: 16px;">
                    <span>${isJapanese ? '合計金額' : 'Total Amount'}:</span>
                    <span style="color: #FF2600; font-size: 18px;">¥345,345</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    } else {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; 
              margin: 0; 
              padding: 16px; 
              background: #f8fafc;
            }
            .container { 
              max-width: 100%; 
              margin: 0 auto; 
            }
            .document {
              font-family: 'Noto Sans Thai', 'Noto Sans', sans-serif; 
              color: #111827; 
              padding: 24px; 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              background: white;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .brand-line {
              border-top: 3px solid #FF2600; 
              width: 100%; 
              margin-bottom: 24px;
            }
            .logo-section {
              text-align: left; 
              margin: 24px 0; 
              margin-bottom: 32px;
            }
            .header-section {
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 32px;
              gap: 24px;
            }
            .header-left {
              flex: 1;
            }
            .header-right {
              text-align: right; 
              flex: 1;
            }
            .document-title {
              margin: 0 0 16px 0; 
              font-size: 28px; 
              font-weight: bold; 
              color: #111827;
            }
            .document-info {
              margin: 0 0 8px 0; 
              color: #111827; 
              font-size: 14px;
            }
            .status-badge {
              display: inline-block; 
              padding: 8px 16px; 
              background: #10B981; 
              color: white; 
              border-radius: 6px; 
              font-size: 12px; 
              font-weight: bold; 
              text-transform: uppercase; 
              margin-top: 16px;
            }
            .company-name {
              margin: 0 0 8px 0; 
              font-size: 18px; 
              color: #111827; 
              font-weight: 600;
            }
            .company-address {
              margin: 0 0 4px 0; 
              color: #111827; 
              font-size: 13px;
            }
            .section-title {
              margin: 0 0 12px 0; 
              color: #374151; 
              font-size: 16px; 
              font-weight: bold;
            }
            .section-content {
              margin-bottom: 24px;
            }
            .info-row {
              margin: 0 0 6px 0; 
              font-size: 14px;
            }
            .info-label {
              font-weight: 600;
            }
            .price-row {
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px;
              font-size: 14px;
            }
            .price-total {
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px; 
              border-top: 2px solid #e5e7eb; 
              padding-top: 12px;
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              margin-top: 40px; 
              padding-top: 20px; 
              border-top: 1px solid #e5e7eb; 
              text-align: center;
            }
            .footer-title {
              margin: 0 0 10px 0; 
              font-size: 16px; 
              font-weight: bold; 
              color: #111827;
            }
            .footer-text {
              margin: 0 0 5px 0; 
              font-size: 14px; 
              color: #111827;
            }
            .footer-company {
              margin: 10px 0 0 0; 
              font-size: 13px; 
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="document">
              <!-- Brand line -->
              <div class="brand-line"></div>
              
              <!-- Logo -->
              <div class="logo-section">
                <img src="data:image/png;base64,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" alt="Driver Logo" style="height: 60px;">
              </div>
              
              <!-- Header -->
              <div class="header-section">
                <div class="header-left">
                  <h1 class="document-title">
                    ${isJapanese ? '請求書' : 'INVOICE'}
                  </h1>
                  <p class="document-info">
                    ${isJapanese ? '請求書番号' : 'Invoice #'}: INV-JPDR-000001
                  </p>
                  <p class="document-info">
                    ${isJapanese ? '請求書発行日' : 'Invoice Date'}: 9/30/2025
                  </p>
                  <div class="status-badge">
                    ✓ ${isJapanese ? '支払済み' : 'PAID'}
                  </div>
                </div>
                <div class="header-right">
                  <h2 class="company-name">${teamInfo.companyName}</h2>
                  ${teamInfo.address.map(line => `<p class="company-address">${line}</p>`).join('')}
                  <p class="company-address">${teamInfo.taxId}</p>
                </div>
              </div>
              
              <!-- Billing Address -->
              <div class="section-content">
                <h3 class="section-title">
                  ${isJapanese ? '請求先' : 'BILL TO'}:
                </h3>
                <p class="info-row">John Doe</p>
                <p class="info-row">john.doe@example.com</p>
                <p class="info-row">0800553516</p>
              </div>
              
              <!-- Service Details -->
              <div class="section-content">
                <h3 class="section-title">
                  ${isJapanese ? '項目詳細' : 'ITEM DETAILS'}:
                </h3>
                <p class="info-row">
                  <span class="info-label">${isJapanese ? 'サービス種別' : 'Service Type'}:</span> 
                  ${isJapanese ? 'チャーターサービス' : 'Charter Services'}
                </p>
                <p class="info-row">
                  <span class="info-label">${isJapanese ? '車両' : 'Vehicle'}:</span> 
                  Mercedes V-class Black Suites
                </p>
                <p class="info-row">
                  <span class="info-label">${isJapanese ? '乗車場所' : 'Pickup'}:</span> 
                  ${isJapanese ? '成田空港' : 'Narita Airport'}
                </p>
                <p class="info-row">
                  <span class="info-label">${isJapanese ? '降車場所' : 'Dropoff'}:</span> 
                  ${isJapanese ? '東京駅' : 'Tokyo Station'}
                </p>
              </div>
              
              <!-- Price Details -->
              <div class="section-content">
                <h3 class="section-title">
                  ${isJapanese ? '請求金額' : 'AMOUNT DUE'}:
                </h3>
                
                <!-- Service Items -->
                <div style="margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 6px;">
                    <div>
                      <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 4px;">
                        Mercedes V-class Black Suites (品川 300 い 4058)
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '時間料金 (4時間/日)' : 'Hourly Rate (4 hours / day)'}: ¥92,000
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '日数' : 'Number of Days'}: × 3
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '乗車日' : 'Pickup Date'}: 30/09/2025
                      </div>
                      <div style="font-size: 12px; color: #666;">
                        ${isJapanese ? '乗車時間' : 'Pickup Time'}: 09:00:00
                      </div>
                    </div>
                    <div style="font-weight: bold; font-size: 16px; color: #111827;">
                      ¥276,000
                    </div>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 6px;">
                    <div>
                      <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 4px;">
                        Airport Transfer Haneda - Toyota Alphard Executive Lounge (品川 300 い 4077)
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        1 ${isJapanese ? '時間' : 'hour(s)'}
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '乗車日' : 'Pickup Date'}: 10/10/2025
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '乗車時間' : 'Pickup Time'}: 05:05:00
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '基本料金' : 'Base Price'}: ¥138,000
                      </div>
                      <div style="font-size: 12px; color: #666; margin-bottom: 2px;">
                        ${isJapanese ? '時間調整 (25%)' : 'Time Adjustment (25%)'}: +¥34,500
                      </div>
                      <div style="font-size: 12px; color: #666;">
                        ${isJapanese ? '深夜料金 (22:00-06:00)' : 'Overtime (22:00-06:00)'}
                      </div>
                    </div>
                    <div style="font-weight: bold; font-size: 16px; color: #111827;">
                      ¥172,500
                    </div>
                  </div>
                </div>
                
                <!-- Summary -->
                <div style="border-top: 2px solid #e5e7eb; padding-top: 16px;">
                  <div class="price-row">
                    <span>${isJapanese ? 'サービス小計' : 'Services Subtotal'}:</span>
                    <span>¥448,500</span>
                  </div>
                  <div class="price-row">
                    <span>${isJapanese ? '小計' : 'Subtotal'}:</span>
                    <span>¥448,500</span>
                  </div>
                  <div class="price-row" style="color: #dc2626;">
                    <span>${isJapanese ? 'プロモーション: TIERA' : 'Promotion: TIERA'}:</span>
                    <span>-¥134,550</span>
                  </div>
                  <div class="price-row">
                    <span>${isJapanese ? '税金 (10%)' : 'Tax (10%)'}:</span>
                    <span>+¥31,395</span>
                  </div>
                  <div class="price-total" style="border-top: 3px solid #FF2600; padding-top: 16px; margin-top: 16px;">
                    <span>${isJapanese ? '合計金額' : 'Total Amount'}:</span>
                    <span style="color: #FF2600; font-size: 18px;">¥345,345</span>
                  </div>
                </div>
              </div>
              
              <!-- Footer -->
              <div class="footer">
                <p class="footer-title">
                  ${isJapanese ? 'ご利用いただきありがとうございます！' : 'Thank you for your business!'}
                </p>
                <p class="footer-text">
                  ${isJapanese ? 'この請求書に関するお問い合わせは booking@japandriver.com までご連絡ください。' : 'If you have any questions about this invoice, please contact us at booking@japandriver.com'}
                </p>
                <p class="footer-company">
                  ${teamInfo.companyName} • www.japandriver.com
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">PDF Templates</h2>
          <p className="text-muted-foreground">
            Manage your PDF generation templates with integrated preview and editing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Templates & Preview</TabsTrigger>
          <TabsTrigger value="partials">Partials</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Templates</Label>
                  <Input
                    id="search"
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="sm:w-48">
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="quotation">Quotation</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:w-48">
                  <Label htmlFor="team-filter">Team</Label>
                  <Select value={filterTeam} onValueChange={setFilterTeam}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      <SelectItem value="japan">Japan</SelectItem>
                      <SelectItem value="thailand">Thailand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:w-48">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="send">Send</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className="grid gap-8 lg:grid-cols-2">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-all duration-200 group border-2 hover:border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div>
                        <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">{template.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {template.isActive && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(template.type)}>
                        {template.type}
                      </Badge>
                      <Badge className={getLocationColor(template.location)}>
                        {template.location}
                      </Badge>
                      <Badge className={getTeamColor(template.team)}>
                        {template.team}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {template.lastModified}
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.config.statuses.map((status) => (
                      <Badge key={status} className={`${getStatusColor(status)} text-xs`}>
                        {getStatusIcon(status)}
                        <span className="ml-1">{status}</span>
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Template Info */}
                  <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">File:</span>
                        <p className="truncate">{template.filePath}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Function:</span>
                        <p className="truncate">{template.functionName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Features:</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.config.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(template)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleDownload(template)}
                      className="ml-2"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Loading Templates...</h3>
                <p className="text-muted-foreground text-center">
                  Fetching PDF templates from the database
                </p>
              </CardContent>
            </Card>
          ) : filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || filterType !== 'all' || filterTeam !== 'all' || filterStatus !== 'all'
                    ? 'No templates found matching your search criteria'
                    : 'No PDF templates found in your codebase'}
                </p>
                <Button onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan Codebase
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>


        <TabsContent value="partials" className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Partials Coming Soon</h3>
              <p className="text-muted-foreground text-center mb-4">
                We're working on a user-friendly partials editor. Stay tuned!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {isEditModalOpen && selectedTemplate && (
        <SimplePDFTemplateEditor
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedTemplate(null)
          }}
          template={selectedTemplate}
          onSave={handleSaveTemplate}
        />
      )}

      {isPreviewOpen && selectedTemplate && (
        <RealPDFTemplatePreview
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false)
            setSelectedTemplate(null)
          }}
          template={selectedTemplate}
        />
      )}
    </div>
  )
}
