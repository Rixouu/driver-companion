"use client";

import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  InspectionItem,
  InspectionItemTemplate,
  InspectionPhoto,
} from "@/components/inspections/inspection-details"; // Adjust path as needed

/**
 * Props for the useInspectionItems hook.
 */
interface UseInspectionItemsProps {
  /** Initial array of inspection items, typically from server-side props. */
  initialInspectionItems: InspectionItem[] | undefined;
  /** The Supabase client instance. */
  supabase: SupabaseClient;
}

/**
 * Defines the shape of the object returned by the `useInspectionItems` hook.
 */
interface UseInspectionItemsReturn {
  /** An array of inspection items, enriched with their template and photo data. */
  itemsWithTemplates: InspectionItem[];
  /** Boolean indicating if the related templates and photos are currently being loaded. */
  isLoadingTemplates: boolean;
  /** Function to set the `itemsWithTemplates` state. */
  setItemsWithTemplates: React.Dispatch<React.SetStateAction<InspectionItem[]>>;
}

/**
 * Custom hook to manage the loading and enrichment of inspection items with their templates and photos.
 * It handles fetching related data if not already present in the initial items.
 *
 * @param props - The properties needed by the hook.
 * @returns An object containing `itemsWithTemplates`, `isLoadingTemplates` state, and `setItemsWithTemplates` setter.
 */
export function useInspectionItems({
  initialInspectionItems,
  supabase,
}: UseInspectionItemsProps): UseInspectionItemsReturn {
  const [itemsWithTemplates, setItemsWithTemplates] = useState<InspectionItem[]>(
    initialInspectionItems || []
  );
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  useEffect(() => {
    if (!initialInspectionItems || initialInspectionItems.length === 0 || itemsWithTemplates.length > 0) {
      // If initial items are already processed or there are no items, no need to fetch.
      // This check might need refinement based on how `itemsWithTemplates` is updated elsewhere.
      // If initialInspectionItems could change and require a re-fetch, this logic needs adjustment.
      if(itemsWithTemplates.length === 0 && initialInspectionItems && initialInspectionItems.length > 0){
        // This condition implies initialInspectionItems were provided but not yet processed
        // (e.g. if the initial itemsWithTemplates was an empty array due to server not providing full data)
      } else {
        return;
      }
    }

    let isMounted = true;
    setIsLoadingTemplates(true);

    async function loadTemplatesAndPhotos() {
      try {
        const templateIds = initialInspectionItems
          ?.map((item) => item.template_id)
          .filter(Boolean);

        if (!templateIds || templateIds.length === 0) {
          if (isMounted) setIsLoadingTemplates(false);
          return;
        }

        const { data: templates, error: templateError } = await supabase
          .from("inspection_item_templates")
          .select("*")
          .in("id", templateIds);

        if (templateError) {
          console.error("Auth error or other error loading templates:", templateError);
          if (isMounted) setIsLoadingTemplates(false);
          return; 
        }

        const itemIds = initialInspectionItems
          ?.map((item) => item.id)
          .filter(Boolean);

        let photos: InspectionPhoto[] = [];
        if (itemIds && itemIds.length > 0) {
          const { data: photosData, error: photosError } = await supabase
            .from("inspection_photos")
            .select("*")
            .in("inspection_item_id", itemIds);

          if (photosError) {
            console.error("Error fetching photos:", photosError);
          } else {
            photos = (photosData as InspectionPhoto[]) || [];
          }
        }

        if (isMounted && initialInspectionItems) {
          const updatedItems = initialInspectionItems.map((item) => ({
            ...item,
            template: templates?.find(
              (t) => t.id === item.template_id
            ) as InspectionItemTemplate | undefined,
            inspection_photos:
              photos?.filter((photo) => photo.inspection_item_id === item.id) ||
              [],
          }));
          setItemsWithTemplates(updatedItems);
        }
      } catch (error) {
        console.error("Error loading templates and photos:", error);
      } finally {
        if (isMounted) setIsLoadingTemplates(false);
      }
    }

    loadTemplatesAndPhotos();

    return () => {
      isMounted = false;
    };
  }, [initialInspectionItems, supabase, itemsWithTemplates.length]); // Added itemsWithTemplates.length to re-evaluate if it becomes empty

  return {
    itemsWithTemplates,
    isLoadingTemplates,
    setItemsWithTemplates,
    // If realtime updates to itemsWithTemplates are needed, expose setItemsWithTemplates or a handler
    // For now, this hook primarily handles initial loading and enrichment of items.
  };
} 