import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { VehicleDetails } from "@/components/vehicles/vehicle-details"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface VehiclePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies })
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('name')
    .eq('id', params.id)
    .single()
  
  return {
    title: vehicle ? `${vehicle.name} - Vehicle Details` : 'Vehicle Details',
    description: 'View and manage vehicle details',
  }
}

export default async function VehiclePage({ params }: VehiclePageProps) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select(`
      *,
      maintenance_tasks (*),
      inspections (*)
    `)
    .eq('id', params.id)
    .order('due_date', { foreignTable: 'maintenance_tasks', ascending: true })
    .order('due_date', { foreignTable: 'inspections', ascending: true })
    .single()

  if (!vehicle) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{vehicle.name}</h1>
          <p className="text-muted-foreground">
            View and manage vehicle details
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="w-full sm:w-auto"
          asChild
        >
          <Link href="/vehicles" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to vehicles
          </Link>
        </Button>
      </div>

      <VehicleDetails vehicle={vehicle} />
    </div>
  )
} 