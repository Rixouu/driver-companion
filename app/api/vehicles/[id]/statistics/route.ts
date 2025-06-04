import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/supabase'

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
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseClient()
    
    // const { data: stats } = await supabase
    //   .from("vehicle_statistics")
    //   .select("*")
    //   .eq("vehicle_id", params.id)
    //   .single()

    // return NextResponse.json({ stats })
    return NextResponse.json({ stats: {} }) // Return empty object for now
  } catch (error) {
    console.error("Error fetching vehicle statistics:", error)
    return new NextResponse("Error fetching vehicle statistics", { status: 500 })
  }
} 