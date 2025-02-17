import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type FuelEntry = Database["public"]["Tables"]["fuel_entries"]["Row"]

export async function getFuelHistory(vehicleId: string) {
  const { data, error } = await supabase
    .from("fuel_entries")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("date", { ascending: true })

  if (error) throw error
  return data as FuelEntry[]
}

export async function addFuelEntry(entry: Database["public"]["Tables"]["fuel_entries"]["Insert"]) {
  const { data, error } = await supabase
    .from("fuel_entries")
    .insert([entry])
    .select()
    .single()

  if (error) throw error
  return data as FuelEntry
} 