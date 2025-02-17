"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function VehicleNavigation() {

  return (
    <div className="flex justify-between items-center">
      <Button variant="outline" asChild>
        <Link href="/vehicles">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {"buttons.backToVehicles"}
        </Link>
      </Button>
      <Button>
        {"buttons.startInspection"}
      </Button>
    </div>
  )
} 