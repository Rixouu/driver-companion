import { Metadata } from "next"
import { VehicleList } from "@/components/vehicles/vehicle-list"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export const metadata: Metadata = {
  title: "Vehicles",
  description: "Manage your vehicle fleet",
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const supabase = createServerComponentClient({ cookies })
  const page = Number(searchParams.page) || 1
  const ITEMS_PER_PAGE = 10

  const { data: vehicles, count } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact' })
    .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)
    .order('created_at', { ascending: false })

  const totalPages = count ? Math.ceil(count / ITEMS_PER_PAGE) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground">
            Manage your vehicle fleet and details
          </p>
        </div>
        <Link href="/vehicles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      <VehicleList
        vehicles={vehicles || []}
        currentPage={page}
        totalPages={totalPages}
      />
    </div>
  )
} 