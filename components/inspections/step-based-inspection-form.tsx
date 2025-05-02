"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
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
import { getInspectionTemplates } from "@/lib/services/inspections"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

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

// Define the vehicle type
interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand?: string;
  model?: string;
  image_url?: string;
  year?: string;
}

const inspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
  type: z.enum(["routine", "safety", "maintenance"]).default("routine"),
});

type InspectionFormData = z.infer<typeof inspectionSchema>;

interface StepBasedInspectionFormProps {
  inspectionId: string;
  vehicleId: string;
  bookingId?: string;
  vehicles: Vehicle[];
}

export function StepBasedInspectionForm({ inspectionId, vehicleId, bookingId, vehicles }: StepBasedInspectionFormProps) {
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
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 for vehicle selection, 0+ for sections
  const [completedSections, setCompletedSections] = useState<Record<string, boolean>>({});
  
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
  const [currentPage, setCurrentPage] = useState(1);
  const vehiclesPerPage = 10;
  
  // Extract unique brands and models from vehicles for filters
  const brands = useMemo(() => {
    const uniqueBrands = new Set<string>();
    vehicles.forEach(vehicle => {
      if (vehicle.brand) uniqueBrands.add(vehicle.brand);
    });
    return Array.from(uniqueBrands).sort();
  }, [vehicles]);
  
  // Get unique models based on selected brand
  const models = useMemo(() => {
    const uniqueModels = new Set<string>();
    vehicles.forEach(vehicle => {
      if ((brandFilter === "all" || vehicle.brand === brandFilter) && vehicle.model) {
        uniqueModels.add(vehicle.model);
      }
    });
    return Array.from(uniqueModels).sort();
  }, [vehicles, brandFilter]);
  
  // Filter and paginate vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Apply search filter
      const matchesSearch = searchQuery.trim() === "" || 
        vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vehicle.brand && vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Apply brand filter
      const matchesBrand = brandFilter === "all" || vehicle.brand === brandFilter;
      
      // Apply model filter
      const matchesModel = modelFilter === "all" || vehicle.model === modelFilter;
      
      return matchesSearch && matchesBrand && matchesModel;
    });
  }, [vehicles, searchQuery, brandFilter, modelFilter]);
  
  // Get paginated vehicles
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * vehiclesPerPage;
    const endIndex = startIndex + vehiclesPerPage;
    return filteredVehicles.slice(startIndex, endIndex);
  }, [filteredVehicles, currentPage, vehiclesPerPage]);
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setBrandFilter("all");
    setModelFilter("all");
    setCurrentPage(1);
  };
  
  // Update current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, brandFilter, modelFilter]);
  
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
      const fetchVehicle = async () => {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single();
          
        if (error) {
          console.error("Error fetching vehicle:", error);
          return;
        }
        
        setSelectedVehicle(data as Vehicle);
        methods.setValue('vehicle_id', vehicleId);
      };
      
      fetchVehicle();
    }
  }, [vehicleId, methods]);
  
  // Load inspection template when type changes
  useEffect(() => {
    if (selectedType) {
      const loadInspectionTemplate = async () => {
        try {
          // Use the inspection service instead of direct queries
          const categories = await getInspectionTemplates(selectedType);
          
          // Format the sections with their items
          const sectionsWithItems: InspectionSection[] = categories.map(category => {
            return {
              id: category.id,
              name_translations: category.name_translations,
              description_translations: category.description_translations,
              title: category.name_translations[locale] || 'Unknown Section',
              description: category.description_translations[locale] || '',
              items: category.inspection_item_templates.map(item => ({
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
    }
  }, [selectedType, locale, toast]);
  
  // Handle changes to vehicle
  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    methods.setValue('vehicle_id', vehicle.id);
    // Move to type selection
    setCurrentStepIndex(0);
  };
  
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
  const handleStartInspection = () => {
    if (!selectedVehicle) {
      toast({
        title: "Please select a vehicle",
        variant: "destructive"
      });
      return;
    }
    
    // Set current step to first section
    setCurrentStepIndex(1);
  };
  
  // Handle item status change
  const handleItemStatus = (sectionId: string, itemId: string, status: 'pass' | 'fail') => {
    setSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id === itemId) {
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
  const handleNotesChange = (sectionId: string, itemId: string, notes: string) => {
    setSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id === itemId) {
                return {
                  ...item,
                  notes: notes
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
    setCurrentPhotoItem({ sectionId, itemId });
    setIsCameraOpen(true);
  };
  
  // Handle photo capture
  const handlePhotoCapture = async (photoUrl: string) => {
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
    
    setIsCameraOpen(false);
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

    try {
      setIsSubmitting(true);

      // Validate that we have a vehicle and at least some completed items
      if (!selectedVehicle) {
        toast({
          title: "Please select a vehicle",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Check if any sections have been completed
      const hasCompletedItems = sections.some(section => 
        section.items.some(item => item.status === 'pass' || item.status === 'fail')
      );

      if (!hasCompletedItems) {
        toast({
          title: "Please complete at least one inspection item",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Create the inspection record first
      const { data: newInspection, error: inspectionError } = await supabase
        .from('inspections')
        .insert({
          vehicle_id: selectedVehicle.id,
          booking_id: bookingId || null,
          type: selectedType,
          status: 'completed',
          date: new Date().toISOString(),
          notes: notes,
          created_by: user?.id,
          inspector_id: user?.id,
        })
        .select()
        .single();

      if (inspectionError) {
        console.error('Error creating inspection:', inspectionError);
        toast({
          title: "Error creating inspection",
          description: inspectionError.message,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Filter items to save
      const itemsToSave = sections.flatMap(section => 
        section.items.map(item => ({
          template_id: item.id,
          status: item.status,
          notes: item.notes,
          photos: item.photos
        }))
      ).filter(item => item.status !== null);
      
      // Upload photos to storage and get URLs
      for (const item of itemsToSave) {
        const uploadedPhotoUrls = [];
        
        for (const photoUrl of item.photos) {
          if (photoUrl.startsWith('blob:')) {
            try {
              const response = await fetch(photoUrl);
              const blob = await response.blob();
              const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
              
              // Upload to Supabase storage
              const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
              const filePath = `${user.id}/${fileName}`;
              
              const { data, error } = await supabase.storage
                .from('inspection-photos')
                .upload(filePath, file);
                
              if (error) throw error;
              
              // Get public URL
              const { data: urlData } = supabase.storage
                .from('inspection-photos')
                .getPublicUrl(filePath);
                
              uploadedPhotoUrls.push(urlData.publicUrl);
            } catch (error) {
              console.error('Error uploading photo:', error);
            }
          } else {
            // Already uploaded photo
            uploadedPhotoUrls.push(photoUrl);
          }
        }
        
        // Replace the blob URLs with the uploaded photo URLs
        item.photos = uploadedPhotoUrls;
      }
      
      // Insert inspection items
      const { data: newItems, error: insertItemsError } = await supabase
        .from('inspection_items')
        .insert(
          itemsToSave.map(item => ({
            inspection_id: newInspection.id,
            template_id: item.template_id,
            status: item.status,
            notes: item.notes
          }))
        )
        .select();
        
      if (insertItemsError) throw insertItemsError;
      
      // Insert photos for items that have them
      const photosToInsert = [];
      for (let i = 0; i < itemsToSave.length; i++) {
        const item = itemsToSave[i];
        const newItem = newItems[i];
        
        if (item.photos && item.photos.length > 0) {
          for (const photoUrl of item.photos) {
            photosToInsert.push({
              inspection_item_id: newItem.id,
              photo_url: photoUrl
            });
          }
        }
      }
      
      if (photosToInsert.length > 0) {
        const { error: insertPhotosError } = await supabase
          .from('inspection_photos')
          .insert(photosToInsert);
          
        if (insertPhotosError) throw insertPhotosError;
      }
      
      toast({
        title: "Inspection created successfully",
      });
      
      router.push(`/inspections/${newInspection.id}`);
    } catch (error: any) {
      console.error("Error submitting inspection:", error);
      toast({
        title: "Failed to submit inspection",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
              placeholder={t('drivers.filters.searchPlaceholder')}
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
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
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
          
          {/* Clear filters button - only show if any filter is applied */}
          {(searchQuery || brandFilter !== "all" || modelFilter !== "all") && (
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
          {t('drivers.pagination.showing', {
            start: String(Math.min((currentPage - 1) * vehiclesPerPage + 1, filteredVehicles.length)),
            end: String(Math.min(currentPage * vehiclesPerPage, filteredVehicles.length)),
            total: String(filteredVehicles.length)
          })}
        </div>
      </div>
      
      {/* Vehicle list */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <Filter className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
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
        <ScrollArea className="max-h-[60vh]">
          <div className="grid grid-cols-1 gap-4">
            {paginatedVehicles.map(vehicle => (
              <Card 
                key={vehicle.id} 
                className={`cursor-pointer transition-colors ${selectedVehicle?.id === vehicle.id ? 'border-primary border-2' : ''}`}
                onClick={() => handleVehicleSelect(vehicle)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Vehicle thumbnail with 16:9 aspect ratio */}
                    <div className="sm:w-48 w-full">
                      <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden">
                        {vehicle.image_url ? (
                          <Image 
                            src={vehicle.image_url} 
                            alt={vehicle.name}
                            fill
                            sizes="(max-width: 768px) 100%, 192px"
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
      
      {/* Pagination controls */}
      {filteredVehicles.length > vehiclesPerPage && (
        <div className="flex justify-between items-center">
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
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back')}
        </Button>
        
        {selectedVehicle && (
          <Button onClick={() => setCurrentStepIndex(0)}>
            {t('common.next')} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
  
  // Render inspection type selection
  const renderTypeSelection = () => (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">{t('inspections.steps.selectType')}</h2>
      
      <FormProvider {...methods}>
        <InspectionTypeSelector 
          control={methods.control}
          onTypeChange={handleTypeChange}
          defaultValue={selectedType}
        />
      </FormProvider>
      
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={() => setCurrentStepIndex(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back')}
        </Button>
        <Button onClick={handleStartInspection}>
          {t('inspections.actions.startInspection')} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
  
  // Render section items with improved spacing
  const renderSectionItems = () => {
    if (!sections.length || currentSectionIndex >= sections.length) return null;
    
    const currentSection = sections[currentSectionIndex];
    
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
          {currentSection.items.map(item => (
            <Card key={item.id} className="border">
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
                    onClick={() => handleItemStatus(currentSection.id, item.id, 'pass')}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {t('inspections.actions.pass')}
                  </Button>
                  <Button 
                    variant={item.status === 'fail' ? 'default' : 'outline'} 
                    size="sm"
                    className={item.status === 'fail' ? 'bg-red-600 hover:bg-red-700' : ''}
                    onClick={() => handleItemStatus(currentSection.id, item.id, 'fail')}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t('inspections.actions.fail')}
                  </Button>
                  {item.requires_photo && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCameraClick(currentSection.id, item.id)}
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
                      <div key={index} className="w-20 h-20 relative rounded overflow-hidden">
                        <Image 
                          src={photo} 
                          alt={t('inspections.labels.photoNumber', { number: String(index + 1) })}
                          fill
                          className="object-cover" 
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Notes input */}
                {(item.requires_notes || item.status === 'fail') && (
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
              onClick={handleSubmit} 
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
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Vehicle thumbnail with 16:9 aspect ratio */}
            {selectedVehicle.image_url ? (
              <div className="w-full sm:w-48">
                <div className="relative aspect-[16/9] w-full rounded-md overflow-hidden">
                  <Image 
                    src={selectedVehicle.image_url} 
                    alt={selectedVehicle.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            ) : (
              <div className="w-full sm:w-48 bg-muted flex items-center justify-center rounded-md" style={{ aspectRatio: '16/9' }}>
                <span className="text-muted-foreground">{t('common.noImage')}</span>
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="text-xl font-bold">
                {selectedVehicle.brand} {selectedVehicle.model}
              </h3>
              <p className="text-muted-foreground">
                {selectedVehicle.year} {t('inspections.labels.model')}
              </p>
              
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
                      className={`h-2.5 rounded-full flex-1 ${
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
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-8">
      {/* Vehicle thumbnail when selected */}
      {selectedVehicle && renderVehicleThumbnail()}
      
      {/* Main content based on step */}
      {currentStepIndex === -1 && !selectedVehicle && renderVehicleSelection()}
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