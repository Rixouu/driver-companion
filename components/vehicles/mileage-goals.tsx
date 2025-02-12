"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface MileageGoalsProps {
  vehicleId: string
  currentMileage: number
  dailyAverage: number
}

export function MileageGoals({ vehicleId, currentMileage, dailyAverage }: MileageGoalsProps) {
  const { t } = useLanguage()

  const goals = {
    monthly: {
      target: 2500,
      current: dailyAverage * 30,
    },
    yearly: {
      target: 30000,
      current: dailyAverage * 365,
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("vehicles.management.mileage.goals.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <p>{t("vehicles.management.mileage.goals.monthly")}</p>
              <p>{t("vehicles.management.mileage.goals.current", { current: 2143, target: 2500 })}</p>
            </div>
            <Progress value={85.72} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <p>{t("vehicles.management.mileage.goals.yearly")}</p>
              <p>{t("vehicles.management.mileage.goals.current", { current: 26071, target: 30000 })}</p>
            </div>
            <Progress value={86.90} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 