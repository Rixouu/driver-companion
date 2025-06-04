import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"

import { MileageForm } from "@/components/mileage/mileage-form"
import { PageHeader } from "@/components/page-header"
import { getMileageLog } from "@/lib/services/mileage"
import { getVehicle } from "@/lib/services/vehicles"
import { getDictionary } from "@/lib/i18n/server"
import type { Database } from "@/types/supabase"

interface EditMileageLogPageProps {
  params: {
    id: string
    logId: string
  }
}

export async function generateMetadata({ params }: EditMileageLogPageProps) {
  const { t } = await getDictionary()

  return {
    title: t('mileage.edit.title'),
    description: t('mileage.edit.description'),
  }
}

export default async function EditMileageLogPage({ params }: EditMileageLogPageProps) {
  const { id, logId } = params
  const { t } = await getDictionary()
  
  try {
    console.log('Loading mileage log edit page with params:', { id, logId })
    
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

    // Then, get the mileage log with the user ID
    const { log } = await getMileageLog(logId, user.id)
    if (!log) {
      console.error('Mileage log not found:', logId)
      notFound()
    }
    console.log('Found mileage log:', log)

    // Verify that the log belongs to the vehicle
    if (log.vehicle_id !== id) {
      console.error('Mileage log does not belong to vehicle:', { logId, vehicleId: id, logVehicleId: log.vehicle_id })
      notFound()
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title={t("mileage.edit.title")}
          description={t("mileage.edit.description")}
        />
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <MileageForm vehicleId={id} initialData={log} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading mileage log:', error)
    notFound()
  }
} 