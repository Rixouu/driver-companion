import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data: groups, error } = await supabase
      .from('vehicle_groups')
      .select(`
        *,
        vehicle_count:vehicles(count)
      `)
      .order('name')
    
    if (error) {
      console.error('Error fetching vehicle groups:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle groups', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(groups || [])
  } catch (error) {
    console.error('Unexpected error fetching vehicle groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()
    
    const { name, description, color } = body
    
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }
    
    const { data: newGroup, error } = await supabase
      .from('vehicle_groups')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating vehicle group:', error)
      return NextResponse.json(
        { error: 'Failed to create vehicle group', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(newGroup)
  } catch (error) {
    console.error('Unexpected error creating vehicle group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 