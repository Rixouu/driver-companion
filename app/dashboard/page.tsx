"use client"

import { PageContainer } from "@/components/layouts/page-container"
import { VehicleCard } from "@/components/dashboard/vehicle-card"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import { AlertsList } from "@/components/dashboard/alerts-list"
import { useLanguage } from "@/components/providers/language-provider"
import { useSession } from "next-auth/react"

export default function DashboardPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard.welcome", { name: session?.user?.name || "User" })}
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

