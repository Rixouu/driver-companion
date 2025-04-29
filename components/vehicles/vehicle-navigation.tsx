"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function VehicleNavigation() {

  return (
    <div className="flex justify-between items-center">
      <Link href="/vehicles" legacyBehavior>
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {"buttons.backToVehicles"}
        </Button>
      </Link>
      <Button>
        {"buttons.startInspection"}
      </Button>
    </div>
  );
} 