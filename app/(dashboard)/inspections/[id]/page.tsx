export const dynamic = "force-dynamic"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { InspectionDetails } from "@/components/inspections/inspection-details"
import type { DbInspection, DbVehicle } from "@/types"

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
    // Await params before accessing its properties
    const awaitedParams = await params;
    const id = awaitedParams.id;
    
    // Fetch the inspection with vehicle details
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User not authenticated, redirecting to login for inspection details.");
      // Or handle as per your app's logic, e.g., redirect('/login')
      // For now, let's assume notFound() is appropriate if auth is strictly required here.
      notFound();
    }

    const { data: inspection, error } = await supabase
      .from('inspections')
      .select('*, vehicle:vehicle_id(*)')
      .eq('id', id)
      .single<DbInspection>()
      
    if (error || !inspection) {
      console.error("Error fetching inspection:", error)
      notFound()
    }
    
    // Fetch inspection items with templates
    const { data: rawItems, error: itemsError } = await supabase
      .from('inspection_items')
      .select('*, template:template_id(*)')
      .eq('inspection_id', id)
      
    if (itemsError) {
      console.error("Error fetching inspection items:", itemsError)
      // Continue as we can show partial data, rawItems might be null or empty
    }
    
    // Filter items to ensure required string properties (inspection_id, template_id) are not null
    // This addresses the type error where 'string | null' is not assignable to 'string'.
    const validItems = rawItems?.filter(item => 
      item.inspection_id !== null && item.template_id !== null
    ) || [];
    
    // Fetch inspection item photos for valid items
    // Use a placeholder UUID if itemIdsForPhotoQuery is empty to prevent Supabase error on empty .in()
    const itemIdsForPhotoQuery = validItems.map(item => item.id);
    const photoQueryIds = itemIdsForPhotoQuery.length > 0 ? itemIdsForPhotoQuery : ['00000000-0000-0000-0000-000000000000'];

    const { data: photos, error: photosError } = await supabase
      .from('inspection_photos')
      .select('*')
      .in('inspection_item_id', photoQueryIds)
      
    if (photosError) {
      console.error("Error fetching inspection photos:", photosError)
      // Continue as we can show partial data
    }
    
    // Attach items and photos to the inspection
    // After filtering, item.inspection_id and item.template_id within validItems are guaranteed to be strings.
    const inspectionWithItems = {
      ...inspection,
      vehicle: inspection.vehicle ? { ...inspection.vehicle } : undefined,
      created_by: inspection.created_by === null ? undefined : inspection.created_by,
      inspection_items: validItems.map(item => ({
        ...item, 
        inspection_id: item.inspection_id as string,
        template_id: item.template_id as string,
        status: item.status as 'pass' | 'fail' | 'pending' | null,
        notes: item.notes === null ? undefined : item.notes,
        template: item.template === null ? undefined : item.template,
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