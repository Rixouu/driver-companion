import { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/server"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { getDashboardData } from "@/app/actions/dashboard"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary()
  return {
    title: t("dashboard.title"),
    description: t("dashboard.description")
  }
}

export default async function DashboardPage() {
  // Get translations
  const { t } = await getDictionary()
  
  // Fetch all necessary data for the dashboard using our server action
  const { 
    stats,
    recentInspections,
    upcomingInspections,
    recentMaintenance,
    upcomingMaintenance,
    inProgressItems,
    vehicles
  } = await getDashboardData()

  return (
    <DashboardContent
      stats={stats}
      recentInspections={recentInspections}
      upcomingInspections={upcomingInspections}
      recentMaintenance={recentMaintenance}
      upcomingMaintenance={upcomingMaintenance}
      inProgressItems={inProgressItems}
      vehicles={vehicles}
    />
  )
} 