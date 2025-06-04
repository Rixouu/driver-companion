import { Metadata } from "next"
import { cookies } from "next/headers"
import { MaintenancePageContent } from "@/components/maintenance/maintenance-page-content"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { MaintenanceTask } from "@/types"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { Plus } from 'lucide-react'

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Maintenance",
  description: "Vehicle maintenance management",
}

export default async function MaintenancePage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  const { data: tasks } = await supabase
    .from('maintenance_tasks')
    .select(`
      *,
      vehicle:vehicles (
        id,
        name,
        plate_number
      )
    `)
    .order('due_date', { ascending: true })

  return (
    <>
      <MaintenancePageContent tasks={(tasks || []) as MaintenanceTask[]} />
      <FloatingActionButton 
        href="/maintenance/new" 
        tooltip="Create New Maintenance Task"
        icon={<Plus className="h-7 w-7" />}
      />
    </>
  )
} 