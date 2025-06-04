import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { isAfter, isBefore, addDays } from "date-fns"

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
    
    const { data: tasks } = await supabase
      .from("maintenance_tasks")
      .select("*")
      .eq("vehicle_id", params.id)
      .eq("status", "scheduled")
      .order("due_date", { ascending: true })

    if (!tasks) {
      return NextResponse.json({ error: "No tasks found" }, { status: 404 })
    }

    const upcomingServices = tasks.map(task => ({
      id: task.id,
      title: task.title,
      dueDate: task.due_date,
      estimatedDuration: task.estimated_duration,
      priority: isAfter(new Date(task.due_date), addDays(new Date(), 7))
        ? "normal"
        : "high",
    }))

    return NextResponse.json(upcomingServices)
  } catch (error) {
    console.error("Error fetching upcoming maintenance:", error)
    return new NextResponse("Error fetching upcoming maintenance", { status: 500 })
  }
} 