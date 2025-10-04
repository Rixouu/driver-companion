"use client";

import { useState, useEffect, useRef } from "react";
import type { InspectionType } from "@/types/inspections";

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand?: string;
  model?: string;
  image_url?: string | null;
  year?: string;
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
