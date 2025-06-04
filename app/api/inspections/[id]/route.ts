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