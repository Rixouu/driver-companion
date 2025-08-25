"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DriverForm } from "@/components/drivers/driver-form"


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
        const response = await fetch(`/api/drivers/${id}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch driver: ${response.status}`)
        }
        
        const data = await response.json()
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
  }, [id, t])

  async function onSubmit(data: DriverFormData) {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/drivers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update driver: ${response.status}`)
      }
      
      toast({
        title: t("drivers.messages.updateSuccess"),
        description: t("drivers.messages.updateSuccessDescription"),
      })
      
      // Add a small delay for better UX
      setTimeout(() => {
        router.push(`/drivers/${id}`)
      }, 500)
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-80" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
          </div>
        </div>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <div className="pt-4">
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-red-600">Driver Not Found</h1>
          <p className="text-muted-foreground mt-2">The requested driver could not be found or loaded.</p>
        </div>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">{t("drivers.notFound.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("drivers.notFound.description")}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" asChild>
                <Link href="/drivers">
                  {t("common.backTo")} {t("drivers.title")}
                </Link>
              </Button>
              <Button asChild>
                <Link href="/drivers">
                  View All Drivers
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
          <Link href="/drivers" className="hover:text-foreground transition-colors">
            Drivers
          </Link>
          <span>/</span>
          <Link href={`/drivers/${id}`} className="hover:text-foreground transition-colors">
            {driver.first_name} {driver.last_name}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Edit</span>
        </nav>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("drivers.actions.editDriver")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Editing:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">{driver.first_name} {driver.last_name}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form Section */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Driver Information</h2>
            <p className="text-muted-foreground">Update the driver's personal and professional details below.</p>
          </div>
          
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