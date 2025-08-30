import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { AppError, AuthenticationError, DatabaseError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/error-handler';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthenticationError('User not authenticated.');
    }

    console.log('🔍 Starting to fetch quotation form data...');

    // Fetch all data in parallel
    const [
      { data: pricingCategories, error: categoriesError },
      { data: serviceTypes, error: serviceTypesError },
      { data: categoryServiceTypes, error: categoryServiceTypesError },
      { data: vehiclesData, error: vehiclesError },
      { data: pricingItems, error: itemsError }
    ] = await Promise.all([
      supabase
        .from('pricing_categories')
        .select('id, name, description, service_type_ids, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('service_types')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true }),
      
      supabase
        .from('pricing_category_service_types')
        .select('category_id, service_type_id')
        .order('category_id', { ascending: true }),
      
      // Fetch vehicles and their associated categories via the junction table
      supabase
        .from('pricing_category_vehicles')
        .select(`
          category_id,
          vehicles!inner(
            id,
            name,
            brand,
            model,
            year,
            status
          )
        `)
        .eq('vehicles.status', 'active'),
      
      supabase
        .from('pricing_items')
        .select('id, category_id, service_type, vehicle_id, duration_hours, price, currency, is_active')
        .eq('is_active', true)
        .order('duration_hours', { ascending: true })
    ]);

    console.log('📊 Raw data fetched:');
    console.log('- Pricing Categories:', pricingCategories?.length || 0);
    console.log('- Service Types:', serviceTypes?.length || 0);
    console.log('- Category Service Types:', categoryServiceTypes?.length || 0);
    console.log('- Vehicles Data (from junction table):', vehiclesData?.length || 0);
    console.log('- Pricing Items:', pricingItems?.length || 0);

    if (categoriesError) {
      throw new DatabaseError('Error fetching pricing categories.', { cause: categoriesError });
    }
    if (serviceTypesError) {
      throw new DatabaseError('Error fetching service types.', { cause: serviceTypesError });
    }
    if (categoryServiceTypesError) {
      throw new DatabaseError('Error fetching category service types.', { cause: categoryServiceTypesError });
    }
    if (vehiclesError) {
      throw new DatabaseError('Error fetching vehicles.', { cause: vehiclesError });
    }
    if (itemsError) {
      throw new DatabaseError('Error fetching pricing items.', { cause: itemsError });
    }

    // Log raw data for debugging
    console.log('📋 Raw pricing categories:', pricingCategories);
    console.log('🔧 Raw service types:', serviceTypes);
    console.log('🔗 Raw category service types:', categoryServiceTypes);
    console.log('🚗 Raw vehicles data from junction table:', vehiclesData);

    // Group vehicles by category using the junction table data
    const vehiclesByCategory = vehiclesData?.reduce((acc, pcv) => {
      const categoryId = pcv.category_id;
      const vehicle = pcv.vehicles;
      
      if (!vehicle) {
        console.warn('⚠️ No vehicle data in junction table entry:', pcv);
        return acc;
      }
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          id: categoryId,
          name: '', // Will be filled from pricing_categories
          vehicles: []
        };
      }
      
      // Add vehicle to its category
      acc[categoryId].vehicles.push({
        id: vehicle.id,
        name: vehicle.name,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        status: vehicle.status,
        category_id: categoryId
      });
      
      return acc;
    }, {} as Record<string, any>) || {};

    // Fill in category names from pricing_categories
    pricingCategories?.forEach(category => {
      if (vehiclesByCategory[category.id]) {
        vehiclesByCategory[category.id].name = category.name;
      }
    });

    console.log('🚗 Vehicles by category (from junction table):', Object.keys(vehiclesByCategory).map(catId => ({
      category_id: catId,
      category_name: vehiclesByCategory[catId]?.name,
      vehicle_count: vehiclesByCategory[catId]?.vehicles?.length || 0,
      vehicles: vehiclesByCategory[catId]?.vehicles?.map((v: any) => v.name) || []
    })));

    // Group pricing items by service type and vehicle id
    const pricingByServiceAndVehicle = pricingItems?.reduce((acc, item) => {
      const key = `${item.service_type}_${item.vehicle_id || 'no-vehicle'}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        id: item.id,
        duration_hours: item.duration_hours,
        price: item.price,
        currency: item.currency,
        category_id: item.category_id
      });
      return acc;
    }, {} as Record<string, any[]>) || {};

    // Create a map of service types by ID for quick lookup
    const serviceTypesMap = new Map(serviceTypes?.map((st: any) => [st.id, st]) || []);
    
    // Create a map of categories with their associated service types
    const categoriesWithServiceTypes = pricingCategories?.map(category => {
      // Get service types from the junction table
      const categoryServiceTypeIds = categoryServiceTypes
        ?.filter((cst: any) => cst.category_id === category.id)
        ?.map((cst: any) => cst.service_type_id) || [];
      
      // Get the actual service type objects
      const categoryServiceTypeObjects = categoryServiceTypeIds
        .map((id: string) => serviceTypesMap.get(id))
        .filter(Boolean);
      
      return {
        ...category,
        service_type_ids: categoryServiceTypeIds,
        service_types: categoryServiceTypeObjects
      };
    }) || [];

    console.log('🔗 Categories with service types:', categoriesWithServiceTypes.map((c: any) => ({
      name: c.name,
      service_type_count: c.service_type_ids?.length || 0,
      service_types: c.service_types?.map((st: any) => st.name) || []
    })));

    const result = {
      pricingCategories: categoriesWithServiceTypes,
      serviceTypes: serviceTypes || [],
      vehicles: vehiclesData || [],
      vehiclesByCategory,
      pricingItems: pricingItems || [],
      pricingByServiceAndVehicle
    };

    console.log('✅ Final result structure:', {
      pricingCategoriesCount: result.pricingCategories.length,
      serviceTypesCount: result.serviceTypes.length,
      vehiclesCount: result.vehicles.length,
      vehiclesByCategoryCount: Object.keys(result.vehiclesByCategory).length,
      pricingItemsCount: result.pricingItems.length,
      pricingByServiceAndVehicleCount: Object.keys(result.pricingByServiceAndVehicle).length
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error fetching quotation form data:', error);
    if (error instanceof AppError) {
      return handleApiError(error);
    }
    return handleApiError(new AppError('An unexpected error occurred while fetching form data.', 500, { 
      cause: error instanceof Error ? error : undefined, 
      isOperational: true 
    }));
  }
}
