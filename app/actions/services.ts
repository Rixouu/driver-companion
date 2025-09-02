'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'

export interface ServiceType {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface PricingCategory {
  id: string
  name: string
  description?: string
  service_types: string[]
  service_type_ids: string[]
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at?: string
}

export interface VehicleWithCategory {
  id: string
  name: string
  plate_number?: string
  model?: string
  year?: string
  brand?: string
  status?: string
  image_url?: string
  passenger_capacity?: number
  luggage_capacity?: number
  category_name?: string
  category_id?: string
}

export async function getServiceTypesAction(): Promise<ServiceType[]> {
  const supabase = await getSupabaseServerClient()
  
  try {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching service types:', JSON.stringify(error))
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Detailed error fetching service types:', error)
    throw error
  }
}

export async function getPricingCategoriesAction(): Promise<PricingCategory[]> {
  const supabase = await getSupabaseServerClient()
  
  try {
    const { data, error } = await supabase
      .from('pricing_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching pricing categories:', JSON.stringify(error))
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Detailed error fetching pricing categories:', error)
    throw error
  }
}

export async function getVehiclesWithCategoriesAction(): Promise<VehicleWithCategory[]> {
  const supabase = await getSupabaseServerClient()
  
  try {
    // Get current user ID
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('Error getting user:', JSON.stringify(userError))
      throw userError
    }
    
    const userId = userData.user?.id
    
    if (!userId) {
      throw new Error('User not authenticated')
    }

    console.log('🚗 [SERVER] Fetching vehicles using junction table (same as quotation system)...')
    
    // Use the same approach as quotation system: fetch from pricing_category_vehicles junction table
    const { data: vehiclesData, error: vehiclesError } = await supabase
      .from('pricing_category_vehicles')
      .select(`
        category_id,
        vehicles!inner(
          id,
          name,
          plate_number,
          model,
          year,
          brand,
          status,
          image_url,
          passenger_capacity,
          luggage_capacity,
          user_id
        )
      `)
      .eq('vehicles.status', 'active')
      .eq('vehicles.user_id', userId)

    if (vehiclesError) {
      console.error('Error fetching vehicles from junction table:', JSON.stringify(vehiclesError))
      throw vehiclesError
    }

    if (!vehiclesData || vehiclesData.length === 0) {
      console.log('🚗 [SERVER] No vehicles found in junction table for user:', userId)
      return []
    }

    // Get all pricing categories
    const { data: categories, error: categoriesError } = await supabase
      .from('pricing_categories')
      .select('id, name, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (categoriesError) {
      console.error('Error fetching categories:', JSON.stringify(categoriesError))
      throw categoriesError
    }

    // Map vehicles with their categories using junction table data
    console.log('🏭 [SERVER] Mapping vehicles with categories from junction table...')
    console.log('🏭 [SERVER] Raw junction data from DB:', vehiclesData?.length, 'vehicle-category pairs')
    console.log('🏭 [SERVER] Categories from DB:', categories?.length, 'categories')
    
    const vehiclesWithCategories = vehiclesData?.map(pcv => {
      const vehicle = pcv.vehicles
      const category = categories?.find(cat => cat.id === pcv.category_id)
      
      const mappedVehicle = {
        id: vehicle.id,
        name: vehicle.name,
        plate_number: vehicle.plate_number,
        model: vehicle.model,
        year: vehicle.year,
        brand: vehicle.brand,
        status: vehicle.status,
        image_url: vehicle.image_url,
        passenger_capacity: vehicle.passenger_capacity,
        luggage_capacity: vehicle.luggage_capacity,
        category_name: category?.name,
        category_id: pcv.category_id
      }
      console.log('🏭 [SERVER] Mapped vehicle:', vehicle.id, vehicle.brand?.trim(), vehicle.model?.trim(), '→ Category:', category?.name)
      return mappedVehicle
    }) || []

    // Sort by category sort_order, then by brand and model
    const sortedVehicles = vehiclesWithCategories.sort((a, b) => {
      const categoryA = categories?.find(cat => cat.id === a.category_id)
      const categoryB = categories?.find(cat => cat.id === b.category_id)
      
      if (categoryA?.sort_order !== categoryB?.sort_order) {
        return (categoryA?.sort_order || 999) - (categoryB?.sort_order || 999)
      }
      
      if ((a.brand?.trim() || '') !== (b.brand?.trim() || '')) {
        return (a.brand?.trim() || '').localeCompare(b.brand?.trim() || '')
      }
      
      return (a.model?.trim() || '').localeCompare(b.model?.trim() || '')
    })
    
    console.log('🏭 [SERVER] Final sorted vehicles:', sortedVehicles.length, 'vehicles')
    console.log('🏭 [SERVER] Categories breakdown:')
    
    // Log breakdown by category
    categories?.forEach(category => {
      const categoryVehicles = sortedVehicles.filter(v => v.category_id === category.id)
      console.log(`🏭 [SERVER] ${category.name}: ${categoryVehicles.length} vehicles - ${categoryVehicles.map(v => `${v.brand?.trim()} ${v.model?.trim()}`).join(', ')}`)
    })
    
    return sortedVehicles
  } catch (error) {
    console.error('Detailed error fetching vehicles with categories:', error)
    throw error
  }
}
