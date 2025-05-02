import { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { InspectionScheduleForm } from "@/components/inspections/inspection-schedule-form"
import { getDictionary } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { t } = await getDictionary()
    return {
      title: t("inspections.schedule.title") || "Schedule Inspection",
      description: t("inspections.schedule.description") || "Schedule a new inspection by selecting a vehicle and date",
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Schedule Inspection",
      description: "Schedule a new inspection by selecting a vehicle and date",
    }
  }
}

export default async function ScheduleInspectionPage() {
  // Redirect to the create inspection page
  return redirect("/inspections/create")
} 