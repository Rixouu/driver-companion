"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { PageContainer } from "@/components/layouts/page-container"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/components/providers/language-provider"
import { MaintenanceSchedule } from "@/components/vehicles/maintenance-schedule"
import { MileageTracker } from "@/components/vehicles/mileage-tracker"
import { FuelTracker } from "@/components/vehicles/fuel-tracker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssignmentManager } from "@/components/vehicles/assignment-manager"
import { UpcomingInspections } from "@/components/vehicles/upcoming-inspections"
import { InspectionHistory } from "@/components/inspections/inspection-history"

// Mock data for a single vehicle
const MOCK_VEHICLE_DETAILS = {
  "1": {
    id: "1",
    name: "Toyota Alphard Z-Class",
    plateNumber: "ABC-123",
    status: "active",
    model: "Alphard Z-Class",
    year: "2023",
    vin: "JN1WNYD26U0123456",
    lastInspection: "2023-05-10",
    assignedTo: "Test User",
    imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg",
    maintenanceHistory: [
      { date: "2023-05-10", type: "Inspection", status: "Completed" },
      { date: "2023-04-15", type: "Oil Change", status: "Completed" },
    ],
  },
}

interface VehicleDetailsPageProps {
  params: {
    vehicleId: string
  }
}

export default function VehicleDetailsPage({ params }: VehicleDetailsPageProps) {
  const vehicleId = params.vehicleId as string
  const vehicle = MOCK_VEHICLE_DETAILS[vehicleId as keyof typeof MOCK_VEHICLE_DETAILS]
  const { t } = useLanguage()

  if (!vehicle) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Not Found</h1>
          <Button asChild>
            <Link href="/vehicles">Back to Vehicles</Link>
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{vehicle.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">Plate: {vehicle.plateNumber}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/vehicles" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Vehicles
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/inspections/new?vehicleId=${vehicle.id}`}>Start Inspection</Link>
            </Button>
          </div>
        </div>

        {/* Vehicle Image Card */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[300px] w-full overflow-hidden rounded-lg">
              <Image
                src={vehicle.imageUrl}
                alt={vehicle.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{vehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-medium">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">VIN</p>
                  <p className="font-medium">{vehicle.vin}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={`status-badge inline-flex mt-1 ${
                    vehicle.status === 'active' 
                      ? 'status-badge-success' 
                      : 'status-badge-warning'
                  }`}>
                    {vehicle.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment & Inspection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{vehicle.assignedTo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Inspection</p>
                  <p className="font-medium">{vehicle.lastInspection || 'No inspection recorded'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance History */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance History</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle.maintenanceHistory.length > 0 ? (
              <div className="space-y-4">
                {vehicle.maintenanceHistory.map((record, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{record.type}</p>
                      <p className="text-sm text-muted-foreground">{record.date}</p>
                    </div>
                    <span className={`status-badge ${
                      record.status === 'Completed' 
                        ? 'status-badge-success' 
                        : 'status-badge-warning'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No maintenance history available</p>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="maintenance" className="space-y-6">
          <TabsList>
            <TabsTrigger value="maintenance">
              {t("vehicles.management.maintenance.schedule")}
            </TabsTrigger>
            <TabsTrigger value="history">
              {t("inspections.history.title")}
            </TabsTrigger>
            <TabsTrigger value="mileage">
              {t("vehicles.management.mileage.current")}
            </TabsTrigger>
            <TabsTrigger value="fuel">
              {t("vehicles.management.fuel.consumption")}
            </TabsTrigger>
            <TabsTrigger value="assignments">
              {t("vehicles.management.assignment.title")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="maintenance">
            <MaintenanceSchedule vehicleId={vehicleId} />
          </TabsContent>

          <TabsContent value="history">
            <InspectionHistory vehicleId={vehicleId} />
          </TabsContent>

          <TabsContent value="mileage">
            <MileageTracker vehicleId={vehicleId} />
          </TabsContent>

          <TabsContent value="fuel">
            <FuelTracker vehicleId={vehicleId} />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentManager vehicleId={vehicleId} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4">
          <Link href={`/inspections/schedule/${params.vehicleId}`}>
            <Button>
              {t("inspections.schedule.title")}
            </Button>
          </Link>
        </div>

        {/* Upcoming inspections section */}
        <UpcomingInspections vehicleId={params.vehicleId} />
      </div>
    </PageContainer>
  )
} 