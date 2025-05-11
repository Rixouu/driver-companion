import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { ScheduleInspectionForm } from "@/components/inspections/schedule-inspection-form"
import { ScheduleInspectionContent } from "./content"

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
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!vehicle) {
    return notFound()
  }

  return <ScheduleInspectionContent vehicle={vehicle} />
} 