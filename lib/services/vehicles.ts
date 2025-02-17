import { supabase } from '@/lib/db/client'
import type { Database } from '@/types/supabase'

type Vehicle = Database['public']['Tables']['vehicles']['Row']
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export async function getVehicles(page = 1, status = 'all', search = '') {
  const itemsPerPage = 10
  let query = supabase
    .from('vehicles')
    .select('*', { count: 'exact' })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,model.ilike.%${search}%,brand.ilike.%${search}%`)
  }

  const { data, error, count } = await query
    .range((page - 1) * itemsPerPage, page * itemsPerPage - 1)
    .order('created_at', { ascending: false })

  if (error) throw error
  return { vehicles: data, count }
}

export async function getVehicleById(id: string) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createVehicle(vehicle: VehicleInsert) {
  const { data, error } = await supabase
    .from('vehicles')
    .insert([vehicle])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateVehicle(id: string, vehicle: VehicleUpdate) {
  const { data, error } = await supabase
    .from('vehicles')
    .update(vehicle)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
} 