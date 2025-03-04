import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  const { data: inspection, error } = await supabase
    .from('inspections')
    .select(`
      *,
      vehicle:vehicles (
        id, 
        name, 
        plate_number, 
        brand, 
        model, 
        year, 
        vin,
        image_url
      ),
      inspection_items (
        id,
        template_id,
        status,
        notes,
        inspection_photos (
          id,
          photo_url
        )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(inspection)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = params
  
  try {
    const body = await request.json()
    const { status } = body
    
    // Update the inspection status
    const { data, error } = await supabase
      .from('inspections')
      .update({
        status,
        ...(status === 'in_progress' ? { started_at: new Date().toISOString() } : {}),
        ...(status === 'completed' ? { completed_date: new Date().toISOString() } : {})
      })
      .eq('id', id)
      .select()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 