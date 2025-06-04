"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CameraModal } from "@/components/inspections/camera-modal"
import { useRouter } from "next/navigation"
import { toast } from '@/components/ui/use-toast'
import { Check, X, Camera, Calendar, ChevronDown, ChevronUp, Loader2, ImagePlus, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils/styles"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { useAuth } from "@/lib/hooks/use-auth"
import { DbVehicle } from "@/types"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { VehicleSelector } from "@/components/vehicle-selector"
import { Progress } from "@/components/ui/progress"
import { useI18n } from "@/lib/i18n/context"
import type { InspectionType } from "@/types/inspections"
import { Badge } from "@/components/ui/badge"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { InspectionTypeSelector } from "./inspection-type-selector"
import { withErrorHandling, handleError } from "@/lib/utils/error-handler"
import { ErrorBoundary, ErrorMessage } from "@/components/ui/error-boundary"
import { useRealtimeRecord } from "@/lib/hooks/use-realtime"
import { useAsync } from "@/lib/hooks/use-async"
import { idFilter } from "@/lib/services/realtime"
import { Skeleton } from "@/components/ui/skeleton"
import { isAfter, isBefore, isEqual } from 'date-fns'

type TranslationObject = { [key: string]: string }

interface InspectionItemType {
  id: string
  template_id?: string
  name_translations: TranslationObject
  description_translations: TranslationObject
  title: string
  description?: string
  requires_photo: boolean
  requires_notes: boolean
  status: 'pass' | 'fail' | null | 'pending'
  notes: string
  photos: string[]
}

interface InspectionSection {
  id: string
  name_translations: TranslationObject
  description_translations: TranslationObject
  title: string
  description?: string
  items: InspectionItemType[]
}

const inspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
  type: z.enum(["routine", "safety", "maintenance"]).default("routine"),
  is_scheduled: z.boolean().default(false),
  scheduled_date: z.string().optional(),
  frequency: z.enum([
    "daily", 
    "weekly", 
    "biweekly", 
    "monthly", 
    "quarterly", 
    "biannually", 
    "annually", 
    "custom"
  ]).optional(),
  interval_days: z.string().optional(),
  end_date: z.string().optional(),
})
.refine(
  (data) => {
    if (data.is_scheduled) {
      return !!data.scheduled_date && !!data.frequency;
    }
    return true;
  },
  {
    message: "Scheduled date and frequency are required for scheduled inspections",
    path: ["scheduled_date"],
  }
)
.refine(
  (data) => {
    if (data.frequency === "custom" && data.is_scheduled) {
      return !!data.interval_days && /^[1-9][0-9]*$/.test(data.interval_days);
    }
    return true;
  },
  {
    message: "A positive interval in days is required for custom frequency",
    path: ["interval_days"],
  }
);

type InspectionFormData = z.infer<typeof inspectionSchema>

interface InspectionFormProps {
  inspectionId?: string | null
  type?: InspectionType
  vehicleId?: string | null
  bookingId?: string
}

interface Vehicle {
  id: string;
  name: string;
  plate_number?: string;
  brand?: string;
  model?: string;
  image_url?: string;
}

function InspectionRealtimeUpdater({ inspectionId, supabaseClient, onDataChange }: {
  inspectionId: string;
  supabaseClient: SupabaseClient<any, "public", any>;
  onDataChange: (newData: any) => void;
}) {
  const config = useMemo(() => ({
    table: "inspections" as const,
    filter: idFilter(inspectionId),
  }), [inspectionId]);

  useRealtimeRecord<any>({
    config,
    initialFetch: false,
    onDataChange,
    supabaseClient,
  });

  return null;
}

export function InspectionForm({ inspectionId, type = 'routine', vehicleId, bookingId }: InspectionFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { t, locale } = useI18n()

  console.log("[InspectionForm] User object from useAuth():", user);
  console.log("[InspectionForm] Initial props - inspectionId:", inspectionId, "type:", type, "vehicleId:", vehicleId);

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedType, setSelectedType] = useState<InspectionType>(type)
  const [sections, setSections] = useState<InspectionSection[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [currentPhotoItem, setCurrentPhotoItem] = useState<{
    sectionId: string;
    itemId: string;
  } | null>(null)
  const [formNotes, setFormNotes] = useState<string>('')
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);

  const supabase = useMemo(() => {
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    console.log("[InspectionForm] Supabase client initialized:", client);
    return client;
  }, []);

  const methods = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      vehicle_id: vehicleId || '',
      type: type || 'routine',
      is_scheduled: false,
    },
  })
  
  const { setValue, watch, control } = methods;

  const formVehicleId = watch('vehicle_id');

  const fetchVehicleCallback = useCallback(async (id: string) => {
    if (!id) return null;
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, name, plate_number, brand, model, image_url')
      .eq('id', id)
      .single();
    if (error) {
      handleError(error);
      return null;
    }
    return data as Vehicle;
  }, [supabase]);

  const { execute: triggerFetchVehicle, data: fetchedVehicleData, isLoading: isLoadingVehicle } = useAsync<Vehicle | null, [string]>(
    fetchVehicleCallback
  );

  useEffect(() => {
    if (formVehicleId) {
      triggerFetchVehicle(formVehicleId);
    } else {
      setSelectedVehicle(null);
    }
  }, [formVehicleId, triggerFetchVehicle]);

  useEffect(() => {
    if (fetchedVehicleData) {
      setSelectedVehicle(fetchedVehicleData);
    }
  }, [fetchedVehicleData]);

  const loadInspectionTemplate = useCallback(async (currentLocale: string, currentType: InspectionType, currentInspectionId?: string | null) => {
    setIsLoadingTemplate(true);
    console.log("[loadInspectionTemplate] Called. Locale:", currentLocale, "Type:", currentType, "InspectionId:", currentInspectionId);

    await withErrorHandling(async () => {
      console.log("[loadInspectionTemplate] Inside withErrorHandling. User:", user);
      let existingNotes = '';
      let existingItemsData: any[] = [];
      let allPhotosForThisInspection: any[] = [];

      if (currentInspectionId) {
        // Fetch inspection notes
        console.log("[loadInspectionTemplate] Attempting to fetch existing inspection notes for ID:", currentInspectionId);
        const { data: inspectionNotesData, error: inspectionNotesError } = await supabase
          .from('inspections')
          .select('notes')
          .eq('id', currentInspectionId)
          .single();

        console.log("[loadInspectionTemplate] Fetched existing inspection notes. Error:", inspectionNotesError, "Data:", inspectionNotesData);
        if (inspectionNotesError) {
          console.error("[loadInspectionTemplate] CRITICAL: Error fetching existing inspection notes:", inspectionNotesError);
          throw inspectionNotesError;
        }
        if (inspectionNotesData) {
          existingNotes = inspectionNotesData.notes || '';
        }

        // Fetch inspection items
        console.log("[loadInspectionTemplate] Attempting to fetch existing inspection items for ID:", currentInspectionId);
        const { data: inspectionItemsDataVal, error: inspectionItemsError } = await supabase
          .from('inspection_items')
          .select('id, template_id, status, notes') // template_id links to inspection_item_templates
          .eq('inspection_id', currentInspectionId);
        
        console.log("[loadInspectionTemplate] Fetched existing inspection items. Error:", inspectionItemsError, "Data:", inspectionItemsDataVal);
        if (inspectionItemsError) {
          console.error("[loadInspectionTemplate] CRITICAL: Error fetching existing inspection items:", inspectionItemsError);
          throw inspectionItemsError;
        }
        if (inspectionItemsDataVal) {
          existingItemsData = inspectionItemsDataVal;
        }

        // Fetch inspection photos
        console.log("[loadInspectionTemplate] Attempting to fetch inspection photos for ID:", currentInspectionId);
        // Ensure 'inspection_item_template_id' is the FK on 'inspection_photos' table
        // referencing 'inspection_item_templates.id'.
        // If photos are linked to `inspection_items.id` (the actual instance of an item in an inspection),
        // then the FK on inspection_photos should be `inspection_item_id` and you should select that here.
        const { data: photosData, error: photosError } = await supabase
          .from('inspection_photos')
          .select('id, photo_url, inspection_item_template_id') 
          .eq('inspection_id', currentInspectionId);

        console.log("[loadInspectionTemplate] Fetched inspection photos. Error:", photosError, "Data:", photosData);
        if (photosError) {
          console.error("[loadInspectionTemplate] WARNING: Error fetching inspection photos:", photosError, "Query was for inspection_id:", currentInspectionId);
          // Not throwing, so form can load without photos if this part fails
        } else if (photosData) {
          allPhotosForThisInspection = photosData;
        }
      }
      setFormNotes(existingNotes);

      console.log("[loadInspectionTemplate] Attempting to fetch categories for type:", currentType);
      const { data: categories, error: categoriesError } = await supabase
        .from('inspection_categories')
        .select(`
          id,
          name_translations,
          description_translations,
          order_number,
          inspection_item_templates (
            id,
            name_translations,
            description_translations,
            requires_photo,
            requires_notes,
            order_number
          )
        `)
        .eq('type', currentType)
        .order('order_number', { ascending: true, nullsFirst: true }) 
        .order('order_number', { 
          referencedTable: 'inspection_item_templates', 
          ascending: true, 
          nullsFirst: true 
        });
      
      console.log("[loadInspectionTemplate] Fetched categories. Error:", categoriesError, "Data:", categories);
      if (categoriesError) {
        console.error("[loadInspectionTemplate] CRITICAL: Error fetching categories:", categoriesError);
        throw categoriesError;
      }

      if (categories) {
        const formattedSections = categories.map(category => {
          const items = (category.inspection_item_templates || []).map((itemTemplate: any) => {
            const existingItem = existingItemsData.find(ei => ei.template_id === itemTemplate.id);
            
            // Map photos to this item template
            // This assumes `p.inspection_item_template_id` on the `inspection_photos` table
            // correctly refers to `itemTemplate.id` (which is `inspection_item_templates.id`).
            const itemPhotos = allPhotosForThisInspection
              .filter(p => p.inspection_item_template_id === itemTemplate.id)
              .map(p => p.photo_url);

            return {
              id: itemTemplate.id, // This is the inspection_item_template_id
              template_id: itemTemplate.id,
              name_translations: itemTemplate.name_translations,
              description_translations: itemTemplate.description_translations,
              title: itemTemplate.name_translations?.[currentLocale] || itemTemplate.name_translations?.['en'] || 'Unnamed Item',
              description: itemTemplate.description_translations?.[currentLocale] || itemTemplate.description_translations?.['en'] || '',
              requires_photo: itemTemplate.requires_photo,
              requires_notes: itemTemplate.requires_notes,
              status: existingItem?.status || 'pending',
              notes: existingItem?.notes || '',
              photos: itemPhotos, // Use the mapped photos
            };
          });
          return {
            id: category.id,
            name_translations: category.name_translations,
            description_translations: category.description_translations,
            title: category.name_translations?.[currentLocale] || category.name_translations?.['en'] || 'Unnamed Section',
            description: category.description_translations?.[currentLocale] || category.description_translations?.['en'] || '',
            items: items,
          };
        });
        setSections(formattedSections);
        console.log("[loadInspectionTemplate] Successfully formatted sections:", formattedSections);
        if (formattedSections.length > 0) {
          setActiveSection(formattedSections[0].id);
        }
      } else {
        console.warn("[loadInspectionTemplate] Categories data is null or undefined after fetch.");
        setSections([]); // Ensure sections are empty if no categories
      }
    }, t('inspections.messages.errorLoadingTemplate'));
    setIsLoadingTemplate(false);
    console.log("[loadInspectionTemplate] Finished.");
  }, [supabase, t, user]);

  useEffect(() => {
    loadInspectionTemplate(locale, selectedType, inspectionId);
  }, [inspectionId, selectedType, locale, loadInspectionTemplate]);

  const inspectionRealtimeConfig = useMemo(() => {
    if (!inspectionId) return null;
    return {
      table: "inspections" as const,
      filter: idFilter(inspectionId),
    };
  }, [inspectionId]);

  const handleInspectionDataChange = useCallback((newData: any) => {
    if (newData?.notes !== undefined && newData.notes !== formNotes) {
      setFormNotes(newData.notes);
    }
  }, [formNotes]);
  
  const inspectionItemsRealtimeConfig = useMemo(() => {
    if (!inspectionId) return null;
    return {
      table: "inspection_items" as const,
      filter: `inspection_id=eq.${inspectionId}`,
    };
  }, [inspectionId]);

  const realtimeRecordOptions = useMemo(() => {
    if (!inspectionId || !supabase) return null;
    return {
      config: { table: "inspections" as const, filter: idFilter(inspectionId) },
      initialFetch: false,
      onDataChange: handleInspectionDataChange,
      supabaseClient: supabase,
    };
  }, [inspectionId, supabase, handleInspectionDataChange]);

  if (realtimeRecordOptions) {
    useRealtimeRecord<any>(realtimeRecordOptions);
  }
  
  const handleItemStatus = (sectionId: string, itemId: string, status: 'pass' | 'fail') => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId ? { ...item, status } : item
              ),
            }
          : section
      )
    );
  };

  const handlePhotoCapture = async (photoUrl: string) => {
    if (currentPhotoItem) {
      const { sectionId, itemId } = currentPhotoItem;
      
      const fileName = `inspection_photo_${Date.now()}.jpg`;
      const file = await blobUrlToFile(photoUrl, fileName);

      const storagePath = await uploadPhotoToStorage(file, `inspections/${inspectionId || 'new'}/${itemId}/${fileName}`);

      setSections(prevSections =>
        prevSections.map(section =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.map(item =>
                  item.id === itemId
                    ? { ...item, photos: [...item.photos, storagePath] }
                    : item
                ),
              }
            : section
        )
      );
      setCurrentPhotoItem(null);
      setIsCameraOpen(false);
    }
  };
  
  const blobUrlToFile = async (blobUrl: string, fileName: string): Promise<File> => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  };

  const uploadPhotoToStorage = async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('vehicle_assets')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      handleError(error);
      throw error;
    }
    const { data: publicUrlData } = supabase.storage.from('vehicle_assets').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  };

  const handleCameraClick = (sectionId: string, itemId: string) => {
    setCurrentPhotoItem({ sectionId, itemId });
    setIsCameraOpen(true);
  };

  const handleItemNotesChange = (sectionId: string, itemId: string, newNotes: string) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId ? { ...item, notes: newNotes } : item
              ),
            }
          : section
      )
    );
  };

  const handlePhotoDelete = (sectionId: string, itemId: string, photoIndex: number) => {
    const photoToDelete = sections.find(s => s.id === sectionId)?.items.find(i => i.id === itemId)?.photos[photoIndex];
    console.log("Deleting photo (client-side only for now):", photoToDelete);

    setSections(prevSections =>
        prevSections.map(s =>
          s.id === sectionId
            ? {
                ...s,
                items: s.items.map(i =>
                  i.id === itemId
                    ? { ...i, photos: i.photos.filter((_, idx) => idx !== photoIndex) }
                    : i
                ),
              }
            : s
        )
      );
      toast({title: t('common.success'), description: t('inspections.messages.photoDeleted')});
  };

  const onSubmit = methods.handleSubmit(async (formData) => {
    setIsSubmitting(true);
    await withErrorHandling(async () => {
      if (!user) {
        toast({ title: t('common.error'), description: t('auth.signInRequired'), variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      if (!formData.vehicle_id) {
        toast({ title: t('common.error'), description: t('inspections.messages.selectVehicle'), variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }

      const inspectionPayload = {
        vehicle_id: formData.vehicle_id,
        type: selectedType,
        status: 'pending', 
        created_by: user.id,
        notes: formNotes,
        booking_id: bookingId || null,
        is_scheduled: formData.is_scheduled,
        scheduled_date: formData.is_scheduled ? formData.scheduled_date : null,
        frequency: formData.is_scheduled ? formData.frequency : null,
        interval_days: formData.is_scheduled && formData.frequency === 'custom' && formData.interval_days ? parseInt(formData.interval_days) : null,
        end_date: formData.is_scheduled ? formData.end_date : null,
      };

      let currentInspectionId = inspectionId;
      let operationType: 'INSERT' | 'UPDATE' = 'INSERT';

      if (currentInspectionId) {
        operationType = 'UPDATE';
        const { error } = await supabase
          .from('inspections')
          .update({ ...inspectionPayload, updated_at: new Date().toISOString() })
          .eq('id', currentInspectionId);
        if (error) throw error;
      } else {
        const { data: newInspectionData, error } = await supabase
          .from('inspections')
          .insert(inspectionPayload)
          .select('id')
          .single();
        if (error) throw error;
        if (!newInspectionData?.id) throw new Error("Failed to create inspection or retrieve ID.");
        currentInspectionId = newInspectionData.id;
      }

      const itemPayloads = sections.flatMap(section =>
        section.items.map(item => ({
          inspection_id: currentInspectionId!,
          template_id: item.template_id || item.id,
          status: item.status,
          notes: item.notes || '',
        }))
      );
      
      if (itemPayloads.length > 0) {
        const { error: itemsError } = await supabase
          .from('inspection_items')
          .upsert(itemPayloads, { onConflict: 'inspection_id, template_id' }); 
        if (itemsError) throw itemsError;
      }
      
      const allPhotoRecordsToInsert: { inspection_id: string; inspection_item_template_id: string; photo_url: string; }[] = [];

      if (operationType === 'UPDATE' && currentInspectionId) {
         await supabase.from('inspection_photos').delete().eq('inspection_id', currentInspectionId);
      }

      for (const section of sections) {
        for (const item of section.items) {
          if (item.photos.length > 0 && item.template_id && currentInspectionId) { 
            item.photos.forEach(photoUrl => {
              allPhotoRecordsToInsert.push({
                inspection_id: currentInspectionId!,      
                inspection_item_template_id: item.template_id!,
                photo_url: photoUrl,
              });
            });
          }
        }
      }

      if (allPhotoRecordsToInsert.length > 0) {
        const { error: photoError } = await supabase
          .from('inspection_photos') 
          .insert(allPhotoRecordsToInsert);
        if (photoError) {
           console.warn("Error saving some photos:", photoError);
           toast({ title: t('common.warning'), description: t('inspections.messages.errorSavingSomePhotos'), variant: 'default' });
        }
      }

      toast({ title: t('common.success'), description: t('inspections.messages.inspectionSaved') });
      router.push(`/${locale}/inspections/${currentInspectionId}` as any);
    }, t('inspections.messages.errorSavingInspection'));
    setIsSubmitting(false);
  });

  const getSectionProgress = (section: InspectionSection) => {
    const totalItems = section.items.length;
    if (totalItems === 0) return 0;
    const completedItems = section.items.filter(item => item.status === 'pass' || item.status === 'fail').length;
    return (completedItems / totalItems) * 100;
  };

  const getOverallProgress = () => {
    const allItems = sections.flatMap(section => section.items);
    const totalItems = allItems.length;
    if (totalItems === 0) return 0;
    const completedItems = allItems.filter(item => item.status === 'pass' || item.status === 'fail').length;
    return (completedItems / totalItems) * 100;
  };
  
  const handleVehicleSelect = (vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle);
    setValue('vehicle_id', vehicle?.id || '');
  };

  if (isLoadingTemplate || (formVehicleId && isLoadingVehicle && !selectedVehicle)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }
  
  if (!inspectionId && !formVehicleId && !isLoadingVehicle && !selectedVehicle) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('inspections.selectVehicleTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
                <VehicleSelector 
                  value={formVehicleId} 
                  onValueChange={(id) => setValue('vehicle_id', id)} 
                  placeholder={t('inspections.selectVehiclePlaceholder')}
                />
                <p className="mt-4 text-sm text-muted-foreground">
                    {t('inspections.selectVehiclePrompt')}
                </p>
            </CardContent>
        </Card>
    );
  }

  return (
    <FormProvider {...methods}>
      {inspectionId && supabase && 
        <InspectionRealtimeUpdater 
          inspectionId={inspectionId} 
          supabaseClient={supabase} 
          onDataChange={handleInspectionDataChange} 
        />
      }
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {inspectionId ? t('inspections.editTitle') : t('inspections.newTitle')}
            </h1>
            {selectedVehicle && (
              <p className="text-muted-foreground">
                {t('inspections.forVehicle', { vehicleName: selectedVehicle.name || selectedVehicle.plate_number || 'N/A' })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Progress value={getOverallProgress()} className="w-32" />
            <span className="text-sm text-muted-foreground">{Math.round(getOverallProgress())}%</span>
          </div>
        </div>

        {!inspectionId && !vehicleId && (
            <Card>
                <CardHeader>
                    <CardTitle>{t('inspections.selectVehicle')}</CardTitle>
                </CardHeader>
                <CardContent>
                     <VehicleSelector 
                        value={formVehicleId} 
                        onValueChange={(id) => setValue('vehicle_id', id)}
                        placeholder={t('inspections.selectVehiclePlaceholder')}
                      />
                </CardContent>
            </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('inspections.inspectionDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('inspections.typeLabel')}</FormLabel>
                      <InspectionTypeSelector
                        control={control}
                        onTypeChange={(newType) => {
                          field.onChange(newType);
                          setSelectedType(newType);
                        }}
                        defaultValue={field.value || type}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="is_scheduled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                       <FormControl>
                        <input 
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary-dark border-gray-300"
                            aria-label={t('inspections.isScheduled')}
                         />
                        </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('inspections.isScheduled')}</FormLabel>
                        <FormDescription>
                          {t('inspections.isScheduledDescription')}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                {watch('is_scheduled') && (
                  <>
                    <FormField
                      control={control}
                      name="scheduled_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('inspections.scheduledDate')}</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('inspections.frequency')}</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('inspections.selectFrequency')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="daily">{t('inspections.frequencies.daily')}</SelectItem>
                                    <SelectItem value="weekly">{t('inspections.frequencies.weekly')}</SelectItem>
                                    <SelectItem value="biweekly">{t('inspections.frequencies.biweekly')}</SelectItem>
                                    <SelectItem value="monthly">{t('inspections.frequencies.monthly')}</SelectItem>
                                    <SelectItem value="quarterly">{t('inspections.frequencies.quarterly')}</SelectItem>
                                    <SelectItem value="biannually">{t('inspections.frequencies.biannually')}</SelectItem>
                                    <SelectItem value="annually">{t('inspections.frequencies.annually')}</SelectItem>
                                    <SelectItem value="custom">{t('inspections.frequencies.custom')}</SelectItem>
                                </SelectContent>
                            </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watch('frequency') === 'custom' && (
                       <FormField
                        control={control}
                        name="interval_days"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('inspections.intervalDays')}</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 15" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    )}
                     <FormField
                      control={control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('inspections.endDateOptional')}</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormDescription>{t('inspections.endDateDescription')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>{t('inspections.overallNotes')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder={t('inspections.overallNotesPlaceholder')}
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        rows={4}
                    />
                </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            {sections.map((section, sectionIndex) => (
              <Card key={section.id} id={`section-${section.id}`}>
                <CardHeader 
                  className="cursor-pointer flex flex-row justify-between items-center"
                  onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                >
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={getSectionProgress(section)} className="w-24" />
                    {activeSection === section.id ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </CardHeader>
                {activeSection === section.id && (
                  <CardContent className="pt-4 space-y-4">
                    {section.items.map((item, itemIndex) => (
                      <div key={item.id} className="border p-4 rounded-md space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{item.title}</h4>
                            {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={item.status === 'pass' ? 'default' : 'outline'}
                              size="icon"
                              onClick={() => handleItemStatus(section.id, item.id, 'pass')}
                              className={cn(item.status === 'pass' && 'bg-green-500 hover:bg-green-600')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={item.status === 'fail' ? 'destructive' : 'outline'}
                              size="icon"
                              onClick={() => handleItemStatus(section.id, item.id, 'fail')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {item.requires_notes && (
                          <div>
                            <Textarea
                              placeholder={t('inspections.itemNotesPlaceholder')}
                              value={item.notes}
                              onChange={(e) => handleItemNotesChange(section.id, item.id, e.target.value)}
                              rows={2}
                            />
                          </div>
                        )}

                        {item.requires_photo && (
                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleCameraClick(section.id, item.id)}
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              {t('inspections.takePhoto')}
                            </Button>
                            <div className="flex flex-wrap gap-2">
                              {item.photos.map((photoUrl, photoIndex) => (
                                <div key={photoIndex} className="relative group w-24 h-24">
                                  <img 
                                    src={photoUrl} 
                                    alt={`Inspection photo ${photoIndex + 1}`} 
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handlePhotoDelete(section.id, item.id, photoIndex) }
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {inspectionId ? t('common.saveChanges') : t('inspections.createInspection')}
          </Button>
        </div>
      </form>
      {isCameraOpen && currentPhotoItem && (
        <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handlePhotoCapture}
        />
      )}
    </FormProvider>
  );
} 