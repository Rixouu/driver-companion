"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { DriverForm } from "@/components/drivers/driver-form"
import { createDriver } from "@/lib/services/drivers"
import { toast } from "@/components/ui/use-toast"
import type { DriverFormData } from "@/types"

export default function NewDriverPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(data: DriverFormData) {
    try {
      setIsSubmitting(true)
      const driver = await createDriver(data)
      
      toast({
        title: t("drivers.messages.createSuccess"),
        description: t("drivers.messages.createSuccessDescription"),
      })
      
      router.push(`/drivers/${driver.id}`)
    } catch (error) {
      console.error(t("drivers.messages.consoleGenericCreateError"), error)
      toast({
        title: t("drivers.messages.createError"),
        description: t("drivers.messages.createErrorDescription"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("drivers.actions.addDriver")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("drivers.newDriver.description")}
        </p>
      </div>
      
      <DriverForm 
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
} 