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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseClient()
    
    const resolvedParams = await params
    const { searchParams } = new URL(request.url)
    const latestOnly = searchParams.get('latestOnly') === 'true'

    if (latestOnly) {
      // Return only the latest service for quickstats
      const { data: latestTask } = await supabase
        .from("maintenance_tasks")
        .select("id, title, due_date, created_at")
        .eq("vehicle_id", resolvedParams.id)
        .order("created_at", { ascending: false })
        .limit(1)

      return NextResponse.json({ 
        latestService: latestTask?.[0] ? {
          id: latestTask[0].id,
          title: latestTask[0].title,
          date: latestTask[0].due_date || latestTask[0].created_at
        } : null
      })
    }

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