"use client"

import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { useI18n } from "@/lib/i18n/context"

export function NewVehiclePageContent() {
  const { t } = useI18n()

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('vehicles.addNewTitle')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('vehicles.addNewDescription')}
        </p>
      </div>
      
      <VehicleForm />
    </div>
  );
} 