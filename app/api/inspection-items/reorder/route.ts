import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { items }: { items: { id: string; order: number }[] } = await request.json()
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty items data' },
        { status: 400 }
      )
    }

    console.log(`[REORDER_ITEMS] Attempting to reorder ${items.length} items: `, 
      items.map(i => `${i.id}:${i.order}`).join(', ')
    )

    const supabase = createServiceClient()
    
    // Get the item IDs from the request
    const itemIds = items.map(i => i.id)
    
    // First, get all the items that exist in the database
    const { data: existingItems, error: fetchError } = await supabase
      .from('inspection_item_templates')
      .select('id, category_id, order_number')
      .in('id', itemIds)
    
    if (fetchError) {
      console.error('[REORDER_ITEMS] Error fetching items:', fetchError)
      throw fetchError
    }
    
    if (!existingItems || existingItems.length === 0) {
      console.error('[REORDER_ITEMS] None of the requested items exist in the database')
      return NextResponse.json(
        { error: 'No requested items found in database' },
        { status: 404 }
      )
    }
    
    console.log(`[REORDER_ITEMS] Found ${existingItems.length} of ${itemIds.length} requested items in database`)
    
    // Identify which items were not found
    const existingItemIds = existingItems.map(i => i.id)
    const missingIds = itemIds.filter(id => !existingItemIds.includes(id))
    
    if (missingIds.length > 0) {
      console.warn(`[REORDER_ITEMS] ${missingIds.length} items not found in database:`, missingIds)
    }
    
    // Update each item's order_number
    const updates = []
    for (const item of items) {
      // Skip items that don't exist
      if (!existingItemIds.includes(item.id)) {
        console.warn(`[REORDER_ITEMS] Item ${item.id} not found in database, skipping update`)
        continue
      }
      
      console.log(`[REORDER_ITEMS] Updating item ${item.id} to order ${item.order}`)
      
      const { error: updateError } = await supabase
        .from('inspection_item_templates')
        .update({ order_number: item.order })
        .eq('id', item.id)
        
      if (updateError) {
        console.error(`[REORDER_ITEMS] Error updating item ${item.id}:`, updateError)
      } else {
        console.log(`[REORDER_ITEMS] Successfully updated item ${item.id} to order ${item.order}`)
        updates.push({
          id: item.id,
          order: item.order
        })
      }
    }
    
    // Consider it a success if at least one item was updated
    const isSuccess = updates.length > 0
    return NextResponse.json({ 
      success: isSuccess,
      message: isSuccess 
        ? `Successfully reordered ${updates.length} of ${items.length} items`
        : 'No items were updated. The items may not exist in the database.',
      updates: updates,
      missingIds: missingIds
    }, { status: isSuccess ? 200 : 404 })
  } catch (error) {
    console.error('Error reordering items:', error)
    return NextResponse.json(
      { error: 'Failed to reorder items', details: error },
      { status: 500 }
    )
  }
} 