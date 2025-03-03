import { supabase } from '@/lib/db/client'
import type { Database } from '@/types/supabase'
import type { DbVehicle } from "@/types"

type Vehicle = Database['public']['Tables']['vehicles']['Row']
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export async function getVehicles(options?: {
  page?: number;
  status?: string;
  search?: string;
}) {
  const { page = 1, status = 'all', search = '' } = options || {}
  const itemsPerPage = 10
  
  let query = supabase
    .from('vehicles')
    .select('*', { count: 'exact' })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,plate_number.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`)
  }

  const { data, error, count } = await query
    .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
    .order('created_at', { ascending: false })

  if (error) throw error
  return { vehicles: data as DbVehicle[], count }
}

export async function getVehicleById(id: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as DbVehicle
}

export async function createVehicle(vehicle: Omit<DbVehicle, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicle)
    .select()
    .single()

  if (error) throw error
  return data as DbVehicle
}

export async function updateVehicle(id: string, vehicle: Partial<DbVehicle>) {
  const { data, error } = await supabase
    .from('vehicles')
    .update(vehicle)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DbVehicle
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)

  if (error) throw error
} 