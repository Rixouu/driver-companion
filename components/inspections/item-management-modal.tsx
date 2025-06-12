"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useI18n } from "@/lib/i18n/context"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Plus,
  Edit,
  Trash2,
  Camera,
  FileText,
  GripVertical,
  X
} from "lucide-react"
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  useSortable, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { arrayMove } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

interface InspectionItemTemplate {
  id: string
  category_id: string | null
  name_translations: { [key: string]: string }
  description_translations: { [key: string]: string }
  requires_photo: boolean | null
  requires_notes: boolean | null
  order_number: number | null
}

interface InspectionSection {
  id: string
  type: string
  name_translations: { [key: string]: string }
  description_translations: { [key: string]: string }
  order_number: number
  is_active: boolean
  inspection_item_templates: InspectionItemTemplate[]
}

interface ItemManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: InspectionSection | null
  onAddItem: (sectionId: string, item: Omit<InspectionItemTemplate, 'id' | 'category_id'>) => Promise<void>
  onEditItem: (itemId: string, item: Partial<InspectionItemTemplate>) => Promise<void>
  onDeleteItem: (itemId: string) => Promise<void>
  onReorderItems?: (reorderedItems: { id: string; order: number }[]) => Promise<void>
  isSubmitting: boolean
}

interface ItemFormData {
  name_en: string
  name_ja: string
  description_en: string
  description_ja: string
  requires_photo: boolean
  requires_notes: boolean
  order_number: number
}

interface SortableItemProps {
  item: InspectionItemTemplate
  onEdit: (item: InspectionItemTemplate) => void
  onDelete: (item: InspectionItemTemplate) => void
  locale: string
}

function SortableItem({ item, onEdit, onDelete, locale }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    position: isDragging ? 'relative' : 'static' as any,
  }

  const itemName = item.name_translations?.[locale] || item.name_translations?.en || 'Unnamed Item'
  const itemDescription = item.description_translations?.[locale] || item.description_translations?.en || ''

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-background border rounded-lg p-3 sm:p-4 ${isDragging ? 'opacity-50 shadow-lg' : 'shadow-sm'}`}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1 rounded cursor-grab active:cursor-grabbing hover:bg-muted/80 dark:hover:bg-muted/60 touch-none transition-colors mt-1"
          aria-label="Drag handle"
          role="button"
          tabIndex={0}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{itemName}</div>
          {itemDescription && (
            <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{itemDescription}</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {item.requires_photo && (
              <Badge variant="outline" className="text-xs">
                <Camera className="h-3 w-3 mr-1" />
                Photo Required
              </Badge>
            )}
            {item.requires_notes && (
              <Badge variant="outline" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Notes Required
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ItemManagementModal({
  open,
  onOpenChange,
  section,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderItems,
  isSubmitting
}: ItemManagementModalProps) {
  const { t, locale } = useI18n()
  const [items, setItems] = useState<InspectionItemTemplate[]>([])
  const [editingItem, setEditingItem] = useState<InspectionItemTemplate | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean
    item: InspectionItemTemplate | null
  }>({ open: false, item: null })

  const [formData, setFormData] = useState<ItemFormData>({
    name_en: '',
    name_ja: '',
    description_en: '',
    description_ja: '',
    requires_photo: false,
    requires_notes: false,
    order_number: 1
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Update items when section changes
  useEffect(() => {
    if (section?.inspection_item_templates) {
      const sortedItems = [...section.inspection_item_templates].sort(
        (a, b) => (a.order_number || 0) - (b.order_number || 0)
      )
      setItems(sortedItems)
    } else {
      setItems([])
    }
  }, [section])

  const resetForm = useCallback(() => {
    setFormData({
      name_en: '',
      name_ja: '',
      description_en: '',
      description_ja: '',
      requires_photo: false,
      requires_notes: false,
      order_number: items.length + 1
    })
    setEditingItem(null)
    setShowForm(false)
  }, [items.length])

  const handleAddItem = () => {
    resetForm()
    setFormData(prev => ({ ...prev, order_number: items.length + 1 }))
    setShowForm(true)
  }

  const handleEditItem = (item: InspectionItemTemplate) => {
    setEditingItem(item)
    setFormData({
      name_en: item.name_translations?.en || '',
      name_ja: item.name_translations?.ja || '',
      description_en: item.description_translations?.en || '',
      description_ja: item.description_translations?.ja || '',
      requires_photo: item.requires_photo || false,
      requires_notes: item.requires_notes || false,
      order_number: item.order_number || 0
    })
    setShowForm(true)
  }

  const handleSaveItem = async () => {
    if (!formData.name_en.trim()) {
      toast({
        title: t('common.error'),
        description: t('inspectionTemplates.messages.errors.itemCreateFailed'),
        variant: "destructive"
      })
      return
    }

    try {
      const itemData = {
        name_translations: {
          en: formData.name_en,
          ja: formData.name_ja || formData.name_en
        },
        description_translations: {
          en: formData.description_en,
          ja: formData.description_ja || formData.description_en
        },
        requires_photo: formData.requires_photo,
        requires_notes: formData.requires_notes,
        order_number: formData.order_number
      }

      if (editingItem) {
        await onEditItem(editingItem.id, itemData)
        // Update local state for real-time updates
        setItems(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { ...item, ...itemData }
            : item
        ))
      } else {
        if (section) {
          await onAddItem(section.id, itemData)
          // Add to local state for real-time updates
          const newItem: InspectionItemTemplate = {
            id: Date.now().toString(), // Temporary ID
            category_id: section.id,
            ...itemData
          }
          setItems(prev => [...prev, newItem])
        }
      }

      resetForm()
    } catch (error) {
      console.error('Error saving item:', error)
    }
  }

  const handleDeleteItem = async (item: InspectionItemTemplate) => {
    if (!confirm(t('inspectionTemplates.messages.confirmations.deleteItem'))) return

    try {
      await onDeleteItem(item.id)
      // Remove from local state for real-time updates
      setItems(prev => prev.filter(i => i.id !== item.id))
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      try {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedItems = arrayMove(items, oldIndex, newIndex)
          setItems(reorderedItems)
  
          // Update order numbers and call the reorder function
          const reorderData = reorderedItems.map((item, index) => ({
            id: item.id,
            order: index + 1
          }))
  
          if (onReorderItems) {
            await onReorderItems(reorderData)
          }
        }
      } catch (error) {
        console.error('Error reordering items:', error)
        // Revert on error - get the original items for the section
        if (section) {
          setItems(section.inspection_item_templates)
        }
      }
    }
  }

  const sectionName = section?.name_translations?.[locale] || section?.name_translations?.en || 'Section'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 pb-2">
          <DialogTitle className="text-lg sm:text-xl">
            {t('inspectionTemplates.items.manageItems')} - {sectionName}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Manage inspection items for this section. Drag and drop to reorder items.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row">
            {/* Items List */}
            <div className="flex-1 p-4 sm:p-6 pt-2 overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="font-medium text-base">
                  Items ({items.length})
                </h3>
                <Button 
                  onClick={handleAddItem}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('inspectionTemplates.items.addItem')}
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-muted" />
                  <p>{t('inspectionTemplates.sections.noItemsInSection')}</p>
                </div>
              ) : (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext 
                    items={items.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {items.map((item) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          onEdit={handleEditItem}
                          onDelete={handleDeleteItem}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Form Panel */}
            {showForm && (
              <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l bg-muted/50 dark:bg-muted/20">
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-base">
                      {editingItem ? t('inspectionTemplates.items.editItem') : t('inspectionTemplates.items.addItem')}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="name_en" className="text-sm">
                          {t('common.nameEn')} *
                        </Label>
                        <Input
                          id="name_en"
                          value={formData.name_en}
                          onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                          placeholder="Item name in English"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="name_ja" className="text-sm">
                          {t('common.nameJa')}
                        </Label>
                        <Input
                          id="name_ja"
                          value={formData.name_ja}
                          onChange={(e) => setFormData(prev => ({ ...prev, name_ja: e.target.value }))}
                          placeholder="アイテム名（日本語）"
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="description_en" className="text-sm">
                          {t('common.descriptionEn')}
                        </Label>
                        <Textarea
                          id="description_en"
                          value={formData.description_en}
                          onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                          placeholder="Item description in English"
                          rows={2}
                          className="text-sm resize-none"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description_ja" className="text-sm">
                          {t('common.descriptionJa')}
                        </Label>
                        <Textarea
                          id="description_ja"
                          value={formData.description_ja}
                          onChange={(e) => setFormData(prev => ({ ...prev, description_ja: e.target.value }))}
                          placeholder="アイテムの説明（日本語）"
                          rows={2}
                          className="text-sm resize-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requires_photo" className="text-sm">
                          {t('inspectionTemplates.items.requiresPhoto')}
                        </Label>
                        <Switch
                          id="requires_photo"
                          checked={formData.requires_photo}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_photo: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requires_notes" className="text-sm">
                          {t('inspectionTemplates.items.requiresNotes')}
                        </Label>
                        <Switch
                          id="requires_notes"
                          checked={formData.requires_notes}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_notes: checked }))}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleSaveItem}
                        disabled={!formData.name_en.trim() || isSubmitting}
                        size="sm"
                        className="flex-1"
                      >
                        {isSubmitting ? t('common.saving') : t('common.save')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetForm}
                        size="sm"
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 