"use client"

import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export function NewVehiclePageContent() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Link href="/vehicles" className="flex items-center gap-2" legacyBehavior>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t('common.backTo').replace('{page}', t('navigation.vehicles'))}</span>
                <span className="sm:hidden">{t('common.back')}</span>
              </Button>
            </Link>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {t('vehicles.addNewTitle')}
            </h1>
            <p className="text-muted-foreground">
              {t('vehicles.addNewDescription')}
            </p>
          </div>
        </div>

        <VehicleForm />
      </div>
    </div>
  );
} 