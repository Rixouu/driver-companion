"use client"

import { useState } from "react"

interface InspectionItem {
  id: string
  title: string
  description?: string
  requires_photo: boolean
  requires_notes: boolean
  status: 'pass' | 'fail' | null
  notes: string
  photos: string[]
}

interface InspectionSection {
  id: string
  title: string
  description?: string
  items: InspectionItem[]
}

interface UseInspectionItemsProps {
  sections: InspectionSection[]
  setSections: (sections: InspectionSection[] | ((prev: InspectionSection[]) => InspectionSection[])) => void
  setCompletedSections: (sections: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void
  setCurrentPhotoItem: (item: { sectionId: string; itemId: string } | null) => void
  setIsCameraOpen: (open: boolean) => void
}

export function useInspectionItems({
  sections,
  setSections,
  setCompletedSections,
  setCurrentPhotoItem,
  setIsCameraOpen
}: UseInspectionItemsProps) {
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
  
  // Handle camera click
  const handleCameraClick = (sectionId: string, itemId: string) => {
    console.log(`[INSPECTION_FORM] Camera click: sectionId=${sectionId}, itemId=${itemId}`);
    setCurrentPhotoItem({ sectionId, itemId });
    setIsCameraOpen(true);
  };

  // Handle photo deletion
  const handleDeletePhoto = (sectionId: string, itemId: string, photoIndex: number) => {
    console.log(`[INSPECTION_FORM] Deleting photo: sectionId=${sectionId}, itemId=${itemId}, photoIndex=${photoIndex}`);
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

  // Handle photo capture
  const handlePhotoCapture = async (photoUrl: string, currentPhotoItem: { sectionId: string; itemId: string } | null) => {
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
  };

  return {
    handleItemStatus,
    handleNotesChange,
    handleCameraClick,
    handleDeletePhoto,
    handlePhotoCapture
  }
}
