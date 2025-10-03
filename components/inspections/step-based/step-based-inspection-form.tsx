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
import { Check, X, Camera, ArrowRight, ArrowLeft, Calendar } from "lucide-react"
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
import { useVehicleSelection } from "./hooks/use-vehicle-selection"
import { useInspectionTemplates } from "./hooks/use-inspection-templates"
import { useExistingInspectionData } from "./hooks/use-existing-inspection-data"
import { useInspectionSubmission } from "./hooks/use-inspection-submission"
import { VehicleSearchFilters } from "./vehicle-search-filters"
import { VehicleList } from "./vehicle-list"
import { FormField, FormItem, FormControl } from "@/components/ui/form"
import { withErrorHandling } from "@/lib/utils/error-handler"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { useIsMobile } from "@/lib/hooks/use-mobile"
import type { InspectionType } from "@/types/inspections"
import { fetchInspectionTemplatesAction } from "@/app/(dashboard)/inspections/actions"
import Image from "next/image"
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
  description_translations: TranslationObject
  title: string // Display title derived from translations
  description?: string // Display description derived from translations
  items: InspectionItemType[]
}

// Define the vehicle and group types
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

const inspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
  type: z.string().min(1).default("routine"),
  inspection_date: z.date().optional(),
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
  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedType, setSelectedType] = useState<InspectionType>('routine');
  const [sections, setSections] = useState<InspectionSection[]>([]);
  const [inspectionDate, setInspectionDate] = useState<Date | undefined>(new Date());
  const [isBackdatingEnabled, setIsBackdatingEnabled] = useState(false);
  const [isSearchFiltersExpanded, setIsSearchFiltersExpanded] = useState(false);
  
  // Step handling
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(vehicleId ? 0 : -1); // -1 for vehicle selection, 0+ for sections
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  
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
  
  // Camera handling
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentPhotoItem, setCurrentPhotoItem] = useState<{
    sectionId: string;
    itemId: string;
  } | null>(null);
  
  // Notes
  const [notes, setNotes] = useState<string>('');
  
  // Estimated time
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(10); // in minutes
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Prevent duplicate toast notifications when auto-selecting templates
  const autoTemplateToastShownRef = useRef(false);
  const isAutoStartingRef = useRef(false);

  // Use vehicle selection hook
  const {
    searchQuery,
    setSearchQuery,
    brandFilter,
    setBrandFilter,
    modelFilter,
    setModelFilter,
    groupFilter,
    setGroupFilter,
    currentPage,
    setCurrentPage,
    vehiclesPerPage,
    brandOptions,
    modelOptions,
    groupOptions,
    vehicleGroups,
    filteredVehicles,
    paginatedVehicles,
    resetFilters
  } = useVehicleSelection({
    vehicles,
    isSearchFiltersExpanded,
    setIsSearchFiltersExpanded
  });
  
  const methods = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      vehicle_id: vehicleId || '',
      type: 'routine',
      inspection_date: new Date(),
    },
  });

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

  // Load vehicle data when vehicleId changes
  useEffect(() => {
    if (vehicleId) {
      const supabaseClient = createClient()
      const fetchVehicle = async () => {
        const { data, error } = await supabaseClient
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single();
          
        if (error) {
          console.error("Error fetching vehicle:", error);
          // Optionally, reset to vehicle selection if vehicleId is invalid
          // setCurrentStepIndex(-1); 
          return;
        }
        
        setSelectedVehicle(data as Vehicle);
        methods.setValue('vehicle_id', vehicleId);
        // If vehicleId is provided, and we auto-selected, ensure we are at type selection or beyond
        // This check might be redundant if initial state is set correctly, but good for safety.
        if (currentStepIndex === -1) {
          setCurrentStepIndex(0);
        }
      };
      
      fetchVehicle();
    } else {
      // If no vehicleId, ensure we are at the vehicle selection step
      setCurrentStepIndex(-1);
      setSelectedVehicle(null); // Clear any previously selected vehicle if vehicleId is removed/nullified
    }
  }, [vehicleId, methods, currentStepIndex]); // Added currentStepIndex to dependencies
  
  // Use inspection templates hook
  const { availableTemplateTypes } = useInspectionTemplates({
    selectedVehicle,
    selectedType,
    setSelectedType,
    setSections,
    currentStepIndex,
    inspectionId,
    methods,
    autoTemplateToastShownRef,
    isAutoStartingRef
  });
  
  // Use inspection submission hook
  const { isSubmitting, handleFormSubmit } = useInspectionSubmission({
    selectedVehicle,
    sections,
    inspectionId,
    bookingId,
    inspectionDate,
    notes,
    isResuming
  });
  
  // Auto-start logic removed - let user control the flow by clicking Next
  
  // Handle changes to vehicle
  const handleVehicleSelect = (vehicle: Vehicle) => {
    console.log(`[INSPECTION_CREATE] Vehicle selected: ${vehicle.name} (${vehicle.id})`)
    setSelectedVehicle(vehicle)
    methods.setValue("vehicle_id", vehicle.id)
    // DO NOT move to type selection automatically, wait for user to click Next.
    // setCurrentStepIndex(0);
  }
  
  // Handle type change
  const handleTypeChange = (type: InspectionType) => {
    setSelectedType(type);
    // Reset section data when type changes
    setCompletedSections({});
    setCurrentSectionIndex(0);
  };
  
  // Move to the next section
  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };
  
  // Move to the previous section
  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };
  
  // Start inspection (after selecting vehicle and type)
  // Use inspection creation hook
  const { isSubmitting: isCreatingInspection, handleStartInspection: createInspection } = useInspectionCreation({
    selectedVehicle,
    selectedType: selectedType || null,
    inspectionId: inspectionId || null,
    sections: sections as any[],
    inspectionDate,
    isAutoStartingRef
  })

  const handleStartInspection = async () => {
    const result = await createInspection()
    if (result?.shouldMoveToNextStep) {
      setCurrentStepIndex(1)
    }
  }

  // Use inspection items hook
  const { 
    handleItemStatus, 
    handleNotesChange, 
    handleCameraClick, 
    handleDeletePhoto,
    handlePhotoCapture: capturePhoto
  } = useInspectionItems({
    sections: sections as any[],
    setSections: setSections as any,
    setCompletedSections,
    setCurrentPhotoItem,
    setIsCameraOpen
  })

  // Handle photo capture
  const handlePhotoCapture = async (photoUrl: string) => {
    await capturePhoto(photoUrl, currentPhotoItem)
    setIsCameraOpen(false)
    setCurrentPhotoItem(null)
  }
  
  
  // Calculate overall progress
  const getOverallProgress = () => {
    if (sections.length === 0) return 0;
    
    const totalItems = sections.reduce((total, section) => total + section.items.length, 0);
    const completedItems = sections.reduce((total, section) => {
      return total + section.items.filter(item => item.status !== null).length;
    }, 0);
    
    return Math.round((completedItems / totalItems) * 100);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('inspections.steps.selectVehicle')}</h2>
      
       {/* Search and filters */}
       <VehicleSearchFilters
         searchQuery={searchQuery}
         setSearchQuery={setSearchQuery}
         brandFilter={brandFilter}
         setBrandFilter={setBrandFilter}
         modelFilter={modelFilter}
         setModelFilter={setModelFilter}
         groupFilter={groupFilter}
         setGroupFilter={setGroupFilter}
         isSearchFiltersExpanded={isSearchFiltersExpanded}
         setIsSearchFiltersExpanded={setIsSearchFiltersExpanded}
         brandOptions={brandOptions}
         modelOptions={modelOptions}
         groupOptions={groupOptions}
         vehicleGroups={vehicleGroups}
         filteredVehicles={filteredVehicles}
         currentPage={currentPage}
         vehiclesPerPage={vehiclesPerPage}
         resetFilters={resetFilters}
       />
      
      {/* Vehicle list */}
      <VehicleList
        vehicles={paginatedVehicles}
        selectedVehicle={selectedVehicle}
        onVehicleSelect={handleVehicleSelect}
        filteredVehicles={filteredVehicles}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        vehiclesPerPage={vehiclesPerPage}
        resetFilters={resetFilters}
      />
      
      {/* Date Selection Section - Better positioned */}
      {selectedVehicle && (
        <div className="bg-muted/30 p-4 sm:p-6 rounded-lg space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-medium">{t("inspections.labels.inspectionDate")}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("inspections.labels.inspectionDateDescription")}</p>
            </div>
            <Button
              variant="outline"
              size={isMobile ? "default" : "sm"}
              className={cn(
                "w-full sm:w-auto min-h-[44px] sm:min-h-0",
                isMobile && "text-sm"
              )}
              onClick={() => setIsBackdatingEnabled(!isBackdatingEnabled)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span className="truncate">
                {isBackdatingEnabled ? t("inspections.actions.useCurrentDate") : t("inspections.actions.backdateInspection")}
              </span>
            </Button>
          </div>

          {isBackdatingEnabled && (
            <div className="space-y-4">
              <div className="w-full">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal min-h-[44px]",
                        isMobile && "text-sm"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {inspectionDate ? format(inspectionDate, "PPP") : t("inspections.labels.selectDate")}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className={cn(
                      "w-auto p-0",
                      isMobile && "w-[calc(100vw-2rem)] max-w-sm mx-auto"
                    )} 
                    align={isMobile ? "center" : "start"}
                    side={isMobile ? "bottom" : "bottom"}
                  >
                    <CalendarComponent
                      mode="single"
                      selected={inspectionDate}
                      onSelect={(date) => {
                        setInspectionDate(date);
                        methods.setValue('inspection_date', date);
                      }}
                      disabled={(date) => date > new Date() || date < new Date(1900, 0, 1)}
                      initialFocus
                      className={cn(
                        isMobile && "w-full [&_table]:w-full [&_td]:w-[14.28%] [&_td]:p-0 [&_td_button]:w-full [&_td_button]:h-10 [&_td_button]:rounded-none [&_td_button]:text-center [&_td_button]:text-sm"
                      )}
                      classNames={isMobile ? {
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_hidden: "invisible",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full justify-between",
                        head_cell: "text-muted-foreground text-center font-normal text-xs w-[14.28%] px-0",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative w-[14.28%] [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      } : undefined}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {inspectionDate && inspectionDate < new Date() && (
                <div className="flex items-start space-x-2 text-xs sm:text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
                  <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {t("inspections.labels.backdatingWarning", { 
                      date: format(inspectionDate, "PPP"),
                      daysAgo: Math.ceil((new Date().getTime() - inspectionDate.getTime()) / (1000 * 60 * 60 * 24))
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {!isBackdatingEnabled && (
            <div className="text-xs sm:text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              {t("inspections.labels.currentDateInspection", { date: format(new Date(), "PPP") })}
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-end mt-4 sm:mt-6">
      {selectedVehicle && (
          <Button 
            className={cn(
              "w-full sm:w-auto min-h-[44px] sm:min-h-0",
              isMobile && "text-sm"
            )}
            onClick={() => {
              console.log(`[INSPECTION_FLOW] Moving to type selection with vehicle: ${selectedVehicle.name}`);
              setCurrentStepIndex(0);
            }}
          >
            {t('common.next')} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
      )}
      </div>
    </div>
  );
  
  // Use existing inspection data hook
  const { existingInspection } = useExistingInspectionData({
    inspectionId,
    sections,
    setSections,
    setSelectedType,
    setCurrentStepIndex,
    methods
  });
  
  return (
      <div className="space-y-8">
        {/* Vehicle thumbnail when selected */}
      {selectedVehicle && currentStepIndex !== -1 && (
          <VehicleThumbnail
          selectedVehicle={selectedVehicle}
          sections={sections}
          currentSectionIndex={currentSectionIndex}
          currentStepIndex={currentStepIndex}
          isBackdatingEnabled={isBackdatingEnabled}
          inspectionDate={inspectionDate}
          progress={getOverallProgress()}
          estimatedTimeRemaining={estimatedTimeRemaining}
          />
        )}
        
        {/* Main content based on step */}
      {currentStepIndex === -1 && (
          <VehicleSelectionStep
            vehicles={vehicles}
          selectedVehicle={selectedVehicle}
          onVehicleSelect={setSelectedVehicle}
          onNext={() => setCurrentStepIndex(0)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          brandFilter={brandFilter}
          setBrandFilter={setBrandFilter}
          modelFilter={modelFilter}
          setModelFilter={setModelFilter}
          groupFilter={groupFilter}
          setGroupFilter={setGroupFilter}
          inspectionDate={inspectionDate}
          setInspectionDate={setInspectionDate}
          isBackdatingEnabled={isBackdatingEnabled}
          setIsBackdatingEnabled={setIsBackdatingEnabled}
          isSearchFiltersExpanded={isSearchFiltersExpanded}
          setIsSearchFiltersExpanded={setIsSearchFiltersExpanded}
          brandOptions={brandOptions}
          modelOptions={modelOptions}
          groupOptions={groupOptions}
          filteredVehicles={filteredVehicles}
        />
      )}
      {currentStepIndex === 0 && (
          <TypeSelectionStep
            control={methods.control}
          onTypeChange={handleTypeChange}
          selectedType={selectedType}
          availableTypes={availableTemplateTypes}
          onBack={() => setCurrentStepIndex(-1)}
            onStartInspection={handleStartInspection}
            isSubmitting={isSubmitting}
          />
        )}
      {currentStepIndex === 1 && (
          <SectionItemsStep
          sections={sections}
          currentSectionIndex={currentSectionIndex}
            onItemStatusChange={handleItemStatus}
            onCameraClick={handleCameraClick}
            onDeletePhoto={handleDeletePhoto}
            onNotesChange={handleNotesChange}
          onPreviousSection={handlePreviousSection}
          onNextSection={handleNextSection}
          onBackToTypeSelection={() => setCurrentStepIndex(0)}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        )}
        
        {/* Camera modal */}
      {isCameraOpen && (
          <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handlePhotoCapture}
          />
        )}
      </div>
  );
}
