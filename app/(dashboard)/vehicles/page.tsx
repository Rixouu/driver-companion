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
  searchParams: { 
    page?: string; 
    query?: string; 
    status?: string; 
    brand?: string; 
    model?: string; 
  }
}) {
  // Await searchParams before accessing its properties
  const resolvedSearchParams = await searchParams;
  // Read page from searchParams early
  const pageQueryParam = resolvedSearchParams?.page;
  const searchQuery = resolvedSearchParams?.query;
  const statusFilter = resolvedSearchParams?.status;
  const brandFilter = resolvedSearchParams?.brand;
  const modelFilter = resolvedSearchParams?.model;

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
  if (brandFilter && brandFilter !== 'all') {
    vehiclesQuery = vehiclesQuery.eq('brand', brandFilter);
    countQuery = countQuery.eq('brand', brandFilter);
  }
  if (modelFilter && modelFilter !== 'all') {
    vehiclesQuery = vehiclesQuery.eq('model', modelFilter);
    countQuery = countQuery.eq('model', modelFilter);
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

  if (brandFilter && brandFilter !== 'all') {
    modelsQuery = modelsQuery.eq('brand', brandFilter);
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

  const brandOptions = [...new Set((distinctBrands || []).map(item => item.brand).filter(Boolean))].map(b => ({ value: b, label: b }));
  const modelOptions = [...new Set((distinctModels || []).map(item => item.model).filter(Boolean))].map(m => ({ value: m, label: m }));

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
      }}
      brandOptions={brandOptions}
      modelOptions={modelOptions}
    />
  )
} 