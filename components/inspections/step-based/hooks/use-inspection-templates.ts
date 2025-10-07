"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useI18n } from "@/lib/i18n/context"
import { fetchInspectionTemplatesAction } from "@/app/(dashboard)/inspections/actions"
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

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand?: string;
  model?: string;
  image_url?: string | null;
  year?: string;
  vehicle_group_id?: string;
  vehicle_group?: {
    id: string;
    name: string;
    description?: string;
    color: string;
    vehicle_count?: number;
  };
}

interface UseInspectionTemplatesProps {
  selectedVehicle: Vehicle | null;
  selectedType: InspectionType;
  setSelectedType: (type: InspectionType) => void;
  setSections: (sections: InspectionSection[]) => void;
  currentStepIndex: number;
  inspectionId?: string;
  methods: any; // Form methods
  autoTemplateToastShownRef: React.MutableRefObject<boolean>;
  isAutoStartingRef: React.MutableRefObject<boolean>;
}

export function useInspectionTemplates({
  selectedVehicle,
  selectedType,
  setSelectedType,
  setSections,
  currentStepIndex,
  inspectionId,
  methods,
  autoTemplateToastShownRef,
  isAutoStartingRef
}: UseInspectionTemplatesProps) {
  const { toast } = useToast();
  const { locale } = useI18n();
  const [availableTemplateTypes, setAvailableTemplateTypes] = useState<InspectionType[]>([]);

  // Load the template only when we are in the section-rendering step (index >= 1).
  useEffect(() => {
    if (currentStepIndex < 1 || !selectedType) return;

    const loadInspectionTemplate = async () => {
      try {
        // Use the server action to fetch templates
        const categories = await fetchInspectionTemplatesAction(selectedType);
        
        if (!categories || categories.length === 0) {
          console.error(`[INSPECTION_TEMPLATE] No template categories found for type: ${selectedType}`);
          toast({
            title: "Template not found",
            description: `No inspection template found for ${selectedType}`,
            variant: "destructive"
          });
          return;
        }
        
        // Format the sections with their items
        const sectionsWithItems: InspectionSection[] = categories.map((category: any) => {
          return {
            id: category.id,
            name_translations: category.name_translations,
            description_translations: category.description_translations,
            title: category.name_translations[locale] || 'Unknown Section',
            description: category.description_translations[locale] || '',
            items: category.inspection_item_templates.map((item: any) => ({
              id: item.id,
              name_translations: item.name_translations,
              description_translations: item.description_translations,
              title: item.name_translations[locale] || 'Unknown Item',
              description: item.description_translations[locale] || '',
              requires_photo: Boolean(item.requires_photo),
              requires_notes: Boolean(item.requires_notes),
              status: null as 'pass' | 'fail' | null,
              notes: '',
              photos: [] as string[]
            }))
          };
        });

        setSections(sectionsWithItems);
      } catch (error) {
        console.error('Error loading inspection template:', error);
        toast({
          title: "Failed to load inspection template",
          variant: "destructive"
        });
      }
    };

    loadInspectionTemplate();
  }, [selectedType, currentStepIndex, locale, toast, setSections]);
  
  // Load available templates based on vehicle assignments
  useEffect(() => {
    if (selectedVehicle) {
      // Reset flags when vehicle changes
      autoTemplateToastShownRef.current = false;
      isAutoStartingRef.current = false;
      
      const loadAvailableTemplates = async () => {
        try {
          const supabaseClient = createClient();
          
          // Check for templates assigned to this specific vehicle
          const { data: vehicleAssignments, error: vehicleError } = await supabaseClient
            .from('inspection_template_assignments')
            .select('template_type')
            .eq('vehicle_id', selectedVehicle.id)
            .eq('is_active', true);

          if (vehicleError) {
            console.error('Error fetching vehicle assignments:', vehicleError);
          }

          // Check for templates assigned to this vehicle's group
          let groupAssignments: any[] = [];
          if (selectedVehicle.vehicle_group_id) {
            const { data: groupData, error: groupError } = await supabaseClient
              .from('inspection_template_assignments')
              .select('template_type')
              .eq('vehicle_group_id', selectedVehicle.vehicle_group_id)
              .eq('is_active', true);

            if (groupError) {
              console.error('Error fetching group assignments:', groupError);
            } else {
              groupAssignments = groupData || [];
            }
          }

          // Combine and deduplicate template types
          const allAssignments = [...(vehicleAssignments || []), ...groupAssignments];
          const availableTypes = [...new Set(allAssignments.map(a => a.template_type))] as InspectionType[];

          // Set the available template types state
          setAvailableTemplateTypes(availableTypes);

          // If only one template type is available, auto-select it and skip type selection
          if (availableTypes.length === 1) {
            const alreadyNotified = autoTemplateToastShownRef.current;
            const autoType = availableTypes[0] as InspectionType;

            setSelectedType(autoType);
            methods.setValue('type', autoType);
            
            // Trigger immediate template loading
            fetchInspectionTemplatesAction(autoType)
              .then(categories => {
                if (categories && categories.length > 0) {
                  // Template pre-loaded successfully
                } else {
                  console.error(`[VEHICLE_TEMPLATE_ASSIGNMENT] Failed to pre-load template: ${autoType} - no categories returned`);
                }
              })
              .catch(err => {
                console.error(`[VEHICLE_TEMPLATE_ASSIGNMENT] Error pre-loading template: ${autoType}`, err);
              });

            // Don't automatically navigate steps - let user control the flow
            // The auto-selection just pre-selects the type and loads the template
            
            if (!alreadyNotified) {
              toast({
                title: "Template Auto-Selected",
                description: `Using ${autoType} inspection template for this vehicle`
              });
              autoTemplateToastShownRef.current = true;
            }
          } else if (availableTypes.length === 0) {
            // No specific templates assigned, show all types as fallback
            setAvailableTemplateTypes([]); // Empty array will trigger "No templates assigned" message
            setSelectedType('routine');
            methods.setValue('type', 'routine');
          } else {
            // Multiple templates available, set default to first available
            const firstAvailable = availableTypes[0];
            setSelectedType(firstAvailable);
            methods.setValue('type', firstAvailable);
          }
          
        } catch (error) {
          console.error('Error loading available templates for vehicle:', error);
          // Fallback: no templates available
          setAvailableTemplateTypes([]);
          setSelectedType('routine');
          methods.setValue('type', 'routine');
        }
      };

      loadAvailableTemplates();
    } else {
      // No vehicle selected, reset available types
      setAvailableTemplateTypes([]);
    }
  }, [selectedVehicle, methods, currentStepIndex, setSelectedType, toast, autoTemplateToastShownRef, isAutoStartingRef, inspectionId]);

  return {
    availableTemplateTypes
  };
}
