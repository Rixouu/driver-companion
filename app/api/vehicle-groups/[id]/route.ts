import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-client"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = createServiceClient()

    const { data: vehicleGroup, error } = await supabase
      .from('vehicle_groups')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[API] Error fetching vehicle group:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle group' },
        { status: 500 }
      )
    }

    if (!vehicleGroup) {
      return NextResponse.json(
        { error: 'Vehicle group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(vehicleGroup)
  } catch (error) {
    console.error('[API] Error in vehicle group endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    
    const { name, description, color } = body
    
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }
    
    const { data: updatedGroup, error } = await supabase
      .from('vehicle_groups')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating vehicle group:', error)
      return NextResponse.json(
        { error: 'Failed to update vehicle group', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(updatedGroup)
  } catch (error) {
    console.error('Unexpected error updating vehicle group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    
    // First, unassign all vehicles from this group
    const { error: vehicleUpdateError } = await supabase
      .from('vehicles')
      .update({ vehicle_group_id: null, updated_at: new Date().toISOString() })
      .eq('vehicle_group_id', params.id)

    if (vehicleUpdateError) {
      console.error('Error unassigning vehicles:', vehicleUpdateError)
      return NextResponse.json(
        { error: 'Failed to unassign vehicles from group', details: vehicleUpdateError.message },
        { status: 500 }
      )
    }

    // Delete any template assignments for this group
    const { error: assignmentDeleteError } = await supabase
      .from('inspection_template_assignments')
      .delete()
      .eq('vehicle_group_id', params.id)

    if (assignmentDeleteError) {
      console.error('Error deleting template assignments:', assignmentDeleteError)
      return NextResponse.json(
        { error: 'Failed to delete template assignments', details: assignmentDeleteError.message },
        { status: 500 }
      )
    }

    // Delete the group
    const { error } = await supabase
      .from('vehicle_groups')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting vehicle group:', error)
      return NextResponse.json(
        { error: 'Failed to delete vehicle group', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error deleting vehicle group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 