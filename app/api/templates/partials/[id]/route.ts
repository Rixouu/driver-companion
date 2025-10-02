import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { error } = await supabase
      .from('partial_templates')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting partial:', error)
      return NextResponse.json({ error: 'Failed to delete partial' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in partials DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
