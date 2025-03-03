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

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getDictionary()
  
  return {
    title: dictionary.vehicles.title,
    description: dictionary.vehicles.description,
  }
}

const ITEMS_PER_PAGE = 9

export default async function VehiclesPage() {
  const supabase = createServerComponentClient({ cookies })
  const dictionary = await getDictionary()
  
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <VehiclesPageContent 
      vehicles={vehicles || []} 
      currentPage={1} 
      totalPages={1} 
    />
  )
} 