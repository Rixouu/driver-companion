import { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MaintenanceScheduleForm } from "@/components/maintenance/maintenance-schedule-form"

export const metadata: Metadata = {
  title: "Schedule Maintenance",
  description: "Schedule a new maintenance task",
}

export default async function ScheduleMaintenancePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/maintenance" ><span className="flex items-center gap-2"><span className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to maintenance</span>
                <span className="sm:hidden">Back</span>
              </div>
            </span></span></Link>
          </Button>
        </div>

        <MaintenanceScheduleForm />
      </div>
    </div>
  );
} 