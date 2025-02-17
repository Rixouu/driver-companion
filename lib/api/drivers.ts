import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"
import type { Driver } from "@/types/vehicles"

export async function getDrivers() {
  const { data, error } = await supabase
    .from("drivers")
    .select(`
      id,
      name,
      email,
      avatar_url,
      status
    `)
    .eq("status", "active")
    .order("name")

  if (error) throw error
  
  return data.map((driver): Driver => ({
    id: driver.id,
    name: driver.name,
    email: driver.email,
    avatar: driver.avatar_url,
  }))
}

export async function getDriver(id: string) {
  const { data, error } = await supabase
    .from("drivers")
    .select(`
      id,
      name,
      email,
      avatar_url,
      status,
      license_number,
      license_expiry
    `)
    .eq("id", id)
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    avatar: data.avatar_url,
    status: data.status,
    licenseNumber: data.license_number,
    licenseExpiry: data.license_expiry,
  }
}

export async function assignVehicleToDriver(vehicleId: string, driverId: string) {
  const { error: unassignError } = await supabase
    .from("vehicle_assignments")
    .update({ end_date: new Date().toISOString() })
    .eq("vehicle_id", vehicleId)
    .is("end_date", null)

  if (unassignError) throw unassignError

  const { error: assignError } = await supabase
    .from("vehicle_assignments")
    .insert([{
      vehicle_id: vehicleId,
      driver_id: driverId,
      start_date: new Date().toISOString(),
    }])

  if (assignError) throw assignError
} 