"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PageContainer } from "@/components/layouts/page-container"
import Image from "next/image"
import { useLanguage } from "@/components/providers/language-provider"

// Mock data for inspections with more details
const MOCK_INSPECTIONS = [
  {
    id: "1",
    vehicleName: "Toyota Alphard Z-Class",
    plateNumber: "ABC-123",
    date: "2024-02-09",
    status: "completed",
    inspector: "Test User",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg"
  },
  {
    id: "2",
    vehicleName: "Toyota Alphard Executive",
    plateNumber: "XYZ-789",
    date: "2024-02-08",
    status: "pending",
    inspector: "Test User",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg"
  },
]

export default function InspectionsPage() {
  const { t } = useLanguage()

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">{t("inspections.title")}</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_INSPECTIONS.map((inspection) => (
            <Card key={inspection.id} className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={inspection.imageUrl}
                  alt={inspection.vehicleName}
                  fill
                  className="object-cover"
                />
              </div>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="text-xl font-semibold">{inspection.vehicleName}</span>
                  <span className={`status-badge ${
                    inspection.status === 'completed' 
                      ? 'status-badge-success' 
                      : 'status-badge-warning'
                  }`}>
                    {t(`status.${inspection.status}`)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("vehicles.plateNumber")}</p>
                      <p className="font-medium">{inspection.plateNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("inspections.date")}</p>
                      <p className="font-medium">{inspection.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("inspections.inspector")}</p>
                      <p className="font-medium">{inspection.inspector}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/inspection-details/${inspection.id}`}>
                      {t("vehicles.viewDetails")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  )
} 