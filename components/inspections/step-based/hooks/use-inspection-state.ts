"use client";

import { useState, useEffect, useRef } from "react";
import type { InspectionType } from "@/types/inspections";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { fetchInspectionTemplatesAction } from "@/app/(dashboard)/inspections/actions";
import { createClient } from "@/lib/supabase";

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand?: string;
  model?: string;
  image_url?: string | null;
  year?: string;
  vehicle_group_id?: string;
}

interface InspectionSection {
  id: string;
  name_translations: { [key: string]: string };
  title: string;
  description?: string;
  items: any[];
}

interface UseInspectionStateProps {
  vehicleId?: string;
  inspectionId?: string;
  isResuming?: boolean;
  methods?: any; // Form methods for setting values
}

export function useInspectionState({ vehicleId, inspectionId, isResuming = false, methods }: UseInspectionStateProps) {
  const { toast } = useToast();
  const { locale } = useI18n();
  
  // Core inspection state
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedType, setSelectedType] = useState<InspectionType>('routine');
  const [sections, setSections] = useState<InspectionSection[]>([]);
  const [inspectionDate, setInspectionDate] = useState<Date | undefined>(new Date());
  const [isBackdatingEnabled, setIsBackdatingEnabled] = useState(false);
  const [availableTemplateTypes, setAvailableTemplateTypes] = useState<InspectionType[]>([]);
  
  // Step navigation state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(vehicleId ? 0 : -1); // -1 for vehicle selection, 0+ for sections
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  
  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentPhotoItem, setCurrentPhotoItem] = useState<{
    sectionId: string;
    itemId: string;
  } | null>(null);
  
  // Notes and timing
  const [notes, setNotes] = useState<string>('');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(10); // in minutes
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Refs for preventing duplicate operations
  const autoTemplateToastShownRef = useRef(false);
  const isAutoStartingRef = useRef(false);

  // Debug component mount
  useEffect(() => {
    return () => {
      // Reset flags on unmount
      autoTemplateToastShownRef.current = false;
      isAutoStartingRef.current = false;
    };
  }, []);

  // Debug sections changes
  useEffect(() => {
    // Sections updated
  }, [sections]);

  // Load inspection templates when type is selected and we're in the inspection step
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
            name_translations: category.name_translations || {},
            description_translations: category.description_translations || {},
            title: category.name_translations?.[locale] || category.name || 'Untitled Section',
            description: category.description_translations?.[locale] || category.description,
            items: (category.items || []).map((item: any) => ({
              id: item.id,
              name_translations: item.name_translations || {},
              description_translations: item.description_translations || {},
              title: item.name_translations?.[locale] || item.name || 'Untitled Item',
              description: item.description_translations?.[locale] || item.description,
              requires_photo: item.requires_photo || false,
              requires_notes: item.requires_notes || false,
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
  }, [selectedType, currentStepIndex, locale, toast]);

  // Load available template types when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
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

          // Combine vehicle and group assignments
          const allAssignments = [...(vehicleAssignments || []), ...groupAssignments];
          const availableTypes = [...new Set(allAssignments.map(a => a.template_type))] as InspectionType[];

          // Set the available template types state
          setAvailableTemplateTypes(availableTypes);

          // If only one template type is available, auto-select it
          if (availableTypes.length === 1) {
            const autoType = availableTypes[0] as InspectionType;
            setSelectedType(autoType);
            methods?.setValue('type', autoType);
          } else if (availableTypes.length === 0) {
            // No specific templates assigned, show all types as fallback
            setAvailableTemplateTypes([]);
            setSelectedType('routine');
            methods?.setValue('type', 'routine');
          } else {
            // Multiple templates available, set default to first available
            const firstAvailable = availableTypes[0];
            setSelectedType(firstAvailable);
            methods?.setValue('type', firstAvailable);
          }
          
        } catch (error) {
          console.error('Error loading available templates for vehicle:', error);
          // Fallback: no templates available
          setAvailableTemplateTypes([]);
          setSelectedType('routine');
          methods?.setValue('type', 'routine');
        }
      };

      loadAvailableTemplates();
    } else {
      // No vehicle selected, reset available types
      setAvailableTemplateTypes([]);
    }
  }, [selectedVehicle, methods]);

  // Calculate overall progress
  const getOverallProgress = () => {
    if (sections.length === 0) return 0;
    
    const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
    const completedItems = sections.reduce((sum, section) => {
      return sum + section.items.filter(item => item.status !== null).length;
    }, 0);
    
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  // Handle type change
  const handleTypeChange = (type: InspectionType) => {
    setSelectedType(type);
    setSections([]); // Clear sections when type changes
    setCompletedSections({});
    setCurrentSectionIndex(0);
  };

  // Handle section navigation
  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  // Handle notes change
  const handleNotesChange = (sectionId: string, itemId: string, notesValue: string) => {
    setSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id === itemId) {
                return {
                  ...item,
                  notes: notesValue
                };
              }
              return item;
            })
          };
        }
        return section;
      });
    });
  };

  // Handle camera operations
  const handleCameraClick = (sectionId: string, itemId: string) => {
    setCurrentPhotoItem({ sectionId, itemId });
    setIsCameraOpen(true);
  };

  const handleDeletePhoto = (sectionId: string, itemId: string, photoIndex: number) => {
    setSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id === itemId) {
                const newPhotos = [...item.photos];
                newPhotos.splice(photoIndex, 1);
                return {
                  ...item,
                  photos: newPhotos
                };
              }
              return item;
            })
          };
        }
        return section;
      });
    });
  };

  const handlePhotoCapture = async (photoUrl: string, currentPhotoItem: { sectionId: string; itemId: string } | null) => {
    if (!currentPhotoItem) return;
    
    setSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === currentPhotoItem.sectionId) {
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id === currentPhotoItem.itemId) {
                return {
                  ...item,
                  photos: [...item.photos, photoUrl]
                };
              }
              return item;
            })
          };
        }
        return section;
      });
    });
  };

  return {
    // Core state
    selectedVehicle,
    setSelectedVehicle,
    selectedType,
    setSelectedType,
    sections,
    setSections,
    inspectionDate,
    setInspectionDate,
    isBackdatingEnabled,
    setIsBackdatingEnabled,
    availableTemplateTypes,
    setAvailableTemplateTypes,
    
    // Step navigation
    currentSectionIndex,
    setCurrentSectionIndex,
    currentStepIndex,
    setCurrentStepIndex,
    completedSections,
    setCompletedSections,
    
    // Camera state
    isCameraOpen,
    setIsCameraOpen,
    currentPhotoItem,
    setCurrentPhotoItem,
    
    // Notes and timing
    notes,
    setNotes,
    estimatedTimeRemaining,
    setEstimatedTimeRemaining,
    startTime,
    setStartTime,
    
    // Refs
    autoTemplateToastShownRef,
    isAutoStartingRef,
    
    // Computed values
    getOverallProgress,
    
    // Handlers
    handleTypeChange,
    handlePreviousSection,
    handleNextSection,
    handleNotesChange,
    handleCameraClick,
    handleDeletePhoto,
    handlePhotoCapture,
  };
}
