import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function POST(request: NextRequest) {
  try {
    const { user_id, group_id, should_add } = await request.json()
    
    if (!user_id || !group_id || typeof should_add !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    if (should_add) {
      // Add user to group
      const { error } = await supabase
        .from('user_group_memberships')
        .insert({
          user_id,
          group_id,
          is_active: true
        })

      if (error) throw error
    } else {
      // Remove user from group (deactivate membership)
      const { error } = await supabase
        .from('user_group_memberships')
        .update({ is_active: false })
        .eq('user_id', user_id)
        .eq('group_id', group_id)

      if (error) throw error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating user group membership:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
