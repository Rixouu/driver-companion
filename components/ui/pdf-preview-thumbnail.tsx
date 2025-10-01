"use client"

import { useState, useEffect } from 'react'
import { FileText, Eye } from 'lucide-react'
import { CountryFlag } from './country-flag'

interface PDFPreviewThumbnailProps {
  template: {
    id: string
    name: string
    type: 'quotation' | 'invoice'
    team: 'japan' | 'thailand' | 'both'
    variant?: string
  }
  className?: string
}

export function PDFPreviewThumbnail({ template, className = "" }: PDFPreviewThumbnailProps) {
  const [previewHTML, setPreviewHTML] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate preview using existing API
  const generatePreview = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Use the existing preview API
      const response = await fetch(`/api/admin/preview-template/${template.id}?language=en&team=${template.team}&status=pending`)
      
      if (response.ok) {
        const htmlContent = await response.text()
        setPreviewHTML(htmlContent)
      } else {
        throw new Error('Failed to generate preview')
      }
    } catch (err) {
      console.error('Error generating PDF preview:', err)
      setError('Preview unavailable')
    } finally {
      setIsLoading(false)
    }
  }

  // Generate preview on mount
  useEffect(() => {
    generatePreview()
  }, [template.id])

  const getTeamFlag = () => {
    if (template.team === 'both') return 'both'
    return template.team
  }

  return (
    <div className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm ${className}`}>
      {/* Simple Header */}
      <div className="bg-gray-50 h-8 flex items-center justify-between px-3 border-b">
        <div className="flex items-center gap-2">
          <CountryFlag country={getTeamFlag()} size="sm" />
          <span className="text-xs text-gray-600 font-medium">PDF Preview</span>
        </div>
        <button
          onClick={generatePreview}
          className="p-1 hover:bg-gray-200 rounded"
          title="Refresh preview"
        >
          <Eye className="h-3 w-3 text-gray-600" />
        </button>
      </div>

      {/* Preview Content */}
      <div className="h-40 overflow-hidden bg-gray-50">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-xs text-gray-500">Loading preview...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-600 font-medium">{template.name}</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
            </div>
          </div>
        ) : previewHTML ? (
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <iframe
              srcDoc={previewHTML}
              className="border-0 scale-[0.8] origin-center pointer-events-none w-[100%] h-[100%]"
              title={`${template.name} preview`}
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-600 font-medium">{template.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
