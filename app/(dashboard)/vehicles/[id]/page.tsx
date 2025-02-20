import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { VehicleDetails } from "@/components/vehicles/vehicle-details"

interface VehiclePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies })
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (!vehicle) {
    return {
      title: "Vehicle Not Found",
    }
  }

  return {
    title: vehicle.name,
    description: `Details for ${vehicle.name} (${vehicle.plate_number})`,
  }
}

export default async function VehiclePage({ params }: VehiclePageProps) {
  const supabase = createServerComponentClient({ cookies })

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select(`
      *,
      maintenance_tasks (
        id,
        title,
        status,
        due_date
      ),
      inspections (
        id,
        status,
        date,
        schedule_type,
        due_date,
        notes
      )
    `)
    .eq('id', params.id)
    .order('due_date', { foreignTable: 'maintenance_tasks', ascending: true })
    .order('due_date', { foreignTable: 'inspections', ascending: true })
    .single()

  if (!vehicle) {
    notFound()
  }

  return <VehicleDetails vehicle={vehicle} />
} 