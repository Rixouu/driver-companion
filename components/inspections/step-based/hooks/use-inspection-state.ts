"use client";

import { useState, useEffect, useRef } from "react";
import type { InspectionType } from "@/types/inspections";

interface VehicleGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  vehicle_count?: number;
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
  vehicle_group?: VehicleGroup;
}

type TranslationObject = { [key: string]: string };

interface InspectionItemType {
  id: string;
  name_translations: TranslationObject;
  description_translations: TranslationObject;
  title: string;
  description?: string;
  requires_photo: boolean;
  requires_notes: boolean;
  status: 'pass' | 'fail' | null;
  notes: string;
  photos: string[];
}

interface InspectionSection {
  id: string;
  name_translations: TranslationObject;
  description_translations: TranslationObject;
  title: string;
  description?: string;
  items: InspectionItemType[];
}

interface UseInspectionStateProps {
  vehicleId?: string;
  inspectionId?: string;
  isResuming?: boolean;
}

export function useInspectionState({ vehicleId, inspectionId, isResuming = false }: UseInspectionStateProps) {
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
    console.log(`[INSPECTION_FORM] Component mounted. Vehicle ID: ${vehicleId}, Inspection ID: ${inspectionId}`);
    return () => {
      console.log(`[INSPECTION_FORM] Component unmounting`);
      // Reset flags on unmount
      autoTemplateToastShownRef.current = false;
      isAutoStartingRef.current = false;
    };
  }, [vehicleId, inspectionId]);

  // Debug sections changes
  useEffect(() => {
    console.log(`[INSPECTION_FORM] Sections changed:`, sections);
  }, [sections]);
  
  // Calculate and update the time remaining
  useEffect(() => {
    if (startTime && sections.length > 0) {
      const timePerSection = 10; // base time in minutes
      const completedSectionCount = Object.values(completedSections).filter(Boolean).length;
      const remainingSections = sections.length - completedSectionCount;
      const elapsed = (Date.now() - startTime.getTime()) / (1000 * 60); // minutes
      
      const estimatedRemaining = Math.max(1, Math.round(remainingSections * timePerSection - elapsed));
      setEstimatedTimeRemaining(estimatedRemaining);
    }
  }, [completedSections, sections, startTime]);
  
  // Initialize start time when vehicle is selected
  useEffect(() => {
    if (selectedVehicle && !startTime) {
      setStartTime(new Date());
    }
  }, [selectedVehicle, startTime]);

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

  // Handle item status change
  const handleItemStatus = (sectionId: string, itemId: string, status: "pass" | "fail") => {
    console.log(`[INSPECTION_FORM] Setting item status: sectionId=${sectionId}, itemId=${itemId}, status=${status}`);
    
    setSections(prevSections => {
      console.log(`[INSPECTION_FORM] Previous sections before status update:`, prevSections);
      
      let itemFound = false;
      const newSections = prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id === itemId) {
                itemFound = true;
                console.log(`[INSPECTION_FORM] Item found, updating status from ${item.status} to ${status}`);
                return {
                  ...item,
                  status: status
                };
              }
              return item;
            })
          };
        }
        return section;
      });
      
      if (!itemFound) {
        console.error(`[INSPECTION_FORM] Item not found! sectionId=${sectionId}, itemId=${itemId}`);
        console.log(`[INSPECTION_FORM] Available sections:`, prevSections.map(s => ({ id: s.id, items: s.items.map(i => ({ id: i.id, title: i.title })) })));
      }
      
      console.log(`[INSPECTION_FORM] Updated sections:`, newSections);
      return newSections;
    });
    
    // Check if section is complete
    checkSectionCompletion(sectionId);
  };
  
  // Check if a section is complete (all items have status)
  const checkSectionCompletion = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const isComplete = section.items.every(item => item.status !== null);
    
    setCompletedSections(prev => ({
      ...prev,
      [sectionId]: isComplete
    }));
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

  const handlePhotoCapture = async (photoUrl: string) => {
    console.log(`[INSPECTION_FORM] Photo captured: ${photoUrl}`);
    console.log(`[INSPECTION_FORM] Current photo item:`, currentPhotoItem);
    
    if (!currentPhotoItem) {
      console.error(`[INSPECTION_FORM] No current photo item set!`);
      return;
    }

    setSections(prevSections => {
      console.log(`[INSPECTION_FORM] Previous sections before photo capture:`, prevSections);
      
      let itemFound = false;
      const newSections = prevSections.map(section => {
        if (section.id === currentPhotoItem.sectionId) {
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id === currentPhotoItem.itemId) {
                itemFound = true;
                console.log(`[INSPECTION_FORM] Adding photo to item, current photos:`, item.photos);
                const newPhotos = [...item.photos, photoUrl];
                console.log(`[INSPECTION_FORM] New photos array:`, newPhotos);
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
      
      if (!itemFound) {
        console.error(`[INSPECTION_FORM] Photo item not found! sectionId=${currentPhotoItem.sectionId}, itemId=${currentPhotoItem.itemId}`);
        console.log(`[INSPECTION_FORM] Available sections:`, prevSections.map(s => ({ id: s.id, items: s.items.map(i => ({ id: i.id, title: i.title })) })));
      }
      
      console.log(`[INSPECTION_FORM] Updated sections after photo capture:`, newSections);
      return newSections;
    });
    
    setIsCameraOpen(false);
    setCurrentPhotoItem(null);
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
    handleItemStatus,
    handleNotesChange,
    handleCameraClick,
    handleDeletePhoto,
    handlePhotoCapture,
    checkSectionCompletion,
  };
}
