"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CameraModal } from "@/components/inspections/camera-modal"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Check, X, Camera, Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils/styles"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { DbVehicle } from "@/types"
import { useForm } from "react-hook-form"
import { FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { VehicleSelector } from "@/components/vehicle-selector"
import { Progress } from "@/components/ui/progress"
import { useI18n } from "@/lib/i18n/context"
import { InspectionType } from "@/lib/types/inspections"
import { Badge } from "@/components/ui/badge"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InspectionTypeSelector } from "./inspection-type-selector"

// Define inspection item type
type InspectionItemType = {
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
  items: InspectionItemType[]
}

const inspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
  type: z.enum(["routine", "safety", "maintenance"]).default("routine"),
})

type InspectionFormData = z.infer<typeof inspectionSchema>

interface InspectionFormProps {
  inspectionId: string
  type?: InspectionType
  vehicleId: string
}

interface InspectionCategory {
  id: string;
  name: string;
}

// Define the vehicle type
interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand?: string;
  model?: string;
  image_url?: string;
}

// Map our section IDs to the actual UUIDs from the database
const CATEGORY_IDS = {
  steering: '63a30ec2-c4da-40ea-a408-da98b6e4fde',
  brake: '49884798-34d3-4576-a771-bae768eff1f3',
  suspension: '44ff8e2e-1773-49d9-b93c-a3128b760443',
  lighting: 'effb87ad-2917-4207-a51a-6889f4d4eeb7',
  tires: '5e18c77d-b822-4ba5-b45c-482635bd46d'
}

export function InspectionForm({ inspectionId, type = 'routine', vehicleId }: InspectionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { t } = useI18n()
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
  const [notes, setNotes] = useState<string>('')

  const methods = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      vehicle_id: vehicleId || '',
      type: type || 'routine',
    },
  })

  // Fetch vehicle data if vehicleId is provided
  useEffect(() => {
    if (vehicleId) {
      const fetchVehicle = async () => {
        try {
          const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', vehicleId)
            .single();
            
          if (error) {
            console.error('Error fetching vehicle:', error);
            return;
          }
          
          if (data) {
            // Set the selected vehicle with the full vehicle object
            setSelectedVehicle(data as Vehicle);
          }
        } catch (error) {
          console.error('Error in fetchVehicle:', error);
        }
      };
      
      fetchVehicle();
    }
  }, [vehicleId]);

  // Fetch inspection template on mount
  useEffect(() => {
    async function loadInspectionTemplate() {
      try {
        // If we have an inspectionId, load the inspection data first
        if (inspectionId) {
          const { data: inspectionData, error: inspectionError } = await supabase
            .from('inspections')
            .select('*')
            .eq('id', inspectionId)
            .single()

          if (inspectionError) throw inspectionError

          // Set notes from existing inspection
          if (inspectionData && inspectionData.notes) {
            setNotes(inspectionData.notes)
          }
        }

        const { data: categories, error: categoriesError } = await supabase
          .from('inspection_categories')
          .select(`
            id,
            name,
            description,
            type,
            inspection_item_templates (
              id,
              name,
              description,
              requires_photo,
              requires_notes,
              order_number
            )
          `)
          .eq('type', selectedType)
          .order('order_number', { ascending: true })

        if (categoriesError) throw categoriesError

        if (categories) {
          const formattedSections: InspectionSection[] = categories.map(category => {
            const categoryKey = category.name.toLowerCase().replace(/\s+/g, '_')
            const translatedTitle = t(`inspections.sections.${categoryKey}.title`)
            
            return {
              id: category.id,
              title: translatedTitle || category.name,
              description: category.description,
              items: (category.inspection_item_templates || [])
                .sort((a, b) => a.order_number - b.order_number)
                .map(item => {
                  const itemKey = item.name.toLowerCase().replace(/\s+/g, '_')
                  const translatedItemTitle = t(`inspections.sections.${categoryKey}.items.${itemKey}.title`)
                  const translatedItemDesc = t(`inspections.sections.${categoryKey}.items.${itemKey}.description`)
                  
                  return {
                    id: item.id,
                    title: translatedItemTitle || item.name,
                    description: translatedItemDesc || item.description,
                    requires_photo: item.requires_photo,
                    requires_notes: item.requires_notes,
                    status: null,
                    notes: '',
                    photos: []
                  }
                })
            }
          })

          setSections(formattedSections)
          
          // If we have an inspectionId, load existing inspection items
          if (inspectionId) {
            loadExistingInspectionItems(formattedSections);
          } else if (!activeSection && formattedSections.length > 0) {
            setActiveSection(formattedSections[0].id)
            if (formattedSections[0].items.length > 0) {
              setActiveItem(formattedSections[0].items[0].id)
            }
          }
        }
      } catch (error) {
        console.error('Error loading inspection template:', error)
        toast({
          title: t('common.error'),
          description: t('inspections.messages.error'),
          variant: "destructive",
        })
      }
    }

    loadInspectionTemplate()
  }, [selectedType, t, inspectionId])

  // Load existing inspection items if we have an inspectionId
  const loadExistingInspectionItems = async (formattedSections: InspectionSection[]) => {
    try {
      // Fetch existing inspection items
      const { data: existingItems, error } = await supabase
        .from('inspection_items')
        .select('id, template_id, status, notes')
        .eq('inspection_id', inspectionId)

      if (error) {
        console.error('Error loading existing items:', error)
        return formattedSections
      }

      if (!existingItems || existingItems.length === 0) {
        return formattedSections
      }

      // Define a type for items with photos
      type ItemWithPhotos = {
        id: string;
        template_id: string;
        status: 'pass' | 'fail' | null;
        notes: string | null;
        inspection_photos?: { id: string; photo_url: string }[];
      };

      // Initialize items with photos array
      const itemsWithPhotos: ItemWithPhotos[] = existingItems.map(item => ({
        ...item,
        inspection_photos: []
      }));

      // Fetch photos for these items
      const { data: photos, error: photosError } = await supabase
        .from('inspection_photos')
        .select('id, inspection_item_id, photo_url')
        .in('inspection_item_id', existingItems.map(item => item.id))

      if (photosError) {
        console.error('Error loading photos:', photosError)
      } else if (photos) {
        // Attach photos to their respective items
        photos.forEach(photo => {
          const item = itemsWithPhotos.find(i => i.id === photo.inspection_item_id)
          if (item && item.inspection_photos) {
            item.inspection_photos.push(photo)
          }
        })
      }

      // Update the sections with existing data
      const updatedSections = [...formattedSections]
      
      // Find the active section and item based on the first item with a status
      let foundActiveSection = false
      
      // Update each section's items with existing data
      updatedSections.forEach(section => {
        section.items.forEach(item => {
          // Find matching existing item by template_id
          const existingItem = itemsWithPhotos.find(i => i.template_id === item.id)
          
          if (existingItem) {
            // Update status and notes
            item.status = existingItem.status
            item.notes = existingItem.notes || ''
            
            // Add photos if any
            if (existingItem.inspection_photos && existingItem.inspection_photos.length > 0) {
              item.photos = existingItem.inspection_photos.map(photo => photo.photo_url)
            }
            
            // Set active section and item if not already set
            if (!foundActiveSection && existingItem.status) {
              setActiveSection(section.id)
              setActiveItem(item.id)
              foundActiveSection = true
            }
          }
        })
      })
      
      return updatedSections
    } catch (error) {
      console.error('Error in loadExistingInspectionItems:', error)
      return formattedSections
    }
  }

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('inspection_categories')
        .select('id, name')

      if (error) {
        console.error('Error fetching categories:', error)
        return
      }

      // Create a mapping of category name to ID
      const categoryMap = data.reduce((acc: Record<string, string>, cat) => {
        acc[cat.name.toLowerCase()] = cat.id
        return acc
      }, {})

      methods.setValue('vehicle_id', vehicleId)
    }

    fetchCategories()
  }, [vehicleId, methods])

  const handleItemStatus = (sectionId: string, itemId: string, status: 'pass' | 'fail') => {
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? { ...item, status }
                  : item
              )
            }
          : section
      )
    )

    // Auto-advance logic
    const currentSection = sections.find(s => s.id === sectionId)
    if (currentSection) {
      const currentItemIndex = currentSection.items.findIndex(i => i.id === itemId)
      if (currentItemIndex < currentSection.items.length - 1) {
        // Move to next item in same section
        setActiveItem(currentSection.items[currentItemIndex + 1].id)
      } else {
        // Move to next section
        const currentSectionIndex = sections.findIndex(s => s.id === sectionId)
        if (currentSectionIndex < sections.length - 1) {
          const nextSection = sections[currentSectionIndex + 1]
          setActiveSection(nextSection.id)
          setActiveItem(nextSection.items[0].id)
        }
      }
    }
  }

  const handlePhotoCapture = async (photoUrl: string) => {
    if (!currentPhotoItem) return
    
    try {
      setIsSubmitting(true);
      
      // Find the section and item
      const sectionIndex = sections.findIndex(s => s.id === currentPhotoItem.sectionId)
      if (sectionIndex === -1) return

      const itemIndex = sections[sectionIndex].items.findIndex(i => i.id === currentPhotoItem.itemId)
      if (itemIndex === -1) return
      
      // If it's a blob URL, upload it to storage immediately
      let permanentUrl = photoUrl;
      
      if (photoUrl.startsWith('blob:')) {
        try {
          // Convert blob URL to file
          const file = await blobUrlToFile(photoUrl, `photo-${Date.now()}.jpg`);
          
          // Upload file to storage
          permanentUrl = await uploadPhotoToStorage(file);
          
          console.log('Photo uploaded to storage:', permanentUrl);
        } catch (error) {
          console.error('Error uploading photo to storage:', error);
          toast({
            title: t('inspections.messages.error'),
            description: t('inspections.messages.photoUploadError'),
            variant: "destructive",
          });
          return;
        }
      }

      // Add the permanent URL to the item
      const updatedSections = [...sections]
      updatedSections[sectionIndex].items[itemIndex].photos = [
        ...updatedSections[sectionIndex].items[itemIndex].photos,
        permanentUrl
      ]

      setSections(updatedSections)
      setIsCameraOpen(false)
      setCurrentPhotoItem(null)

      // Show success message
      toast({
        title: t('inspections.messages.photoAdded'),
      })
    } catch (error) {
      console.error('Error in handlePhotoCapture:', error);
      toast({
        title: t('inspections.messages.error'),
        description: t('inspections.messages.photoUploadError'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper function to convert blob URL to File object
  const blobUrlToFile = async (blobUrl: string, fileName = 'photo.jpg'): Promise<File> => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  }

  // Helper function to upload a file to storage
  const uploadPhotoToStorage = async (file: File): Promise<string> => {
    try {
      // Create a unique filename
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      console.log('Uploading file to storage:', fileName);
      
      // Upload the file to Supabase storage - using the correct bucket name 'inspection-photos'
      const { data, error } = await supabase.storage
        .from('inspection-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) {
        console.error('Error uploading photo to storage:', error);
        throw error;
      }
      
      console.log('Upload successful, data:', data);
      
      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(fileName);
        
      console.log('Public URL:', publicUrlData.publicUrl);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadPhotoToStorage:', error);
      throw error;
    }
  }

  const handleCameraClick = (sectionId: string, itemId: string) => {
    setCurrentPhotoItem({ sectionId, itemId })
    setIsCameraOpen(true)
  }

  const handleNotesChange = async (sectionId: string, itemId: string, notes: string) => {
    try {
      // First update the local state
      setSections(prevSections => 
        prevSections.map(section => 
          section.id === sectionId
            ? {
                ...section,
                items: section.items.map(item =>
                  item.id === itemId
                    ? { ...item, notes }
                    : item
                )
              }
            : section
        )
      )

      // Then update the database
      const { error } = await supabase
        .from('inspection_items')
        .update({ notes })
        .eq('id', itemId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating notes:', error)
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async () => {
    try {
      if (!selectedVehicle) {
        toast({
          title: t('inspections.messages.error'),
          description: t('inspections.messages.selectVehicle'),
          variant: "destructive",
        })
        return
      }

      if (!user?.id) {
        toast({
          title: t('inspections.messages.error'),
          description: t('inspections.messages.loginRequired'),
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      // Filter out items with null status
      const itemsToSave = sections.flatMap(section =>
        section.items
          .filter(item => item.status !== null)
          .map(item => ({
            template_id: item.id,
            status: item.status,
            notes: item.notes || null,
            photos: item.photos
          }))
      )

      if (inspectionId) {
        // Update existing inspection
        const { error: updateError } = await supabase
          .from('inspections')
          .update({
            status: 'completed',
            notes: notes
          })
          .eq('id', inspectionId)

        if (updateError) throw updateError

        // Delete existing inspection items and their photos
        const { data: existingItems, error: fetchError } = await supabase
          .from('inspection_items')
          .select('id')
          .eq('inspection_id', inspectionId)

        if (fetchError) throw fetchError

        if (existingItems.length > 0) {
          const existingItemIds = existingItems.map(item => item.id)

          // Delete associated photos first
          const { error: deletePhotosError } = await supabase
            .from('inspection_photos')
            .delete()
            .in('inspection_item_id', existingItemIds)

          if (deletePhotosError) throw deletePhotosError

          // Then delete the items
          const { error: deleteItemsError } = await supabase
            .from('inspection_items')
            .delete()
            .in('id', existingItemIds)

          if (deleteItemsError) throw deleteItemsError
        }

        // Insert new inspection items
        const { data: newItems, error: insertItemsError } = await supabase
          .from('inspection_items')
          .insert(
            itemsToSave.map(item => ({
              inspection_id: inspectionId,
              template_id: item.template_id,
              status: item.status,
              notes: item.notes
            }))
          )
          .select()

        if (insertItemsError) throw insertItemsError

        // Insert photos for items that have them
        const photosToInsert = []
        for (let i = 0; i < itemsToSave.length; i++) {
          const item = itemsToSave[i]
          const newItem = newItems[i]
          
          if (item.photos && item.photos.length > 0) {
            for (const photoUrl of item.photos) {
              photosToInsert.push({
                inspection_item_id: newItem.id,
                photo_url: photoUrl
              })
            }
          }
        }

        if (photosToInsert.length > 0) {
          const { error: insertPhotosError } = await supabase
            .from('inspection_photos')
            .insert(photosToInsert)

          if (insertPhotosError) throw insertPhotosError
        }

        toast({
          title: t('inspections.messages.updateSuccess'),
        })

        router.push(`/inspections/${inspectionId}`)
        router.refresh()
      } else {
        // Create new inspection
        const { data: newInspection, error: createError } = await supabase
          .from('inspections')
          .insert({
            vehicle_id: selectedVehicle.id,
            type: selectedType,
            status: 'completed',
            date: new Date().toISOString(), // Set the date to current date for direct creation
            notes: notes,
            created_by: user.id
          })
          .select()
          .single()

        if (createError) throw createError

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
          .select()

        if (insertItemsError) throw insertItemsError

        // Insert photos for items that have them
        const photosToInsert = []
        for (let i = 0; i < itemsToSave.length; i++) {
          const item = itemsToSave[i]
          const newItem = newItems[i]
          
          if (item.photos && item.photos.length > 0) {
            for (const photoUrl of item.photos) {
              photosToInsert.push({
                inspection_item_id: newItem.id,
                photo_url: photoUrl
              })
            }
          }
        }

        if (photosToInsert.length > 0) {
          const { error: insertPhotosError } = await supabase
            .from('inspection_photos')
            .insert(photosToInsert)

          if (insertPhotosError) throw insertPhotosError
        }

        toast({
          title: t('inspections.messages.createSuccess'),
        })

        router.push(`/inspections/${newInspection.id}`)
        router.refresh()
      }
    } catch (error) {
      console.error('Error submitting inspection:', error)
      toast({
        title: t('inspections.messages.error'),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSectionProgress = (section: InspectionSection) => {
    const completed = section.items.filter(item => item.status).length
    return `${completed}/${section.items.length}`
  }

  const getOverallProgress = () => {
    const total = sections.reduce((acc, section) => acc + section.items.length, 0)
    const completed = sections.reduce((acc, section) =>
      acc + section.items.filter(item => item.status).length, 0
    )
    return Math.round((completed / total) * 100)
  }

  const handleVehicleChange = (vehicleId: string) => {
    // Fetch the vehicle data based on the ID
    const fetchVehicle = async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single();
          
        if (error) {
          console.error('Error fetching vehicle:', error);
          return;
        }
        
        if (data) {
          // Set the selected vehicle with the full vehicle object
          setSelectedVehicle(data as Vehicle);
        }
      } catch (error) {
        console.error('Error in fetchVehicle:', error);
      }
    };
    
    fetchVehicle();
  }

  const handleSectionComplete = async (sectionId: string, status: 'pass' | 'fail') => {
    try {
      const { error } = await supabase
        .from('inspection_items')
        .update({ status })
        .eq('inspection_id', inspectionId)
        .eq('section_id', sectionId)

      if (error) throw error

      toast({
        title: "Section updated",
        description: `Section has been marked as ${status}`,
      })
    } catch (error) {
      console.error('Error updating section:', error)
      toast({
        title: "Error",
        description: "Failed to update section status",
        variant: "destructive",
      })
    }
  }

  const handlePhotoAdd = async (sectionId: string, itemId: string, photoUrl: string) => {
    // Find the section and item
    const sectionIndex = sections.findIndex(s => s.id === sectionId)
    if (sectionIndex === -1) return

    const itemIndex = sections[sectionIndex].items.findIndex(i => i.id === itemId)
    if (itemIndex === -1) return

    // Add the photo to the item
    const updatedSections = [...sections]
    updatedSections[sectionIndex].items[itemIndex].photos = [
      ...updatedSections[sectionIndex].items[itemIndex].photos,
      photoUrl
    ]

    setSections(updatedSections)

    // Show success message
    toast({
      title: t('inspections.messages.photoAdded'),
    })
  }

  const handlePhotoUpload = async (sectionId: string, itemId: string, file: File) => {
    try {
      // Upload the file to storage
      const photoUrl = await uploadPhotoToStorage(file);
      
      // Add the photo URL to the item
      handlePhotoAdd(sectionId, itemId, photoUrl);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: t('inspections.messages.error'),
        description: t('inspections.messages.photoUploadError'),
        variant: "destructive",
      });
    }
  }

  const handlePhotoDelete = (sectionId: string, itemId: string, photoIndex: number) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(i =>
                i.id === itemId
                  ? {
                      ...i,
                      photos: i.photos.filter((_, idx) => idx !== photoIndex)
                    }
                  : i
              )
            }
          : section
      )
    );
    toast({
      title: t('common.success'),
      description: t('inspections.messages.photoDeleted'),
    });
  };

  const onSubmit = methods.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      await handleSubmit()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: t('inspections.messages.error'),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <div className="relative">
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('inspections.type.select')}</CardTitle>
            </CardHeader>
            <CardContent>
              <InspectionTypeSelector
                control={methods.control}
                onTypeChange={setSelectedType}
                defaultValue={type}
              />
            </CardContent>
          </Card>

          <Card className="p-4">
            <h2 className="text-lg font-medium mb-4">{t('inspections.fields.vehicle')}</h2>
            <FormField
              control={methods.control}
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <VehicleSelector
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        handleVehicleChange(value)
                      }}
                      placeholder={t('inspections.fields.vehicleDescription')}
                      disabled={!!vehicleId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <div className="space-y-2">
            <h2 className="text-lg font-medium">{t('inspections.details.inspectionProgress')}</h2>
            <Progress value={getOverallProgress()} className="h-2" />
            <p className="text-sm text-muted-foreground text-right">{getOverallProgress()}%</p>
          </div>

          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.id} className={cn("p-4 transition-colors", activeSection === section.id ? "bg-card" : "bg-muted/50")}>
                <button
                  type="button"
                  className="flex items-center justify-between w-full"
                  onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                >
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">{section.title}</h3>
                    <div className="flex items-center gap-2">
                      <Progress value={(section.items.filter(i => i.status).length / section.items.length) * 100} className="w-24 h-1" />
                      <span className="text-sm text-muted-foreground">{getSectionProgress(section)}</span>
                    </div>
                  </div>
                  {activeSection === section.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                {activeSection === section.id && (
                  <div className="mt-4 space-y-4">
                    {section.items.map((item, index) => (
                      <div key={item.id} className={cn("space-y-4 rounded-lg p-4", activeItem === item.id ? "bg-muted" : "bg-transparent")}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                          </div>
                          {item.requires_photo && (
                            <Badge variant="outline" className="ml-2">{t('inspections.fields.photoRequired')}</Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={item.status === 'pass' ? 'default' : 'outline'}
                            className={cn("flex-1", item.status === 'pass' && "bg-green-500 hover:bg-green-600")}
                            onClick={() => handleItemStatus(section.id, item.id, 'pass')}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            {t('inspections.actions.pass')}
                          </Button>
                          <Button
                            type="button"
                            variant={item.status === 'fail' ? 'destructive' : 'outline'}
                            className="flex-1"
                            onClick={() => handleItemStatus(section.id, item.id, 'fail')}
                          >
                            <X className="mr-2 h-4 w-4" />
                            {t('inspections.actions.fail')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setCurrentPhotoItem({ sectionId: section.id, itemId: item.id })
                              setIsCameraOpen(true)
                            }}
                            title={t('inspections.fields.photo')}
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                        </div>

                        {item.photos.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {item.photos.map((photo, index) => (
                              <div key={index} className="relative group aspect-square">
                                <img
                                  src={photo}
                                  alt={`${t('inspections.fields.photo')} ${index + 1}`}
                                  className="rounded-lg object-cover w-full h-full"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handlePhotoDelete(section.id, item.id, index);
                                  }}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  title={t('common.delete')}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <Textarea
                          placeholder={t('inspections.fields.notesPlaceholder')}
                          value={item.notes}
                          onChange={(e) => handleNotesChange(section.id, item.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <h2 className="text-lg font-medium mb-4">{t('inspections.fields.notes')}</h2>
            <Textarea
              placeholder={t('inspections.fields.generalNotesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </Card>

          <div className="sticky bottom-0 bg-background p-4 border-t">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !selectedVehicle}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('inspections.actions.complete')
              )}
            </Button>
          </div>
        </form>
      </FormProvider>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false)
          setCurrentPhotoItem(null)
        }}
        onCapture={handlePhotoCapture}
      />
    </div>
  )
} 