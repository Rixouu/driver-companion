import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Clear all existing templates
    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: 'All notification templates cleared successfully' 
    })

  } catch (error) {
    console.error('Error clearing notification templates:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}
