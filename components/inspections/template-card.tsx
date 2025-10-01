"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Plus, 
  Trash2, 
  Edit, 
  Settings,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  Camera,
  FileText,
  Copy,
  Users,
  Car,
  GripVertical,
  MapPin
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { getStatusBadgeClasses } from "@/lib/utils/styles"
import { AssignmentModal } from "./assignment-modal"
import { ItemManagementModal } from "./item-management-modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates, useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

interface InspectionItemTemplate {
  id: string;
  category_id: string | null;
  name_translations: { [key: string]: string };
  description_translations: { [key: string]: string };
  requires_photo: boolean | null;
  requires_notes: boolean | null;
  order_number: number | null;
}

interface InspectionSection {
  id: string;
  type: string;
  name_translations: { [key: string]: string };
  description_translations: { [key: string]: string };
  order_number: number;
  is_active: boolean;
  assigned_to_vehicle_id?: string | null;
  assigned_to_group_id?: string | null;
  inspection_item_templates: InspectionItemTemplate[];
}

interface InspectionTemplate {
  type: string;
  displayName?: string;
  sections: InspectionSection[];
  totalItems: number;
  isActive: boolean;
  assignedVehicles: number;
  assignedGroups: number;
}

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand?: string;
  model?: string;
  vehicle_group_id?: string | null;
  vehicle_group?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
}

interface VehicleGroup {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  vehicle_count?: number;
}

interface TemplateAssignment {
  id: string;
  template_type: string;
  vehicle_id?: string | null;
  vehicle_group_id?: string | null;
  is_active: boolean | null;
  vehicle?: Vehicle | null;
  vehicle_group?: VehicleGroup | null;
}

interface TemplateCardProps {
  template: InspectionTemplate
  vehicles: Vehicle[]
  vehicleGroups: VehicleGroup[]
  assignments: TemplateAssignment[]
  expandedTemplates: Record<string, boolean>
  expandedSections: Record<string, boolean>
  selectedSections: Set<string>
  onToggleTemplate: (templateType: string) => void
  onToggleSectionExpansion: (sectionId: string) => void
  onToggleSectionSelection: (sectionId: string) => void
  onToggleAssignment: (templateType: string, vehicleId?: string, vehicleGroupId?: string) => void
  onAddSection: (templateType: string) => void
  onEditSection: (section: InspectionSection) => void
  onDeleteSection: (section: InspectionSection) => void
  onDeleteTemplate: (template: InspectionTemplate) => void
  onEditTemplate: (template: InspectionTemplate) => void
  onDuplicateTemplate: (template: InspectionTemplate) => void
  onAddVehicleGroup: () => void
  onEditVehicleGroup: (group: VehicleGroup) => void
  onDeleteVehicleGroup: (group: VehicleGroup) => void
  onManageGroupVehicles?: (group: VehicleGroup) => void
  onAddItem?: (sectionId: string, item: Omit<InspectionItemTemplate, 'id' | 'category_id'>) => Promise<void>
  onEditItem?: (itemId: string, item: Partial<InspectionItemTemplate>) => Promise<void>
  onDeleteItem?: (itemId: string) => Promise<void>
  onReorderSections?: (reorderData: { id: string; order: number }[]) => Promise<void>
  onReorderItems?: (reorderData: { id: string; order: number }[]) => Promise<void>
  isSubmitting: boolean
}

interface SortableSectionProps {
  section: InspectionSection
  template: InspectionTemplate
  expandedSections: Record<string, boolean>
  selectedSections: Set<string>
  onToggleSectionExpansion: (sectionId: string) => void
  onToggleSectionSelection: (sectionId: string) => void
  onEditSection: (section: InspectionSection) => void
  onDeleteSection: (section: InspectionSection) => void
  onManageItems: (section: InspectionSection) => void
  locale: string
  t: (key: string) => string
}

function SortableSection({ 
  section, 
  template, 
  expandedSections, 
  selectedSections, 
  onToggleSectionExpansion, 
  onToggleSectionSelection, 
  onEditSection, 
  onDeleteSection, 
  onManageItems, 
  locale,
  t 
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: section.id,
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

  const sectionName = section.name_translations?.[locale] || section.name_translations?.en || 'Unnamed Section'
  const sectionDescription = section.description_translations?.[locale] || section.description_translations?.en || ''
  const isExpanded = expandedSections[section.id]
  const isSelected = selectedSections.has(section.id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg ${isDragging ? 'opacity-50 shadow-lg' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-center gap-2 p-3 sm:p-4">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1 rounded cursor-grab active:cursor-grabbing hover:bg-muted/80 dark:hover:bg-muted/60 touch-none transition-colors"
          aria-label="Drag handle"
          role="button"
          tabIndex={0}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </div>
        
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSectionSelection(section.id)}
          className="flex-shrink-0"
        />
        
        <Collapsible open={isExpanded} onOpenChange={() => onToggleSectionExpansion(section.id)} className="flex-1 min-w-0">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left hover:bg-muted/50 dark:hover:bg-muted/30 p-2 rounded -m-2 transition-colors">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isExpanded ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm sm:text-base truncate">{sectionName}</h4>
                {sectionDescription && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{sectionDescription}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusBadgeClasses(section.is_active ? 'active' : 'inactive')}`}
                >
                  {section.is_active ? t('common.active') : t('common.inactive')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {section.inspection_item_templates?.length || 0} items
                </Badge>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-2">
            <div className="space-y-2 ml-6">
              {/* Items list */}
              {section.inspection_item_templates && section.inspection_item_templates.length > 0 ? (
                <div className="grid gap-2">
                  {section.inspection_item_templates
                    .sort((a, b) => (a.order_number || 0) - (b.order_number || 0))
                    .map((item) => {
                      const itemName = item.name_translations?.[locale] || item.name_translations?.en || 'Unnamed Item'
                      return (
                        <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/50 dark:bg-muted/20 rounded text-sm border border-border/50">
                          <span className="flex-1 truncate">{itemName}</span>
                          <div className="flex gap-1 flex-shrink-0">
                            {item.requires_photo && (
                              <Badge variant="outline" className="text-xs">
                                <Camera className="h-3 w-3" />
                              </Badge>
                            )}
                            {item.requires_notes && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('inspectionTemplates.sections.noItemsInSection')}
                </p>
              )}
              
              {/* Section actions */}
              <div className="flex flex-wrap gap-2 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onManageItems(section)}
                  className="text-xs hover:bg-muted/80 dark:hover:bg-muted/60"
                  title={t('inspectionTemplates.items.manageItems')}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  {t('inspectionTemplates.items.manageItems')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditSection(section)}
                  className="text-xs hover:bg-muted/80 dark:hover:bg-muted/60"
                  title={t('common.edit')}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  {t('common.edit')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteSection(section)}
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                  title={t('common.delete')}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}

export function TemplateCard({
  template,
  vehicles,
  vehicleGroups,
  assignments,
  expandedTemplates,
  expandedSections,
  selectedSections,
  onToggleTemplate,
  onToggleSectionExpansion,
  onToggleSectionSelection,
  onToggleAssignment,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onDeleteTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onAddVehicleGroup,
  onEditVehicleGroup,
  onDeleteVehicleGroup,
  onManageGroupVehicles,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorderSections,
  onReorderItems,
  isSubmitting
}: TemplateCardProps) {
  const { t, locale } = useI18n()
  const [mobileActiveTab, setMobileActiveTab] = useState("assignments")
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showItemManagementModal, setShowItemManagementModal] = useState(false)
  const [selectedSection, setSelectedSection] = useState<InspectionSection | null>(null)
  const [sections, setSections] = useState<InspectionSection[]>(template.sections)
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean
    type: 'template' | 'section'
    item: InspectionTemplate | InspectionSection | null
  }>({ open: false, type: 'template', item: null })
  
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

  // Update sections when template changes
  useEffect(() => {
    setSections(template.sections)
  }, [template.sections])

  // Ensure isExpanded is always a boolean
  const isExpanded = Boolean(expandedTemplates[template.type])
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // Handler functions for modals
  const handleManageItems = (section: InspectionSection) => {
    setSelectedSection(section)
    setShowItemManagementModal(true)
  }

  const handleManageAssignments = () => {
    setShowAssignmentModal(true)
  }

  const handleDeleteTemplate = () => {
    setConfirmDelete({
      open: true,
      type: 'template',
      item: template
    })
  }

  const handleDeleteSection = (section: InspectionSection) => {
    setConfirmDelete({
      open: true,
      type: 'section',
      item: section
    })
  }

  const handleConfirmDelete = () => {
    if (!confirmDelete.item) return
    
    if (confirmDelete.type === 'template') {
      onDeleteTemplate(confirmDelete.item as InspectionTemplate)
    } else {
      onDeleteSection(confirmDelete.item as InspectionSection)
    }
    
    setConfirmDelete({ open: false, type: 'template', item: null })
  }

  const handleSectionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && onReorderSections) {
      try {
        const oldIndex = sections.findIndex(section => section.id === active.id)
        const newIndex = sections.findIndex(section => section.id === over.id)
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedSections = arrayMove(sections, oldIndex, newIndex)
          setSections(reorderedSections)
  
          // Update order numbers and call the reorder function
          const reorderData = reorderedSections.map((section, index) => ({
            id: section.id,
            order: index + 1
          }))
  
          await onReorderSections(reorderData)
        }
      } catch (error) {
        console.error('Error reordering sections:', error)
        // Revert on error
        setSections(template.sections)
      }
    }
  }

  // Get assignment summary
  const templateAssignments = assignments.filter(a => a.template_type === template.type)
  const assignedVehiclesCount = templateAssignments.filter(a => a.vehicle_id).length
  const assignedGroupsCount = templateAssignments.filter(a => a.vehicle_group_id).length
  const totalAssignments = assignedVehiclesCount + assignedGroupsCount

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleTemplate(template.type)}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold truncate">
                {template.displayName || template.type}
              </CardTitle>
              <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusBadgeClasses(template.isActive ? 'active' : 'inactive')}`}
                >
                  {template.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
                <Badge variant="outline" className="text-xs border-border">
                  {template.sections.length} {t('inspectionTemplates.template.sections')}
                </Badge>
                <Badge variant="outline" className="text-xs border-border">
                  {template.totalItems} {t('inspectionTemplates.template.items')}
                </Badge>
                <Badge variant="outline" className="text-xs border-border flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {totalAssignments}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddSection(template.type)}
              className="text-xs sm:inline-flex hidden hover:bg-muted/80 dark:hover:bg-muted/60"
              title={t('inspectionTemplates.sections.addSection')}
            >
              <Plus className="h-3 w-3 mr-1" />
              {t('inspectionTemplates.sections.addSection')}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddSection(template.type)}
              className="text-xs sm:hidden h-8 w-8 p-0"
              title={t('inspectionTemplates.sections.addSection')}
            >
              <Plus className="h-3 w-3" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleManageAssignments}
              className="text-xs h-8 w-8 p-0 sm:px-2 sm:w-auto"
              title={t('common.assign')}
            >
              <MapPin className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">{t('common.assign')}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditTemplate(template)}
              className="text-xs h-8 w-8 p-0"
              title={t('common.edit')}
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDuplicateTemplate(template)}
              className="text-xs h-8 w-8 p-0"
              title={t('common.duplicate')}
            >
              <Copy className="h-3 w-3" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteTemplate}
              className="text-xs h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
              title={t('common.delete')}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {sections.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-sm font-medium mb-1">No sections found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                Add sections to organize your inspection items.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddSection(template.type)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add First Section
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSectionDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={sections.map(section => section.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {sections.map((section) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      template={template}
                      expandedSections={expandedSections}
                      selectedSections={selectedSections}
                      onToggleSectionExpansion={onToggleSectionExpansion}
                      onToggleSectionSelection={onToggleSectionSelection}
                      onEditSection={onEditSection}
                      onDeleteSection={handleDeleteSection}
                      onManageItems={handleManageItems}
                      locale={locale}
                      t={t}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      )}

      {/* Item Management Modal */}
      <ItemManagementModal
        open={showItemManagementModal}
        onOpenChange={setShowItemManagementModal}
        section={selectedSection}
        onAddItem={onAddItem || (() => Promise.resolve())}
        onEditItem={onEditItem || (() => Promise.resolve())}
        onDeleteItem={onDeleteItem || (() => Promise.resolve())}
        onReorderItems={onReorderItems}
        isSubmitting={isSubmitting}
      />

      {/* Assignment Management Modal */}
      <Dialog open={showAssignmentModal} onOpenChange={setShowAssignmentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Template Assignments - {template.displayName || template.type}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Assign this inspection template to vehicles or vehicle groups
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="vehicles" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="vehicles" className="text-sm">Individual Vehicles</TabsTrigger>
                <TabsTrigger value="groups" className="text-sm">Vehicle Groups</TabsTrigger>
              </TabsList>

              <TabsContent value="vehicles" className="flex-1 overflow-hidden">
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-2 pr-4">
                    {vehicles.map((vehicle) => {
                      const isAssigned = templateAssignments.some(a => a.vehicle_id === vehicle.id)
                      const isAssignedViaGroup = Boolean(vehicle.vehicle_group?.id) && templateAssignments.some(a => a.vehicle_group_id === vehicle.vehicle_group?.id)
                      return (
                        <div
                          key={vehicle.id}
                          className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isAssigned || isAssignedViaGroup ? 'bg-muted/40 ring-1 ring-primary/30' : 'hover:bg-muted/50 dark:hover:bg-muted/30'}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{vehicle.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {vehicle.plate_number}
                              </Badge>
                              {vehicle.vehicle_group && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{ borderColor: vehicle.vehicle_group.color || '#3B82F6' }}
                                >
                                  {vehicle.vehicle_group.name}
                                </Badge>
                              )}
                              {isAssigned && (
                                <Badge className="text-xs bg-primary/90">Assigned</Badge>
                              )}
                              {!isAssigned && isAssignedViaGroup && (
                                <Badge variant="secondary" className="text-xs">From Group</Badge>
                              )}
                            </div>
                            {vehicle.brand && vehicle.model && (
                              <p className="text-xs text-muted-foreground">
                                {vehicle.brand} {vehicle.model}
                              </p>
                            )}
                          </div>
                          <Button
                            variant={isAssigned ? "default" : "outline"}
                            size="sm"
                            onClick={() => onToggleAssignment(template.type, vehicle.id)}
                            className="text-xs"
                          >
                            {isAssigned ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Assigned
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Assign
                              </>
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="groups" className="flex-1 overflow-hidden">
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-2 pr-4">
                    <div className="flex justify-end mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddVehicleGroup}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Group
                      </Button>
                    </div>
                    {vehicleGroups.map((group) => {
                      const isAssigned = templateAssignments.some(a => a.vehicle_group_id === group.id)
                      return (
                        <div
                          key={group.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 dark:hover:bg-muted/30"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: group.color || '#3B82F6' }}
                              />
                              <span className="font-medium text-sm truncate">{group.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {group.vehicle_count || 0} vehicles
                              </Badge>
                            </div>
                            {group.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 ml-5">
                                {group.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {onManageGroupVehicles && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onManageGroupVehicles(group)}
                                className="text-xs"
                              >
                                <Users className="h-3 w-3 mr-1" />
                                Manage Vehicles
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditVehicleGroup(group)}
                              className="text-xs"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant={isAssigned ? "default" : "outline"}
                              size="sm"
                              onClick={() => onToggleAssignment(template.type, undefined, group.id)}
                              className="text-xs"
                            >
                              {isAssigned ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Assigned
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Assign
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ open, type: 'template', item: null })}
        title={t('inspectionTemplates.dialogs.deleteConfirm.title', { 
          type: confirmDelete.type === 'template' ? 'Template' : 'Section' 
        })}
        description={
          confirmDelete.type === 'template' 
            ? t('inspectionTemplates.dialogs.deleteConfirm.templateDescription')
            : t('inspectionTemplates.dialogs.deleteConfirm.sectionDescription')
        }
        confirmText={t('common.delete')}
        onConfirm={handleConfirmDelete}
        isLoading={isSubmitting}
      />
    </Card>
  )
} 