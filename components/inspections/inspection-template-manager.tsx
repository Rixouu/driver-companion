"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Pencil, Save, X, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
   addInspectionSection,
   updateInspectionSection,
   deleteInspectionSection,
   addInspectionItem,
   updateInspectionItem,
   deleteInspectionItem,
   type InspectionCategory,
   type InspectionItemTemplate
} from "@/lib/services/inspections"
import type { InspectionType } from "@/types/inspections"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// Define TranslationObject type
type TranslationObject = { [key: string]: string };

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

  // Add new state for force delete checkbox
  const [forceDeleteItem, setForceDeleteItem] = useState(false);

  // Effect to load initial template data
  useEffect(() => {
    async function loadTemplate() {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch the templates for the given type from the API route
        const response = await fetch(`/api/inspection-templates/${type}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || `Failed to fetch templates: ${response.statusText}`)
        }
        const fetchedCategories: InspectionCategory[] = await response.json()
        
        // Map fetched data to EditableSection, calculating locale-specific title
        const formattedSections = fetchedCategories.map((category: InspectionCategory): EditableSection => {
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
                items: (category.inspection_item_templates || []).map((item: InspectionItemTemplate): EditableItem => {
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
                }).sort((a: EditableItem, b: EditableItem) => (a.order_number ?? 0) - (b.order_number ?? 0)), // Sort items
                isEditing: false, // Initialize editing state if needed
            };
        }).sort((a: EditableSection, b: EditableSection) => (a.order_number ?? 0) - (b.order_number ?? 0)); // Sort sections

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
  }, [type, t, locale])
  
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
    if (!newSectionNameEn.trim() && !newSectionNameJa.trim()) {
      toast({ title: t("common.error"), description: t("inspections.templates.sectionNameRequired"), variant: "destructive" })
      return
    }
    setIsSavingSection(true)

    const nameTranslations: TranslationObject = {};
    if (newSectionNameEn.trim()) nameTranslations.en = newSectionNameEn.trim();
    if (newSectionNameJa.trim()) nameTranslations.ja = newSectionNameJa.trim();

    const descriptionTranslations: TranslationObject = {};
    if (newSectionDescEn.trim()) descriptionTranslations.en = newSectionDescEn.trim();
    if (newSectionDescJa.trim()) descriptionTranslations.ja = newSectionDescJa.trim();
    
    const payload = {
      type,
      name_translations: nameTranslations,
      description_translations: Object.keys(descriptionTranslations).length > 0 ? descriptionTranslations : undefined,
    };

    try {
      const response = await fetch('/api/inspection-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Failed to add section: ${response.statusText}`);
      }
      const newSectionData: InspectionCategory = await response.json();
      
      const nameTrans = newSectionData.name_translations || { en: '', ja: '' };
      const descTrans = newSectionData.description_translations || { en: '', ja: '' };
      const title = nameTrans[locale] || nameTrans['en'] || t('common.untitled'); 

      const newSectionForState: EditableSection = {
         ...newSectionData, 
         name_translations: nameTrans,
         description_translations: descTrans,
         title: title,
         items: [], 
         order_number: newSectionData.order_number ?? 0, 
         isEditing: false,
      };

      setSections(prevSections => 
         [...prevSections, newSectionForState].sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
      );
      
      toast({ title: t("common.success"), description: t("inspections.templates.addSectionSuccess") })
      setNewSectionNameEn("")
      setNewSectionNameJa("")
      setNewSectionDescEn("")
      setNewSectionDescJa("")
      setIsAddingSection(false) 
    } catch (err) {
      console.error("Error adding section:", err);
      const message = err instanceof Error ? err.message : t("inspections.templates.addSectionError");
      toast({ title: t("common.error"), description: message, variant: "destructive" });
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
    
    const payload = {
      name_translations: nameTranslations,
      description_translations: Object.keys(descriptionTranslations).length > 0 ? descriptionTranslations : undefined,
      // order_number could be part of the payload if ordering is handled here
    };

    try {
      const response = await fetch(`/api/inspection-sections/${editingSection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Failed to update section: ${response.statusText}`);
      }
      const updatedSectionData: InspectionCategory = await response.json();

      const nameTrans = updatedSectionData.name_translations || { en: '', ja: '' };
      const descTrans = updatedSectionData.description_translations || { en: '', ja: '' };
      const title = nameTrans[locale] || nameTrans['en'] || t('common.untitled');

      const updatedSectionForState: EditableSection = {
         ...editingSection, 
         ...updatedSectionData, 
         name_translations: nameTrans,
         description_translations: descTrans,
         title: title,
         order_number: updatedSectionData.order_number ?? 0,
      };

      setSections(prevSections =>
        prevSections.map(section => {
          if (section.id === editingSection.id) {
            return updatedSectionForState;
          }
          return section;
        }).sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
      );

      toast({ title: t("common.success"), description: t("inspections.templates.editSectionSuccess") });
      setIsEditingSection(false);
      setEditingSection(null);
    } catch (err) {
      console.error("Error updating section:", err);
      const message = err instanceof Error ? err.message : t("inspections.templates.editSectionError");
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    } finally {
      setIsSavingEditedSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    const originalSections = JSON.parse(JSON.stringify(sections)); 
    setSections(prevSections => prevSections.filter(section => section.id !== sectionId));

    try {
      const response = await fetch(`/api/inspection-sections/${sectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        // If the API returns a specific code for SECTION_NOT_EMPTY, use that for a better message
        if (errorData.code === 'SECTION_NOT_EMPTY') {
          throw new Error(errorData.details || t("inspections.templates.deleteSectionErrorNotEmpty"));
        } 
        throw new Error(errorData.details || `Failed to delete section: ${response.statusText}`);
      }
      // No need to parse response.json() if DELETE is successful with 200/204 and no body.
      toast({ title: t("common.success"), description: t("inspections.templates.deleteSectionSuccess") })
    } catch (err) {
      console.error("Error deleting section:", err);
      setSections(originalSections);
      
      const errorMessage = err instanceof Error ? err.message : t("inspections.templates.deleteSectionError");
      toast({ 
        title: t("common.error"), 
        description: errorMessage, 
        variant: "destructive" 
      })
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

    const payload = {
      category_id: addingItemToSectionId,
      name_translations: nameTranslations,
      description_translations: Object.keys(descriptionTranslations).length > 0 ? descriptionTranslations : undefined,
      requires_photo: newItemRequiresPhoto,
      requires_notes: newItemRequiresNotes,
      // order_number will be handled by backend or a subsequent update if needed
    };

    try {
      const response = await fetch('/api/inspection-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Failed to add item: ${response.statusText}`);
      }
      const newItemData: InspectionItemTemplate = await response.json();

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

       setSections(prevSections => 
          prevSections.map(section => {
             if (section.id === addingItemToSectionId) {
                return {
                   ...section,
                   items: [...section.items, newItemForState].sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
                };
             }
             return section;
          })
       );

       toast({ title: t("common.success"), description: t("inspections.templates.addItemSuccess") });
       setIsAddingItem(false); 
    } catch (err) {
       console.error("Error adding item:", err);
       const message = err instanceof Error ? err.message : t("inspections.templates.addItemError");
       toast({ title: t("common.error"), description: message, variant: "destructive" });
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
    setEditItemNameEn(itemToEdit.name_translations?.en || "");
    setEditItemNameJa(itemToEdit.name_translations?.ja || "");
    setEditItemDescEn(itemToEdit.description_translations?.en || "");
    setEditItemDescJa(itemToEdit.description_translations?.ja || "");
    setEditItemRequiresPhoto(itemToEdit.requires_photo ?? false);
    setEditItemRequiresNotes(itemToEdit.requires_notes ?? false);
    setIsEditingItem(true);
  };

  // Handles the submission of the Edit Item dialog
  const handleEditItemSubmit = async () => {
    if (!editingItem || !editItemSectionId) return; // Ensure editItemSectionId is also checked

    if (!editItemNameEn.trim() && !editItemNameJa.trim()) {
      toast({ title: t("common.error"), description: t("inspections.templates.itemNameRequired", { defaultValue: "Please provide a name for the item in at least one language" }), variant: "destructive" });
      return;
    }
    setIsSavingEditedItem(true);

    const nameTranslations: TranslationObject = {};
    if (editItemNameEn.trim()) nameTranslations.en = editItemNameEn.trim();
    if (editItemNameJa.trim()) nameTranslations.ja = editItemNameJa.trim();

    const descriptionTranslations: TranslationObject = {};
    if (editItemDescEn.trim()) descriptionTranslations.en = editItemDescEn.trim();
    if (editItemDescJa.trim()) descriptionTranslations.ja = editItemDescJa.trim();

    const payload: Partial<InspectionItemTemplate & { name_translations: TranslationObject, description_translations: TranslationObject | undefined }> = {
        name_translations: nameTranslations,
        description_translations: Object.keys(descriptionTranslations).length > 0 ? descriptionTranslations : undefined,
        requires_photo: editItemRequiresPhoto,
        requires_notes: editItemRequiresNotes,
        // order_number: editingItem.order_number, // If order editing is implemented, pass it here
    };

    try {
      const response = await fetch(`/api/inspection-items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Failed to update item: ${response.statusText}`);
      }
      const updatedItemData: InspectionItemTemplate = await response.json();
      
      const nameTrans = updatedItemData.name_translations || { en: '', ja: '' };
      const descTrans = updatedItemData.description_translations || { en: '', ja: '' };
      const title = nameTrans[locale] || nameTrans['en'] || t('common.untitled');

      const updatedItemForState: EditableItem = {
         ...editingItem, 
         ...updatedItemData, 
         name_translations: nameTrans,
         description_translations: descTrans,
         title: title,
         requires_photo: updatedItemData.requires_photo ?? false,
         requires_notes: updatedItemData.requires_notes ?? false,
         order_number: updatedItemData.order_number ?? 0,
      };

      setSections(prevSections =>
        prevSections.map(section => {
          if (section.id === editItemSectionId) { // Use editItemSectionId captured when edit began
            return {
              ...section,
              items: section.items.map(item => 
                item.id === editingItem.id ? updatedItemForState : item
              ).sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
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
      const message = err instanceof Error ? err.message : t("inspections.templates.editItemError");
      toast({ title: t("common.error"), description: message, variant: "destructive" });
    } finally {
      setIsSavingEditedItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
     const sectionIndex = sections.findIndex(sec => sec.items.some(item => item.id === itemId));
     if (sectionIndex === -1) {
       console.error("Could not find section for item deletion");
       toast({ title: t("common.error"), description: t("inspections.templates.itemNotFound"), variant: "destructive" });
       return;
     }
     const sectionId = sections[sectionIndex].id;

    const originalSections = JSON.parse(JSON.stringify(sections)); 
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
      const apiUrl = forceDeleteItem ? `/api/inspection-items/${itemId}?force=true` : `/api/inspection-items/${itemId}`;
      const response = await fetch(apiUrl, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'ITEM_IN_USE') {
          throw new Error(errorData.details || t("inspections.templates.deleteItemErrorInUse"));
        }
        throw new Error(errorData.details || `Failed to delete item: ${response.statusText}`);
      }

      toast({ title: t("common.success"), description: t("inspections.templates.deleteItemSuccess") });
      setForceDeleteItem(false); 
    } catch (err) {
      console.error("Error deleting item:", err);
      setSections(originalSections);
      
      const errorMessage = err instanceof Error ? err.message : t("inspections.templates.deleteItemError");
      toast({ 
        title: t("common.error"), 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  }

  // --- Render Logic ---

  if (isLoading) {
    return <div>{t("common.loading", { defaultValue: "Loading..." })}</div>
  }

  if (error) {
    return <div className="text-destructive">{error}</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-5">
           <div className="flex flex-col gap-4">
             <div className="space-y-1.5">
               <CardTitle className="capitalize text-base font-normal">{t("inspections.templates.manageTitle", { type })}</CardTitle>
               <CardDescription className="text-sm">
                 {t("inspections.templates.managerDescription", { type, defaultValue: `Configure and customize your ${type} inspection templates. Add sections and items to streamline your inspection process.` })}
               </CardDescription>
             </div>
             {/* Dialog Trigger for Adding Section */}
             <Dialog open={isAddingSection} onOpenChange={setIsAddingSection}>
               <DialogTrigger asChild>
                 <Button size="sm" className="w-full sm:w-auto">
                   <Plus className="mr-2 h-4 w-4" />
                   {t("inspections.templates.addSection")}
                 </Button>
               </DialogTrigger>
               <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
                 <DialogHeader>
                   <DialogTitle>{t("inspections.templates.newSectionTitle")}</DialogTitle>
                   <DialogDescription>
                     {t("inspections.templates.newSectionDescription")}
                   </DialogDescription>
                 </DialogHeader>
                 {/* Update Dialog content for EN/JA inputs */}
                 <div className="grid gap-4 py-4">
                   <div className="grid grid-cols-12 items-center gap-2">
                     <Label htmlFor="section-name-en" className="col-span-12 xs:col-span-4 xs:text-right">
                       {t("inspections.templates.sectionNameLabel", { defaultValue: "Section Name" })} (EN)
                     </Label>
                     <Input 
                       id="section-name-en" 
                       value={newSectionNameEn} 
                       onChange={(e) => setNewSectionNameEn(e.target.value)} 
                       className="col-span-12 xs:col-span-8" 
                       placeholder={t("inspections.templates.sectionNamePlaceholder", { defaultValue: "Enter section name..." })} 
                     />
                   </div>
                   <div className="grid grid-cols-12 items-center gap-2">
                     <Label htmlFor="section-name-ja" className="col-span-12 xs:col-span-4 xs:text-right">
                       {t("inspections.templates.sectionNameLabel", { defaultValue: "セクション名" })} (JA)
                     </Label>
                     <Input 
                       id="section-name-ja" 
                       value={newSectionNameJa} 
                       onChange={(e) => setNewSectionNameJa(e.target.value)} 
                       className="col-span-12 xs:col-span-8" 
                       placeholder={t("inspections.templates.sectionNamePlaceholderJa", { defaultValue: "セクション名を入力..." })} 
                     />
                   </div>
                   <div className="grid grid-cols-12 items-center gap-2">
                     <Label htmlFor="section-description-en" className="col-span-12 xs:col-span-4 xs:text-right">
                       {t("inspections.templates.sectionDescriptionLabel", { defaultValue: "Description" })} (EN)
                     </Label>
                     <Input 
                       id="section-description-en" 
                       value={newSectionDescEn} 
                       onChange={(e) => setNewSectionDescEn(e.target.value)} 
                       className="col-span-12 xs:col-span-8" 
                       placeholder={t("inspections.templates.sectionDescriptionPlaceholder", { defaultValue: "Enter description (optional)..." })} 
                     />
                   </div>
                   <div className="grid grid-cols-12 items-center gap-2">
                     <Label htmlFor="section-description-ja" className="col-span-12 xs:col-span-4 xs:text-right">
                       {t("inspections.templates.sectionDescriptionLabel", { defaultValue: "説明" })} (JA)
                     </Label>
                     <Input 
                       id="section-description-ja" 
                       value={newSectionDescJa} 
                       onChange={(e) => setNewSectionDescJa(e.target.value)} 
                       className="col-span-12 xs:col-span-8" 
                       placeholder={t("inspections.templates.sectionDescriptionPlaceholderJa", { defaultValue: "説明を入力（オプション）..." })} 
                     />
                   </div>
                 </div>
                 <DialogFooter className="flex-col xs:flex-row gap-2">
                   <DialogClose asChild>
                      <Button type="button" variant="outline" className="w-full xs:w-auto">{t("common.cancel")}</Button>
                   </DialogClose>
                   <Button type="button" onClick={handleAddSectionSubmit} disabled={isSavingSection} className="w-full xs:w-auto">
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
              {t("inspections.templates.noSections", { defaultValue: "No inspection sections found. Create one to get started." })}
            </p>
          ) : (
            <Accordion type="multiple" className="w-full space-y-4">
              {sections.map((section, sectionIndex) => (
                <AccordionItem value={section.id} key={section.id} className="border rounded-md px-4 bg-muted/30">
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center w-full py-2 gap-1">
                    <AccordionTrigger className="hover:no-underline flex-1 text-left p-0">
                      <span className="font-medium">{section.title || t('common.untitled')}</span>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditSection(section.id); }} title={t('common.edit')}>
                         <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                         <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('inspections.templates.deleteSectionConfirm', { name: section.title || 'Untitled Section', defaultValue: "Are you sure you want to delete the section '{name}'? This action cannot be undone." })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                              <AlertDialogCancel className="w-full xs:w-auto">{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSection(section.id)} className="w-full xs:w-auto bg-destructive hover:bg-destructive/80">
                                {t('common.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                    </div>
                  </div>
                  <AccordionContent className="pt-2 pb-2 border-t mt-0">
                    <div className="space-y-4 pl-2 xs:pl-4">
                      {section.items?.map((item, itemIndex) => (
                         <div key={item.id} className="flex flex-col xs:flex-row xs:items-center justify-between p-2 xs:p-3 border rounded-md bg-background">
                            <div className="space-y-1 flex-grow mr-2 xs:mr-4 mb-2 xs:mb-0">
                              <p className="font-medium text-sm xs:text-base">{item.title || t('common.untitled')}</p>
                              {item.description_translations[locale] && 
                                <p className="text-xs xs:text-sm text-muted-foreground">
                                  {item.description_translations[locale]}
                                </p>
                              }
                              <div className="flex gap-4 pt-1">
                                 <div className="flex items-center space-x-2">
                                    <Checkbox id={`photo-${item.id}`} checked={item.requires_photo ?? false} disabled />
                                    <Label htmlFor={`photo-${item.id}`} className="text-xs">{t('inspections.templates.requiresPhoto', { defaultValue: "Requires Photo" })}</Label>
                                 </div>
                                 <div className="flex items-center space-x-2">
                                    <Checkbox id={`notes-${item.id}`} checked={item.requires_notes ?? false} disabled />
                                    <Label htmlFor={`notes-${item.id}`} className="text-xs">{t('inspections.templates.requiresNotes', { defaultValue: "Requires Notes" })}</Label>
                                 </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 self-end xs:self-auto">
                               <Button variant="ghost" size="icon" onClick={() => { handleEditItem(section.id, item.id); }} title={t('common.edit')}>
                                 <Pencil className="h-4 w-4" />
                               </Button>
                               <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('inspections.templates.deleteItemConfirm', { name: item.title || 'Untitled Item', defaultValue: "Are you sure you want to delete the item '{name}'? This action cannot be undone." })}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="flex items-center space-x-2 py-4">
                                    <Checkbox 
                                      id={`force-delete-${item.id}`}
                                      checked={forceDeleteItem}
                                      onCheckedChange={(checked) => setForceDeleteItem(checked === true)} 
                                    />
                                    <Label htmlFor={`force-delete-${item.id}`} className="text-xs xs:text-sm text-destructive">
                                      Force delete (will also delete any inspections using this item)
                                    </Label>
                                  </div>
                                  <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                                    <AlertDialogCancel onClick={() => setForceDeleteItem(false)} className="w-full xs:w-auto">{t('common.cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="w-full xs:w-auto bg-destructive hover:bg-destructive/80">
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
         <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>{t("inspections.templates.newItemTitle", { defaultValue: "Add New Item" })}</DialogTitle>
             <DialogDescription>
               {t("inspections.templates.newItemDescription", { defaultValue: "Add a new inspection item to this section." })}
             </DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="grid grid-cols-12 items-center gap-2">
               <Label htmlFor="item-name-en" className="col-span-12 xs:col-span-4 xs:text-right">
                 {t("inspections.templates.itemNameLabel", { defaultValue: "Item Name" })} (EN)
               </Label>
               <Input 
                 id="item-name-en" 
                 value={newItemNameEn} 
                 onChange={(e) => setNewItemNameEn(e.target.value)} 
                 className="col-span-12 xs:col-span-8" 
                 placeholder={t("inspections.templates.itemNamePlaceholder", { defaultValue: "Enter item name..." })} 
               />
             </div>
             <div className="grid grid-cols-12 items-center gap-2">
               <Label htmlFor="item-name-ja" className="col-span-12 xs:col-span-4 xs:text-right">
                 {t("inspections.templates.itemNameLabel", { defaultValue: "項目名" })} (JA)
               </Label>
               <Input 
                 id="item-name-ja" 
                 value={newItemNameJa} 
                 onChange={(e) => setNewItemNameJa(e.target.value)} 
                 className="col-span-12 xs:col-span-8" 
                 placeholder={t("inspections.templates.itemNamePlaceholderJa", { defaultValue: "項目名を入力..." })} 
               />
             </div>
             <div className="grid grid-cols-12 items-center gap-2">
               <Label htmlFor="item-description-en" className="col-span-12 xs:col-span-4 xs:text-right">
                 {t("inspections.templates.itemDescriptionLabel", { defaultValue: "Description" })} (EN)
               </Label>
               <Input 
                 id="item-description-en" 
                 value={newItemDescEn} 
                 onChange={(e) => setNewItemDescEn(e.target.value)} 
                 className="col-span-12 xs:col-span-8" 
                 placeholder={t("inspections.templates.itemDescriptionPlaceholder", { defaultValue: "Enter description (optional)..." })} 
               />
             </div>
             <div className="grid grid-cols-12 items-center gap-2">
               <Label htmlFor="item-description-ja" className="col-span-12 xs:col-span-4 xs:text-right">
                 {t("inspections.templates.itemDescriptionLabel", { defaultValue: "説明" })} (JA)
               </Label>
               <Input 
                 id="item-description-ja" 
                 value={newItemDescJa} 
                 onChange={(e) => setNewItemDescJa(e.target.value)} 
                 className="col-span-12 xs:col-span-8" 
                 placeholder={t("inspections.templates.itemDescriptionPlaceholderJa", { defaultValue: "説明を入力（オプション）..." })} 
               />
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox 
                   id="item-requires-photo"
                   checked={newItemRequiresPhoto}
                   onCheckedChange={(checked) => setNewItemRequiresPhoto(checked === true)} 
                />
                <Label htmlFor="item-requires-photo">{t('inspections.templates.requiresPhoto', { defaultValue: "Requires Photo" })}</Label>
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox 
                   id="item-requires-notes"
                   checked={newItemRequiresNotes}
                   onCheckedChange={(checked) => setNewItemRequiresNotes(checked === true)} 
                />
                <Label htmlFor="item-requires-notes">{t('inspections.templates.requiresNotes', { defaultValue: "Requires Notes" })}</Label>
             </div>
           </div>
           <DialogFooter className="flex-col xs:flex-row gap-2">
             <DialogClose asChild>
               <Button type="button" variant="outline" className="w-full xs:w-auto">{t("common.cancel")}</Button>
             </DialogClose>
             <Button type="button" onClick={handleAddItemSubmit} disabled={isSavingItem} className="w-full xs:w-auto">
               {isSavingItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
               {isSavingItem ? t("common.saving") : t("common.save")}
             </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={isEditingSection} onOpenChange={setIsEditingSection}>
         <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>{t("inspections.templates.editSectionTitle", { defaultValue: "Edit Section" })}</DialogTitle>
             <DialogDescription>
               {t("inspections.templates.editSectionDescription", { defaultValue: "Update the section details below." })}
             </DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="grid grid-cols-12 items-center gap-2">
               <Label htmlFor="edit-section-name-en" className="col-span-12 xs:col-span-4 xs:text-right">
                 {t("inspections.templates.sectionNameLabel")} (EN)
               </Label>
               <Input 
                 id="edit-section-name-en" 
                 value={editSectionNameEn} 
                 onChange={(e) => setEditSectionNameEn(e.target.value)} 
                 className="col-span-12 xs:col-span-8" 
               />
             </div>
             <div className="grid grid-cols-12 items-center gap-2">
               <Label htmlFor="edit-section-name-ja" className="col-span-12 xs:col-span-4 xs:text-right">
                 {t("inspections.templates.sectionNameLabel")} (JA)
               </Label>
               <Input 
                 id="edit-section-name-ja" 
                 value={editSectionNameJa} 
                 onChange={(e) => setEditSectionNameJa(e.target.value)} 
                 className="col-span-12 xs:col-span-8" 
               />
             </div>
             <div className="grid grid-cols-12 items-center gap-2">
               <Label htmlFor="edit-section-description-en" className="col-span-12 xs:col-span-4 xs:text-right">
                 {t("inspections.templates.sectionDescriptionLabel")} (EN)
               </Label>
               <Input 
                 id="edit-section-description-en" 
                 value={editSectionDescEn} 
                 onChange={(e) => setEditSectionDescEn(e.target.value)} 
                 className="col-span-12 xs:col-span-8" 
               />
             </div>
             <div className="grid grid-cols-12 items-center gap-2">
               <Label htmlFor="edit-section-description-ja" className="col-span-12 xs:col-span-4 xs:text-right">
                 {t("inspections.templates.sectionDescriptionLabel")} (JA)
               </Label>
               <Input 
                 id="edit-section-description-ja" 
                 value={editSectionDescJa} 
                 onChange={(e) => setEditSectionDescJa(e.target.value)} 
                 className="col-span-12 xs:col-span-8" 
               />
             </div>
           </div>
           <DialogFooter className="flex-col xs:flex-row gap-2">
             <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => setEditingSection(null)} className="w-full xs:w-auto">{t("common.cancel")}</Button>
             </DialogClose>
             <Button type="button" onClick={handleEditSectionSubmit} disabled={isSavingEditedSection} className="w-full xs:w-auto">
               {isSavingEditedSection ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
               {isSavingEditedSection ? t("common.saving") : t("common.save")}
             </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>
      
      {/* Edit Item Dialog */}
      <Dialog open={isEditingItem} onOpenChange={setIsEditingItem}>
         <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>{t("inspections.templates.editItemTitle", { defaultValue: "Edit Item" })}</DialogTitle>
             <DialogDescription>
                {t("inspections.templates.editItemDescription", { defaultValue: "Update the item details below." })}
             </DialogDescription>
           </DialogHeader>
            <div className="grid gap-4 py-4">
             <div className="grid grid-cols-12 items-center gap-2">
               <Label htmlFor="edit-item-name-en" className="col-span-12 xs:col-span-4 xs:text-right">
                 {t("inspections.templates.itemNameLabel", { defaultValue: "Item Name" })} (EN)
               </Label>
               <Input 
                 id="edit-item-name-en" 
                 value={editItemNameEn} 
                 onChange={(e) => setEditItemNameEn(e.target.value)} 
                 className="col-span-12 xs:col-span-8" 
               />
             </div>
             <div className="grid grid-cols-12 items-center gap-2">
               <Label htmlFor="edit-item-name-ja" className="col-span-12 xs:col-span-4 xs:text-right">
                 {t("inspections.templates.itemNameLabel", { defaultValue: "項目名" })} (JA)
               </Label>
               <Input 
                 id="edit-item-name-ja" 
                 value={editItemNameJa} 
                 onChange={(e) => setEditItemNameJa(e.target.value)} 
                 className="col-span-12 xs:col-span-8" 
               />
             </div>
              <div className="grid grid-cols-12 items-center gap-2">
               <Label htmlFor="edit-item-description-en" className="col-span-12 xs:col-span-4 xs:text-right">
                 {t("inspections.templates.itemDescriptionLabel", { defaultValue: "Description" })} (EN)
               </Label>
               <Input 
                 id="edit-item-description-en" 
                 value={editItemDescEn} 
                 onChange={(e) => setEditItemDescEn(e.target.value)} 
                 className="col-span-12 xs:col-span-8" 
               />
             </div>
              <div className="grid grid-cols-12 items-center gap-2">
               <Label htmlFor="edit-item-description-ja" className="col-span-12 xs:col-span-4 xs:text-right">
                 {t("inspections.templates.itemDescriptionLabel", { defaultValue: "説明" })} (JA)
               </Label>
               <Input 
                 id="edit-item-description-ja" 
                 value={editItemDescJa} 
                 onChange={(e) => setEditItemDescJa(e.target.value)} 
                 className="col-span-12 xs:col-span-8"
               />
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox 
                   id="edit-item-requires-photo"
                   checked={editItemRequiresPhoto}
                   onCheckedChange={(checked) => setEditItemRequiresPhoto(checked === true)} 
                />
                <Label htmlFor="edit-item-requires-photo">{t('inspections.templates.requiresPhoto', { defaultValue: "Requires Photo" })}</Label>
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox 
                   id="edit-item-requires-notes"
                   checked={editItemRequiresNotes}
                   onCheckedChange={(checked) => setEditItemRequiresNotes(checked === true)} 
                />
                <Label htmlFor="edit-item-requires-notes">{t('inspections.templates.requiresNotes', { defaultValue: "Requires Notes" })}</Label>
             </div>
           </div>
           <DialogFooter className="flex-col xs:flex-row gap-2">
             <DialogClose asChild>
               <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="w-full xs:w-auto">{t("common.cancel")}</Button>
             </DialogClose>
             <Button type="button" onClick={handleEditItemSubmit} disabled={isSavingEditedItem} className="w-full xs:w-auto">
               {isSavingEditedItem ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
               {isSavingEditedItem ? t("common.saving") : t("common.save")}
             </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

    </div>
  )
} 