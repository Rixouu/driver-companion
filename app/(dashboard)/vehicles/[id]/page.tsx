import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { VehicleDetails } from "@/components/vehicles/vehicle-details"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getDictionary } from "@/lib/i18n/server"

interface VehiclePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies })
  const dictionary = await getDictionary()
  
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('name')
    .eq('id', params.id)
    .single()
  
  return {
    title: vehicle ? `${vehicle.name} - ${dictionary.vehicles.details}` : dictionary.vehicles.details,
    description: dictionary.vehicles.description,
  }
}

export default async function VehiclePage({ params }: VehiclePageProps) {
  const supabase = createServerComponentClient({ cookies })
  const dictionary = await getDictionary()
  
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
      <Button 
        variant="ghost" 
        size="sm"
        className="mb-2"
        asChild
      >
        <Link href="/vehicles" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {dictionary.common.backTo.replace('{page}', dictionary.navigation.vehicles)}
        </Link>
      </Button>

      <VehicleDetails vehicle={vehicle} />
    </div>
  )
} 