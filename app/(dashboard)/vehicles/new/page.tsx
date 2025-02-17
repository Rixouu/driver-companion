import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from "next/navigation"
import { VehicleForm } from "@/components/vehicles/vehicle-form"

export default async function NewVehiclePage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add New Vehicle</h1>
      <p className="text-muted-foreground">
        Add a new vehicle to the fleet
      </p>
      <VehicleForm />
    </div>
  )
} 