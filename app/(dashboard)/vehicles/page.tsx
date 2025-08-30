import { Metadata } from "next"
import { VehicleList } from "@/components/vehicles/vehicle-list"
import { VehiclesPageContent } from "@/components/vehicles/vehicles-page-content"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { getDictionary } from "@/lib/i18n/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import type { DbVehicle } from "@/types"
import { Suspense } from "react"

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { t } = await getDictionary()
    
    return {
      title: t('vehicles.title') || "Vehicles",
      description: t('vehicles.description') || "Manage your fleet of vehicles",
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Vehicles",
      description: "Manage your fleet of vehicles",
    }
  }
}

const ITEMS_PER_PAGE = 9

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string; 
    query?: string; 
    status?: string; 
    brand?: string; 
    model?: string; 
    category?: string; 
  }>
}) {
  // Await searchParams before accessing its properties
  const resolvedSearchParams = await searchParams;
  // Read page from searchParams early
  const pageQueryParam = resolvedSearchParams?.page;
  const searchQuery = resolvedSearchParams?.query;
  const statusFilter = resolvedSearchParams?.status;
  const brandFilter = resolvedSearchParams?.brand;
  const modelFilter = resolvedSearchParams?.model;
  const categoryFilter = resolvedSearchParams?.category;

  const supabase = await getSupabaseServerClient();
  const { t } = await getDictionary()
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  const pageParam = Array.isArray(pageQueryParam)
    ? Number(pageQueryParam[0])
    : pageQueryParam
      ? Number(pageQueryParam)
      : 1;
  const currentPage = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1
  
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE - 1;



  // Base query for vehicles
  let vehiclesQuery = supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });

  // Base query for count
  let countQuery = supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true });

  // Apply filters
  if (searchQuery) {
    const searchPattern = `%${searchQuery}%`;
    vehiclesQuery = vehiclesQuery.or(`name.ilike.${searchPattern},plate_number.ilike.${searchPattern},brand.ilike.${searchPattern},model.ilike.${searchPattern}`);
    countQuery = countQuery.or(`name.ilike.${searchPattern},plate_number.ilike.${searchPattern},brand.ilike.${searchPattern},model.ilike.${searchPattern}`);
  }
  if (statusFilter && statusFilter !== 'all') {
    vehiclesQuery = vehiclesQuery.eq('status', statusFilter);
    countQuery = countQuery.eq('status', statusFilter);
  }
  // We'll resolve brand variants after fetching the list of distinct brands below
  if (modelFilter && modelFilter !== 'all') {
    vehiclesQuery = vehiclesQuery.eq('model', modelFilter);
    countQuery = countQuery.eq('model', modelFilter);
  }
  
  // Apply category filter if provided
  if (categoryFilter && categoryFilter !== 'all') {
    try {
      // Get vehicle IDs for the selected category with better error handling
      const { data: categoryVehicles, error: categoryError } = await supabase
        .from('pricing_category_vehicles')
        .select('vehicle_id')
        .eq('category_id', categoryFilter);
      
      if (categoryError) {
        console.error("Error fetching category vehicles:", categoryError);
        // Continue without category filter if there's an error
      } else if (categoryVehicles && categoryVehicles.length > 0) {
        const vehicleIds = categoryVehicles.map(cv => cv.vehicle_id);
        vehiclesQuery = vehiclesQuery.in('id', vehicleIds);
        countQuery = countQuery.in('id', vehicleIds);
      } else {
        // No vehicles in this category, return empty result
        vehiclesQuery = vehiclesQuery.eq('id', 'no-match');
        countQuery = countQuery.eq('id', 'no-match');
      }
    } catch (error) {
      console.error("Error in category filtering:", error);
      // Continue without category filter if there's an error
    }
  }

  // Fetch paginated vehicles with filters
  const { data: vehicles, error: vehiclesError } = await vehiclesQuery.range(startIndex, endIndex);

  // Fetch total count of vehicles with filters
  const { count, error: countError } = await countQuery;

  // Fetch distinct brands and models for filters
  const { data: distinctBrands, error: brandsError } = await supabase
    .from('vehicles')
    .select('brand')
    .not('brand', 'is', null) // Ensure brand is not null
    .neq('brand', '');      // Ensure brand is not empty
  
  let modelsQuery = supabase
    .from('vehicles')
    .select('model')
    .not('model', 'is', null)
    .neq('model', '');

  // Fetch pricing categories for the category filter
  const { data: pricingCategories, error: categoriesError } = await supabase
    .from('pricing_categories')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (categoriesError) {
    console.error("Error fetching pricing categories:", categoriesError);
  }

  // Build brand options with case-insensitive deduplication
  const brandMap = new Map();
  (distinctBrands || []).forEach(item => {
    if (item.brand) {
      const normalizedBrand = item.brand.trim();
      const lowerBrand = normalizedBrand.toLowerCase();
      if (!brandMap.has(lowerBrand)) {
        brandMap.set(lowerBrand, normalizedBrand);
      }
    }
  });
  
  const brandOptions = Array.from(brandMap.values())
    .map(brand => ({ value: brand, label: brand }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (brandFilter && brandFilter !== 'all') {
    // Find the actual brand value from the normalized brand options
    const selectedBrand = brandOptions.find(brand => brand.value === brandFilter);
    if (selectedBrand) {
      // Use the actual brand value from the database for filtering
      vehiclesQuery = vehiclesQuery.eq('brand', selectedBrand.value);
      countQuery = countQuery.eq('brand', selectedBrand.value);
      modelsQuery = modelsQuery.eq('brand', selectedBrand.value);
    }
  }
  const { data: distinctModels, error: modelsError } = await modelsQuery;

  if (vehiclesError) {
    console.error("Error fetching vehicles:", vehiclesError);
    // Handle error appropriately, maybe show a toast or an error message
  }
  if (countError) {
    console.error("Error fetching vehicle count:", countError);
    // Handle error appropriately
  }
    
  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Build model options with case-insensitive deduplication
  const modelMap = new Map();
  (distinctModels || []).forEach(item => {
    if (item.model) {
      const normalizedModel = item.model.trim();
      const lowerModel = normalizedModel.toLowerCase();
      if (!modelMap.has(lowerModel)) {
        modelMap.set(lowerModel, normalizedModel);
      }
    }
  });
  
  const modelOptions = Array.from(modelMap.values())
    .map(model => ({ value: model, label: model }))
    .sort((a, b) => a.label.localeCompare(b.label));
  
  // Build category options
  const categoryOptions = (pricingCategories || []).map(cat => ({ 
    value: cat.id, 
    label: cat.name 
  }));

  return (
    <VehiclesPageContent 
      vehicles={(vehicles || []) as DbVehicle[]} 
      currentPage={currentPage} 
      totalPages={totalPages} 
      initialFilters={{
        query: searchQuery,
        status: statusFilter,
        brand: brandFilter,
        model: modelFilter,
        category: categoryFilter,
      }}
      brandOptions={brandOptions}
      modelOptions={modelOptions}
      categoryOptions={categoryOptions}
    />
  )
} 