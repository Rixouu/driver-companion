export const dynamic = "force-dynamic"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { InspectionDetails } from "@/components/inspections/inspection-details"

interface InspectionDetailsPageProps {
  params: {
    id: string
  }
}

// Define interface for template and photo items
interface InspectionItemTemplate {
  id: string;
  [key: string]: any;
}

interface InspectionPhoto {
  id: string;
  inspection_item_id: string;
  [key: string]: any;
}

export const metadata: Metadata = {
  title: "Inspection Details",
  description: "View inspection details",
}

export default async function InspectionDetailsPage({ params }: InspectionDetailsPageProps) {
  try {
    // Access the id parameter correctly
    const id = params.id
    
    // Fetch the inspection with vehicle details
    const supabase = await createServerSupabaseClient()
    const { data: inspection, error } = await supabase
      .from('inspections')
      .select('*, vehicle:vehicle_id(*)')
      .eq('id', id)
      .single()
      
    if (error || !inspection) {
      console.error("Error fetching inspection:", error)
      notFound()
    }
    
    // Fetch inspection items with templates
    const { data: items, error: itemsError } = await supabase
      .from('inspection_items')
      .select('*, template:template_id(*)')
      .eq('inspection_id', id)
      
    if (itemsError) {
      console.error("Error fetching inspection items:", itemsError)
      // Continue as we can show partial data
    }
    
    // Fetch inspection item photos
    const { data: photos, error: photosError } = await supabase
      .from('inspection_photos')
      .select('*')
      .in('inspection_item_id', items?.map(item => item.id) || [])
      
    if (photosError) {
      console.error("Error fetching inspection photos:", photosError)
      // Continue as we can show partial data
    }
    
    // Attach items and photos to the inspection
    const inspectionWithItems = {
      ...inspection,
      inspection_items: items?.map(item => ({
        ...item,
        inspection_photos: photos?.filter(photo => photo.inspection_item_id === item.id) || []
      }))
    }
    
    return (
      <InspectionDetails inspection={inspectionWithItems} />
    )
  } catch (error) {
    console.error("Error in InspectionDetailsPage:", error)
    return notFound()
  }
} 