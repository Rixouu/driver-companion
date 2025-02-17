import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type MileageEntry = Database["public"]["Tables"]["mileage_entries"]["Row"]

export async function getMileageHistory(vehicleId: string) {
  const { data, error } = await supabase
    .from("mileage_entries")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("date", { ascending: true })

  if (error) throw error
  return data as MileageEntry[]
}

export async function addMileageEntry(
  entry: Database["public"]["Tables"]["mileage_entries"]["Insert"]
) {
  const { data, error } = await supabase
    .from("mileage_entries")
    .insert([entry])
    .select()
    .single()

  if (error) throw error
  return data as MileageEntry
}

export async function getCurrentMileage(vehicleId: string) {
  const { data, error } = await supabase
    .from("mileage_entries")
    .select("reading")
    .eq("vehicle_id", vehicleId)
    .order("date", { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== "PGRST116") throw error // PGRST116 is "no rows returned"
  return data?.reading
} 