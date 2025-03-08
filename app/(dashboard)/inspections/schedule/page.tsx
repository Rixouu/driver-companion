import { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { InspectionScheduleForm } from "@/components/inspections/inspection-schedule-form"
import { getDictionary } from "@/lib/i18n/server"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary()
  return {
    title: t("inspections.schedule.title"),
    description: t("inspections.schedule.description"),
  }
}

export default async function ScheduleInspectionPage() {
  const supabase = createServerComponentClient({ cookies })
  const { t } = await getDictionary()
  
  // Fetch vehicles for the form
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .order('name')
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/inspections" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t("inspections.schedule.backToInspections")}</span>
              <span className="sm:hidden">{t("common.back")}</span>
            </Link>
          </Button>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {t("inspections.schedule.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("inspections.schedule.description")}
            </p>
          </div>
        </div>

        <InspectionScheduleForm vehicles={vehicles || []} />
      </div>
    </div>
  )
} 