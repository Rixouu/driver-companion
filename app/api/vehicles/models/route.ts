import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'
import { handleApiError } from '@/lib/errors/error-handler'
import { DatabaseError } from '@/lib/errors/app-error'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
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
    
    // Get all vehicles with models
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('model')
      .not('model', 'is', null)

    if (error) {
      throw new DatabaseError('Error fetching vehicle models from database.', { cause: error })
    }

    // Extract unique models and trim whitespace
    const uniqueModels = [...new Set(
      vehicles
        ?.map(v => v.model?.trim().toLowerCase()) // Trim whitespace and convert to lowercase
        .filter(Boolean) // Filter out nulls and empty strings
        || []
    )]

    // Convert back to proper case (first letter capitalized) and sort alphabetically
    const formattedModels = uniqueModels
      .map(model => model.charAt(0).toUpperCase() + model.slice(1))
      .sort()

    console.log('🔍 [VEHICLE_MODELS_API] Processing models:', {
      rawCount: vehicles?.length || 0,
      uniqueCount: uniqueModels.length,
      formattedCount: formattedModels.length,
      sample: formattedModels.slice(0, 5)
    })

    return NextResponse.json(formattedModels)
  } catch (error) {
    return handleApiError(error)
  }
}
