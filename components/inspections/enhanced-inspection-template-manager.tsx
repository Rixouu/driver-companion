"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search,
  XCircle,
  Settings,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  Camera,
  FileText
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase"
import { useI18n } from "@/lib/i18n/context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { TemplateHeader } from "./template-header"
import { TemplateCard } from "./template-card"
import { 
  addInspectionItem, 
  updateInspectionItem, 
  deleteInspectionItem
} from "@/lib/services/inspections"
import { VehicleGroupManagementModal } from './vehicle-group-management-modal'

type TranslationObject = { [key: string]: string };

interface InspectionItemTemplate {
  id: string;
  category_id: string | null;
  name_translations: TranslationObject;
  description_translations: TranslationObject;
  requires_photo: boolean | null;
  requires_notes: boolean | null;
  order_number: number | null;
}

interface InspectionSection {
  id: string;
  type: string;
  name_translations: TranslationObject;
  description_translations: TranslationObject;
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

// Logging function for debugging delete operations
const logDeleteOperation = (operation: string, data: any, error?: any) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    operation,
    data,
    error: error ? {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    } : null
  };
  
  console.log(`[DELETE_LOG] ${operation}:`, logData);
  
  // Also log to localStorage for debugging
  try {
    const existingLogs = JSON.parse(localStorage.getItem('inspection_delete_logs') || '[]');
    existingLogs.push(logData);
    // Keep only last 50 logs
    if (existingLogs.length > 50) {
      existingLogs.splice(0, existingLogs.length - 50);
    }
    localStorage.setItem('inspection_delete_logs', JSON.stringify(existingLogs));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
};

export function EnhancedInspectionTemplateManager() {
  const { t, locale } = useI18n()
  const supabase = useMemo(() => createClient(), [])

  // State
  const [templates, setTemplates] = useState<InspectionTemplate[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>([])
  const [assignments, setAssignments] = useState<TemplateAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<InspectionTemplate | null>(null)
  const [expandedTemplates, setExpandedTemplates] = useState<Record<string, boolean>>({})
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set())
  
  // Dialog states
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false)
  const [showEditTemplateDialog, setShowEditTemplateDialog] = useState(false)
  const [showDuplicateTemplateDialog, setShowDuplicateTemplateDialog] = useState(false)
  const [showEditSectionDialog, setShowEditSectionDialog] = useState(false)
  const [showVehicleGroupDialog, setShowVehicleGroupDialog] = useState(false)
  const [showManageVehiclesDialog, setShowManageVehiclesDialog] = useState(false)
  
  // Delete confirmation states
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    type: 'template' | 'section' | 'item';
    item: InspectionTemplate | InspectionSection | InspectionItemTemplate | null;
    title: string;
    description: string;
  }>({
    open: false,
    type: 'template',
    item: null,
    title: '',
    description: ''
  })
  
  // Edit state
  const [editingTemplate, setEditingTemplate] = useState<InspectionTemplate | null>(null)
  const [editingSection, setEditingSection] = useState<InspectionSection | null>(null)
  const [editingVehicleGroup, setEditingVehicleGroup] = useState<VehicleGroup | null>(null)
  const [selectedVehicleGroup, setSelectedVehicleGroup] = useState<VehicleGroup | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [newTemplateType, setNewTemplateType] = useState('')
  const [editTemplateForm, setEditTemplateForm] = useState({
    currentType: '',
    newType: '',
    displayName: ''
  })
  const [duplicateTemplateForm, setDuplicateTemplateForm] = useState({
    sourceType: '',
    targetType: ''
  })
  const [sectionForm, setSectionForm] = useState({
    name_en: '',
    name_ja: '',
    description_en: '',
    description_ja: '',
    is_active: true,
    order_number: 1
  })
  const [vehicleGroupForm, setVehicleGroupForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })
  const [showVehicleGroupManagementModal, setShowVehicleGroupManagementModal] = useState(false)

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      const { data: categories, error } = await supabase
        .from('inspection_categories')
        .select(`
          *,
          inspection_item_templates (*)
        `)
        .order('type')
        .order('order_number', { ascending: true })

      if (error) throw error

      const templateMap = new Map<string, InspectionTemplate>()
      
      categories?.forEach(category => {
        const type = category.type
        // Use type assertion to access the display_name property
        const categoryAny = category as any
        const displayName = categoryAny.display_name || type
        
        if (!templateMap.has(type)) {
          templateMap.set(type, {
            type,
            displayName,
            sections: [],
            totalItems: 0,
            isActive: false,
            assignedVehicles: 0,
            assignedGroups: 0
          })
        }
        
        const template = templateMap.get(type)!
        const section: InspectionSection = {
          ...category,
          name_translations: (category.name_translations as TranslationObject) || {},
          description_translations: (category.description_translations as TranslationObject) || {},
          is_active: Boolean(category.is_active),
          order_number: category.order_number || 0,
          assigned_to_vehicle_id: category.assigned_to_vehicle_id,
          assigned_to_group_id: category.assigned_to_group_id,
          inspection_item_templates: (category.inspection_item_templates || []).map(item => ({
            ...item,
            name_translations: (item.name_translations as TranslationObject) || {},
            description_translations: (item.description_translations as TranslationObject) || {},
            requires_photo: Boolean(item.requires_photo),
            requires_notes: Boolean(item.requires_notes),
            order_number: item.order_number || 0
          }))
        }
        
        template.sections.push(section)
        template.totalItems += (category.inspection_item_templates?.length || 0)
        template.isActive = template.isActive || Boolean(category.is_active)
      })

      setTemplates(Array.from(templateMap.values()))
    } catch (error) {
      console.error('Error loading templates:', error)
      toast({
        title: t('common.error'),
        description: t('inspectionTemplates.messages.errors.loadTemplatesFailed'),
        variant: "destructive"
      })
    }
  }, [supabase, t])

  const loadVehiclesAndGroups = useCallback(async () => {
    try {
      const [vehiclesResult, groupsResult] = await Promise.all([
        supabase
          .from('vehicles')
          .select(`
            id, name, plate_number, brand, model, vehicle_group_id,
            vehicle_group:vehicle_groups(id, name, color)
          `)
          .order('name'),
        supabase
          .from('vehicle_groups')
          .select('*')
          .order('name')
      ])

      if (vehiclesResult.error) throw vehiclesResult.error
      if (groupsResult.error) throw groupsResult.error

      const vehicles = vehiclesResult.data || []
      const groups = groupsResult.data || []

      // Calculate vehicle count for each group
      const groupsWithCount = groups.map(group => ({
        ...group,
        vehicle_count: vehicles.filter(v => v.vehicle_group_id === group.id).length
      }))

      setVehicles(vehicles)
      setVehicleGroups(groupsWithCount)
    } catch (error) {
      console.error('Error loading vehicles and groups:', error)
      toast({
        title: t('common.error'),
        description: t('inspectionTemplates.messages.errors.loadVehiclesFailed'),
        variant: "destructive"
      })
    }
  }, [supabase, t])

  const loadAssignments = useCallback(async (templateType?: string) => {
    try {
      let query = supabase
        .from('inspection_template_assignments')
        .select(`
          *,
          vehicle:vehicles(id, name, plate_number),
          vehicle_group:vehicle_groups(id, name, color)
        `)

      if (templateType) {
        query = query.eq('template_type', templateType)
      }

      const { data, error } = await query
      if (error) throw error
      
      setAssignments(data || [])
      
      // Update template assignment counts
      if (!templateType) {
        setTemplates(prev => prev.map(template => ({
          ...template,
          assignedVehicles: (data || []).filter(a => a.template_type === template.type && a.vehicle_id).length,
          assignedGroups: (data || []).filter(a => a.template_type === template.type && a.vehicle_group_id).length
        })))
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
      toast({
        title: t('common.error'),
        description: t('inspectionTemplates.messages.errors.loadAssignmentsFailed'),
        variant: "destructive"
      })
    }
  }, [supabase, t])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        loadTemplates(),
        loadVehiclesAndGroups(),
        loadAssignments()
      ])
      setIsLoading(false)
    }
    loadData()
  }, [loadTemplates, loadVehiclesAndGroups, loadAssignments])

  // Create new template
  const handleCreateTemplate = async () => {
    if (!newTemplateType.trim()) {
      toast({
        title: t('common.error'),
        description: t('inspectionTemplates.messages.errors.templateNameRequired'),
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Store the original display name
      const displayName = newTemplateType.trim();
      // Create a URL-friendly ID but keep original name for display
      const typeId = displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      
      const { error } = await supabase
        .from('inspection_categories')
        .insert({
          type: typeId,
          display_name: displayName,
          name_translations: {
            en: `Default Section`,
            ja: `デフォルトセクション`
          },
          description_translations: {
            en: `Default section for ${displayName}`,
            ja: `${displayName}のデフォルトセクション`
          },
          order_number: 1,
          is_active: true
        })

      if (error) throw error

      setNewTemplateType('')
      setShowNewTemplateDialog(false)
      
      toast({
        title: t('common.success'),
        description: t('inspectionTemplates.messages.templateCreated')
      })
      
      await loadTemplates()
    } catch (error: any) {
      console.error('Error creating template:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.templateCreateFailed'),
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  // Edit template
  const handleEditTemplate = (template: InspectionTemplate) => {
    setEditingTemplate(template)
    setEditTemplateForm({
      currentType: template.type,
      newType: template.type,
      displayName: template.type
    })
    setShowEditTemplateDialog(true)
  }

  const handleSaveTemplateEdit = async () => {
    if (!editTemplateForm.newType.trim()) {
      toast({
        title: t('common.error'),
        description: t('inspectionTemplates.messages.errors.templateNameRequired'),
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Store the original display name
      const displayName = editTemplateForm.displayName.trim() || editTemplateForm.newType.trim();
      // Create a URL-friendly ID but keep original name for display
      const typeId = editTemplateForm.newType.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      
      const response = await fetch(`/api/inspection-templates/${editTemplateForm.currentType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newType: typeId,
          displayName: displayName
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update template')
      }

      setShowEditTemplateDialog(false)
      toast({
        title: t('common.success'),
        description: t('inspectionTemplates.messages.templateRenamed')
      })
      
      await Promise.all([loadTemplates(), loadAssignments()])
    } catch (error: any) {
      console.error('Error updating template:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.templateUpdateFailed'),
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  // Duplicate template
  const handleDuplicateTemplate = (template: InspectionTemplate) => {
    setEditingTemplate(template)
    setDuplicateTemplateForm({
      sourceType: template.type,
      targetType: ''
    })
    setShowDuplicateTemplateDialog(true)
  }

  const handleSaveTemplateDuplicate = async () => {
    if (!duplicateTemplateForm.targetType.trim()) {
      toast({
        title: t('common.error'),
        description: t('inspectionTemplates.messages.errors.templateNameRequired'),
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Store the original display name
      const displayName = duplicateTemplateForm.targetType.trim();
      // Create a URL-friendly ID but keep original name for display
      const typeId = displayName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      
      const response = await fetch(`/api/inspection-templates/${typeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType: duplicateTemplateForm.sourceType,
          displayName: displayName,
          nameTranslations: {
            en: displayName,
            ja: displayName
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to duplicate template')
      }

      setShowDuplicateTemplateDialog(false)
      toast({
        title: t('common.success'),
        description: t('inspectionTemplates.messages.templateDuplicated')
      })
      
      await loadTemplates()
    } catch (error: any) {
      console.error('Error duplicating template:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.templateDuplicateFailed'),
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  // Delete template
  const handleDeleteTemplate = async (template: InspectionTemplate) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/inspection-templates/${template.type}?force=true`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete template')
      }

      toast({
        title: t('common.success'),
        description: t('inspectionTemplates.messages.templateDeleted')
      })
      
      await Promise.all([loadTemplates(), loadAssignments()])
    } catch (error: any) {
      console.error('Error deleting template:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.templateDeleteFailed'),
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  // Add new section
  const handleAddSection = async (templateType: string) => {
    setEditingSection(null)
    setSectionForm({
      name_en: '',
      name_ja: '',
      description_en: '',
      description_ja: '',
      is_active: true,
      order_number: 1
    })
    setSelectedTemplate(templates.find(t => t.type === templateType) || null)
    setShowEditSectionDialog(true)
  }

  // Edit section
  const handleEditSection = (section: InspectionSection) => {
    setEditingSection(section)
    setSectionForm({
      name_en: section.name_translations.en || '',
      name_ja: section.name_translations.ja || '',
      description_en: section.description_translations.en || '',
      description_ja: section.description_translations.ja || '',
      is_active: section.is_active,
      order_number: section.order_number
    })
    setShowEditSectionDialog(true)
  }

  // Save section
  const handleSaveSection = async () => {
    if (!sectionForm.name_en.trim()) {
      toast({
        title: t('common.error'),
        description: t('inspectionTemplates.messages.errors.sectionNameRequired'),
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const sectionData = {
        name_translations: {
          en: sectionForm.name_en,
          ja: sectionForm.name_ja || sectionForm.name_en
        },
        description_translations: {
          en: sectionForm.description_en,
          ja: sectionForm.description_ja || sectionForm.description_en
        },
        is_active: sectionForm.is_active,
        order_number: sectionForm.order_number
      }

      if (editingSection) {
        const { error } = await supabase
          .from('inspection_categories')
          .update(sectionData)
          .eq('id', editingSection.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('inspection_categories')
          .insert({
            ...sectionData,
            type: selectedTemplate!.type
          })

        if (error) throw error
      }

      setShowEditSectionDialog(false)
      toast({
        title: t('common.success'),
        description: editingSection ? t('inspectionTemplates.messages.sectionUpdated') : t('inspectionTemplates.messages.sectionCreated')
      })
      
      await loadTemplates()
    } catch (error: any) {
      console.error('Error saving section:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.sectionCreateFailed'),
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  // Delete section
  const handleDeleteSection = async (section: InspectionSection) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/inspection-sections/${section.id}?force=true`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete section')
      }

      toast({
        title: t('common.success'),
        description: t('inspectionTemplates.messages.sectionDeleted')
      })
      
      await loadTemplates()
    } catch (error: any) {
      console.error('Error deleting section:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.sectionDeleteFailed'),
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  // Delete multiple sections
  const handleDeleteMultipleSections = async () => {
    if (selectedSections.size === 0) {
      toast({
        title: t('common.error'),
        description: t('inspectionTemplates.messages.confirmations.noSectionsSelected'),
        variant: "destructive"
      })
      return
    }

    if (!confirm(t('inspectionTemplates.messages.confirmations.deleteMultipleSections', { count: selectedSections.size }))) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/inspection-sections/bulk-delete?force=true', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionIds: Array.from(selectedSections)
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        if (result.partialSuccess) {
          toast({
            title: t('common.success'),
            description: t('inspectionTemplates.messages.errors.partialDeleteSuccess'),
            variant: "default"
          })
        } else {
          throw new Error(result.error || 'Failed to delete sections')
        }
      } else {
        toast({
          title: t('common.success'),
          description: t('inspectionTemplates.messages.sectionsDeleted', { count: selectedSections.size })
        })
      }
      
      setSelectedSections(new Set())
      await loadTemplates()
    } catch (error: any) {
      console.error('Error deleting multiple sections:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.deleteMultipleFailed'),
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  // Toggle section selection
  const toggleSectionSelection = (sectionId: string) => {
    setSelectedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  // Toggle section expansion
  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Template assignment management
  const toggleAssignment = async (templateType: string, vehicleId?: string, vehicleGroupId?: string) => {
    try {
      const existing = assignments.find(a => 
        a.template_type === templateType && 
        ((vehicleId && a.vehicle_id === vehicleId) || (vehicleGroupId && a.vehicle_group_id === vehicleGroupId))
      )

      if (existing) {
        const { error } = await supabase
          .from('inspection_template_assignments')
          .delete()
          .eq('id', existing.id)
          
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('inspection_template_assignments')
          .insert({
            template_type: templateType,
            vehicle_id: vehicleId,
            vehicle_group_id: vehicleGroupId,
            is_active: true
          })
          
        if (error) throw error
      }

      await loadAssignments(templateType)
      await loadAssignments() // Refresh counts
    } catch (error: any) {
      console.error('Error toggling assignment:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.assignmentFailed'),
        variant: "destructive"
      })
    }
  }

  // Toggle expansions
  const toggleTemplate = (templateType: string) => {
    const wasExpanded = expandedTemplates[templateType]
    setExpandedTemplates(prev => ({
      ...prev,
      [templateType]: !prev[templateType]
    }))
    
    // Load assignments when template is expanded
    if (!wasExpanded) {
      loadAssignments(templateType)
    }
  }

  // Vehicle Group Management Functions
  const handleAddVehicleGroup = () => {
    setEditingVehicleGroup(null)
    setVehicleGroupForm({
      name: '',
      description: '',
      color: '#3B82F6'
    })
    setShowVehicleGroupDialog(true)
  }

  const handleEditVehicleGroup = (group: VehicleGroup) => {
    setEditingVehicleGroup(group)
    setVehicleGroupForm({
      name: group.name,
      description: group.description || '',
      color: group.color || '#3B82F6'
    })
    setShowVehicleGroupDialog(true)
  }

  const handleSaveVehicleGroup = async () => {
    if (!vehicleGroupForm.name.trim()) {
      toast({
        title: t('common.error'),
        description: t('inspectionTemplates.messages.errors.groupNameRequired'),
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const groupData = {
        name: vehicleGroupForm.name,
        description: vehicleGroupForm.description || null,
        color: vehicleGroupForm.color
      }

      if (editingVehicleGroup) {
        const response = await fetch(`/api/vehicle-groups/${editingVehicleGroup.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(groupData)
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Failed to update vehicle group')
        }
      } else {
        const { error } = await supabase
          .from('vehicle_groups')
          .insert(groupData)

        if (error) throw error
      }

      setShowVehicleGroupDialog(false)
      toast({
        title: t('common.success'),
        description: editingVehicleGroup ? t('inspectionTemplates.messages.vehicleGroupUpdated') : t('inspectionTemplates.messages.vehicleGroupCreated')
      })
      
      await loadVehiclesAndGroups()
    } catch (error: any) {
      console.error('Error saving vehicle group:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.vehicleGroupCreateFailed'),
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  const handleDeleteVehicleGroup = async (group: VehicleGroup) => {
    logDeleteOperation('Vehicle Group Delete', { group })
    setIsSubmitting(true)
    try {
      // First check if the group has any assigned templates
      const { data: assignments, error: assignmentError } = await supabase
        .from('inspection_template_assignments')
        .select('id')
        .eq('vehicle_group_id', group.id)
        .limit(1)

      if (assignmentError) throw assignmentError

      if (assignments && assignments.length > 0) {
        toast({
          title: t('common.error'),
          description: t('inspectionTemplates.messages.errors.vehicleGroupHasAssignments'),
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      const { error } = await supabase
        .from('vehicle_groups')
        .delete()
        .eq('id', group.id)

      if (error) throw error

      toast({
        title: t('common.success'),
        description: t('inspectionTemplates.messages.vehicleGroupDeleted')
      })
      
      await loadVehiclesAndGroups()
    } catch (error: any) {
      console.error('Error deleting vehicle group:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.vehicleGroupDeleteFailed'),
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  const handleManageGroupVehicles = (group: VehicleGroup) => {
    setSelectedVehicleGroup(group)
    setShowVehicleGroupManagementModal(true)
  }

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmDialog.item) return
    
    try {
      switch (deleteConfirmDialog.type) {
        case 'template':
          await handleDeleteTemplate(deleteConfirmDialog.item as InspectionTemplate)
          break
        case 'section':
          await handleDeleteSection(deleteConfirmDialog.item as InspectionSection)
          break
        case 'item':
          await handleDeleteItem((deleteConfirmDialog.item as InspectionItemTemplate).id)
          break
      }
      setDeleteConfirmDialog({ open: false, type: 'template', item: null, title: '', description: '' })
    } catch (error) {
      console.error('Error in delete confirmation:', error)
    }
  }

  // Item Management Functions
  const handleAddItem = async (sectionId: string, item: Omit<InspectionItemTemplate, 'id' | 'category_id'>) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/inspection-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId: sectionId,
          nameTranslations: item.name_translations,
          requiresPhoto: item.requires_photo || false,
          requiresNotes: item.requires_notes || false,
          descriptionTranslations: item.description_translations
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add item')
      }

      toast({
        title: t('common.success'),
        description: t('inspectionTemplates.messages.itemAdded')
      })
      
      await loadTemplates()
    } catch (error: any) {
      console.error('Error adding item:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.itemAddFailed'),
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  const handleEditItem = async (itemId: string, item: Partial<InspectionItemTemplate>) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/inspection-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update item')
      }

      toast({
        title: t('common.success'),
        description: t('inspectionTemplates.messages.itemUpdated')
      })
      
      await loadTemplates()
    } catch (error: any) {
      console.error('Error updating item:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.itemUpdateFailed'),
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  const handleDeleteItem = async (itemId: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/inspection-items/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete item')
      }

      toast({
        title: t('common.success'),
        description: t('inspectionTemplates.messages.itemDeleted')
      })
      
      await loadTemplates()
    } catch (error: any) {
      console.error('Error deleting item:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.itemDeleteFailed'),
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  // Reorder Functions - use API routes instead of service client
  const handleReorderSections = async (reorderedSections: { id: string; order: number }[]) => {
    try {
      const response = await fetch('/api/inspection-sections/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sections: reorderedSections })
      })

      const result = await response.json()

      if (!response.ok) {
        // If we have missing section IDs, provide a more specific error message
        if (result.missingIds && result.missingIds.length > 0) {
          throw new Error(`Some sections could not be found in the database. Please refresh and try again.`);
        }
        throw new Error(result.error || 'Failed to reorder sections')
      }
      
      // If any sections were updated, consider it a success
      if (result.success) {
        toast({
          title: t('common.success'),
          description: t('inspectionTemplates.messages.sectionsReordered')
        })
      } else {
        // Partial success or no sections updated
        console.warn('Reorder sections partial success:', result);
        toast({
          title: t('common.warning'),
          description: result.message || t('inspectionTemplates.messages.errors.reorderFailed'),
          variant: "default"
        })
      }
      
      // Refresh data regardless of partial success
      await loadTemplates()
    } catch (error: any) {
      console.error('Error reordering sections:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.reorderFailed'),
        variant: "destructive"
      })
      
      // Refresh data to ensure UI is in sync with backend
      await loadTemplates()
    }
  }

  const handleReorderItems = async (reorderedItems: { id: string; order: number }[]) => {
    try {
      const response = await fetch('/api/inspection-items/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: reorderedItems })
      })

      const result = await response.json()

      if (!response.ok) {
        // If we have missing item IDs, provide a more specific error message
        if (result.missingIds && result.missingIds.length > 0) {
          throw new Error(`Some items could not be found in the database. Please refresh and try again.`);
        }
        throw new Error(result.error || 'Failed to reorder items')
      }
      
      // If any items were updated, consider it a success
      if (result.success) {
        toast({
          title: t('common.success'),
          description: t('inspectionTemplates.messages.itemsReordered')
        })
      } else {
        // Partial success or no items updated
        console.warn('Reorder items partial success:', result);
        toast({
          title: t('common.warning'),
          description: result.message || t('inspectionTemplates.messages.errors.reorderFailed'),
          variant: "default"
        })
      }
      
      // Refresh data regardless of partial success
      await loadTemplates()
    } catch (error: any) {
      console.error('Error reordering items:', error)
      toast({
        title: t('common.error'),
        description: error.message || t('inspectionTemplates.messages.errors.reorderFailed'),
        variant: "destructive"
      })
      
      // Refresh data to ensure UI is in sync with backend
      await loadTemplates()
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true
    return template.type.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <TemplateHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSections={selectedSections}
        onDeleteMultiple={handleDeleteMultipleSections}
        onCreateTemplate={() => setShowNewTemplateDialog(true)}
        isSubmitting={isSubmitting}
      />

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('inspectionTemplates.noTemplatesFound')}</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              {searchQuery 
                ? t('inspectionTemplates.noSearchResults')
                : t('inspectionTemplates.noTemplatesDescription')
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowNewTemplateDialog(true)}>
                {t('inspectionTemplates.createTemplate')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.type}
              template={template}
              vehicles={vehicles}
              vehicleGroups={vehicleGroups}
              assignments={assignments}
              expandedTemplates={expandedTemplates}
              expandedSections={expandedSections}
              selectedSections={selectedSections}
              onToggleTemplate={toggleTemplate}
              onToggleSectionExpansion={toggleSectionExpansion}
              onToggleSectionSelection={toggleSectionSelection}
              onToggleAssignment={toggleAssignment}
              onAddSection={handleAddSection}
              onEditSection={handleEditSection}
              onDeleteSection={handleDeleteSection}
              onDeleteTemplate={handleDeleteTemplate}
              onEditTemplate={handleEditTemplate}
              onDuplicateTemplate={handleDuplicateTemplate}
              onAddVehicleGroup={handleAddVehicleGroup}
              onEditVehicleGroup={handleEditVehicleGroup}
              onDeleteVehicleGroup={handleDeleteVehicleGroup}
              onAddItem={handleAddItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onReorderSections={handleReorderSections}
              onReorderItems={handleReorderItems}
              onManageGroupVehicles={handleManageGroupVehicles}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}

      {/* New Template Dialog */}
      <Dialog open={showNewTemplateDialog} onOpenChange={setShowNewTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inspectionTemplates.dialogs.createTemplate.title')}</DialogTitle>
            <DialogDescription>{t('inspectionTemplates.dialogs.createTemplate.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="templateType">{t('inspectionTemplates.templateType')} *</Label>
              <Input
                id="templateType"
                value={newTemplateType}
                onChange={(e) => setNewTemplateType(e.target.value)}
                placeholder={t('inspectionTemplates.dialogs.createTemplate.templateTypePlaceholder')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewTemplateDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleCreateTemplate} 
                disabled={!newTemplateType.trim() || isSubmitting}
              >
                {isSubmitting ? t('common.creating') : t('inspectionTemplates.createTemplate')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={showEditTemplateDialog} onOpenChange={setShowEditTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inspectionTemplates.dialogs.editTemplate.title')}</DialogTitle>
            <DialogDescription>{t('inspectionTemplates.dialogs.editTemplate.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentType">{t('inspectionTemplates.dialogs.editTemplate.currentName')}</Label>
              <Input
                id="currentType"
                value={editTemplateForm.currentType}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="newType">{t('inspectionTemplates.dialogs.editTemplate.newName')} *</Label>
              <Input
                id="newType"
                value={editTemplateForm.newType}
                onChange={(e) => setEditTemplateForm(prev => ({ ...prev, newType: e.target.value }))}
                placeholder={t('inspectionTemplates.newTemplateType')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditTemplateDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleSaveTemplateEdit} 
                disabled={!editTemplateForm.newType.trim() || isSubmitting}
              >
                {isSubmitting ? t('common.saving') : t('common.saveChanges')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Template Dialog */}
      <Dialog open={showDuplicateTemplateDialog} onOpenChange={setShowDuplicateTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('inspectionTemplates.dialogs.duplicateTemplate.title')}</DialogTitle>
            <DialogDescription>{t('inspectionTemplates.dialogs.duplicateTemplate.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sourceType">{t('inspectionTemplates.dialogs.duplicateTemplate.sourceTemplate')}</Label>
              <Input
                id="sourceType"
                value={duplicateTemplateForm.sourceType}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="targetType">{t('inspectionTemplates.dialogs.duplicateTemplate.targetType')} *</Label>
              <Input
                id="targetType"
                value={duplicateTemplateForm.targetType}
                onChange={(e) => setDuplicateTemplateForm(prev => ({ ...prev, targetType: e.target.value }))}
                placeholder={t('inspectionTemplates.dialogs.duplicateTemplate.targetTypePlaceholder')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDuplicateTemplateDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleSaveTemplateDuplicate} 
                disabled={!duplicateTemplateForm.targetType.trim() || isSubmitting}
              >
                {isSubmitting ? t('common.creating') : t('inspectionTemplates.duplicateTemplate')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={showEditSectionDialog} onOpenChange={setShowEditSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? t('inspectionTemplates.dialogs.section.edit') : t('inspectionTemplates.dialogs.section.create')}</DialogTitle>
            <DialogDescription>
              {editingSection 
                ? 'Modify the section details and settings'
                : 'Create a new section for organizing inspection items'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sectionNameEn">{t('inspectionTemplates.dialogs.section.nameEn')} *</Label>
                <Input
                  id="sectionNameEn"
                  value={sectionForm.name_en}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder={t('inspectionTemplates.dialogs.section.nameEnPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="sectionNameJa">{t('inspectionTemplates.dialogs.section.nameJa')}</Label>
                <Input
                  id="sectionNameJa"
                  value={sectionForm.name_ja}
                  onChange={(e) => setSectionForm(prev => ({ ...prev, name_ja: e.target.value }))}
                  placeholder={t('inspectionTemplates.dialogs.section.nameJaPlaceholder')}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="sectionActive"
                checked={sectionForm.is_active}
                onCheckedChange={(checked) => setSectionForm(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="sectionActive">{t('inspectionTemplates.dialogs.section.isActive')}</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditSectionDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleSaveSection} 
                disabled={!sectionForm.name_en.trim() || isSubmitting}
              >
                {isSubmitting ? t('common.saving') : editingSection ? t('common.saveChanges') : t('inspectionTemplates.sections.addSection')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Group Dialog */}
      <Dialog open={showVehicleGroupDialog} onOpenChange={setShowVehicleGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVehicleGroup ? t('inspectionTemplates.dialogs.vehicleGroup.edit') : t('inspectionTemplates.dialogs.vehicleGroup.create')}</DialogTitle>
            <DialogDescription>
              {editingVehicleGroup 
                ? 'Update the vehicle group information'
                : 'Create a new vehicle group to organize your fleet'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">{t('inspectionTemplates.dialogs.vehicleGroup.name')} *</Label>
              <Input
                id="groupName"
                value={vehicleGroupForm.name}
                onChange={(e) => setVehicleGroupForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('inspectionTemplates.dialogs.vehicleGroup.namePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="groupDescription">{t('inspectionTemplates.dialogs.vehicleGroup.description')}</Label>
              <Input
                id="groupDescription"
                value={vehicleGroupForm.description}
                onChange={(e) => setVehicleGroupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('inspectionTemplates.dialogs.vehicleGroup.descriptionPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="groupColor">{t('inspectionTemplates.dialogs.vehicleGroup.color')}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="groupColor"
                  value={vehicleGroupForm.color}
                  onChange={(e) => setVehicleGroupForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-10 rounded border border-input"
                  title={t('inspectionTemplates.dialogs.vehicleGroup.selectColor')}
                  aria-label={t('inspectionTemplates.dialogs.vehicleGroup.selectColor')}
                />
                <Input
                  value={vehicleGroupForm.color}
                  onChange={(e) => setVehicleGroupForm(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowVehicleGroupDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleSaveVehicleGroup} 
                disabled={!vehicleGroupForm.name.trim() || isSubmitting}
              >
                {isSubmitting ? t('common.saving') : editingVehicleGroup ? t('common.saveChanges') : t('inspectionTemplates.groups.create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.open} onOpenChange={(open) => setDeleteConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {deleteConfirmDialog.title}
            </DialogTitle>
            <DialogDescription>
              {deleteConfirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('common.cannotBeUndone')}
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirmDialog(prev => ({ ...prev, open: false }))}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('common.deleting')}
                  </>
                ) : (
                  <>
                    {t('common.delete')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Group Management Modal */}
      <VehicleGroupManagementModal
        open={showVehicleGroupManagementModal}
        onOpenChange={setShowVehicleGroupManagementModal}
        group={selectedVehicleGroup}
        onUpdate={() => loadVehiclesAndGroups()}
      />
    </div>
  )
} 