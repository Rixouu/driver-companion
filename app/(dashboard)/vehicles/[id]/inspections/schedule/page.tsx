import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ScheduleInspectionForm } from "@/components/inspections/schedule-inspection-form"
import { ScheduleInspectionContent } from "./content"
import type { DbVehicle } from "@/types"
interface ScheduleInspectionPageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: "Schedule Inspection",
  description: "Schedule a new vehicle inspection",
}

export const dynamic = "force-dynamic"

export default async function ScheduleInspectionPage({ params }: ScheduleInspectionPageProps) {
  const supabase = await getSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!vehicle) {
    return notFound()
  }

  return <ScheduleInspectionContent vehicle={vehicle as DbVehicle} />
} 