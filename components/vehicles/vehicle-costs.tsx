"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"

interface VehicleCostsProps {
  vehicle: DbVehicle
}

export function VehicleCosts({ vehicle }: VehicleCostsProps) {
  const { t } = useI18n()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('vehicles.tabs.totalCosts')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('vehicles.tabs.costsEmpty')}
        </p>
      </CardContent>
    </Card>
  )
} 