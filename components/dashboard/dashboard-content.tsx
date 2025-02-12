"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { 
  ClipboardList, 
  Car, 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

export function DashboardContent() {
  const { t } = useLanguage()
  const { data: session } = useSession()

  const upcomingTasks = [
    {
      id: 1,
      type: "inspection",
      vehicle: "Toyota Crown Majesta",
      date: "2024-04-15",
      time: "14:00",
    },
    {
      id: 2,
      type: "maintenance",
      vehicle: "Toyota Alphard Executive",
      date: "2024-04-16",
      time: "10:00",
    },
  ]

  const recentInspections = [
    {
      id: 1,
      vehicle: "Toyota Vellfire",
      date: "2024-04-10",
      status: "passed",
      inspector: "John Doe"
    },
    {
      id: 2,
      vehicle: "Mercedes-Benz Vito",
      date: "2024-04-09",
      status: "failed",
      inspector: "Jane Smith"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              {session?.user?.name ? `${t("common.welcome")}, ${session.user.name.split(" ")[0]}` : t("common.welcome")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("common.overview")}</p>
          </div>
          <Button asChild>
            <Link href="/inspections/new">
              <ClipboardList className="mr-2 h-4 w-4" />
              {t("buttons.startInspection")}
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("common.pendingInspections")}
                </p>
                <h3 className="text-2xl font-bold">3</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle2 className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("common.completedToday")}
                </p>
                <h3 className="text-2xl font-bold">5</h3>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <XCircle className="h-8 w-8 text-red-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("common.requiresAttention")}
                </p>
                <h3 className="text-2xl font-bold">2</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                <CardTitle>{t("common.upcomingTasks")}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/inspections">
                  {t("common.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{task.vehicle}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(`tasks.${task.type}`)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{task.date}</p>
                      <p className="text-sm text-muted-foreground">{task.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Car className="mr-2 h-5 w-5" />
                <CardTitle>{t("vehicles.title")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Toyota Crown Majesta</span>
                    <span className="text-sm px-2 py-1 bg-green-500/10 text-green-500 rounded">
                      {t("vehicle.status.active")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("vehicle.nextInspection")}: 2024-05-01
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Toyota Alphard Executive</span>
                    <span className="text-sm px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded">
                      {t("vehicle.status.inspection_due")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("vehicle.nextInspection")}: 2024-04-15
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-full lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("common.recentInspections")}</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/inspections">
                  {t("common.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{inspection.vehicle}</p>
                      <p className="text-sm text-muted-foreground">
                        {inspection.inspector} • {inspection.date}
                      </p>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded ${
                      inspection.status === 'passed' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {t(`inspections.results.inspectionStatus.${inspection.status}`)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                <CardTitle>{t("common.alerts")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-yellow-500/10">
                  <p className="font-medium text-yellow-500">
                    {t("vehicle.alerts.inspectionRequired", { date: "2024-04-15" })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Toyota Alphard Executive
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 