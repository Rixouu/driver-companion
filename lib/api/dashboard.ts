import { supabase } from "@/lib/supabase"

export async function getStats() {
  const [
    { count: totalVehicles },
    { count: activeVehicles },
    { count: maintenanceVehicles },
    { count: inspectionDueVehicles }
  ] = await Promise.all([
    supabase.from("vehicles").select("*", { count: "exact", head: true }),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "maintenance"),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "inspection_due")
  ])

  return {
    totalVehicles: totalVehicles || 0,
    activeVehicles: activeVehicles || 0,
    maintenanceVehicles: maintenanceVehicles || 0,
    inspectionDueVehicles: inspectionDueVehicles || 0
  }
} 