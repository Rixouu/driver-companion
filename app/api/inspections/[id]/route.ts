import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { handleApiError } from '@/lib/errors/error-handler'
import { DatabaseError, NotFoundError, AppError } from '@/lib/errors/app-error'

// Helper function to create Supabase client for Route Handlers
async function getSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', options)
        },
      },
    }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseClient()

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
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Inspection with ID ${params.id} not found.`)
      } 
      throw new DatabaseError(error.message, { cause: error })
    }
    if (!inspection) {
      throw new NotFoundError(`Inspection with ID ${params.id} not found.`)
    }

    // Derive type if missing
    if (!inspection.type) {
      // Attempt 1: via category type
      const { data: itemWithCat, error: itemError } = await supabase
        .from('inspection_items')
        .select(`template:inspection_item_templates(category:inspection_categories(type))`)
        .eq('inspection_id', params.id)
        .limit(1)
        .maybeSingle()

      const derivedType = (itemWithCat as any)?.template?.category?.type as string | undefined
      if (derivedType) {
        inspection.type = derivedType
      } else {
        // Attempt 2: template assignments table
        const { data: assignment, error: assignError } = await supabase
          .from('inspection_template_assignments')
          .select('template_type')
          .eq('inspection_id', params.id)
          .maybeSingle()
        if (assignment?.template_type) {
          inspection.type = assignment.template_type
        }
      }
    }

    // Compute pass rate and override status to failed if below threshold (50%)
    try {
      const { count: totalItems, data: _ } = await supabase
        .from('inspection_items')
        .select('*', { count: 'exact', head: true })
        .eq('inspection_id', params.id)

      const { count: passedItems } = await supabase
        .from('inspection_items')
        .select('*', { count: 'exact', head: true })
        .eq('inspection_id', params.id)
        .eq('status', 'pass')

      if (totalItems && passedItems !== null && totalItems > 0) {
        const passRate = passedItems / totalItems
        if (passRate < 0.5 && inspection.status === 'completed') {
          inspection.status = 'failed'
        }
      }
    } catch (statsErr) {
      console.warn('Could not compute pass rate', statsErr)
    }

    return NextResponse.json({ success: true, data: inspection })
  } catch (error) {
    return handleApiError(error, { apiRoute: `/api/inspections/${params.id}`, method: "GET" })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()
    const { status } = body

    if (!status) {
      throw new AppError('Status is required for update.', 400)
    }
    
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
      .single()
    
    if (error) {
       if (error.code === 'PGRST116') {
        throw new NotFoundError(`Inspection with ID ${id} not found for update.`)
      }
      throw new DatabaseError(error.message, { cause: error })
    }
    if (!data) {
      throw new NotFoundError(`Inspection with ID ${id} not found for update.`)
    }
    
    return NextResponse.json({ success: true, data: data })
  } catch (error: unknown) {
    return handleApiError(error, { apiRoute: `/api/inspections/${id}`, method: "PATCH" })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  try {
    const supabase = await getSupabaseClient()

    // Parse request body for fields to update
    const body = await request.json()

    // Build update payload (only allow certain fields to be updated)
    const allowedFields: string[] = [
      "name",
      "notes",
      "status",
      "overall_notes",
      "completed_date",
      "date",
      "type"
    ]
    const updatePayload: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) {
        updatePayload[key] = body[key]
      }
    }

    // Determine the inspection type automatically if not provided
    if (!body.type) {
      // Attempt #1 – derive from inspection_categories via inspection_items -> templates
      const { data: itemWithCategory, error: itemError } = await supabase
        .from('inspection_items')
        .select(`template:inspection_item_templates(category:inspection_categories(type))`)
        .eq('inspection_id', id)
        .limit(1)
        .maybeSingle()

      if (itemError) {
        console.error('Error fetching inspection item/template/category', itemError)
      }

      const derivedType = (itemWithCategory as any)?.template?.category?.type as string | undefined

      if (derivedType) {
        updatePayload.type = derivedType
      } else {
        // Attempt #2 – fallback to inspection_template_assignments
        const { data: assignmentRow, error: assignError } = await supabase
          .from('inspection_template_assignments')
          .select('template_type')
          .eq('inspection_id', id)
          .maybeSingle()
        if (!assignError && assignmentRow?.template_type) {
          updatePayload.type = assignmentRow.template_type
        }
      }
    } else {
      updatePayload.type = body.type
    }

    // If they completed the inspection, determine pass rate and maybe set status failed
    if (updatePayload.status === 'completed') {
      const { count: totalItems } = await supabase
        .from('inspection_items')
        .select('*', { count: 'exact', head: true })
        .eq('inspection_id', id)

      const { count: passedItems } = await supabase
        .from('inspection_items')
        .select('*', { count: 'exact', head: true })
        .eq('inspection_id', id)
        .eq('status', 'pass')

      if (totalItems && passedItems !== null && totalItems > 0) {
        const passRate = passedItems / totalItems
        if (passRate < 0.5) {
          updatePayload.status = 'failed'
        }
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new AppError('No valid fields provided for update.', 400)
    }

    const { data: updatedInspection, error } = await supabase
      .from('inspections')
      .update(updatePayload as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Inspection with ID ${id} not found.`)
      }
      throw new DatabaseError(error.message, { cause: error })
    }

    return NextResponse.json({ success: true, data: updatedInspection })
  } catch (error) {
    return handleApiError(error, { apiRoute: `/api/inspections/${id}`, method: 'PUT' })
  }
} 