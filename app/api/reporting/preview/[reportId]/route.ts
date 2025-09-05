import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'
import { generateReportPdf, ReportData } from '@/lib/report-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params
    const supabase = createServiceClient()

    // Look up the report in the database
    const { data: report, error } = await supabase
      .from('generated_reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (error || !report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Generate the PDF for preview
    if (report.format === 'pdf') {
      try {
        const reportData: ReportData = {
          id: report.id,
          name: report.name,
          type: report.type,
          format: report.format,
          dateRange: report.date_range as any,
          options: report.options as any
        }
        
        const pdfBuffer = await generateReportPdf(reportData)
        
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${report.name.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
            'Content-Length': pdfBuffer.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      } catch (error) {
        console.error('Error generating PDF preview:', error)
        return NextResponse.json(
          { error: 'Failed to generate PDF preview' },
          { status: 500 }
        )
      }
    } else {
      // For non-PDF formats, return a JSON response with report info
      return NextResponse.json({
        id: report.id,
        name: report.name,
        type: report.type,
        format: report.format,
        status: report.status,
        createdAt: report.created_at,
        message: 'Preview not available for this format. Please download the file.'
      })
    }

  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
