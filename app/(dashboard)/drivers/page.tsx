import { Suspense } from "react"
import { DriverList } from "@/components/drivers/driver-list"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function DriversPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
        <p className="text-muted-foreground">
          Manage your fleet drivers and their assignments
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <DriverList />
      </Suspense>
    </div>
  )
} 