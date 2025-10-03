"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"
import type { InspectionType } from "@/types/inspections"

// Type to capture translation field structure from inspection service
type TranslationObject = { [key: string]: string };

// Define inspection item type with translations
interface InspectionItemType {
  id: string
  name_translations: TranslationObject
  description_translations: TranslationObject
  title: string // Display title derived from translations
  description?: string // Display description derived from translations
  requires_photo: boolean
  requires_notes: boolean
  status: 'pass' | 'fail' | null
  notes: string
  photos: string[]
}

// Define inspection section type with translations
interface InspectionSection {
  id: string
  name_translations: TranslationObject
  description_translations: TranslationObject
  title: string // Display title derived from translations
  description?: string // Display description derived from translations
  items: InspectionItemType[]
}

interface UseExistingInspectionDataProps {
  inspectionId?: string;
  sections: InspectionSection[];
  setSections: (sections: InspectionSection[]) => void;
  setSelectedType: (type: InspectionType) => void;
  setCurrentStepIndex: (index: number) => void;
  methods: any; // Form methods
}

export function useExistingInspectionData({
  inspectionId,
  sections,
  setSections,
  setSelectedType,
  setCurrentStepIndex,
  methods
}: UseExistingInspectionDataProps) {
  const [existingInspection, setExistingInspection] = useState<any>(null);
  const hasLoadedExistingData = useRef(false);

  // Load inspection header to get type and existing items when editing/continuing
  useEffect(() => {
    if (!inspectionId) return;
    
    // Reset the flag when inspection ID changes
    hasLoadedExistingData.current = false;

    const loadInspectionHeader = async () => {
      try {
        const supabaseClient = createClient();
        const { data, error } = await supabaseClient
          .from('inspections')
          .select('id, type, status')
          .eq('id', inspectionId)
          .maybeSingle();
        if (error) {
          console.error('[StepBasedInspectionForm] Failed to fetch inspection header:', error);
          return;
        }
        if (data) {
          setExistingInspection(data);
          if (data.type) {
            setSelectedType(data.type as InspectionType);
            methods.setValue('type', data.type as InspectionType);
            // Ensure we move to template step if vehicle is pre-selected
            setCurrentStepIndex(1);
          }
        }
      } catch (err) {
        console.error('[StepBasedInspectionForm] Unexpected error loading inspection header:', err);
      }
    };

    loadInspectionHeader();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectionId]);

  // After sections are loaded, merge existing item statuses/notes/photos
  useEffect(() => {
    if (!inspectionId || sections.length === 0 || hasLoadedExistingData.current) return;

    const loadExistingResults = async () => {
      try {
        const supabaseClient = createClient();
        const { data: itemsRaw, error } = await supabaseClient
          .from('inspection_items')
          .select('template_id, status, notes, inspection_photos (photo_url)')
          .eq('inspection_id', inspectionId);
        if (error) {
          console.error('[StepBasedInspectionForm] Failed to load existing inspection items:', error);
          return;
        }
        if (!itemsRaw || itemsRaw.length === 0) return;

        // Map template_id to existing item result
        const iterableItems = Array.isArray(itemsRaw) ? itemsRaw : [];
        const resultMap: Record<string, any> = {};
        iterableItems.forEach((i: any) => {
          if (i.template_id) {
            resultMap[i.template_id] = i;
          }
        });

        console.log(`[INSPECTION_FORM] Loading existing results for ${iterableItems.length} items`);
        console.log(`[INSPECTION_FORM] Result map:`, resultMap);
        console.log(`[INSPECTION_FORM] Current sections before merge:`, sections);

        const merged = sections.map((section) => ({
          ...section,
          items: section.items.map((item) => {
            const existing = resultMap[item.id as string];
            if (!existing) {
              console.log(`[INSPECTION_FORM] No existing data for item ${item.id}`);
              return item;
            }
            console.log(`[INSPECTION_FORM] Merging existing data for item ${item.id}:`, existing);
            return {
              ...item,
              status: existing.status as 'pass' | 'fail' | null,
              notes: existing.notes || '',
              photos: (existing.inspection_photos ?? []).map((p: { photo_url: string }) => p.photo_url),
            };
          }),
        }));

        console.log(`[INSPECTION_FORM] Merged sections:`, merged);
        setSections(merged);
        hasLoadedExistingData.current = true;
      } catch (err) {
        console.error('[StepBasedInspectionForm] Unexpected error merging existing results:', err);
      }
    };

    loadExistingResults();
  }, [inspectionId, sections, setSections]);

  return {
    existingInspection
  };
}
