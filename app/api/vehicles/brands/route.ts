import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data: brands, error } = await supabase
      .from('vehicles')
      .select('brand')
      .not('deleted_at', 'is', null)
      .order('brand')

    if (error) {
      console.error('Error fetching vehicle brands:', error)
      return NextResponse.json({ error: 'Failed to fetch vehicle brands' }, { status: 500 })
    }

    // Extract unique brands and filter out nulls
    const uniqueBrands = [...new Set(brands?.map(v => v.brand).filter(Boolean) || [])]
    
    return NextResponse.json(uniqueBrands)
  } catch (error) {
    console.error('Error in vehicle brands API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
