import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('templateType')
    const vehicleId = searchParams.get('vehicleId')
    const groupId = searchParams.get('groupId')
    
    let query = supabase
      .from('inspection_template_assignments')
      .select(`
        *,
        vehicle:vehicles(id, name, plate_number),
        vehicle_group:vehicle_groups(id, name, color)
      `)
      .eq('is_active', true)
    
    if (templateType) {
      query = query.eq('template_type', templateType)
    }
    
    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }
    
    if (groupId) {
      query = query.eq('vehicle_group_id', groupId)
    }
    
    const { data: assignments, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching template assignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch template assignments', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(assignments || [])
  } catch (error) {
    console.error('Unexpected error fetching template assignments:', error)
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
    
    const { 
      template_type, 
      vehicle_id, 
      vehicle_group_id, 
      is_active = true,
      replace_existing = false 
    } = body
    
    if (!template_type) {
      return NextResponse.json(
        { error: 'Template type is required' },
        { status: 400 }
      )
    }
    
    if (!vehicle_id && !vehicle_group_id) {
      return NextResponse.json(
        { error: 'Either vehicle_id or vehicle_group_id must be provided' },
        { status: 400 }
      )
    }
    
    if (vehicle_id && vehicle_group_id) {
      return NextResponse.json(
        { error: 'Cannot assign to both vehicle and group simultaneously' },
        { status: 400 }
      )
    }
    
    // If replacing existing assignments, delete old ones first
    if (replace_existing) {
      let deleteQuery = supabase
        .from('inspection_template_assignments')
        .delete()
        .eq('template_type', template_type)
      
      if (vehicle_id) {
        deleteQuery = deleteQuery.eq('vehicle_id', vehicle_id)
      } else if (vehicle_group_id) {
        deleteQuery = deleteQuery.eq('vehicle_group_id', vehicle_group_id)
      }
      
      const { error: deleteError } = await deleteQuery
      
      if (deleteError) {
        console.error('Error deleting existing assignments:', deleteError)
        return NextResponse.json(
          { error: 'Failed to clear existing assignments', details: deleteError.message },
          { status: 500 }
        )
      }
    }
    
    const assignmentData = {
      template_type,
      vehicle_id: vehicle_id || null,
      vehicle_group_id: vehicle_group_id || null,
      is_active
    }
    
    const { data: newAssignment, error } = await supabase
      .from('inspection_template_assignments')
      .insert(assignmentData)
      .select(`
        *,
        vehicle:vehicles(id, name, plate_number),
        vehicle_group:vehicle_groups(id, name, color)
      `)
      .single()
    
    if (error) {
      console.error('Error creating template assignment:', error)
      return NextResponse.json(
        { error: 'Failed to create template assignment', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(newAssignment)
  } catch (error) {
    console.error('Unexpected error creating template assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('id')
    const templateType = searchParams.get('templateType')
    const vehicleId = searchParams.get('vehicleId')
    const groupId = searchParams.get('groupId')
    
    if (!assignmentId && !templateType) {
      return NextResponse.json(
        { error: 'Assignment ID or template type is required' },
        { status: 400 }
      )
    }
    
    let deleteQuery = supabase.from('inspection_template_assignments').delete()
    
    if (assignmentId) {
      deleteQuery = deleteQuery.eq('id', assignmentId)
    } else if (templateType) {
      deleteQuery = deleteQuery.eq('template_type', templateType)
      
      if (vehicleId) {
        deleteQuery = deleteQuery.eq('vehicle_id', vehicleId)
      }
      
      if (groupId) {
        deleteQuery = deleteQuery.eq('vehicle_group_id', groupId)
      }
    }
    
    const { error } = await deleteQuery
    
    if (error) {
      console.error('Error deleting template assignment:', error)
      return NextResponse.json(
        { error: 'Failed to delete template assignment', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error deleting template assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 