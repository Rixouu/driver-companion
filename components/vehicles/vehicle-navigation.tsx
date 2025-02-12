"use client"

import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function VehicleNavigation() {
  const { t } = useLanguage()

  return (
    <div className="flex justify-between items-center">
      <Button variant="outline" asChild>
        <Link href="/vehicles">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("buttons.backToVehicles")}
        </Link>
      </Button>
      <Button>
        {t("buttons.startInspection")}
      </Button>
    </div>
  )
} 