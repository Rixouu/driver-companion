"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Pencil, Save, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
   getInspectionTemplates,
   addInspectionSection,
   updateInspectionSection,
   deleteInspectionSection,
   addInspectionItem,
   updateInspectionItem,
   deleteInspectionItem 
} from "@/lib/services/inspections"
import type { InspectionCategory, InspectionItemTemplate, InspectionType } from "@/types/inspections" 
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Define TranslationObject type
type TranslationObject = { [key: string]: string };

// Define the structure expected for database rows (used for updates)
// This mirrors the structure in the service layer
interface InspectionItemTemplateRow {
   id: string;
   category_id: string;
   name_translations: TranslationObject;
   description_translations: TranslationObject | null;
   requires_photo: boolean;
   requires_notes: boolean;
   order_number: number;
   created_at: string;
   updated_at: string;
}

interface InspectionTemplateManagerProps {
  type: InspectionType
}

// Update types to include translation objects and a display title
interface EditableSection extends InspectionCategory {
  name_translations: TranslationObject;
  description_translations: TranslationObject;
  title: string; // Display title based on locale
  items: EditableItem[]; // Ensure items are also editable type
  isEditing?: boolean;
}
interface EditableItem extends InspectionItemTemplate {
  name_translations: TranslationObject;
  description_translations: TranslationObject;
  title: string; // Display title based on locale
  description?: string; // Make description optional
  isEditing?: boolean;
}

export function InspectionTemplateManager({ type }: InspectionTemplateManagerProps) {
  const { t, locale } = useI18n()
  const { toast } = useToast()
  const [sections, setSections] = useState<EditableSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingSection, setIsAddingSection] = useState(false) // State for add dialog
  // Add state for EN and JA names/descriptions
  const [newSectionNameEn, setNewSectionNameEn] = useState("");
  const [newSectionNameJa, setNewSectionNameJa] = useState("");
  const [newSectionDescEn, setNewSectionDescEn] = useState("");
  const [newSectionDescJa, setNewSectionDescJa] = useState("");

  const [isSavingSection, setIsSavingSection] = useState(false) // Loading state for saving

  // State for Add Item Dialog
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addingItemToSectionId, setAddingItemToSectionId] = useState<string | null>(null);
  const [newItemNameEn, setNewItemNameEn] = useState("");
  const [newItemNameJa, setNewItemNameJa] = useState("");
  const [newItemDescEn, setNewItemDescEn] = useState("");
  const [newItemDescJa, setNewItemDescJa] = useState("");
  const [newItemRequiresPhoto, setNewItemRequiresPhoto] = useState(false);
  const [newItemRequiresNotes, setNewItemRequiresNotes] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);

  // State for Edit Section Dialog
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [editingSection, setEditingSection] = useState<EditableSection | null>(null);
  const [editSectionNameEn, setEditSectionNameEn] = useState("");
  const [editSectionNameJa, setEditSectionNameJa] = useState("");
  const [editSectionDescEn, setEditSectionDescEn] = useState("");
  const [editSectionDescJa, setEditSectionDescJa] = useState("");
  const [isSavingEditedSection, setIsSavingEditedSection] = useState(false);

  // State for Edit Item Dialog
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null);
  const [editItemSectionId, setEditItemSectionId] = useState<string | null>(null); // To know which section it belongs to
  const [editItemNameEn, setEditItemNameEn] = useState("");
  const [editItemNameJa, setEditItemNameJa] = useState("");
  const [editItemDescEn, setEditItemDescEn] = useState("");
  const [editItemDescJa, setEditItemDescJa] = useState("");
  const [editItemRequiresPhoto, setEditItemRequiresPhoto] = useState(false);
  const [editItemRequiresNotes, setEditItemRequiresNotes] = useState(false);
  const [isSavingEditedItem, setIsSavingEditedItem] = useState(false);

  // Effect to load initial template data
  useEffect(() => {
    async function loadTemplate() {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch the templates for the given type
        const fetchedCategories = await getInspectionTemplates(type)
        
        // Map fetched data to EditableSection, calculating locale-specific title
        const formattedSections = fetchedCategories.map((category): EditableSection => {
            const nameTrans = category.name_translations || { en: '', ja: '' };
            const descTrans = category.description_translations || { en: '', ja: '' };
            const title = nameTrans[locale] || nameTrans['en'] || t('common.untitled');
            
            return {
                // Spread the original category data first
                ...category, 
                name_translations: nameTrans,
                description_translations: descTrans,
                title: title,
                // Ensure order_number has a default for sorting if it can be null
                order_number: category.order_number ?? 0, 
                // Map items similarly
                items: (category.inspection_item_templates || []).map((item): EditableItem => {
                   const itemNameTrans = item.name_translations || { en: '', ja: '' };
                   const itemDescTrans = item.description_translations || { en: '', ja: '' };
                   const itemTitle = itemNameTrans[locale] || itemNameTrans['en'] || t('common.untitled');
                   return {
                      // Spread the original item data first
                      ...item, 
                      name_translations: itemNameTrans,
                      description_translations: itemDescTrans,
                      title: itemTitle,
                      // Ensure boolean fields have defaults if they can be null from DB/types
                      requires_photo: item.requires_photo ?? false,
                      requires_notes: item.requires_notes ?? false,
                       // Ensure order_number has a default for sorting if it can be null
                      order_number: item.order_number ?? 0,
                   };
                }).sort((a, b) => a.order_number - b.order_number), // Sort items
                isEditing: false, // Initialize editing state if needed
            };
        }).sort((a, b) => a.order_number - b.order_number); // Sort sections

        setSections(formattedSections)
      } catch (err) {
        console.error(`Error loading ${type} inspection template:`, err)
        setError(t("inspections.templates.loadError", { type }))
        toast({
          title: t("common.error"),
          description: t("inspections.templates.loadError", { type }),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadTemplate()
  }, [type, t, toast, locale])
  
  // Effect to update titles when locale changes after initial load
  useEffect(() => {
    setSections(currentSections => 
      currentSections.map(section => ({
        ...section,
        // Recalculate section title based on the new locale
        title: section.name_translations[locale] || section.name_translations['en'] || t('common.untitled'),
        items: section.items.map(item => ({
          ...item,
          // Recalculate item title based on the new locale
          title: item.name_translations[locale] || item.name_translations['en'] || t('common.untitled'),
          // Recalculate item description based on the new locale
          description: item.description_translations[locale] || item.description_translations['en'] || undefined
        }))
      }))
    );
  // Depend only on locale and t (to re-run translation logic if needed)
  }, [locale, t]);

  // --- Handler Functions (to be implemented) ---

  const handleAddSectionSubmit = async () => {
    // Validate that at least one name (EN or JA) is provided
    if (!newSectionNameEn.trim() && !newSectionNameJa.trim()) {
      toast({ title: t("common.error"), description: t("inspections.templates.sectionNameRequired"), variant: "destructive" })
      return
    }
    setIsSavingSection(true)

    // Construct translation objects, only include non-empty trimmed values
    const nameTranslations: TranslationObject = {};
    if (newSectionNameEn.trim()) nameTranslations.en = newSectionNameEn.trim();
    if (newSectionNameJa.trim()) nameTranslations.ja = newSectionNameJa.trim();

    const descriptionTranslations: TranslationObject = {};
    if (newSectionDescEn.trim()) descriptionTranslations.en = newSectionDescEn.trim();
    if (newSectionDescJa.trim()) descriptionTranslations.ja = newSectionDescJa.trim();
    
    // Use undefined for description if object is empty, otherwise pass the object
    const descPayload = Object.keys(descriptionTranslations).length > 0 ? descriptionTranslations : undefined;

    try {
      // Call service function with translation objects
      const newSectionData = await addInspectionSection(type, nameTranslations, descPayload)
      
      // Format the returned section data for the UI state
      const nameTrans = newSectionData.name_translations || { en: '', ja: '' };
      const descTrans = newSectionData.description_translations || { en: '', ja: '' };
      // Calculate title based on current locale for the new item
      const title = nameTrans[locale] || nameTrans['en'] || t('common.untitled'); 

      const newSectionForState: EditableSection = {
         // Spread the data returned from the backend
         ...newSectionData, 
         name_translations: nameTrans,
         description_translations: descTrans,
         title: title,
         items: [], // New section starts with no items
         // Ensure order_number exists for sorting consistency
         order_number: newSectionData.order_number ?? 0, 
         isEditing: false,
      };

      setSections(prevSections => 
         [...prevSections, newSectionForState].sort((a, b) => a.order_number - b.order_number)
      ); // Add and re-sort
      
      toast({ title: t("common.success"), description: t("inspections.templates.addSectionSuccess") })
      // Reset all input fields
      setNewSectionNameEn("")
      setNewSectionNameJa("")
      setNewSectionDescEn("")
      setNewSectionDescJa("")
      setIsAddingSection(false) // Close dialog on success
    } catch (err) {
      console.error("Error adding section:", err)
      toast({ title: t("common.error"), description: t("inspections.templates.addSectionError"), variant: "destructive" })
    } finally {
      setIsSavingSection(false)
    }
  }

  // Opens the Edit Section dialog and pre-fills data
  const handleEditSection = (sectionId: string) => {
    const sectionToEdit = sections.find(s => s.id === sectionId);
    if (!sectionToEdit) return;
    
    setEditingSection(sectionToEdit);
    setEditSectionNameEn(sectionToEdit.name_translations.en || "");
    setEditSectionNameJa(sectionToEdit.name_translations.ja || "");
    setEditSectionDescEn(sectionToEdit.description_translations.en || "");
    setEditSectionDescJa(sectionToEdit.description_translations.ja || "");
    setIsEditingSection(true);
  };

  // Handles the submission of the Edit Section dialog
  const handleEditSectionSubmit = async () => {
    if (!editingSection) return;

    if (!editSectionNameEn.trim() && !editSectionNameJa.trim()) {
       toast({ title: t("common.error"), description: t("inspections.templates.sectionNameRequired"), variant: "destructive" });
       return;
    }
    setIsSavingEditedSection(true);

    const nameTranslations: TranslationObject = {};
    if (editSectionNameEn.trim()) nameTranslations.en = editSectionNameEn.trim();
    if (editSectionNameJa.trim()) nameTranslations.ja = editSectionNameJa.trim();

    const descriptionTranslations: TranslationObject = {};
    if (editSectionDescEn.trim()) descriptionTranslations.en = editSectionDescEn.trim();
    if (editSectionDescJa.trim()) descriptionTranslations.ja = editSectionDescJa.trim();
    const descPayload = Object.keys(descriptionTranslations).length > 0 ? descriptionTranslations : undefined;

    try {
      const updatedSectionData = await updateInspectionSection(editingSection.id, nameTranslations, descPayload);

      // Format the updated section data for the UI state
      const nameTrans = updatedSectionData.name_translations || { en: '', ja: '' };
      const descTrans = updatedSectionData.description_translations || { en: '', ja: '' };
      const title = nameTrans[locale] || nameTrans['en'] || t('common.untitled');

      setSections(prevSections =>
        prevSections.map(section => {
          if (section.id === editingSection.id) {
            return {
              ...section, // Keep existing items etc.
              ...updatedSectionData, // Apply updates from backend
              name_translations: nameTrans,
              description_translations: descTrans,
              title: title,
              order_number: updatedSectionData.order_number ?? 0,
            };
          }
          return section;
        }).sort((a, b) => a.order_number - b.order_number) // Re-sort just in case order changed
      );

      toast({ title: t("common.success"), description: t("inspections.templates.editSectionSuccess") });
      setIsEditingSection(false);
      setEditingSection(null);
    } catch (err) {
      console.error("Error updating section:", err);
      toast({ title: t("common.error"), description: t("inspections.templates.editSectionError"), variant: "destructive" });
    } finally {
      setIsSavingEditedSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    // Optimistic UI update: Remove the section immediately
    const originalSections = sections;
    setSections(prevSections => prevSections.filter(section => section.id !== sectionId));

    try {
      await deleteInspectionSection(sectionId);
      toast({ title: t("common.success"), description: t("inspections.templates.deleteSectionSuccess") })
    } catch (err) {
      console.error("Error deleting section:", err);
      // Revert UI on error
      setSections(originalSections);
      toast({ title: t("common.error"), description: t("inspections.templates.deleteSectionError"), variant: "destructive" })
    }
  }

  // Opens the Add Item dialog
  const handleAddItem = (sectionId: string) => {
    setAddingItemToSectionId(sectionId); // Store which section we're adding to
    // Reset item form fields
    setNewItemNameEn("");
    setNewItemNameJa("");
    setNewItemDescEn("");
    setNewItemDescJa("");
    setNewItemRequiresPhoto(false);
    setNewItemRequiresNotes(false);
    setIsAddingItem(true); // Open the dialog
  }

  // Handles the submission of the Add Item dialog
  const handleAddItemSubmit = async () => {
    if (!addingItemToSectionId) return;
    
    if (!newItemNameEn.trim() && !newItemNameJa.trim()) {
       toast({ title: t("common.error"), description: t("inspections.templates.itemNameRequired"), variant: "destructive" });
       return;
    }
    setIsSavingItem(true);

    const nameTranslations: TranslationObject = {};
    if (newItemNameEn.trim()) nameTranslations.en = newItemNameEn.trim();
    if (newItemNameJa.trim()) nameTranslations.ja = newItemNameJa.trim();

    const descriptionTranslations: TranslationObject = {};
    if (newItemDescEn.trim()) descriptionTranslations.en = newItemDescEn.trim();
    if (newItemDescJa.trim()) descriptionTranslations.ja = newItemDescJa.trim();
    const descPayload = Object.keys(descriptionTranslations).length > 0 ? descriptionTranslations : undefined;

    try {
       const newItemData = await addInspectionItem(
         addingItemToSectionId,
         nameTranslations,
         newItemRequiresPhoto,
         newItemRequiresNotes,
         descPayload
       );

       // Format new item for state update
       const nameTrans = newItemData.name_translations || { en: '', ja: '' };
       const descTrans = newItemData.description_translations || { en: '', ja: '' };
       const title = nameTrans[locale] || nameTrans['en'] || t('common.untitled');

       const newItemForState: EditableItem = {
          ...newItemData,
          name_translations: nameTrans,
          description_translations: descTrans,
          title: title,
          requires_photo: newItemData.requires_photo ?? false,
          requires_notes: newItemData.requires_notes ?? false,
          order_number: newItemData.order_number ?? 0,
          isEditing: false,
       };

       // Update sections state by adding the new item to the correct section
       setSections(prevSections => 
          prevSections.map(section => {
             if (section.id === addingItemToSectionId) {
                return {
                   ...section,
                   items: [...section.items, newItemForState].sort((a, b) => a.order_number - b.order_number)
                };
             }
             return section;
          })
       );

       toast({ title: t("common.success"), description: t("inspections.templates.addItemSuccess") });
       setIsAddingItem(false); // Close dialog
    } catch (err) {
       console.error("Error adding item:", err);
       toast({ title: t("common.error"), description: t("inspections.templates.addItemError"), variant: "destructive" });
    } finally {
       setIsSavingItem(false);
    }
 };

  // Opens the Edit Item dialog and pre-fills data
  const handleEditItem = (sectionId: string, itemId: string) => {
    const section = sections.find(s => s.id === sectionId);
    const itemToEdit = section?.items.find(i => i.id === itemId);

    if (!itemToEdit || !section) return;

    setEditingItem(itemToEdit);
    setEditItemSectionId(sectionId);
    setEditItemNameEn(itemToEdit.name_translations.en || "");
    setEditItemNameJa(itemToEdit.name_translations.ja || "");
    setEditItemDescEn(itemToEdit.description_translations.en || "");
    setEditItemDescJa(itemToEdit.description_translations.ja || "");
    setEditItemRequiresPhoto(itemToEdit.requires_photo);
    setEditItemRequiresNotes(itemToEdit.requires_notes);
    setIsEditingItem(true);
  };

  // Handles the submission of the Edit Item dialog
  const handleEditItemSubmit = async () => {
    if (!editingItem) return;

    if (!editItemNameEn.trim() && !editItemNameJa.trim()) {
      toast({ title: t("common.error"), description: t("inspections.templates.itemNameRequired"), variant: "destructive" });
      return;
    }
    setIsSavingEditedItem(true);

    const nameTranslations: TranslationObject = {};
    if (editItemNameEn.trim()) nameTranslations.en = editItemNameEn.trim();
    if (editItemNameJa.trim()) nameTranslations.ja = editItemNameJa.trim();

    const descriptionTranslations: TranslationObject = {};
    if (editItemDescEn.trim()) descriptionTranslations.en = editItemDescEn.trim();
    if (editItemDescJa.trim()) descriptionTranslations.ja = editItemDescJa.trim();
    const descPayload = Object.keys(descriptionTranslations).length > 0 ? descriptionTranslations : undefined;

    // Ensure the updates object matches the expected structure for updateInspectionItem,
    // including the translation fields. Using Pick<InspectionItemTemplateRow, ...> aligns this.
    const updates: Partial<Pick<InspectionItemTemplateRow, 'name_translations' | 'description_translations' | 'requires_photo' | 'requires_notes'>> = {
        name_translations: nameTranslations,
        description_translations: descPayload,
        requires_photo: editItemRequiresPhoto,
        requires_notes: editItemRequiresNotes,
    };

    try {
      // Pass the correctly typed updates object
      const updatedItemData = await updateInspectionItem(editingItem.id, updates);
      
      // Format updated item for state
      const nameTrans = updatedItemData.name_translations || { en: '', ja: '' };
      const descTrans = updatedItemData.description_translations || { en: '', ja: '' };
      const title = nameTrans[locale] || nameTrans['en'] || t('common.untitled');

      const updatedItemForState: EditableItem = {
         ...editingItem, // Keep original fields not returned by update
         ...updatedItemData, // Apply backend updates
         name_translations: nameTrans,
         description_translations: descTrans,
         title: title,
         requires_photo: updatedItemData.requires_photo ?? false,
         requires_notes: updatedItemData.requires_notes ?? false,
         order_number: updatedItemData.order_number ?? 0,
      };

      // Update local state
      setSections(prevSections =>
        prevSections.map(section => {
          if (section.id === editItemSectionId) {
            return {
              ...section,
              items: section.items.map(item => 
                item.id === editingItem.id ? updatedItemForState : item
              ).sort((a, b) => a.order_number - b.order_number) // Re-sort items
            };
          }
          return section;
        })
      );

      toast({ title: t("common.success"), description: t("inspections.templates.editItemSuccess") });
      setIsEditingItem(false);
      setEditingItem(null);
      setEditItemSectionId(null);
    } catch (err) {
      console.error("Error updating item:", err);
      toast({ title: t("common.error"), description: t("inspections.templates.editItemError"), variant: "destructive" });
    } finally {
      setIsSavingEditedItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
     // Find which section the item belongs to for UI update
     const sectionIndex = sections.findIndex(sec => sec.items.some(item => item.id === itemId));
     if (sectionIndex === -1) {
       console.error("Could not find section for item deletion");
       return;
     }
     const sectionId = sections[sectionIndex].id;

    // Optimistic UI update: Remove the item immediately
    const originalSections = JSON.parse(JSON.stringify(sections)); // Deep copy for revert
    setSections(prevSections =>
      prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.filter(item => item.id !== itemId)
          };
        }
        return section;
      })
    );

    try {
      await deleteInspectionItem(itemId);
      toast({ title: t("common.success"), description: t("inspections.templates.deleteItemSuccess") })
    } catch (err) {
      console.error("Error deleting item:", err);
      // Revert UI on error
      setSections(originalSections);
      toast({ title: t("common.error"), description: t("inspections.templates.deleteItemError"), variant: "destructive" })
    }
  }

  // --- Render Logic ---

  if (isLoading) {
    return <div>{t("common.loading")}</div>
  }

  if (error) {
    return <div className="text-destructive">{error}</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
           {/* Maybe add description here? */}
           {/* <CardDescription>{t("inspections.templates.managerDescription", { type })}</CardDescription> */}
           <div className="flex justify-between items-center">
             <CardTitle className="capitalize">{t("inspections.templates.manageTitle", { type })}</CardTitle>
             {/* Dialog Trigger for Adding Section */}
             <Dialog open={isAddingSection} onOpenChange={setIsAddingSection}>
               <DialogTrigger asChild>
                 <Button size="sm">
                   <Plus className="mr-2 h-4 w-4" />
                   {t("inspections.templates.addSection")}
                 </Button>
               </DialogTrigger>
               <DialogContent className="sm:max-w-[425px]">
                 <DialogHeader>
                   <DialogTitle>{t("inspections.templates.newSectionTitle")}</DialogTitle>
                   <DialogDescription>
                     {t("inspections.templates.newSectionDescription")}
                   </DialogDescription>
                 </DialogHeader>
                 {/* Update Dialog content for EN/JA inputs */}
                 <div className="grid gap-4 py-4">
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="section-name-en" className="text-right">
                       {t("inspections.templates.sectionNameLabel")} (EN)
                     </Label>
                     <Input 
                       id="section-name-en" 
                       value={newSectionNameEn} 
                       onChange={(e) => setNewSectionNameEn(e.target.value)} 
                       className="col-span-3" 
                       placeholder={t("inspections.templates.sectionNamePlaceholder")} 
                     />
                   </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="section-name-ja" className="text-right">
                       {t("inspections.templates.sectionNameLabel")} (JA)
                     </Label>
                     <Input 
                       id="section-name-ja" 
                       value={newSectionNameJa} 
                       onChange={(e) => setNewSectionNameJa(e.target.value)} 
                       className="col-span-3" 
                       placeholder={t("inspections.templates.sectionNamePlaceholderJa")} 
                     />
                   </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="section-description-en" className="text-right">
                       {t("inspections.templates.sectionDescriptionLabel")} (EN)
                     </Label>
                     <Input 
                       id="section-description-en" 
                       value={newSectionDescEn} 
                       onChange={(e) => setNewSectionDescEn(e.target.value)} 
                       className="col-span-3" 
                       placeholder={t("inspections.templates.sectionDescriptionPlaceholder")} 
                     />
                   </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="section-description-ja" className="text-right">
                       {t("inspections.templates.sectionDescriptionLabel")} (JA)
                     </Label>
                     <Input 
                       id="section-description-ja" 
                       value={newSectionDescJa} 
                       onChange={(e) => setNewSectionDescJa(e.target.value)} 
                       className="col-span-3" 
                       placeholder={t("inspections.templates.sectionDescriptionPlaceholderJa")} 
                     />
                   </div>
                 </div>
                 <DialogFooter>
                   <DialogClose asChild>
                      <Button type="button" variant="outline">{t("common.cancel")}</Button>
                   </DialogClose>
                   <Button type="button" onClick={handleAddSectionSubmit} disabled={isSavingSection}>
                     {isSavingSection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                     {isSavingSection ? t("common.saving") : t("common.save")}
                   </Button>
                 </DialogFooter>
               </DialogContent>
             </Dialog>
           </div>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {t("inspections.templates.noSections")}
            </p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-4">
              {sections.map((section, sectionIndex) => (
                <AccordionItem value={section.id} key={section.id} className="border rounded-md px-4 bg-muted/30">
                  <div className="flex justify-between items-center w-full py-3">
                    <AccordionTrigger className="hover:no-underline flex-1 text-left p-0">
                      <span className="font-medium text-lg">{section.title || t('common.untitled')}</span>
                    </AccordionTrigger>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditSection(section.id); }} title={t('common.edit')}>
                         <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                         <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('inspections.templates.deleteSectionConfirm', { name: section.title || 'Untitled Section' })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSection(section.id)} className="bg-destructive hover:bg-destructive/80">
                                {t('common.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                    </div>
                  </div>
                  <AccordionContent className="pt-2 pb-2 border-t mt-0">
                    <div className="space-y-4 pl-4">
                      {section.items?.map((item, itemIndex) => (
                         <div key={item.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                            <div className="space-y-1 flex-grow mr-4">
                              <p className="font-medium">{item.title || t('common.untitled')}</p>
                              {item.description_translations[locale] && <p className="text-sm text-muted-foreground">{item.description_translations[locale]}</p>}
                              <div className="flex gap-4 pt-1">
                                 <div className="flex items-center space-x-2">
                                    <Checkbox id={`photo-${item.id}`} checked={item.requires_photo ?? false} disabled />
                                    <Label htmlFor={`photo-${item.id}`} className="text-xs">{t('inspections.templates.requiresPhoto')}</Label>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                    <Checkbox id={`notes-${item.id}`} checked={item.requires_notes ?? false} disabled />
                                    <Label htmlFor={`notes-${item.id}`} className="text-xs">{t('inspections.templates.requiresNotes')}</Label>
                                 </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                               <Button variant="ghost" size="icon" onClick={() => { handleEditItem(section.id, item.id); }} title={t('common.edit')}>
                                 <Pencil className="h-4 w-4" />
                               </Button>
                               <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('inspections.templates.deleteItemConfirm', { name: item.title || 'Untitled Item' })}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive hover:bg-destructive/80">
                                      {t('common.delete')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                         </div>
                      ))}
                       <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => handleAddItem(section.id)}>
                         <Plus className="mr-2 h-4 w-4" />
                         {t("inspections.templates.addItem")}
                       </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
      {/* Add Modals/Dialogs for editing/adding sections and items here */}

      {/* Add Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
         <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>{t("inspections.templates.newItemTitle")}</DialogTitle>
             <DialogDescription>
               {t("inspections.templates.newItemDescription")}
             </DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="item-name-en" className="text-right">
                 {t("inspections.templates.itemNameLabel")} (EN)
               </Label>
               <Input 
                 id="item-name-en" 
                 value={newItemNameEn} 
                 onChange={(e) => setNewItemNameEn(e.target.value)} 
                 className="col-span-3" 
                 placeholder={t("inspections.templates.itemNamePlaceholder")} 
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="item-name-ja" className="text-right">
                 {t("inspections.templates.itemNameLabel")} (JA)
               </Label>
               <Input 
                 id="item-name-ja" 
                 value={newItemNameJa} 
                 onChange={(e) => setNewItemNameJa(e.target.value)} 
                 className="col-span-3" 
                 placeholder={t("inspections.templates.itemNamePlaceholderJa", { defaultValue: "項目名"})} 
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="item-description-en" className="text-right">
                 {t("inspections.templates.itemDescriptionLabel")} (EN)
               </Label>
               <Input 
                 id="item-description-en" 
                 value={newItemDescEn} 
                 onChange={(e) => setNewItemDescEn(e.target.value)} 
                 className="col-span-3" 
                 placeholder={t("inspections.templates.itemDescriptionPlaceholder")} 
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="item-description-ja" className="text-right">
                 {t("inspections.templates.itemDescriptionLabel")} (JA)
               </Label>
               <Input 
                 id="item-description-ja" 
                 value={newItemDescJa} 
                 onChange={(e) => setNewItemDescJa(e.target.value)} 
                 className="col-span-3" 
                 placeholder={t("inspections.templates.itemDescriptionPlaceholderJa", { defaultValue: "項目の説明"})} 
               />
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox 
                   id="item-requires-photo"
                   checked={newItemRequiresPhoto}
                   onCheckedChange={(checked) => setNewItemRequiresPhoto(checked === true)} 
                />
                <Label htmlFor="item-requires-photo">{t('inspections.templates.requiresPhoto')}</Label>
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox 
                   id="item-requires-notes"
                   checked={newItemRequiresNotes}
                   onCheckedChange={(checked) => setNewItemRequiresNotes(checked === true)} 
                />
                <Label htmlFor="item-requires-notes">{t('inspections.templates.requiresNotes')}</Label>
             </div>
           </div>
           <DialogFooter>
             <DialogClose asChild>
               <Button type="button" variant="outline">{t("common.cancel")}</Button>
             </DialogClose>
             <Button type="button" onClick={handleAddItemSubmit} disabled={isSavingItem}>
               {isSavingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
               {isSavingItem ? t("common.saving") : t("common.save")}
             </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={isEditingSection} onOpenChange={setIsEditingSection}>
         <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>{t("inspections.templates.editSectionTitle")}</DialogTitle>
             <DialogDescription>
               {t("inspections.templates.editSectionDescription")}
             </DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="edit-section-name-en" className="text-right">
                 {t("inspections.templates.sectionNameLabel")} (EN)
               </Label>
               <Input 
                 id="edit-section-name-en" 
                 value={editSectionNameEn} 
                 onChange={(e) => setEditSectionNameEn(e.target.value)} 
                 className="col-span-3" 
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="edit-section-name-ja" className="text-right">
                 {t("inspections.templates.sectionNameLabel")} (JA)
               </Label>
               <Input 
                 id="edit-section-name-ja" 
                 value={editSectionNameJa} 
                 onChange={(e) => setEditSectionNameJa(e.target.value)} 
                 className="col-span-3" 
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="edit-section-description-en" className="text-right">
                 {t("inspections.templates.sectionDescriptionLabel")} (EN)
               </Label>
               <Input 
                 id="edit-section-description-en" 
                 value={editSectionDescEn} 
                 onChange={(e) => setEditSectionDescEn(e.target.value)} 
                 className="col-span-3" 
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="edit-section-description-ja" className="text-right">
                 {t("inspections.templates.sectionDescriptionLabel")} (JA)
               </Label>
               <Input 
                 id="edit-section-description-ja" 
                 value={editSectionDescJa} 
                 onChange={(e) => setEditSectionDescJa(e.target.value)} 
                 className="col-span-3" 
               />
             </div>
           </div>
           <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => setEditingSection(null)}>{t("common.cancel")}</Button>
             </DialogClose>
             <Button type="button" onClick={handleEditSectionSubmit} disabled={isSavingEditedSection}>
               {isSavingEditedSection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
               {isSavingEditedSection ? t("common.saving") : t("common.save")}
             </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>
      
      {/* Edit Item Dialog */}
      <Dialog open={isEditingItem} onOpenChange={setIsEditingItem}>
         <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>{t("inspections.templates.editItemTitle")}</DialogTitle>
             <DialogDescription>
                {t("inspections.templates.editItemDescription")}
             </DialogDescription>
           </DialogHeader>
            <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="edit-item-name-en" className="text-right">
                 {t("inspections.templates.itemNameLabel")} (EN)
               </Label>
               <Input 
                 id="edit-item-name-en" 
                 value={editItemNameEn} 
                 onChange={(e) => setEditItemNameEn(e.target.value)} 
                 className="col-span-3" 
               />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="edit-item-name-ja" className="text-right">
                 {t("inspections.templates.itemNameLabel")} (JA)
               </Label>
               <Input 
                 id="edit-item-name-ja" 
                 value={editItemNameJa} 
                 onChange={(e) => setEditItemNameJa(e.target.value)} 
                 className="col-span-3" 
               />
             </div>
              <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="edit-item-description-en" className="text-right">
                 {t("inspections.templates.itemDescriptionLabel")} (EN)
               </Label>
               <Input 
                 id="edit-item-description-en" 
                 value={editItemDescEn} 
                 onChange={(e) => setEditItemDescEn(e.target.value)} 
                 className="col-span-3" 
               />
             </div>
              <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="edit-item-description-ja" className="text-right">
                 {t("inspections.templates.itemDescriptionLabel")} (JA)
               </Label>
               <Input 
                 id="edit-item-description-ja" 
                 value={editItemDescJa} 
                 onChange={(e) => setEditItemDescJa(e.target.value)} 
                 className="col-span-3" 
               />
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox 
                   id="edit-item-requires-photo"
                   checked={editItemRequiresPhoto}
                   onCheckedChange={(checked) => setEditItemRequiresPhoto(checked === true)} 
                />
                <Label htmlFor="edit-item-requires-photo">{t('inspections.templates.requiresPhoto')}</Label>
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox 
                   id="edit-item-requires-notes"
                   checked={editItemRequiresNotes}
                   onCheckedChange={(checked) => setEditItemRequiresNotes(checked === true)} 
                />
                <Label htmlFor="edit-item-requires-notes">{t('inspections.templates.requiresNotes')}</Label>
             </div>
           </div>
           <DialogFooter>
             <DialogClose asChild>
               <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>{t("common.cancel")}</Button>
             </DialogClose>
             <Button type="button" onClick={handleEditItemSubmit} disabled={isSavingEditedItem}>
               {isSavingEditedItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
               {isSavingEditedItem ? t("common.saving") : t("common.save")}
             </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  )
} 