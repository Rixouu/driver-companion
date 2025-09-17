import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Add safety check - require confirmation parameter
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get('confirm')
    
    if (confirm !== 'true') {
      return NextResponse.json({
        error: 'Safety check failed. Add ?confirm=true to the URL to confirm template deletion.',
        warning: 'This will delete ALL notification templates permanently!'
      }, { status: 400 })
    }
    
    console.log('⚠️ [CLEAR-TEMPLATES] WARNING: Clearing all notification templates')
    
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
