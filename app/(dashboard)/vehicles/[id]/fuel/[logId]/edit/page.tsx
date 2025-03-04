import { notFound } from "next/navigation"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

import { FuelForm } from "@/components/fuel/fuel-form"
import { PageHeader } from "@/components/page-header"
import { getFuelLog } from "@/lib/services/fuel"
import { getVehicle } from "@/lib/services/vehicles"
import { getDictionary } from "@/lib/i18n/dictionaries"
import type { Database } from "@/types/supabase"

interface EditFuelLogPageProps {
  params: {
    id: string
    logId: string
  }
}

export async function generateMetadata({ params }: EditFuelLogPageProps) {
  const { dictionary } = await getDictionary()

  return {
    title: dictionary.fuel.edit.title,
    description: dictionary.fuel.edit.description,
  }
}

export default async function EditFuelLogPage({ params }: EditFuelLogPageProps) {
  const { id, logId } = params
  const { dictionary } = await getDictionary()
  
  try {
    console.log('Loading fuel log edit page with params:', { id, logId })
    
    // Get the user session
    const supabase = createServerComponentClient<Database>({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      console.error('No authenticated user')
      notFound()
    }
    
    // First, get the vehicle
    const { vehicle } = await getVehicle(id)
    if (!vehicle) {
      console.error('Vehicle not found:', id)
      notFound()
    }
    console.log('Found vehicle:', vehicle)

    // Then, get the fuel log with the user ID
    const { log } = await getFuelLog(logId, session.user.id)
    if (!log) {
      console.error('Fuel log not found:', logId)
      notFound()
    }
    console.log('Found fuel log:', log)

    // Verify that the log belongs to the vehicle
    if (log.vehicle_id !== id) {
      console.error('Fuel log does not belong to vehicle:', { logId, vehicleId: id, logVehicleId: log.vehicle_id })
      notFound()
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title={dictionary.fuel.edit.title}
          description={dictionary.fuel.edit.description}
        />
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <FuelForm vehicleId={id} initialData={log} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading fuel log:', error)
    notFound()
  }
} 