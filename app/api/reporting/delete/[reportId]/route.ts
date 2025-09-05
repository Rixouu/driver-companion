import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params
    const supabase = createServiceClient()

    // Delete the report from database
    const { error } = await supabase
      .from('generated_reports')
      .delete()
      .eq('id', reportId)

    if (error) {
      throw error
    }

    // In a real implementation, you would also:
    // 1. Delete the associated file from storage
    // 2. Clean up any related records

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}
