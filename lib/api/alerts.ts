import { supabase } from "@/lib/supabase"

export async function getAlerts() {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) throw error
  return data
} 