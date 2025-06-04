"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DriverForm } from "@/components/drivers/driver-form"
import { getDriverById, updateDriver } from "@/lib/services/drivers"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import type { Driver, DriverFormData } from "@/types"

export default function EditDriverPage() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const [driver, setDriver] = useState<Driver | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadDriver() {
      try {
        setIsLoading(true)
        const data = await getDriverById(id as string)
        setDriver(data)
      } catch (error) {
        console.error("Error loading driver:", error)
        toast({
          title: t("drivers.messages.loadError"),
          description: t("drivers.messages.loadErrorDescription"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadDriver()
    }
  }, [id, t, toast])

  async function onSubmit(data: DriverFormData) {
    try {
      setIsSubmitting(true)
      await updateDriver(id as string, data)
      
      toast({
        title: t("drivers.messages.updateSuccess"),
        description: t("drivers.messages.updateSuccessDescription"),
      })
      
      router.push(`/drivers/${id}`)
    } catch (error) {
      console.error("Error updating driver:", error)
      toast({
        title: t("drivers.messages.updateError"),
        description: t("drivers.messages.updateErrorDescription"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/drivers/${id}`}
              className="flex items-center gap-2" ><span className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("common.backTo")} {t("drivers.driverDetails")}
            </span></Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <Skeleton className="h-10 w-32 mt-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/drivers" className="flex items-center gap-2" >
              <ArrowLeft className="h-4 w-4" />
              {t("common.backTo")} {t("drivers.title")}
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">{t("drivers.notFound.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("drivers.notFound.description")}</p>
            <Button asChild>
              <Link href="/drivers" ><span className="flex items-center gap-2"><span>{t("common.backTo")} {t("drivers.title")}</span></span></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href={`/drivers/${id}`}
            className="flex items-center gap-2" >
            <ArrowLeft className="h-4 w-4" />
            {t("common.backTo")} {t("drivers.driverDetails")}
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("drivers.actions.editDriver")}</CardTitle>
          <CardDescription>{t("drivers.editDriver.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DriverForm 
            initialData={driver}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
} 