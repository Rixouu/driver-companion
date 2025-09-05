import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    const { data: reports, error } = await supabase
      .from('generated_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform the data to match the expected format
    const transformedReports = (reports || []).map(report => ({
      id: report.id,
      name: report.name,
      type: report.type,
      format: report.format,
      createdAt: report.created_at,
      downloadUrl: report.download_url,
      size: report.file_size ? `${(report.file_size / 1024 / 1024).toFixed(1)} MB` : undefined,
      status: report.status
    }))

    return NextResponse.json({
      success: true,
      reports: transformedReports
    })

  } catch (error) {
    console.error('Error fetching generated reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch generated reports' },
      { status: 500 }
    )
  }
}
