"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { Check, X, Camera, ArrowRight, ArrowLeft, ChevronDown, Search, Filter, XCircle, Calendar, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { CameraModal } from "../camera-modal"
import { InspectionTypeSelector } from "../inspection-type-selector"
import { VehicleSelectionStep } from "./vehicle-selection-step"
import { TypeSelectionStep } from "./type-selection-step"
import { SectionItemsStep } from "./section-items-step"
import { VehicleThumbnail } from "./vehicle-thumbnail"
import { useInspectionCreation } from "./hooks/use-inspection-creation"
import { useInspectionItems } from "./hooks/use-inspection-items"
import { useVehicleFiltering } from "./hooks/use-vehicle-filtering"
import { useInspectionState } from "./hooks/use-inspection-state"
import { FormField, FormItem, FormControl } from "@/components/ui/form"
import { withErrorHandling } from "@/lib/utils/error-handler"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { useIsMobile } from "@/lib/hooks/use-mobile"
import type { InspectionType } from "@/types/inspections"
import { fetchInspectionTemplatesAction } from "@/app/(dashboard)/inspections/actions"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Database } from "@/types/supabase"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

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
  title: string // Display title derived from translations
  description?: string // Display description derived from translations
  items: InspectionItemType[]
}

interface VehicleGroup {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand?: string;
  model?: string;
  image_url?: string | null;
  year?: string;
  group_id?: string;
  group?: VehicleGroup;
}

const inspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
  type: z.string().min(1).default("routine"),
});

type InspectionFormData = z.infer<typeof inspectionSchema>;

interface StepBasedInspectionFormProps {
  inspectionId?: string;
  vehicleId?: string;
  bookingId?: string;
  vehicles: Vehicle[];
  isResuming?: boolean;
}

export function StepBasedInspectionForm({ inspectionId, vehicleId, bookingId, vehicles, isResuming = false }: StepBasedInspectionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isMobile = useIsMobile();
  
  // Use custom hooks for state management
  const vehicleFiltering = useVehicleFiltering({ vehicles });
  const inspectionState = useInspectionState({ vehicleId, inspectionId, isResuming });
  
  // Form setup
  const methods = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      vehicle_id: vehicleId || "",
      type: "routine",
    },
  });

  // Use existing hooks
  const { isSubmitting, handleStartInspection } = useInspectionCreation({
    selectedVehicle: inspectionState.selectedVehicle,
    selectedType: inspectionState.selectedType,
    inspectionId: inspectionId || null,
    sections: inspectionState.sections,
    inspectionDate: inspectionState.inspectionDate,
    isAutoStartingRef: inspectionState.isAutoStartingRef
  });

  const { handleItemStatus, handleNotesChange, handleCameraClick, handleDeletePhoto, handlePhotoCapture } = useInspectionItems({
    sections: inspectionState.sections,
    setSections: inspectionState.setSections,
    setCompletedSections: inspectionState.setCompletedSections,
    setCurrentPhotoItem: inspectionState.setCurrentPhotoItem,
    setIsCameraOpen: inspectionState.setIsCameraOpen
  });

  // Auto-select vehicle if vehicleId is provided
  useEffect(() => {
    if (vehicleId && vehicles.length > 0 && !inspectionState.selectedVehicle) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        inspectionState.setSelectedVehicle(vehicle);
        methods.setValue('vehicle_id', vehicleId);
      }
    }
  }, [vehicleId, vehicles, inspectionState.selectedVehicle, methods]);

  // Load inspection templates when vehicle is selected
  useEffect(() => {
    if (inspectionState.selectedVehicle && inspectionState.selectedType) {
      loadInspectionTemplates();
    }
  }, [inspectionState.selectedVehicle, inspectionState.selectedType]);

  // Load inspection templates
  const loadInspectionTemplates = async () => {
    if (!inspectionState.selectedVehicle || !inspectionState.selectedType) return;

    try {
      const templates = await fetchInspectionTemplatesAction(inspectionState.selectedVehicle.id, inspectionState.selectedType);
      
      if (templates && templates.length > 0) {
        // Format the sections with their items
        const sectionsWithItems: InspectionSection[] = templates.map((template: any) => {
          const sectionTitle = template.name_translations?.[locale] || template.name_translations?.en || template.name || 'Untitled Section';
          const sectionDescription = template.description_translations?.[locale] || template.description_translations?.en || template.description;

          return {
            id: template.id,
            name_translations: template.name_translations || {},
            title: sectionTitle,
            description: sectionDescription,
            items: template.items?.map((item: any) => {
              const itemTitle = item.name_translations?.[locale] || item.name_translations?.en || item.name || 'Untitled Item';
              const itemDescription = item.description_translations?.[locale] || item.description_translations?.en || item.description;

              return {
                id: item.id,
                name_translations: item.name_translations || {},
                description_translations: item.description_translations || {},
                title: itemTitle,
                description: itemDescription,
                requires_photo: item.requires_photo || false,
                requires_notes: item.requires_notes || false,
                status: null,
                notes: '',
                photos: []
              };
            }) || []
          };
        });

        inspectionState.setSections(sectionsWithItems);
        inspectionState.setCurrentSectionIndex(0);
      }
    } catch (error) {
      console.error('Error loading inspection templates:', error);
      toast({
        title: "Error",
        description: "Failed to load inspection templates",
        variant: "destructive",
      });
    }
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    if (!inspectionState.selectedVehicle) {
      toast({
        title: "Please select a vehicle",
        variant: "destructive",
      });
      return;
    }

    if (inspectionState.sections.length === 0) {
      toast({
        title: "No inspection template loaded",
        variant: "destructive",
      });
      return;
    }

    // Here you would implement the actual form submission logic
    console.log('Submitting inspection form...');
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-8">
        {/* Vehicle thumbnail when selected */}
        {inspectionState.selectedVehicle && inspectionState.currentStepIndex !== -1 && (
          <VehicleThumbnail
            selectedVehicle={inspectionState.selectedVehicle}
            sections={inspectionState.sections}
            currentSectionIndex={inspectionState.currentSectionIndex}
            currentStepIndex={inspectionState.currentStepIndex}
            isBackdatingEnabled={inspectionState.isBackdatingEnabled}
            inspectionDate={inspectionState.inspectionDate}
            progress={inspectionState.getOverallProgress()}
            estimatedTimeRemaining={inspectionState.estimatedTimeRemaining}
          />
        )}
        
        {/* Main content based on step */}
        {inspectionState.currentStepIndex === -1 && (
          <VehicleSelectionStep
            vehicles={vehicles}
            selectedVehicle={inspectionState.selectedVehicle}
            onVehicleSelect={inspectionState.setSelectedVehicle}
            onNext={() => inspectionState.setCurrentStepIndex(0)}
            searchQuery={vehicleFiltering.searchQuery}
            setSearchQuery={vehicleFiltering.setSearchQuery}
            brandFilter={vehicleFiltering.brandFilter}
            setBrandFilter={vehicleFiltering.setBrandFilter}
            modelFilter={vehicleFiltering.modelFilter}
            setModelFilter={vehicleFiltering.setModelFilter}
            groupFilter={vehicleFiltering.groupFilter}
            setGroupFilter={vehicleFiltering.setGroupFilter}
            inspectionDate={inspectionState.inspectionDate}
            setInspectionDate={inspectionState.setInspectionDate}
            isBackdatingEnabled={inspectionState.isBackdatingEnabled}
            setIsBackdatingEnabled={inspectionState.setIsBackdatingEnabled}
            isSearchFiltersExpanded={vehicleFiltering.isSearchFiltersExpanded}
            setIsSearchFiltersExpanded={vehicleFiltering.setIsSearchFiltersExpanded}
            brandOptions={vehicleFiltering.brandOptions}
            modelOptions={vehicleFiltering.modelOptions}
            groupOptions={vehicleFiltering.groupOptions}
            filteredVehicles={vehicleFiltering.paginatedVehicles}
          />
        )}
        {inspectionState.currentStepIndex === 0 && (
          <TypeSelectionStep
            control={methods.control}
            onTypeChange={inspectionState.handleTypeChange}
            selectedType={inspectionState.selectedType}
            availableTypes={inspectionState.availableTemplateTypes}
            onBack={() => inspectionState.setCurrentStepIndex(-1)}
            onStartInspection={handleStartInspection}
            isSubmitting={isSubmitting}
          />
        )}
        {inspectionState.currentStepIndex === 1 && (
          <SectionItemsStep
            sections={inspectionState.sections}
            currentSectionIndex={inspectionState.currentSectionIndex}
            onItemStatusChange={handleItemStatus}
            onCameraClick={handleCameraClick}
            onDeletePhoto={handleDeletePhoto}
            onNotesChange={handleNotesChange}
            onPreviousSection={inspectionState.handlePreviousSection}
            onNextSection={inspectionState.handleNextSection}
            onBackToTypeSelection={() => inspectionState.setCurrentStepIndex(0)}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        )}
        
        {/* Camera modal */}
        {inspectionState.isCameraOpen && (
          <CameraModal
            isOpen={inspectionState.isCameraOpen}
            onClose={() => inspectionState.setIsCameraOpen(false)}
            onCapture={(photoUrl) => handlePhotoCapture(photoUrl, inspectionState.currentPhotoItem)}
          />
        )}
      </div>
    </FormProvider>
  );
}
