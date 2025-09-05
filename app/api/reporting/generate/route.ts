import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { v4 as uuidv4 } from 'uuid'
import { generateReportPdf, ReportData } from '@/lib/report-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      type,
      format,
      dateRange,
      includeCharts,
      includeDetails,
      sections
    } = body

    // Validate required fields
    if (!name || !type || !format || !dateRange) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    
    // Generate report ID
    const reportId = uuidv4()
    
    // Format the report name as "report-nameofreport-date"
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-CA') // YYYY-MM-DD format
    }
    
    const formattedName = `report-${name.toLowerCase().replace(/\s+/g, '-')}-${formatDate(dateRange.from)}`
    
    // Create report record
    const reportData = {
      id: reportId,
      name: formattedName,
      type,
      format,
      status: 'generating',
      date_range: {
        from: dateRange.from,
        to: dateRange.to
      },
      options: {
        includeCharts,
        includeDetails,
        sections
      },
      created_at: new Date().toISOString()
    }

    // Generate the actual PDF report
    let pdfBuffer: Buffer | null = null
    let downloadUrl: string | null = null
    
    if (format === 'pdf') {
      try {
        const reportData: ReportData = {
          id: reportId,
          name: formattedName,
          type,
          format,
          dateRange,
          options: {
            includeCharts,
            includeDetails,
            sections
          }
        }
        
        pdfBuffer = await generateReportPdf(reportData)
        downloadUrl = `/api/reporting/download/${reportId}`
      } catch (error) {
        console.error('Error generating PDF:', error)
        // Continue with placeholder for other formats
      }
    }
    
    // For non-PDF formats or if PDF generation fails, use placeholder
    if (!downloadUrl) {
      downloadUrl = `/api/reporting/download/${reportId}`
    }

    // Update report with download URL and file size
    const finalReportData = {
      ...reportData,
      status: 'completed',
      download_url: downloadUrl,
      file_size: pdfBuffer ? pdfBuffer.length : null,
      completed_at: new Date().toISOString()
    }

    // Save to database
    const { error } = await supabase
      .from('generated_reports')
      .insert(finalReportData)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      report: finalReportData
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
