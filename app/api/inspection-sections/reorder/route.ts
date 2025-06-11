import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { sections }: { sections: { id: string; order: number }[] } = await request.json()
    
    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Invalid sections data' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Update each section's order_number
    for (const section of sections) {
      const { error } = await supabase
        .from('inspection_categories')
        .update({ order_number: section.order })
        .eq('id', section.id)
        
      if (error) {
        console.error('Error updating section order:', error)
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering sections:', error)
    return NextResponse.json(
      { error: 'Failed to reorder sections' },
      { status: 500 }
    )
  }
} 