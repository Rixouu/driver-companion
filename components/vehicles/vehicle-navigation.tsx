"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context";

export function VehicleNavigation() {
  const { t } = useI18n();

  return (
    <div className="flex justify-between items-center">
      <Link href="/vehicles" className="flex items-center gap-2">
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("buttons.backToVehicles")}
        </Button>
      </Link>
      <Button>
        {t("buttons.startInspection")}
      </Button>
    </div>
  );
} 