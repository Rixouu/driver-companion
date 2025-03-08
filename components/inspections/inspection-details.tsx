"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Printer, Download, Expand, X, Pencil, Play, CheckCircle, XCircle, Clock, Camera, FileText, AlertTriangle, Wrench } from "lucide-react"
import { formatDate } from "@/lib/utils/formatting"
import { format as dateFormat } from "date-fns"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InspectionStatusBadge } from "./inspection-status-badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { Inspection } from "@/types"

// Add extended inspection type with inspection_items
interface ExtendedInspection extends Inspection {
  inspection_items?: InspectionItem[];
  vehicle_id: string;
  vehicle?: {
    id: string;
    name: string;
    plate_number: string;
    image_url?: string;
    brand?: string;
  };
}

interface InspectionPhoto {
  id: string;
  photo_url: string;
}

interface InspectionItemTemplate {
  id: string;
  name: string;
  description?: string;
}

interface InspectionItem {
  id: string;
  inspection_id: string;
  template_id: string;
  status: 'pass' | 'fail' | 'pending' | null;
  notes?: string;
  template?: InspectionItemTemplate;
  inspection_photos?: InspectionPhoto[];
}

interface InspectionDetailsProps {
  inspection: ExtendedInspection
}

export function InspectionDetails({ inspection: initialInspection }: InspectionDetailsProps) {
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [inspection, setInspection] = useState<ExtendedInspection>(initialInspection)
  const [isUpdating, setIsUpdating] = useState(false)
  const [itemsWithTemplates, setItemsWithTemplates] = useState<InspectionItem[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    async function loadTemplates() {
      try {
        // First, get the vehicle details if needed
        if (inspection.vehicle?.id) {
          const { data: vehicleData, error: vehicleError } = await supabase
            .from('vehicles')
        .select('*')
            .eq('id', inspection.vehicle.id)
        .single()

          if (vehicleError) throw vehicleError
          
          // Update the vehicle information in the inspection object
          setInspection({
            ...inspection,
            vehicle: vehicleData
          })
        }

        // For scheduled inspections, we might not have inspection items yet
        if (inspection.inspection_items && inspection.inspection_items.length > 0) {
          // Fetch all templates for the items
          const templateIds = inspection.inspection_items.map(item => item.template_id)
          
          const { data: templates, error } = await supabase
            .from('inspection_item_templates')
            .select('id, name, description')
            .in('id', templateIds)

          if (error) throw error

          // Fetch photos for each inspection item
          const { data: photos, error: photosError } = await supabase
            .from('inspection_photos')
            .select('id, inspection_item_id, photo_url')
            .in('inspection_item_id', inspection.inspection_items.map(item => item.id))

          if (photosError) throw photosError

          // Attach template data and photos to each item
          const itemsWithData = inspection.inspection_items.map(item => ({
            ...item,
            template: templates.find(t => t.id === item.template_id),
            inspection_photos: photos ? photos.filter(photo => photo.inspection_item_id === item.id) : []
          }))

          setItemsWithTemplates(itemsWithData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadTemplates()
  }, [inspection])

  async function handleStartInspection() {
    try {
      setIsUpdating(true)
      
      const { error } = await supabase
        .from('inspections')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', inspection.id)

      if (error) throw error

      toast({
        title: t('inspections.messages.updateSuccess'),
      })

      // Redirect to the inspection form
      router.push(`/inspections/${inspection.id}/perform`)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: t('inspections.messages.error'),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Update the helper function to map template names to correct section and item keys
  function getTranslationKeys(templateName: string | undefined): { section: string; item: string } {
    if (!templateName) return { section: '', item: '' }
    
    // Convert template name to lowercase and remove extra spaces
    const name = templateName.toLowerCase().trim()
    
    // Map template names to their correct sections and items
    const mappings: Record<string, { section: string; item: string }> = {
      'steering wheel': { section: 'steering_system', item: 'steering_wheel' },
      'power steering': { section: 'steering_system', item: 'power_steering' },
      'steering column': { section: 'steering_system', item: 'steering_column' },
      'brake pedal': { section: 'brake_system', item: 'brake_pedal' },
      'brake discs': { section: 'brake_system', item: 'brake_discs' },
      'brake fluid': { section: 'brake_system', item: 'brake_fluid' },
      'emergency brake': { section: 'brake_safety', item: 'emergency_brake' },
      'brake lines': { section: 'brake_safety', item: 'brake_lines' },
      'abs system': { section: 'brake_safety', item: 'abs_system' },
      'seatbelt condition': { section: 'restraint_systems', item: 'seatbelt_condition' },
      'airbag indicators': { section: 'restraint_systems', item: 'airbag_indicators' },
      'child locks': { section: 'restraint_systems', item: 'child_locks' },
      'windshield condition': { section: 'visibility', item: 'windshield_condition' },
      'mirror condition': { section: 'visibility', item: 'mirror_condition' },
      'window operation': { section: 'visibility', item: 'window_operation' },
      'shock absorbers': { section: 'suspension', item: 'shock_absorbers' },
      'springs': { section: 'suspension', item: 'springs' },
      'bushings': { section: 'suspension', item: 'bushings' },
      'ball joints': { section: 'suspension', item: 'ball_joints' },
      'headlights': { section: 'lighting', item: 'headlights' },
      'taillights': { section: 'lighting', item: 'taillights' },
      'turn indicators': { section: 'lighting', item: 'turn_indicators' },
      'tire pressure': { section: 'tires', item: 'tire_pressure' },
      'tread depth': { section: 'tires', item: 'tread_depth' },
      'tire condition': { section: 'tires', item: 'tire_condition' },
      'wheel alignment': { section: 'tires', item: 'wheel_alignment' },
      'wear pattern': { section: 'tires', item: 'wear_pattern' },
      'oil level': { section: 'engine', item: 'oil_level' },
      'coolant level': { section: 'engine', item: 'coolant_level' },
      'belts': { section: 'engine', item: 'belts' },
      'drive belts': { section: 'engine', item: 'drive_belts' },
      'hoses': { section: 'engine', item: 'hoses' },
      'fluid leaks': { section: 'engine', item: 'fluid_leaks' },
      'transmission fluid': { section: 'transmission', item: 'transmission_fluid' },
      'shifting operation': { section: 'transmission', item: 'shifting_operation' },
      'clutch operation': { section: 'transmission', item: 'clutch_operation' },
      'leaks': { section: 'transmission', item: 'leaks' },
      'battery condition': { section: 'electrical', item: 'battery_condition' },
      'alternator output': { section: 'electrical', item: 'alternator_output' },
      'starter operation': { section: 'electrical', item: 'starter_operation' },
      'seatbelt operation': { section: 'safety_equipment', item: 'seatbelt_operation' },
      'airbag system': { section: 'safety_equipment', item: 'airbag_system' },
      'wiper operation': { section: 'safety_equipment', item: 'wiper_operation' },
      'oil change': { section: 'scheduled_maintenance', item: 'oil_change' },
      'filter replacement': { section: 'scheduled_maintenance', item: 'filter_replacement' },
      'fluid levels': { section: 'scheduled_maintenance', item: 'fluid_levels' },
      'brake pads': { section: 'wear_items', item: 'brake_pads' },
      'tire rotation': { section: 'wear_items', item: 'tire_rotation' },
      'belt condition': { section: 'wear_items', item: 'belt_condition' },
      'computer scan': { section: 'diagnostics', item: 'computer_scan' },
      'sensor check': { section: 'diagnostics', item: 'sensor_check' },
      'emissions test': { section: 'diagnostics', item: 'emissions_test' }
    }

    return mappings[name] || { section: '', item: '' }
  }

  // Function to create a maintenance task from failed items
  const handleScheduleRepair = () => {
    // Get all failed items
    const failedItems = itemsWithTemplates.filter(item => item.status === 'fail');
    
    if (failedItems.length === 0) return;
    
    // Create a title based on the failed items
    let title = '';
    if (failedItems.length === 1) {
      // If only one item failed, use its name as the title
      title = `Repair ${failedItems[0].template?.name || 'Item'}`;
    } else if (failedItems.length <= 3) {
      // If 2-3 items failed, list them all
      title = `Repair ${failedItems.map(item => item.template?.name).join(', ')}`;
    } else {
      // If more than 3 items failed, list the first two and indicate there are more
      title = `Repair ${failedItems[0].template?.name}, ${failedItems[1].template?.name} and ${failedItems.length - 2} more items`;
    }
    
    // Create a detailed description from the failed items
    let description = `Repairs needed based on inspection from ${dateFormat(new Date(inspection.date), 'PPP')}:\n\n`;
    
    failedItems.forEach((item, index) => {
      const itemName = item.template?.name || 'Unknown item';
      description += `${index + 1}. ${itemName}`;
      
      if (item.notes) {
        description += `: ${item.notes}`;
      }
      
      description += '\n';
    });
    
    // Encode the data to pass as URL parameters
    const params = new URLSearchParams({
      title,
      description,
      vehicle_id: inspection.vehicle_id,
      priority: 'high',
      source: 'inspection',
      inspection_id: inspection.id,
      status: 'scheduled' // Ensure the status is set to 'scheduled' instead of 'pending'
    });
    
    // Navigate to the maintenance creation page with prefilled data
    router.push(`/maintenance/new?${params.toString()}`);
  };

  if (!inspection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('inspections.details.title')}</CardTitle>
          <CardDescription>{t('inspections.details.noItems')}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const vehicle = inspection.vehicle || {}
  const items = itemsWithTemplates

  // For scheduled inspections, we might not have any items yet
  const passedItems = items.filter(item => item.status === 'pass').length
  const failedItems = items.filter(item => item.status === 'fail').length
  const totalItems = items.length
  const itemsWithNotes = items.filter(item => item.notes).length
  const totalPhotos = items.reduce((sum, item) => sum + (item.inspection_photos?.length || 0), 0)

  const tabs = [
    { value: "details", label: t("inspections.details.tabs.details"), icon: FileText },
    { value: "failed", label: t("inspections.details.tabs.failed"), icon: XCircle },
    { value: "passed", label: t("inspections.details.tabs.passed"), icon: CheckCircle },
  ]

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="space-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                asChild
              >
                <Link href={`/vehicles/${inspection.vehicle_id}`}>
                  <ArrowLeft className="h-4 w-4" />
                  {t('common.backTo')}
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {inspection.status === 'scheduled' && (
                <Button 
                  onClick={handleStartInspection} 
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  {t('inspections.actions.startInspection')}
                </Button>
              )}
              {inspection.status === 'completed' && (
                <>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Printer className="h-4 w-4" />
                    {t('inspections.details.actions.print')}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    {t('inspections.details.actions.export')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="details" className="w-full">
        {/* Desktop Tabs */}
        <div className="hidden md:block">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="relative rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
          <TabsList className="w-full grid grid-cols-3 gap-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center py-4 px-2 gap-2 min-h-[5rem]"
              >
                <tab.icon className="h-6 w-6" />
                <span className="text-sm font-medium text-center whitespace-normal leading-tight">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content with Mobile Padding */}
        <div className="mt-4 pb-24 md:pb-0">
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('inspections.details.vehicleDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative aspect-video w-full mb-4 rounded-lg overflow-hidden">
                    {inspection.vehicle?.image_url ? (
                      <Image
                        src={inspection.vehicle.image_url}
                        alt={inspection.vehicle?.name || ""}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <p className="text-muted-foreground">{t('inspections.details.vehicleInfo.noImage')}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">
                        {t("vehicles.fields.plateNumber")}
                      </h3>
                      <p>{inspection.vehicle?.plate_number}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">
                        {t("vehicles.fields.brand")}
                      </h3>
                      <p>{inspection.vehicle?.brand || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inspection Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('inspections.details.inspectionDetails')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">{t("inspections.fields.type")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`inspections.type.description.${inspection.type}`)}
                    </p>
                  </div>
                  
                  {/* Inspection Results Summary */}
                  {(inspection.status === 'completed' || inspection.status === 'in_progress') && items.length > 0 && (
                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-3">{t("inspections.details.results.title")}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <p className="text-sm text-muted-foreground">{t("inspections.details.results.passCount", { count: String(passedItems) })}</p>
                          <p className="text-xl font-semibold mt-1 text-green-600 dark:text-green-400">{passedItems}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <p className="text-sm text-muted-foreground">{t("inspections.details.results.failCount", { count: String(failedItems) })}</p>
                          <p className="text-xl font-semibold mt-1 text-red-600 dark:text-red-400">{failedItems}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <p className="text-sm text-muted-foreground">{t("inspections.details.results.photoCount", { count: String(totalPhotos) })}</p>
                          <p className="text-xl font-semibold mt-1">{totalPhotos}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <p className="text-sm text-muted-foreground">{t("inspections.details.results.notesCount", { count: String(itemsWithNotes) })}</p>
                          <p className="text-xl font-semibold mt-1">{itemsWithNotes}</p>
                        </div>
                      </div>
                      
                      {/* Completion Rate Progress Bar */}
                      {totalItems > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-medium">{t("inspections.details.results.completionRate")}</p>
                            <p className="text-sm font-medium">{Math.round(((passedItems + failedItems) / totalItems) * 100)}%</p>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div 
                              className="bg-primary h-2.5 rounded-full" 
                              style={{ width: `${Math.round(((passedItems + failedItems) / totalItems) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Last Updated */}
                      <div className="mt-4 text-sm text-muted-foreground">
                        <p>{t("inspections.details.results.lastUpdated")}: {formatDate(inspection.updated_at || inspection.created_at)}</p>
                      </div>
                    </div>
                  )}
                  
                  {inspection.notes && (
                    <div className="pt-4 border-t">
                      <h3 className="font-medium mb-2">{t("inspections.fields.notes")}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {inspection.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="failed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('inspections.details.results.failedItemsFound', { count: `${itemsWithTemplates.filter(item => item.status === 'fail').length}` })}</CardTitle>
                <CardDescription>{t('inspections.details.results.failedItemsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {failedItems === 0 ? (
                  <div className="text-center py-8 bg-muted/30 rounded-lg">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t('inspections.details.results.allPassed')}</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {t('inspections.details.results.noFailedItems')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                            {t('inspections.details.results.failedItemsFound', { count: String(failedItems) })}
                          </h3>
                          <div className="mt-2 text-sm text-red-700 dark:text-red-300/80">
                            <p>{t('inspections.details.results.failedItemsDescription')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {items
                      .filter((item) => item.status === 'fail')
                      .map((item, index) => (
                        <Card key={item.id} className="border-red-200 dark:border-red-900/50 shadow-sm">
                          <CardHeader className="bg-red-50/50 dark:bg-red-900/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-medium text-sm">
                                    {index + 1}
                                  </div>
                                </div>
                                <div>
                                  <CardTitle className="text-base text-red-800 dark:text-red-300">
                                    {(() => {
                                      const keys = getTranslationKeys(item.template?.name)
                                      const translatedTitle = keys.section && keys.item
                                        ? t(`inspections.sections.${keys.section}.items.${keys.item}.title`)
                                        : item.template?.name
                                      return translatedTitle || t('common.noResults')
                                    })()}
                                  </CardTitle>
                                  {item.template?.description && (
                                    <CardDescription className="text-red-700/80 dark:text-red-400/80">
                                      {(() => {
                                        const keys = getTranslationKeys(item.template?.name)
                                        const translatedDescription = keys.section && keys.item
                                          ? t(`inspections.sections.${keys.section}.items.${keys.item}.description`)
                                          : item.template?.description
                                        return translatedDescription || item.template?.description || ''
                                      })()}
                                    </CardDescription>
                                  )}
                                </div>
                              </div>
                              <Badge variant="destructive">{t('inspections.actions.fail')}</Badge>
                            </div>
                          </CardHeader>
                          {(item.notes || (item.inspection_photos && item.inspection_photos.length > 0)) && (
                            <CardContent className="pt-4">
                              {item.notes && (
                                <div className="mb-4 bg-muted/30 p-3 rounded-md">
                                  <h3 className="font-medium text-sm mb-1 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></span>
                                    {t('inspections.fields.notes')}
                                  </h3>
                                  <p className="text-sm">{item.notes}</p>
                                </div>
                              )}
                              {item.inspection_photos && item.inspection_photos.length > 0 && (
                                <div>
                                  <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></span>
                                    {t('inspections.fields.photos')} ({item.inspection_photos.length})
                                  </h3>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {item.inspection_photos.map((photo) => (
                                      <div key={photo.id} className="group relative aspect-square rounded-md overflow-hidden border border-red-200 dark:border-red-900/30">
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <button className="w-full h-full" title={t('inspections.fields.photo')}>
                                              <Image
                                                src={photo.photo_url}
                                                alt={t('inspections.fields.photo')}
                                                fill
                                                className="object-cover"
                                              />
                                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Expand className="h-6 w-6 text-white" />
                                              </div>
                                            </button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-4xl">
                                            <div className="relative aspect-video w-full">
                                              <Image
                                                src={photo.photo_url}
                                                alt={t('inspections.fields.photo')}
                                                fill
                                                className="rounded-lg object-contain"
                                              />
                                            </div>
                                            <div className="flex justify-end gap-2 mt-4">
                                              <Button variant="outline" size="sm" asChild>
                                                <a href={photo.photo_url} download target="_blank" rel="noopener noreferrer">
                                                  <Download className="h-4 w-4 mr-2" />
                                                  {t('inspections.details.photos.downloadPhoto')}
                                                </a>
                                              </Button>
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      ))}
                      
                    {/* Add a call-to-action card at the bottom */}
                    <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/30">
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                          <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/50 p-3 rounded-full">
                            <Wrench className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div className="flex-grow text-center md:text-left">
                            <h3 className="font-medium text-orange-800 dark:text-orange-300 mb-1">
                              {t('inspections.actions.needsRepair')}
                            </h3>
                            <p className="text-sm text-orange-700 dark:text-orange-400 mb-4">
                              {t('inspections.actions.scheduleRepairDescription')}
                            </p>
                          </div>
                          <Button 
                            onClick={handleScheduleRepair}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            <Wrench className="mr-2 h-4 w-4" />
                            {t("inspections.actions.scheduleRepair")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="passed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('inspections.details.results.passCount', { count: `${itemsWithTemplates.filter(item => item.status === 'pass').length}` })}</CardTitle>
              </CardHeader>
              <CardContent>
                {passedItems === 0 ? (
                  <div className="text-center py-8 bg-muted/30 rounded-lg">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">{t('inspections.details.results.allPassed')}</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {t('inspections.details.results.noFailedItems')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                            {t('inspections.details.results.failedItemsFound', { count: String(failedItems) })}
                          </h3>
                          <div className="mt-2 text-sm text-green-700 dark:text-green-300/80">
                            <p>{t('inspections.details.results.failedItemsDescription')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {items
                      .filter((item) => item.status === 'pass')
                      .map((item, index) => (
                        <Card key={item.id} className="border-green-200 dark:border-green-900/50 shadow-sm">
                          <CardHeader className="bg-green-50/50 dark:bg-green-900/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-medium text-sm">
                                    {index + 1}
                                  </div>
                                </div>
                                <div>
                                  <CardTitle className="text-base text-green-800 dark:text-green-300">
                                    {(() => {
                                      const keys = getTranslationKeys(item.template?.name)
                                      const translatedTitle = keys.section && keys.item
                                        ? t(`inspections.sections.${keys.section}.items.${keys.item}.title`)
                                        : item.template?.name
                                      return translatedTitle || t('common.noResults')
                                    })()}
                                  </CardTitle>
                                  {item.template?.description && (
                                    <CardDescription className="text-green-700/80 dark:text-green-400/80">
                                      {(() => {
                                        const keys = getTranslationKeys(item.template?.name)
                                        const translatedDescription = keys.section && keys.item
                                          ? t(`inspections.sections.${keys.section}.items.${keys.item}.description`)
                                          : item.template?.description
                                        return translatedDescription || item.template?.description || ''
                                      })()}
                                    </CardDescription>
                                  )}
                                </div>
                              </div>
                              <Badge variant="success">{t('inspections.actions.pass')}</Badge>
                            </div>
                          </CardHeader>
                          {(item.notes || (item.inspection_photos && item.inspection_photos.length > 0)) && (
                            <CardContent className="pt-4">
                              {item.notes && (
                                <div className="mb-4 bg-muted/30 p-3 rounded-md">
                                  <h3 className="font-medium text-sm mb-1 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
                                    {t('inspections.fields.notes')}
                                  </h3>
                                  <p className="text-sm">{item.notes}</p>
                                </div>
                              )}
                              {item.inspection_photos && item.inspection_photos.length > 0 && (
                                <div>
                                  <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
                                    {t('inspections.details.photos.title')} ({item.inspection_photos.length})
                                  </h3>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {item.inspection_photos.map((photo) => (
                                      <div key={photo.id} className="group relative aspect-square rounded-md overflow-hidden border border-green-200 dark:border-green-900/30">
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <button className="w-full h-full" title={t('inspections.fields.photo')}>
                                              <Image
                                                src={photo.photo_url}
                                                alt={t('inspections.fields.photo')}
                                                fill
                                                className="object-cover"
                                              />
                                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Expand className="h-6 w-6 text-white" />
                                              </div>
                                            </button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-4xl">
                                            <div className="relative aspect-video w-full">
                                              <Image
                                                src={photo.photo_url}
                                                alt={t('inspections.fields.photo')}
                                                fill
                                                className="rounded-lg object-contain"
                                              />
                                            </div>
                                            <div className="flex justify-end gap-2 mt-4">
                                              <Button variant="outline" size="sm" asChild>
                                                <a href={photo.photo_url} download target="_blank" rel="noopener noreferrer">
                                                  <Download className="h-4 w-4 mr-2" />
                                                  {t('inspections.details.photos.downloadPhoto')}
                                                </a>
                                              </Button>
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
} 

function getStatusVariant(status: string) {
  switch (status) {
    case "completed":
      return "success"
    case "in_progress":
      return "warning"
    case "scheduled":
      return "secondary"
    default:
      return "default"
  }
} 