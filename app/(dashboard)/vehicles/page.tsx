import { Metadata } from "next"
import { VehicleList } from "@/components/vehicles/vehicle-list"
import { VehiclesPageContent } from "@/components/vehicles/vehicles-page-content"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { getDictionary } from "@/lib/i18n/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { DbVehicle } from "@/types"

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { dictionary } = await getDictionary()
    
    return {
      title: dictionary?.vehicles?.title || "Vehicles",
      description: dictionary?.vehicles?.description || "Manage your fleet of vehicles",
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
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createServerSupabaseClient();
  const { t } = await getDictionary()
  
  // Get page from search params
  const pageParam = searchParams.page ? Number(searchParams.page) : 1
  const currentPage = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1
  
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })
    
  // Calculate total pages
  const totalItems = vehicles?.length || 0
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  return (
    <VehiclesPageContent 
      vehicles={(vehicles || []) as DbVehicle[]} 
      currentPage={currentPage} 
      totalPages={totalPages} 
    />
  )
} 