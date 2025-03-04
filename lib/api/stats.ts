import { supabase } from "@/lib/supabase"
import type { DashboardStats } from "@/types/dashboard"

export async function getStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0]

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('status', { count: 'exact' })

  const { data: inspections } = await supabase
    .from('inspections')
    .select('status')
    .eq('status', 'in_progress')

  const { data: completedToday } = await supabase
    .from('inspections')
    .select('id')
    .eq('status', 'completed')
    .gte('completed_date', today)

  const { data: attention } = await supabase
    .from('inspections')
    .select('id')
    .in('status', ['failed', 'requires_attention'])

  return {
    totalVehicles: vehicles?.length || 0,
    activeInspections: inspections?.length || 0,
    completedToday: completedToday?.length || 0,
    requiresAttention: attention?.length || 0
  }
} 