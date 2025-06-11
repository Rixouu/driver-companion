import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { items }: { items: { id: string; order: number }[] } = await request.json()
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid items data' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Update each item's order_number
    for (const item of items) {
      const { error } = await supabase
        .from('inspection_item_templates')
        .update({ order_number: item.order })
        .eq('id', item.id)
        
      if (error) {
        console.error('Error updating item order:', error)
        throw error
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering items:', error)
    return NextResponse.json(
      { error: 'Failed to reorder items' },
      { status: 500 }
    )
  }
} 