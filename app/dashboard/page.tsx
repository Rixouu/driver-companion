"use client"

import { PageContainer } from "@/components/layouts/page-container"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { VehicleCard } from "@/components/dashboard/vehicle-card"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import { AlertsList } from "@/components/dashboard/alerts-list"
import { useLanguage } from "@/components/providers/language-provider"

export default function DashboardPage() {
  const { t } = useLanguage()

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard.welcome")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("dashboard.overview.title")}
          </p>
        </div>

        {/* Vehicle Status Card - Most important info */}
        <VehicleCard />

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Upcoming Tasks */}
          <UpcomingTasks />

          {/* Right Column - Important Alerts */}
          <AlertsList />
        </div>
      </div>
    </PageContainer>
  )
}

