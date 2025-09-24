import { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/server"
import { DashboardContentOptimized } from "@/components/dashboard/dashboard-content-optimized"
import { getDashboardData } from "@/app/actions/dashboard"
import { getCurrentUser } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary()
  return {
    title: "Driver Fleet Management",
    description: t("dashboard.description")
  }
}

export default async function DashboardPage() {
  // Get translations
  const { t } = await getDictionary()
  
  // Get current user for greeting
  const { user } = await getCurrentUser()
  
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
    <DashboardContentOptimized
      stats={stats}
      recentInspections={recentInspections}
      upcomingInspections={upcomingInspections}
      recentMaintenance={recentMaintenance}
      upcomingMaintenance={upcomingMaintenance}
      inProgressItems={inProgressItems}
      vehicles={vehicles}
      user={user}
    />
  )
} 