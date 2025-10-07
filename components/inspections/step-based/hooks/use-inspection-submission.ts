"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { useI18n } from "@/lib/i18n/context"
import { withErrorHandling } from "@/lib/utils/error-handler"
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

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand?: string;
  model?: string;
  image_url?: string | null;
  year?: string;
  vehicle_group_id?: string;
  vehicle_group?: {
    id: string;
    name: string;
    description?: string;
    color: string;
    vehicle_count?: number;
  };
}

interface UseInspectionSubmissionProps {
  selectedVehicle: Vehicle | null;
  sections: InspectionSection[];
  inspectionId?: string;
  bookingId?: string;
  inspectionDate: Date | undefined;
  notes: string;
  isResuming?: boolean;
}

export function useInspectionSubmission({
  selectedVehicle,
  sections,
  inspectionId,
  bookingId,
  inspectionDate,
  notes,
  isResuming = false
}: UseInspectionSubmissionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            type: 'routine', // This will be set by the parent component
            status: 'completed',
            date: (inspectionDate || new Date()).toISOString(),
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

  return {
    isSubmitting,
    handleFormSubmit
  };
}
