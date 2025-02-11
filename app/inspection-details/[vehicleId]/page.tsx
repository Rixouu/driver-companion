"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Camera, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageContainer } from "@/components/layouts/page-container"
import { useLanguage } from "@/components/providers/language-provider"

// Mock data for inspection details
const MOCK_INSPECTION = {
  vehicleId: "1",
  vehicleName: "Toyota Alphard Z-Class",
  plateNumber: "ABC-123",
  imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg",
  items: {
    front: [
      { id: "f1", description: "Lights functioning", status: "pass" },
      { id: "f2", description: "Grill condition", status: "pass" },
      { id: "f3", description: "Hood condition", status: "pass" },
      { id: "f4", description: "Windshield condition", status: "pass" },
    ],
    left: [
      { id: "l1", description: "Left front tire condition", status: "pass" },
      { id: "l2", description: "Left rear tire condition", status: "fail" },
      { id: "l3", description: "Left side panels", status: "pass" },
      { id: "l4", description: "Left mirrors", status: "pass" },
    ],
    right: [
      { id: "r1", description: "Right front tire condition", status: "pass" },
      { id: "r2", description: "Right rear tire condition", status: "pass" },
      { id: "r3", description: "Right side panels", status: "pass" },
      { id: "r4", description: "Right mirrors", status: "pass" },
    ],
    rear: [
      { id: "b1", description: "Tail lights", status: "pass" },
      { id: "b2", description: "Trunk condition", status: "pass" },
      { id: "b3", description: "Rear bumper", status: "pass" },
      { id: "b4", description: "License plate", status: "pass" },
    ],
  }
}

interface InspectionDetailsPageProps {
  params: {
    vehicleId: string
  }
}

export default function InspectionDetailsPage({ params }: InspectionDetailsPageProps) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("inspections.inspectionDetails")}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t("vehicles.plateNumber")}: {MOCK_INSPECTION.plateNumber}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/vehicles/${params.vehicleId}`} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t("common.back")}
              </Link>
            </Button>
          </div>

          {/* Vehicle Image Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("inspections.vehicleInformation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-[300px] w-full overflow-hidden rounded-lg">
                <Image
                  src={MOCK_INSPECTION.imageUrl}
                  alt={MOCK_INSPECTION.vehicleName}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </CardContent>
          </Card>

          {/* Inspection Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>{t("inspections.inspectionChecklist")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex border-b mb-6">
                {Object.keys(MOCK_INSPECTION.items).map((side) => (
                  <button
                    key={side}
                    className={`px-6 py-3 text-sm font-medium capitalize border-b-2 -mb-[2px] transition-colors ${
                      side === "front" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                    }`}
                  >
                    {t(`inspections.sections.${side}`)}
                  </button>
                ))}
              </div>

              {/* Inspection Items */}
              {Object.entries(MOCK_INSPECTION.items).map(([side, items]) => (
                <div key={side} className={side === "front" ? "block" : "hidden"}>
                  <div className="space-y-6">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-4 border-b last:border-0"
                      >
                        <p className="text-base font-medium">
                          {t(`inspections.items.${item.id}`)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={item.status === "pass" ? "default" : "outline"}
                            className={`w-[90px] ${
                              item.status === "pass" ? "bg-emerald-600 hover:bg-emerald-700" : ""
                            }`}
                            disabled
                          >
                            {t("inspections.actions.pass")}
                          </Button>
                          <Button
                            size="sm"
                            variant={item.status === "fail" ? "destructive" : "outline"}
                            className="w-[90px]"
                            disabled
                          >
                            {t("inspections.actions.fail")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="container max-w-5xl mx-auto flex justify-end">
          <Button className="w-[200px]" disabled>
            {t("inspections.completeInspection")}
          </Button>
        </div>
      </div>
    </div>
  )
} 