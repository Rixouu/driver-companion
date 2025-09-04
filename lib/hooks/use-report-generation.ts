import { useState, useCallback } from 'react'
import { DateRange } from 'react-day-picker'

export interface ReportOptions {
  name: string
  type: 'comprehensive' | 'financial' | 'vehicle' | 'driver' | 'inspection' | 'maintenance'
  format: 'pdf' | 'excel' | 'csv'
  dateRange: DateRange
  includeCharts: boolean
  includeDetails: boolean
  sections: {
    financial: boolean
    vehicles: boolean
    drivers: boolean
    inspections: boolean
    maintenance: boolean
    bookings: boolean
  }
}

export interface ReportGenerationResult {
  success: boolean
  reportId?: string
  downloadUrl?: string
  error?: string
}

export function useReportGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReports, setGeneratedReports] = useState<Array<{
    id: string
    name: string
    type: string
    format: string
    createdAt: string
    downloadUrl?: string
  }>>([])

  const generateReport = useCallback(async (options: ReportOptions): Promise<ReportGenerationResult> => {
    setIsGenerating(true)

    try {
      const response = await fetch('/api/reporting/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate report')
      }

      // Add to generated reports list
      if (result.report) {
        setGeneratedReports(prev => [result.report, ...prev])
      }

      return {
        success: true,
        reportId: result.report?.id,
        downloadUrl: result.report?.downloadUrl
      }
    } catch (error) {
      console.error('Error generating report:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report'
      }
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const downloadReport = useCallback(async (reportId: string) => {
    try {
      const response = await fetch(`/api/reporting/download/${reportId}`)
      
      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading report:', error)
      throw error
    }
  }, [])

  const deleteReport = useCallback(async (reportId: string) => {
    try {
      const response = await fetch(`/api/reporting/delete/${reportId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete report')
      }

      setGeneratedReports(prev => prev.filter(report => report.id !== reportId))
    } catch (error) {
      console.error('Error deleting report:', error)
      throw error
    }
  }, [])

  const fetchGeneratedReports = useCallback(async () => {
    try {
      const response = await fetch('/api/reporting/generated')
      
      if (!response.ok) {
        throw new Error('Failed to fetch generated reports')
      }

      const result = await response.json()
      setGeneratedReports(result.reports || [])
    } catch (error) {
      console.error('Error fetching generated reports:', error)
    }
  }, [])

  return {
    isGenerating,
    generatedReports,
    generateReport,
    downloadReport,
    deleteReport,
    fetchGeneratedReports
  }
}
