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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient()
    
    const resolvedParams = await params
    const { data: tasks } = await supabase
      .from("maintenance_tasks")
      .select("*")
      .eq("vehicle_id", resolvedParams.id)
      .order("due_date", { ascending: true })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Error fetching maintenance overview:", error)
    return new NextResponse("Error fetching maintenance overview", { status: 500 })
  }
} 