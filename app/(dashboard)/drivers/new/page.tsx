"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DriverForm } from "@/components/drivers/driver-form"
import { createDriver } from "@/lib/services/drivers"
import { useToast } from "@/hooks/use-toast"
import type { DriverFormData } from "@/types"

export default function NewDriverPage() {
  const router = useRouter()
  const { t } = useI18n()
  const { toast } = useToast()
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
      console.error("Error creating driver:", error)
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
      <div className="flex items-center mb-8">
        <Link href="/drivers" className="flex items-center gap-2" ><span className="flex items-center gap-2"><span className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            {t("common.backTo")} {t("drivers.title")}
          </Button>
        </span></span></Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("drivers.actions.addDriver")}</CardTitle>
          <CardDescription>{t("drivers.newDriver.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DriverForm 
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
} 