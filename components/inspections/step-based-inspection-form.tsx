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
import { Check, X, Camera, ArrowRight, ArrowLeft, ChevronDown, Search, Filter, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { CameraModal } from "@/components/inspections/camera-modal"
import { InspectionTypeSelector } from "./inspection-type-selector"
import { FormField, FormItem, FormControl } from "@/components/ui/form"
import { withErrorHandling } from "@/lib/utils/error-handler"
import { useI18n } from "@/lib/i18n/context"
import type { InspectionType } from "@/types/inspections"
import { fetchInspectionTemplatesAction } from "@/app/(dashboard)/inspections/actions"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Database } from "@/types/supabase"

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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedType, setSelectedType] = useState<InspectionType>('routine');
  const [sections, setSections] = useState<InspectionSection[]>([]);
  
  // Step handling
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(vehicleId ? 0 : -1); // -1 for vehicle selection, 0+ for sections
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  const [availableTemplateTypes, setAvailableTemplateTypes] = useState<InspectionType[]>([]); // NEW: Track available types for selected vehicle
  
  // Debug component mount
  useEffect(() => {
    console.log(`[INSPECTION_FORM] Component mounted. Vehicle ID: ${vehicleId}, Inspection ID: ${inspectionId}`);
    return () => {
      console.log(`[INSPECTION_FORM] Component unmounting`);
    };
  }, []);
  
  // Debug sections changes
  useEffect(() => {
    console.log(`[INSPECTION_FORM] Sections changed:`, sections);
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
  
  // Vehicle selection filtering and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const vehiclesPerPage = 10;
  
  // Prevent duplicate toast notifications when auto-selecting templates
  const [autoTemplateToastShown, setAutoTemplateToastShown] = useState(false);
  
  // Helpers for brand normalization (avoid duplicates like 'Toyota' vs 'toyota')
  const normalizeBrand = (b?: string | null) => (b || '').trim().toLowerCase();

  // Extract unique brands from vehicles and produce canonical options
  const brandOptions = useMemo(() => {
    const groups = new Map<string, string>();
    vehicles.forEach(v => {
      if (!v.brand) return;
      const key = normalizeBrand(v.brand);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, v.brand.trim());
    });
    return Array.from(groups.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [vehicles]);
  
  // Get unique models based on selected brand
  const models = useMemo(() => {
    const uniqueModels = new Set<string>();
    const key = brandFilter === 'all' ? null : brandFilter;
    vehicles.forEach(vehicle => {
      if (vehicle.model) {
        if (!key || normalizeBrand(vehicle.brand) === key) {
          uniqueModels.add(vehicle.model);
        }
      }
    });
    return Array.from(uniqueModels).sort();
  }, [vehicles, brandFilter]);

  // Get unique vehicle groups
  const vehicleGroups = useMemo(() => {
    const uniqueGroups = new Set<VehicleGroup>();
    vehicles.forEach(vehicle => {
      if (vehicle.vehicle_group) {
        uniqueGroups.add(vehicle.vehicle_group);
      }
    });
    return Array.from(uniqueGroups).sort((a, b) => a.name.localeCompare(b.name));
  }, [vehicles]);
  
  // Filter Vehicle selection
  const filteredVehicles = useMemo(() => {
    // If no filters and no search query, return all vehicles
    if (brandFilter === 'all' && modelFilter === 'all' && groupFilter === 'all' && !searchQuery) {
      return vehicles;
    }
    
    return vehicles.filter((vehicle) => {
      const matchesBrand = brandFilter === 'all' || normalizeBrand(vehicle.brand) === brandFilter;
      const matchesModel = modelFilter === 'all' || vehicle.model === modelFilter;
      const matchesGroup = groupFilter === 'all' || vehicle.vehicle_group?.id === groupFilter;
      
      // Search query match against name, model, brand, plate number, or group name
      const matchesSearch = !searchQuery || (
        (vehicle.name && vehicle.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vehicle.brand && vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vehicle.plate_number && vehicle.plate_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vehicle.vehicle_group?.name && vehicle.vehicle_group.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      return matchesBrand && matchesModel && matchesGroup && matchesSearch;
    });
  }, [vehicles, brandFilter, modelFilter, groupFilter, searchQuery]);
  
  // Pagination for vehicle selection
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * vehiclesPerPage;
    return filteredVehicles.slice(startIndex, startIndex + vehiclesPerPage);
  }, [filteredVehicles, currentPage, vehiclesPerPage]);
  
  // Reset filters function
  const resetFilters = () => {
    setSearchQuery('');
    setBrandFilter('all');
    setModelFilter('all');
    setGroupFilter('all');
    setCurrentPage(1);
  };
  
  // Update current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, brandFilter, modelFilter, groupFilter]);
  
  const methods = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      vehicle_id: vehicleId || '',
      type: 'routine',
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
  
  // Load the template only when we are in the section-rendering step (index >= 1).
  useEffect(() => {
    if (currentStepIndex < 1 || !selectedType) return;

    const loadInspectionTemplate = async () => {
      try {
        console.log(`[INSPECTION_TEMPLATE] Loading template for type: ${selectedType}`);
        
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
        
        console.log(`[INSPECTION_TEMPLATE] Loaded ${categories.length} categories for template: ${selectedType}`);
        
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
        console.log(`[INSPECTION_TEMPLATE] Processed ${sectionsWithItems.length} sections with items:`, sectionsWithItems);
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
  
  // NEW: Load available templates based on vehicle assignments
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

          // Combine and deduplicate template types
          const allAssignments = [...(vehicleAssignments || []), ...groupAssignments];
          const availableTypes = [...new Set(allAssignments.map(a => a.template_type))] as InspectionType[];

          console.log(`[VEHICLE_TEMPLATE_ASSIGNMENT] Vehicle: ${selectedVehicle.name}, Available types:`, availableTypes);
          console.log(`[VEHICLE_TEMPLATE_ASSIGNMENT] Raw assignments data:`, { vehicleAssignments, groupAssignments });

          // Set the available template types state
          setAvailableTemplateTypes(availableTypes);

          // If only one template type is available, auto-select it and skip type selection
          if (availableTypes.length === 1) {
            const alreadyNotified = autoTemplateToastShown;
            const autoType = availableTypes[0] as InspectionType;

            console.log(`[VEHICLE_TEMPLATE_ASSIGNMENT] Auto-selecting template type: ${autoType}`);
            setSelectedType(autoType);
            methods.setValue('type', autoType);
            
            // Trigger immediate template loading
            fetchInspectionTemplatesAction(autoType)
              .then(categories => {
                if (categories && categories.length > 0) {
                  console.log(`[VEHICLE_TEMPLATE_ASSIGNMENT] Successfully pre-loaded template: ${autoType} with ${categories.length} categories`);
                } else {
                  console.error(`[VEHICLE_TEMPLATE_ASSIGNMENT] Failed to pre-load template: ${autoType} - no categories returned`);
                }
              })
              .catch(err => {
                console.error(`[VEHICLE_TEMPLATE_ASSIGNMENT] Error pre-loading template: ${autoType}`, err);
              });

            // Skip type selection step and go directly to inspection
            if (currentStepIndex === 0 && inspectionId) {
              setCurrentStepIndex(1);
            }
            
            if (!alreadyNotified) {
              toast({
                title: "Template Auto-Selected",
                description: `Using ${autoType} inspection template for this vehicle`
              });
              setAutoTemplateToastShown(true);
            }
          } else if (availableTypes.length === 0) {
            // No specific templates assigned, show all types as fallback
            console.log(`[VEHICLE_TEMPLATE_ASSIGNMENT] No templates assigned to vehicle ${selectedVehicle.name}, no templates available`);
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
  }, [selectedVehicle, methods, currentStepIndex, toast]);
  
  // Automatically start the inspection when exactly ONE template is available
  // for the selected vehicle. This matches the expected UX: select vehicle →
  // Next → form loads immediately without asking for the type.
  useEffect(() => {
    if (
      currentStepIndex === 0 && // On the type-selection step
      !inspectionId &&          // Creating a new inspection
      selectedVehicle &&
      availableTemplateTypes.length === 1 &&
      !isSubmitting
    ) {
      // Start automatically – no further input required
      handleStartInspection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, selectedVehicle, availableTemplateTypes, isSubmitting]);
  
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
  const handleStartInspection = async () => {
    if (!selectedVehicle) {
      toast({
        title: "Please select a vehicle",
        variant: "destructive",
      })
      return
    }
    
    // Ensure we have a template type selected
    if (!selectedType) {
      toast({
        title: "Please select an inspection type",
        variant: "destructive",
      })
      return
    }
    
    // When creating a brand-new inspection we can proceed immediately and let
    // the perform page load the template. Only enforce the sections-loaded
    // check when we are editing / resuming an existing inspection.
    if (inspectionId && sections.length === 0) {
      toast({
        title: "Template not loaded",
        description: "Please wait for the template to load or try selecting a different template",
        variant: "destructive",
      })
      return
    }

    // Always create a new inspection if we don't have an inspectionId
    if (!inspectionId) {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create an inspection",
          variant: "destructive",
        })
        return
      }

      console.log(
        `[INSPECTION_CREATE] User ${user.id} is creating a new inspection. Vehicle: ${selectedVehicle.name}, Type: ${selectedType}`
      )
      setIsSubmitting(true)
      try {
        const supabaseClient = createClient()
        const { data: newInspection, error } = await supabaseClient
          .from("inspections")
          .insert({
            vehicle_id: selectedVehicle.id,
            type: selectedType,
            status: "in_progress",
            created_by: user.id,
            inspector_id: user.id,
            date: new Date().toISOString(),
          })
          .select("id")
          .single()

        if (error) {
          console.error("[INSPECTION_CREATE] Error creating new inspection:", error)
          throw error
        }

        console.log(
          `[INSPECTION_CREATE] New inspection created (ID: ${newInspection.id}). Redirecting to perform page.`
        )
        toast({ title: "Inspection Created", description: "Starting..." })
        router.push(`/inspections/${newInspection.id}/perform`)
        return
      } catch (error: any) {
        toast({
          title: "Failed to Start Inspection",
          description: error.message || "Could not create the inspection. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
      return
    }
    
    // If we have an inspectionId, we're editing an existing inspection
    console.log("[INSPECTION_PERFORM] Starting/continuing inspection. Moving to first section.")
    setCurrentStepIndex(1)
  }
  
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
  
  // Handle photo capture
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
  
  // Handle photo deletion
  const handleDeletePhoto = (sectionId: string, itemId: string, photoIndex: number) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      photos: item.photos.filter((_, index) => index !== photoIndex),
                    }
                  : item
              ),
            }
          : section
      )
    );
  };
  
  // Calculate overall progress
  const getOverallProgress = () => {
    if (sections.length === 0) return 0;
    
    const totalItems = sections.reduce((total, section) => total + section.items.length, 0);
    const completedItems = sections.reduce((total, section) => {
      return total + section.items.filter(item => item.status !== null).length;
    }, 0);
    
    return Math.round((completedItems / totalItems) * 100);
  };
  
  // Submit the inspection
  const handleSubmit = async () => {
    if (isSubmitting) return;

    const supabaseClient = createClient();

    setIsSubmitting(true);

    // Validate that we have a vehicle and at least some completed items
    if (!selectedVehicle) {
      toast({ title: t("inspections.errors.selectVehicle"), variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const hasCompletedItems = sections.some(section => 
      section.items.some(item => item.status === 'pass' || item.status === 'fail')
    );

    if (!hasCompletedItems) {
      toast({ title: t("inspections.errors.completeOneItem"), variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    if (!user) {
      toast({ title: t("inspections.errors.authError"), description: t("inspections.errors.mustBeLoggedIn"), variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Ensure user folder exists in storage
      try {
        await supabaseClient.storage.from('inspection-photos').upload(`${user.id}/.folder_placeholder`, new File([], '.folder_placeholder'));
      } catch (storageError:any) {
        if (!storageError.message.includes('duplicate')) {
          console.error('Storage access error:', storageError);
          toast({ title: t("inspections.errors.storageAccessError"), description: t("inspections.errors.unableToAccessStorage"), variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
      }

      let finalInspectionId: string;
      let isEditMode = !!inspectionId;

      if (isEditMode) {
        // Editing an existing inspection
        // Determine the status based on the items
        let newStatus = 'completed';
        const allItemsHaveStatus = sections.every(section => 
          section.items.every(item => item.status === 'pass' || item.status === 'fail')
        );
        
        const anyItemFailed = sections.some(section => 
          section.items.some(item => item.status === 'fail')
        );
        
        if (!allItemsHaveStatus) {
          newStatus = 'in_progress';
        } else if (anyItemFailed) {
          newStatus = 'failed';
        }
        
        // When resuming a completed inspection, make sure we update the status
        if (isResuming) {
          // Force status update even for completed inspections when resuming
          const { data: updatedInspection, error: updateError } = await supabaseClient
            .from('inspections')
            .update({
              status: newStatus,
              notes: notes, // Overall inspection notes
              // Don't update date or inspector when resuming
            })
            .eq('id', inspectionId!)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating inspection:', updateError);
            toast({ title: t("inspections.errors.updatingInspectionError"), description: updateError.message, variant: "destructive" });
            setIsSubmitting(false);
            return;
          }
          finalInspectionId = updatedInspection.id;
        } else {
          // Regular edit mode (not resuming)
          console.log("[INSPECTION_FORM] Updating inspection without changing date");
          const { data: updatedInspection, error: updateError } = await supabaseClient
            .from('inspections')
            .update({
              status: newStatus,
              // Do not update date when completing an inspection
              notes: notes, // Overall inspection notes
              // vehicle_id and type are generally not changed during an item edit session
              // inspector_id: user.id, // Could be updated if another user modifies
            })
            .eq('id', inspectionId!)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating inspection:', updateError);
            toast({ title: t("inspections.errors.updatingInspectionError"), description: updateError.message, variant: "destructive" });
            setIsSubmitting(false);
            return;
          }
          finalInspectionId = updatedInspection.id;
        }

        // Clean up old items and photos for this inspection
        const { data: oldItems, error: fetchOldItemsError } = await supabaseClient
          .from('inspection_items')
          .select('id')
          .eq('inspection_id', finalInspectionId);

        if (fetchOldItemsError) {
          console.error("Error fetching old item IDs for cleanup:", fetchOldItemsError);
          // Non-fatal, but means old items/photos might not be cleaned up
        }

        if (oldItems && oldItems.length > 0) {
          const oldItemIds = oldItems.map(it => it.id);

          // Fetch photo_urls associated with old items to delete from storage
          const { data: oldPhotos, error: fetchOldPhotosError } = await supabaseClient
            .from('inspection_photos')
            .select('photo_url')
            .in('inspection_item_id', oldItemIds);

          if (fetchOldPhotosError) {
            console.error("Error fetching old photo URLs for storage deletion:", fetchOldPhotosError);
          }

          if (oldPhotos && oldPhotos.length > 0) {
            const photoFilesToDelete = oldPhotos.map(p => {
              try {
                const url = new URL(p.photo_url);
                const pathParts = url.pathname.split('/');
                // Path: /storage/v1/object/public/inspection-photos/USER_ID/FILENAME.jpg
                // Bucket name "inspection-photos" is at index 5. Path starts at 6.
                return pathParts.slice(6).join('/');
              } catch (e) {
                console.error("Error parsing photo URL for deletion:", p.photo_url, e);
                return null;
              }
            }).filter(path => path !== null) as string[];

            if (photoFilesToDelete.length > 0) {
              const { error: storageDeleteError } = await supabaseClient
                .storage
                .from('inspection-photos')
                .remove(photoFilesToDelete);
              if (storageDeleteError) {
                console.error("Error deleting old photos from storage:", storageDeleteError);
                // Non-fatal, log and continue.
              }
            }
          }
          // Delete old inspection_photos records (database entries)
          const { error: deleteDbPhotosError } = await supabaseClient
            .from('inspection_photos')
            .delete()
            .in('inspection_item_id', oldItemIds);
           if (deleteDbPhotosError) {
            console.error("Error deleting old photo DB entries:", deleteDbPhotosError);
          }
          
          // Delete old inspection_items records
          const { error: deleteItemsError } = await supabaseClient
            .from('inspection_items')
            .delete()
            .eq('inspection_id', finalInspectionId);
          if (deleteItemsError) {
            console.error('Error deleting old inspection items:', deleteItemsError);
            toast({ title: t("inspections.errors.genericSubmitError"), description: "Could not clean up old inspection items.", variant: "destructive" });
            // Potentially non-fatal, but new items might conflict or be duplicated if not handled.
            // Depending on DB constraints, this could be an issue.
          }
        }
      } else {
        // Creating a new inspection
        const { data: newInspectionData, error: inspectionError } = await supabaseClient
          .from('inspections')
          .insert({
            vehicle_id: selectedVehicle.id,
            booking_id: bookingId || null,
            type: selectedType,
            status: 'completed',
            date: new Date().toISOString(),
            notes: notes,
            created_by: user.id,
            inspector_id: user.id,
          })
          .select()
          .single();

        if (inspectionError) {
          console.error('Error creating inspection:', inspectionError);
          toast({ title: t("inspections.errors.creatingInspectionError"), description: inspectionError.message, variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        finalInspectionId = newInspectionData.id;
      }

      const itemsToSave = sections.flatMap(section => 
        section.items
          .filter(item => item.status !== null)
          .map(item => ({
            template_id: item.id, // This is inspection_item_template_id
            status: item.status!,
            notes: item.notes,
            photos: [...item.photos] // Operate on a copy
          }))
      );
      
      if (itemsToSave.length === 0 && !isEditMode) { // For new inspections, must have items. For edits, it could clear all.
        toast({ title: t("inspections.errors.noCompletedItems"), description: t("inspections.errors.completeOneItemBeforeSubmit"), variant: "destructive" });
        if (!isEditMode && finalInspectionId) { // Only delete if it was a new inspection
            await supabaseClient.from('inspections').delete().eq('id', finalInspectionId);
        }
        setIsSubmitting(false);
        return;
      }
      
      // Upload photos and update URLs in itemsToSave
      for (const item of itemsToSave) {
        const uploadedPhotoUrls: string[] = [];
        for (const photoUrl of item.photos) {
          if (photoUrl.startsWith('blob:')) {
            const response = await fetch(photoUrl);
            const blob = await response.blob();
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
            const { error: uploadError } = await supabaseClient.storage.from('inspection-photos').upload(fileName, file);
            if (uploadError) {
              console.error('Photo upload error:', uploadError);
              toast({ title: t("inspections.errors.photoUploadFailed"), description: uploadError.message, variant: "destructive" });
              // This is a critical error during submission process
              setIsSubmitting(false);
              throw new Error(`Photo upload failed: ${uploadError.message}`);
            }
            const { data: urlData } = supabaseClient.storage.from('inspection-photos').getPublicUrl(fileName);
            uploadedPhotoUrls.push(urlData.publicUrl);
          } else {
            uploadedPhotoUrls.push(photoUrl); // Keep existing URLs (e.g. if editing and photo wasn't changed)
          }
        }
        item.photos = uploadedPhotoUrls;
      }
      
      const inspectionItemsPayload = itemsToSave.map(item => ({
        inspection_id: finalInspectionId,
        template_id: item.template_id, // Correctly mapping template_id
        status: item.status,
        notes: item.notes ?? null,
        created_by: user.id // or updated_by if schema supports for edits
      }));

      let newSavedItems: any[] = [];
      if (inspectionItemsPayload.length > 0) {
        const { data: insertedItems, error: insertItemsError } = await supabaseClient
          .from('inspection_items')
          .insert(inspectionItemsPayload)
          .select();

        if (insertItemsError) {
          console.error('[DEBUG] Error inserting inspection items:', JSON.stringify(insertItemsError, null, 2));
          if (!isEditMode) { // Clean up inspection header if it was a new one
            await supabaseClient.from('inspections').delete().eq('id', finalInspectionId);
          }
          toast({ title: t("inspections.errors.failedToSaveItems"), description: t("inspections.errors.permissionOrInvalidData"), variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        newSavedItems = insertedItems;
      }
      
      const photosToInsert: Database['public']['Tables']['inspection_photos']['Insert'][] = [];
      for (let i = 0; i < itemsToSave.length; i++) {
        const processedItem = itemsToSave[i]; // item from itemsToSave, with updated photo URLs
        const savedDbItem = newSavedItems.find(dbItem => dbItem.template_id === processedItem.template_id && dbItem.inspection_id === finalInspectionId); // find corresponding DB item

        if (savedDbItem && processedItem.photos && processedItem.photos.length > 0) {
          for (const photoUrl of processedItem.photos) {
            photosToInsert.push({
              inspection_item_id: savedDbItem.id, // Use the ID of the newly inserted inspection_item
              photo_url: photoUrl,
              created_by: user.id
            });
          }
        }
      }
      
      if (photosToInsert.length > 0) {
        const { error: insertPhotosError } = await supabaseClient.from('inspection_photos').insert(photosToInsert);
        if (insertPhotosError) {
          console.error('Error inserting inspection photos:', JSON.stringify(insertPhotosError, null, 2));
          // Clean up: delete items then inspection (if new)
          if (newSavedItems.length > 0) {
            await supabaseClient.from('inspection_items').delete().in('id', newSavedItems.map(item => item.id));
          }
          if (!isEditMode) {
            await supabaseClient.from('inspections').delete().eq('id', finalInspectionId);
          }
          toast({ title: t("inspections.errors.failedToSavePhotos"), description: t("inspections.errors.permissionOrInvalidDataPhotos"), variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
      }
      
      if (bookingId) {
        const { error: bookingUpdateError } = await supabaseClient.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
        if (bookingUpdateError) {
          console.error('Error updating booking status:', bookingUpdateError);
          toast({ title: t("inspections.warnings.title"), description: t("inspections.warnings.failedToUpdateBooking"), variant: "default" });
        }
      }

      toast({ title: t("inspections.messages.submitSuccessTitle"), description: t("inspections.messages.submitSuccessDescription") });
      
      if (isEditMode) {
        router.push('/inspections'); // Navigate to list page after edit
      } else {
        router.push(bookingId ? `/bookings/${bookingId}` : `/inspections/${finalInspectionId}`);
      }
    } catch (error: any) {
        // This catch block is for unhandled errors from async operations like photo uploads if they throw
        console.error('Unhandled error during submission:', error);
        toast({ title: t("inspections.errors.genericSubmitError"), description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleFormSubmit = () => {
    withErrorHandling(handleSubmit, t("inspections.errors.genericSubmitError"));
  };
  
  // Render vehicle selection step
  const renderVehicleSelection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{t('inspections.steps.selectVehicle')}</h2>
      
      {/* Search and filters */}
      <div className="bg-muted/30 p-4 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search input */}
          <div className="flex-1 relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('vehicles.filters.searchPlaceholder')}
              className="pl-9 w-full"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0" 
                onClick={() => setSearchQuery("")}
              >
                <XCircle className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          
          {/* Brand filter */}
          <div className="w-full sm:w-48">
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('drivers.filters.brand')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('drivers.filters.allBrands')}</SelectItem>
                {brandOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Model filter - only show if brand is selected */}
          {brandFilter !== "all" && (
            <div className="w-full sm:w-48">
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('drivers.filters.model')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('drivers.filters.allModels')}</SelectItem>
                  {models.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Vehicle Group filter */}
          <div className="w-full sm:w-48">
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('vehicleGroups.filter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('vehicleGroups.allGroups')}</SelectItem>
                {vehicleGroups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear filters button - only show if any filter is applied */}
          {(searchQuery || brandFilter !== "all" || modelFilter !== "all" || groupFilter !== "all") && (
            <Button 
              variant="outline" 
              size="sm" 
              className="sm:self-end" 
              onClick={resetFilters}
            >
              {t('drivers.filters.clearFilters')}
            </Button>
          )}
        </div>
        
        {/* Showing results info */}
        <div className="text-sm text-muted-foreground">
          {t('inspections.labels.showingVehicles', {
            start: String(Math.min((currentPage - 1) * vehiclesPerPage + 1, filteredVehicles.length)),
            end: String(Math.min(currentPage * vehiclesPerPage, filteredVehicles.length)),
            total: String(filteredVehicles.length)
          })}
        </div>
      </div>
      
      {/* Vehicle list */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-8 border rounded-lg mt-4">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">
            {t('drivers.filters.noResults')}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
            {t('vehicles.noVehicles')}
          </p>
          <Button variant="outline" onClick={resetFilters}>
            {t('drivers.filters.clearFilters')}
          </Button>
        </div>
      ) : (
        <div className="relative">
          <ScrollArea className="h-[60vh] pr-4 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 pb-2">
              {paginatedVehicles.map((vehicle) => (
                <Card 
                  key={vehicle.id} 
                  className={`cursor-pointer transition-colors ${selectedVehicle?.id === vehicle.id ? 'border-primary border-2' : ''}`}
                  onClick={() => handleVehicleSelect(vehicle)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-row gap-4 items-center">
                      {/* Vehicle thumbnail with 16:9 aspect ratio */}
                      <div className="w-24 sm:w-48 shrink-0 flex items-center">
                        <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden">
                          {vehicle.image_url ? (
                            <Image 
                              src={vehicle.image_url} 
                              alt={vehicle.name}
                              fill
                              sizes="(max-width: 768px) 96px, 192px"
                              className="object-cover"
                              priority={currentPage === 1}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <span className="text-muted-foreground">{t('common.noImage')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Vehicle details */}
                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="font-medium text-lg">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">{vehicle.plate_number}</p>
                        {vehicle.brand && vehicle.model && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {vehicle.year && <span>{vehicle.year} </span>}
                            <span>{vehicle.brand} </span>
                            <span>{vehicle.model}</span>
                          </p>
                        )}
                        {vehicle.vehicle_group && (
                          <div className="flex items-center gap-2 mt-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: vehicle.vehicle_group.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {vehicle.vehicle_group.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Pagination controls */}
      {filteredVehicles.length > vehiclesPerPage && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            {t('drivers.pagination.page', { page: String(currentPage) })} {t('drivers.pagination.of', { total: String(Math.ceil(filteredVehicles.length / vehiclesPerPage)) })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredVehicles.length / vehiclesPerPage)))}
              disabled={currentPage >= Math.ceil(filteredVehicles.length / vehiclesPerPage)}
            >
              <ArrowRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      )}
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => router.push('/inspections')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('inspections.title')}
        </Button>
      
      {selectedVehicle && (
          <Button 
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
  
  // Render inspection type selection
  const renderTypeSelection = () => (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">{t("inspections.steps.selectType")}</h2>

      <FormProvider {...methods}>
        <InspectionTypeSelector
          control={methods.control}
          onTypeChange={handleTypeChange}
          defaultValue={selectedType}
          availableTypes={availableTemplateTypes}
          showAllTypes={false}
        />
      </FormProvider>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => {
            setCurrentStepIndex(-1)
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
        </Button>
        {availableTemplateTypes.length > 0 && (
          <Button onClick={handleStartInspection} disabled={isSubmitting}>
            {isSubmitting ? t("common.creating") : t("inspections.actions.startInspection")}{" "}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
  
  // Render section items with improved spacing
  const renderSectionItems = () => {
    console.log(`[INSPECTION_FORM] Rendering section items. Sections:`, sections);
    console.log(`[INSPECTION_FORM] Current section index:`, currentSectionIndex);
    
    if (!sections.length || currentSectionIndex >= sections.length) {
      console.log(`[INSPECTION_FORM] No sections or invalid index. Sections length: ${sections.length}, Current index: ${currentSectionIndex}`);
      return null;
    }
    
    const currentSection = sections[currentSectionIndex];
    console.log(`[INSPECTION_FORM] Current section:`, currentSection);
    
    return (
      <div className="space-y-8">
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{currentSection.title}</h2>
            <span className="bg-muted px-3 py-1 rounded-full text-sm font-medium">{currentSectionIndex + 1}/{sections.length}</span>
          </div>
          {currentSection.description && (
            <p className="text-muted-foreground">{currentSection.description}</p>
          )}
        </div>
        
        {/* Inspection items */}
        <div className="space-y-6">
          {currentSection.items.map((item, itemIndex) => (
            <Card key={`${currentSection.id}-${item.id}-${itemIndex}`} className="border">
              <CardContent className="p-6 space-y-5">
                <div className="bg-muted/20 p-3 rounded-md">
                  <h3 className="font-medium text-lg">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                  )}
                </div>
                
                <div className="flex gap-4 flex-wrap">
                  <Button 
                    variant={item.status === 'pass' ? 'default' : 'outline'} 
                    size="sm"
                    className={item.status === 'pass' ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={() => {
                      console.log(`[INSPECTION_FORM] Pass button clicked for item:`, item);
                      console.log(`[INSPECTION_FORM] Current section:`, currentSection);
                      handleItemStatus(currentSection.id, item.id, 'pass');
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {t('inspections.actions.pass')}
                  </Button>
                  <Button 
                    variant={item.status === 'fail' ? 'default' : 'outline'} 
                    size="sm"
                    className={item.status === 'fail' ? 'bg-red-600 hover:bg-red-700' : ''}
                    onClick={() => {
                      console.log(`[INSPECTION_FORM] Fail button clicked for item:`, item);
                      console.log(`[INSPECTION_FORM] Current section:`, currentSection);
                      handleItemStatus(currentSection.id, item.id, 'fail');
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t('inspections.actions.fail')}
                  </Button>
                  {item.requires_photo && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        console.log(`[INSPECTION_FORM] Camera button clicked for item:`, item);
                        handleCameraClick(currentSection.id, item.id);
                      }}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {item.photos.length > 0 
                        ? t('inspections.actions.photos', { count: String(item.photos.length) }) 
                        : t('inspections.actions.takePhoto')}
                    </Button>
                  )}
                </div>
                
                {/* Display photos if any */}
                {item.photos.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {item.photos.map((photo, index) => (
                      <div key={index} className="w-20 h-20 relative rounded overflow-hidden group">
                        <Image 
                          src={photo} 
                          alt={t('inspections.labels.photoNumber', { number: String(index + 1) })}
                          fill
                          className="object-cover" 
                        />
                        <button
                          onClick={() => handleDeletePhoto(currentSection.id, item.id, index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Delete photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Notes input */}
                {item.status === 'fail' && (
                  <Textarea
                    placeholder={t('inspections.fields.notesPlaceholder')}
                    value={item.notes}
                    onChange={(e) => handleNotesChange(currentSection.id, item.id, e.target.value)}
                    className="min-h-[100px] mt-4"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={currentSectionIndex === 0 ? () => setCurrentStepIndex(0) : handlePreviousSection}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> 
            {currentSectionIndex === 0 ? t('common.back') : `${t('inspections.actions.previousSection')} (${currentSectionIndex}/${sections.length})`}
          </Button>
          
          {currentSectionIndex < sections.length - 1 ? (
            <Button onClick={handleNextSection}>
              {`${t('inspections.actions.nextSection')} (${currentSectionIndex + 2}/${sections.length})`} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleFormSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? t('common.submitting') : t('inspections.actions.completeInspection')}
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  // Vehicle thumbnail and progress
  const renderVehicleThumbnail = () => {
    if (!selectedVehicle) return null;
    
    const progress = getOverallProgress();
    const currentSection = sections[currentSectionIndex] || { title: '' };
    
    return (
      <Card className="my-6">
        <CardContent className="p-4">
          <div className="flex flex-row gap-4 items-center">
            {/* Vehicle thumbnail - smaller size */}
            <div className="shrink-0">
              {selectedVehicle.image_url ? (
                <div className="relative rounded-md overflow-hidden h-24 w-32">
                  <Image 
                    src={selectedVehicle.image_url} 
                    alt={selectedVehicle.name}
                    fill
                    sizes="128px"
                    className="object-cover"
                    priority={currentStepIndex === -1 || currentStepIndex === 0} // Add priority if it's one of the first steps
                  />
                </div>
              ) : (
                <div className="w-32 h-24 bg-muted flex items-center justify-center rounded-md">
                  <span className="text-muted-foreground">{t('common.noImage')}</span>
                </div>
              )}
            </div>
            
            {/* Vehicle info */}
            <div className="flex-1">
              <h3 className="text-xl font-bold">
                {selectedVehicle.brand} {selectedVehicle.model}
              </h3>
              <p className="text-muted-foreground">
                {selectedVehicle.year} {t('inspections.labels.model')}
              </p>
              <p className="text-muted-foreground mt-1">
                {selectedVehicle.plate_number}
              </p>
            </div>
          </div>
              
          {currentStepIndex !== 0 && (
            <div className="mt-3 space-y-2">
              {/* Section info with progress */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {t('inspections.labels.currentSection')}: {currentSection.title}
                </p>
                <p className="text-sm font-medium">
                  {progress}% - {currentSectionIndex + 1}/{sections.length}
                </p>
              </div>
              
              {/* Section indicators */}
              <div className="flex gap-1 h-2.5">
                {sections.map((section, index) => (
                  <div 
                    key={section.id} 
                    className={`h-2.5 rounded-full flex-1 ${ // Fixed template literal
                      index < currentSectionIndex 
                        ? 'bg-gradient-to-r from-green-500 to-green-600' 
                        : index === currentSectionIndex 
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              
              {/* Estimated time */}
              <p className="text-xs text-right text-muted-foreground">
                {t('inspections.labels.estimatedTime')}: {estimatedTimeRemaining} {t('common.minutes')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  const [existingInspection, setExistingInspection] = useState<any>(null);
  const hasLoadedExistingData = useRef(false);

  // NEW: Load inspection header to get type and existing items when editing/continuing
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

  // NEW: After sections are loaded, merge existing item statuses/notes/photos
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
  }, [inspectionId, sections]);
  
  return (
    <div className="space-y-8">
      {/* Vehicle thumbnail when selected */}
      {selectedVehicle && currentStepIndex !== -1 && renderVehicleThumbnail()}
      
      {/* Main content based on step */}
      {currentStepIndex === -1 && renderVehicleSelection()}
      {currentStepIndex === 0 && renderTypeSelection()}
      {currentStepIndex === 1 && renderSectionItems()}
      
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
