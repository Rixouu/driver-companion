import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-client"
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/main'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Temporarily disable auth check for debugging
    // const session = await getServerSession(authOptions)
    
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = await params
    const supabaseClient = createServiceClient()

    // Get all vehicles and their current group assignments
    const { data: vehicles, error } = await supabaseClient
      .from('vehicles')
      .select(`
        id,
        name,
        plate_number,
        brand,
        model,
        vehicle_group_id
      `)
      .order('name')

    if (error) {
      console.error('Error fetching vehicles:', error)
      throw error
    }

    const result = {
      availableVehicles: vehicles?.filter(v => !v.vehicle_group_id || v.vehicle_group_id === id) || [],
      assignedVehicles: vehicles?.filter(v => v.vehicle_group_id === id) || []
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Temporarily disable auth check for debugging
    // const session = await getServerSession(authOptions)
    
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = await params
    const body = await request.json()
    const { vehicleIds } = body

    if (!Array.isArray(vehicleIds)) {
      return NextResponse.json({ error: 'Invalid vehicle IDs' }, { status: 400 })
    }

    const supabaseClient = createServiceClient()

    // First, remove all vehicles from this group
    const { error: removeError } = await supabaseClient
      .from('vehicles')
      .update({ vehicle_group_id: null })
      .eq('vehicle_group_id', id)

    if (removeError) {
      console.error('Error removing assignments:', removeError)
      throw removeError
    }

    // Then assign the new vehicles to this group
    if (vehicleIds.length > 0) {
      const { error: assignError } = await supabaseClient
        .from('vehicles')
        .update({ vehicle_group_id: id })
        .in('id', vehicleIds)

      if (assignError) {
        console.error('Error assigning vehicles:', assignError)
        throw assignError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating vehicle assignments:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = createServiceClient()
    const body = await request.json()
    
    const { vehicleIds } = body
    
    if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle IDs array is required' },
        { status: 400 }
      )
    }
    
    // Verify the group exists
    const { data: group, error: groupError } = await supabase
      .from('vehicle_groups')
      .select('id')
      .eq('id', resolvedParams.id)
      .single()
    
    if (groupError || !group) {
      return NextResponse.json(
        { error: 'Vehicle group not found' },
        { status: 404 }
      )
    }
    
    // Update vehicles to assign them to this group
    const { data: updatedVehicles, error } = await supabase
      .from('vehicles')
      .update({ 
        vehicle_group_id: resolvedParams.id,
        updated_at: new Date().toISOString()
      })
      .in('id', vehicleIds)
      .select('id, name, plate_number')
    
    if (error) {
      console.error('Error adding vehicles to group:', error)
      return NextResponse.json(
        { error: 'Failed to add vehicles to group', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      updatedVehicles,
      message: `${updatedVehicles?.length || 0} vehicles added to group`
    })
  } catch (error) {
    console.error('Unexpected error adding vehicles to group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const supabase = createServiceClient()
    const body = await request.json()
    
    const { vehicleIds } = body
    
    if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return NextResponse.json(
        { error: 'Vehicle IDs array is required' },
        { status: 400 }
      )
    }
    
    // Remove vehicles from this group
    const { data: updatedVehicles, error } = await supabase
      .from('vehicles')
      .update({ 
        vehicle_group_id: null,
        updated_at: new Date().toISOString()
      })
      .in('id', vehicleIds)
      .eq('vehicle_group_id', resolvedParams.id) // Only remove if they're actually in this group
      .select('id, name, plate_number')
    
    if (error) {
      console.error('Error removing vehicles from group:', error)
      return NextResponse.json(
        { error: 'Failed to remove vehicles from group', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      updatedVehicles,
      message: `${updatedVehicles?.length || 0} vehicles removed from group`
    })
  } catch (error) {
    console.error('Unexpected error removing vehicles from group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 