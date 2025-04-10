import { notFound } from "next/navigation"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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
  const { dictionary } = await getDictionary()

  return {
    title: dictionary.mileage.edit.title,
    description: dictionary.mileage.edit.description,
  }
}

export default async function EditMileageLogPage({ params }: EditMileageLogPageProps) {
  const { id, logId } = params
  const { t } = await getDictionary()
  
  try {
    console.log('Loading mileage log edit page with params:', { id, logId })
    
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

    // Then, get the mileage log with the user ID
    const { log } = await getMileageLog(logId, session.user.id)
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