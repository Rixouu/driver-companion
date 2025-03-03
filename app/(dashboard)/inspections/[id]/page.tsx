import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { InspectionDetails } from "@/components/inspections/inspection-details"

interface InspectionDetailsPageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: "Inspection Details",
  description: "View inspection details",
}

export default async function InspectionDetailsPage({ params }: InspectionDetailsPageProps) {
  const supabase = createServerComponentClient({ cookies })
  
  try {
    // Fetch the inspection with vehicle details
    const { data: inspection, error } = await supabase
      .from('inspections')
      .select(`
        *,
        vehicle:vehicles (*),
        inspection_items (
          id,
          template_id,
          status,
          notes
        )
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      console.error('Error fetching inspection:', error)
      return notFound()
    }
    
    if (!inspection) {
      console.error('No inspection found with ID:', params.id)
      return notFound()
    }

    // Fetch inspection item templates
    let templates = []
    if (inspection.inspection_items && inspection.inspection_items.length > 0) {
      const templateIds = inspection.inspection_items.map((item: { template_id: string }) => item.template_id)
      
      const { data: templatesData, error: templatesError } = await supabase
        .from('inspection_item_templates')
        .select('*')
        .in('id', templateIds)
      
      if (templatesError) {
        console.error('Error fetching templates:', templatesError)
      } else {
        templates = templatesData
      }
    }

    // Fetch photos for inspection items
    let photos = []
    if (inspection.inspection_items && inspection.inspection_items.length > 0) {
      const itemIds = inspection.inspection_items.map((item: { id: string }) => item.id)
      
      const { data: photosData, error: photosError } = await supabase
        .from('inspection_photos')
        .select('*')
        .in('inspection_item_id', itemIds)
      
      if (photosError) {
        console.error('Error fetching photos:', photosError)
      } else {
        photos = photosData
      }
    }

    // Attach templates and photos to inspection items
    if (inspection.inspection_items) {
      inspection.inspection_items = inspection.inspection_items.map((item: { id: string, template_id: string }) => ({
        ...item,
        template: templates.find(t => t.id === item.template_id) || null,
        inspection_photos: photos.filter(p => p.inspection_item_id === item.id) || []
      }))
    }

    return (
      <div className="container mx-auto py-6">
        <InspectionDetails inspection={inspection} />
      </div>
    )
  } catch (error) {
    console.error('Error in InspectionDetailsPage:', error)
    return notFound()
  }
} 