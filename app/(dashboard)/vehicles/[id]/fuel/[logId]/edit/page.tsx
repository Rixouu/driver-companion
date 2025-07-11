import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"

import { FuelForm } from "@/components/fuel/fuel-form"
import { PageHeader } from "@/components/page-header"
import { getFuelLog } from "@/lib/services/fuel"
import { getVehicle } from "@/lib/services/vehicles"
import { getDictionary } from "@/lib/i18n/server"
import type { Database } from "@/types/supabase"

interface EditFuelLogPageProps {
  params: {
    id: string
    logId: string
  }
}

export async function generateMetadata({ params }: EditFuelLogPageProps) {
  const { t } = await getDictionary()

  return {
    title: t('fuel.edit.title'),
    description: t('fuel.edit.description'),
  }
}

export default async function EditFuelLogPage({ params }: EditFuelLogPageProps) {
  const { id, logId } = params
  const { t } = await getDictionary()
  
  try {
    console.log('Loading fuel log edit page with params:', { id, logId })
    
    // Get the user session
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
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
    const { log } = await getFuelLog(logId, user.id)
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
          title={t("fuel.edit.title")}
          description={t("fuel.edit.description")}
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