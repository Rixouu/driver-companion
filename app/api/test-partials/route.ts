import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    console.log('Testing partials API...')
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('partial_templates')
      .select('*')
      .limit(5)

    if (error) {
      console.error('Error in test:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Test successful, found:', data?.length || 0, 'records')
    return NextResponse.json({ success: true, count: data?.length || 0, data })
  } catch (error) {
    console.error('Exception in test:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
