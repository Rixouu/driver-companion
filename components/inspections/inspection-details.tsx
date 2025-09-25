"use client"

import Link from "next/link"
import Image from "next/image"
import dynamic from 'next/dynamic';
import { ArrowLeft, Download, Expand, X, Pencil, Play, CheckCircle, XCircle, Clock, Camera, FileText, AlertTriangle, Wrench, Car, Clipboard, Tag, Hash, Truck, BarChart3 } from "lucide-react"
import { formatDate } from "@/lib/utils/formatting"
import { format as dateFormat } from "date-fns"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InspectionStatusBadge } from "@/components/inspections/inspection-status-badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useSupabase } from "@/components/providers/supabase-provider"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import type { DbInspection, DbVehicle } from "@/types"
import { useRealtimeRecord, useRealtimeCollection } from "@/lib/hooks/use-realtime"
import { idFilter } from "@/lib/services/realtime"
import { useAuth } from "@/lib/hooks/use-auth"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { InspectionDetailsHeader } from "@/components/inspections/inspection-details-header"
import { useInspectionStatus } from "@/lib/hooks/use-inspection-status";
import { useInspectionItems } from "@/lib/hooks/use-inspection-items";
import { useInspectionReportExport } from '@/lib/hooks/use-inspection-report-export';
import { InspectionItemsDisplayList } from '@/components/inspections/inspection-items-display-list';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Add extended inspection type with inspection_items
export interface ExtendedInspection extends DbInspection {
  name?: string;
  inspection_items?: InspectionItem[];
  vehicle?: DbVehicle;
  inspector?: {
    id: string;
    name: string;
    email?: string;
  };
  booking_id?: string | null;
  notes?: string | null;
  templateDisplayName?: string;
}

export interface InspectionCategory {
  id: string;
  type: string;
  name_translations: any;
  description_translations?: any;
  order_number?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface InspectionPhoto {
  id: string;
  photo_url: string;
  inspection_item_id?: string;
  alt?: string;
}

export interface InspectionItemTemplate {
  id: string;
  name_translations: any;
  description_translations?: any;
  category_id?: string | null;
  order_number?: number | null;
  requires_notes?: boolean | null;
  requires_photo?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface InspectionItem {
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
  const { t, locale } = useI18n()
  const router = useRouter()

  const supabase = useSupabase();

  const [inspection, setInspection] = useState<ExtendedInspection>(initialInspection)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const inspectionIdRef = useRef<string>(initialInspection.id)
  const { user } = useAuth()
  
  const { isUpdating, handleStartInspection } = useInspectionStatus({
    inspection,
    user,
    supabase,
    router,
    t
  });
  
  const { 
    itemsWithTemplates, 
    isLoadingTemplates, 
    setItemsWithTemplates
  } = useInspectionItems({
    initialInspectionItems: initialInspection.inspection_items,
    supabase
  });
  
  const {
    isExporting,
    exportCSV,
    exportPDF,
  } = useInspectionReportExport({ inspection, itemsWithTemplates });
  
  const handleInspectionDataChange = useCallback((data: DbInspection | DbInspection[]) => {
    try {
      const inspectionDataToUpdate = Array.isArray(data) ? data[0] : data;
      if (inspectionDataToUpdate) {
        console.log("[INSPECTION_DETAILS] Received inspection data update:", inspectionDataToUpdate);
        console.log("[INSPECTION_DETAILS] Current type value:", inspectionDataToUpdate.type);
        
        setInspection(prevInspection => ({
          ...prevInspection,
          ...inspectionDataToUpdate,
          vehicle: inspectionDataToUpdate.vehicle === null ? undefined : (inspectionDataToUpdate.vehicle as DbVehicle | undefined),
          created_by: inspectionDataToUpdate.created_by === null ? undefined : inspectionDataToUpdate.created_by,
          booking_id: ('booking_id' in inspectionDataToUpdate ? inspectionDataToUpdate.booking_id : prevInspection.booking_id) as string | null | undefined,
        }));
      }
    } catch (error) {
      console.error("Error handling inspection data change:", error);
    }
  }, []);
  
  useRealtimeCollection<DbInspection>({
    config: {
    table: "inspections" as const,
    filter: `id=eq.${inspectionIdRef.current}`
    },
    initialFetch: true,
    onDataChange: handleInspectionDataChange,
    supabaseClient: supabase
  });
  
  const handleRealtimeItemsChange = useCallback((newItem: InspectionItem, oldItem: InspectionItem | null, event: string) => {
    setItemsWithTemplates(prevItems => {
      if (event === "INSERT") {
        return [...prevItems, newItem];
      }
      if (event === "UPDATE") {
        return prevItems.map(item => (item.id === newItem.id ? newItem : item));
      }
      if (event === "DELETE" && oldItem) {
        return prevItems.filter(item => item.id !== oldItem.id);
      }
      return prevItems;
    });
  }, [setItemsWithTemplates]);

  useRealtimeCollection<InspectionItem>({
    config: {
      table: "inspection_items" as const,
      filter: `inspection_id=eq.${inspectionIdRef.current}`,
    },
    initialFetch: false,
    onDataChange: handleRealtimeItemsChange,
    supabaseClient: supabase
  });
  
  // Dynamically import ResponsiveBar
  const ResponsiveBar = dynamic(() => import('@nivo/bar').then(mod => mod.ResponsiveBar), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full flex items-center justify-center bg-muted rounded-md"><p>{t('common.loading')}</p></div>
  });

  // Dynamically import PhotoViewerModal
  const PhotoViewerModal = dynamic(() => import('@/components/inspections/photo-viewer-modal').then(mod => mod.PhotoViewerModal), {
    ssr: false,
    loading: () => null 
  });

  // Dynamically import InspectionItemsDisplayList for use in non-default tabs
  const DynamicInspectionItemsList = dynamic(() => import('@/components/inspections/inspection-items-display-list').then(mod => mod.InspectionItemsDisplayList), {
    loading: () => <div className="h-[200px] flex items-center justify-center bg-muted rounded-md text-sm text-muted-foreground">{t('common.loading')}</div>,
    ssr: false
  });

  // Effect to load inspector details
  useEffect(() => {
    const currentInspectorId = (inspection as any).inspector_id || inspection.created_by;
    if (currentInspectorId && (!inspection.inspector || inspection.inspector.id !== currentInspectorId)) {
      const fetchInspectorDetails = async (inspectorId: string) => {
        const { data: inspectorData, error: inspectorError } = await supabase
          .from('drivers')
          .select('id, first_name, last_name, email')
          .eq('id', inspectorId)
          .single();

        if (inspectorError) {
          console.error('Error fetching inspector details:', inspectorError);
          setInspection(prev => ({ 
            ...prev, 
            inspector: { id: inspectorId, name: t('common.notAssigned'), email: '' }
          }));
        } else if (inspectorData) {
          setInspection(prev => ({ 
            ...prev, 
            inspector: { 
              id: inspectorData.id,
              name: `${inspectorData.first_name} ${inspectorData.last_name}` || inspectorData.email || t('common.notAssigned'),
              email: inspectorData.email || ''
            } 
          }));
        }
      };
      fetchInspectorDetails(currentInspectorId);
    } else if (!currentInspectorId && inspection.inspector?.name !== t('common.notAssigned')) {
        setInspection(prev => ({ 
            ...prev, 
            inspector: { id: '', name: t('common.notAssigned'), email: '' }
        }));
    }
  }, [inspection, supabase, t]);

  // Effect to load vehicle details
  useEffect(() => {
    if (inspection.vehicle_id && (!inspection.vehicle || inspection.vehicle.id !== inspection.vehicle_id)) {
      const fetchVehicleDetails = async () => {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', inspection.vehicle_id)
          .single();
        if (vehicleError) {
          console.error("Error fetching vehicle details:", vehicleError);
        } else if (vehicleData) {
          setInspection(prev => ({ ...prev, vehicle: vehicleData as DbVehicle }));
        }
      };
      fetchVehicleDetails();
    }
  }, [inspection.vehicle_id, inspection.vehicle, supabase]);

  // TODO: Add proper template type lookup in the future
  // Effect to load template type information
  useEffect(() => {
    if (inspection.vehicle_id) {
      const fetchTemplateType = async () => {
        try {
          console.log("[INSPECTION_DETAILS] Current inspection:", inspection);
          console.log("[INSPECTION_DETAILS] Current type:", inspection.type);

          // If we already have the type directly from the inspection, use it
          if (inspection.type && inspection.type.includes('Daily Checklist')) {
            console.log("[INSPECTION_DETAILS] Using direct type from inspection:", inspection.type);
            setInspection(prev => ({
              ...prev,
              templateDisplayName: inspection.type
            }));
            return;
          }
          
          // First check for a specific assignment for this vehicle
          let { data: vehicleAssignment } = await supabase
            .from('inspection_template_assignments')
            .select('template_type')
            .eq('vehicle_id', inspection.vehicle_id)
            .eq('is_active', true)
            .maybeSingle();

          // If no vehicle-specific assignment, try to find via vehicle group
          if (!vehicleAssignment && inspection.vehicle) {
            // First get the vehicle group ID
            const { data: vehicleData } = await supabase
              .from('vehicles')
              .select('vehicle_group_id')
              .eq('id', inspection.vehicle_id)
              .single();

            if (vehicleData?.vehicle_group_id) {
              // Then look for a group assignment
              const { data: groupAssignment } = await supabase
                .from('inspection_template_assignments')
                .select('template_type')
                .eq('vehicle_group_id', vehicleData.vehicle_group_id)
                .eq('is_active', true)
                .maybeSingle();
              
              if (groupAssignment) {
                console.log("[INSPECTION_DETAILS] Found template type via group assignment:", groupAssignment.template_type);
                setInspection(prev => ({
                  ...prev,
                  templateDisplayName: groupAssignment.template_type
                }));
              }
            }
          } else if (vehicleAssignment) {
            console.log("[INSPECTION_DETAILS] Found template type via vehicle assignment:", vehicleAssignment.template_type);
            setInspection(prev => ({
              ...prev,
              templateDisplayName: vehicleAssignment.template_type
            }));
          }
        } catch (error) {
          console.error("Error fetching template type:", error);
        }
      };
      
      fetchTemplateType();
    }
  }, [inspection.type, inspection.vehicle_id, inspection.vehicle, supabase]);

  const passedItems = useMemo(() => itemsWithTemplates.filter(item => item.status === 'pass'), [itemsWithTemplates]);
  const failedItems = useMemo(() => itemsWithTemplates.filter(item => item.status === 'fail'), [itemsWithTemplates]);

  const passedCount = passedItems.length;
  const failedCount = failedItems.length;
  const notesCount = useMemo(() => itemsWithTemplates.filter(item => item.notes && item.notes.trim() !== '').length, [itemsWithTemplates]);
  const photosCount = useMemo(() => itemsWithTemplates.reduce((count, item) => count + (item.inspection_photos?.length || 0), 0), [itemsWithTemplates]);

  // Aggregate all photos from all items for the modal
  const allInspectionPhotos = useMemo(() => {
    return itemsWithTemplates.flatMap(item => 
      item.inspection_photos?.map(photo => ({
        url: photo.photo_url,
        alt: t('inspections.photoForItem', { itemName: item.template?.name_translations?.[locale] || item.template?.name_translations?.['en'] || t('common.untitled') })
      })) || []
    );
  }, [itemsWithTemplates, t, locale]);
  
  const handlePhotoClick = (photoUrl: string) => {
    const photoIndex = allInspectionPhotos.findIndex(p => p.url === photoUrl);
    if (photoIndex !== -1) {
      setSelectedPhotoIndex(photoIndex);
    } else {
      // Fallback if somehow clicked photo not in aggregated list (should not happen)
      // Or, if we want to support individual photo display if not part of an item
      // For now, only open if found in the main list.
      console.warn("Clicked photo not found in aggregated list:", photoUrl);
    }
  };

  // Placeholder for Label and TextValue components - these would typically be simple styled span/divs
  const Label = ({ children }: { children: React.ReactNode }) => <p className="text-sm font-medium text-muted-foreground">{children}</p>;
  const TextValue = ({ children }: { children: React.ReactNode }) => <p className="text-base">{children}</p>; 

  const handleScheduleRepair = () => {
    const failedItemTemplateIds = failedItems.map(item => item.template_id).join(',');
    
    // Construct a more detailed description from failed items
    let repairDescription = t('inspections.details.defaultRepairDescription'); 
    if (failedItems.length > 0) {
      const failedItemNames = failedItems
        .map(item => item.template?.name_translations?.[locale] || item.template?.name_translations?.en || t('inspections.details.unknownItem'))
        .slice(0, 3); 
      repairDescription = `${t('inspections.details.repairNeededFor')}: ${failedItemNames.join(', ')}${failedItems.length > 3 ? ` ${t('inspections.details.andMoreItems', { count: failedItems.length - 3 })}` : ''}`;
    }

    const queryParams = new URLSearchParams({
      inspectionId: inspection.id,
      vehicleId: inspection.vehicle_id,
      failedItemTemplateIds,
      title: t('inspections.details.repairTaskTitle', { 
        inspectionName: inspection.name || t('inspections.unnamedInspection'), 
        vehicleName: inspection.vehicle?.name || t('common.notAvailableShort') 
      }),
      description: repairDescription, 
      priority: 'high', 
      create_immediate_task: 'true'
    });
    router.push(`/maintenance/schedule?${queryParams.toString()}`);
  };

  // Local state for tabs (needed to sync with mobile select)
  const [tabValue, setTabValue] = useState<string>("all");

  if (isLoadingTemplates && itemsWithTemplates.length === 0) {
    return <div className="container mx-auto p-4"><p>{t('common.loading')}</p></div>;
  }
  
  // Fallback for inspection name for the header
  const headerInspection = {
    ...inspection,
    name: inspection.name || t('inspections.unnamedInspection')
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 print-container">

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3 print-content">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("inspections.details.vehicleInfoTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              {inspection.vehicle ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-96 h-48 sm:h-56 bg-white rounded-md overflow-hidden relative flex-shrink-0">
                    {inspection.vehicle.image_url ? (
                        <Image 
                          src={inspection.vehicle.image_url} 
                          alt={inspection.vehicle.name || t('vehicles.imageAlt', { name: inspection.vehicle.name || t('common.untitled')})} 
                          fill
                          sizes="(max-width: 640px) 100vw, 384px"
                          className="object-contain"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Car className="w-12 h-12" />
                        </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <Label>{t("vehicles.fields.name")}</Label>
                      <TextValue>{inspection.vehicle.name || t("common.notAvailable")}</TextValue>
                    </div>
                    <div>
                      <Label>{t("vehicles.fields.plateNumber")}</Label>
                      <TextValue>{inspection.vehicle.plate_number || t("common.notAvailable")}</TextValue>
                    </div>
                    <Link href={`/vehicles/${inspection.vehicle_id}`} className="block mt-3">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        View Vehicle Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p>{t("inspections.noVehicleAssigned")}</p>
              )}
            </CardContent>
          </Card>

          <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
            {/* Mobile dropdown selector */}
            <div className="sm:hidden mb-4">
              <Select value={tabValue} onValueChange={setTabValue}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("inspections.details.tabs.details")} ({itemsWithTemplates.length})</SelectItem>
                  <SelectItem value="failed">{t("inspections.details.tabs.failed")} ({failedCount})</SelectItem>
                  <SelectItem value="passed">{t("inspections.details.tabs.passed")} ({passedCount})</SelectItem>
                  <SelectItem value="photos">{t("inspections.details.tabs.photos")} ({photosCount})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Desktop/Tablet tab buttons */}
            <TabsList className="hidden sm:grid w-full grid-cols-4 print-hide">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">
                {t("inspections.details.tabs.details")} ({itemsWithTemplates.length})
              </TabsTrigger>
              <TabsTrigger value="failed" className="flex-1 sm:flex-none">
                {t("inspections.details.tabs.failed")} ({failedCount})
              </TabsTrigger>
              <TabsTrigger value="passed" className="flex-1 sm:flex-none">
                {t("inspections.details.tabs.passed")} ({passedCount})
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex-1 sm:flex-none">
                {t("inspections.details.tabs.photos")} ({photosCount})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <InspectionItemsDisplayList 
                items={itemsWithTemplates}
                listTitle={t("inspections.details.allItemsTitle", { count: itemsWithTemplates.length })}
              />
            </TabsContent>
            <TabsContent value="failed" className="mt-4">
              <InspectionItemsDisplayList 
                items={failedItems}
                listTitle={t("inspections.details.failedItemsTitle", { count: failedCount })}
                itemStatusFilter="fail"
              />
              {failedItems.length > 0 && (
                <div className="mt-4 p-4 border border-destructive/50 bg-destructive/10 rounded-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-destructive mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-destructive">{t("inspections.details.repairNeededTitle")}</h4>
                      <p className="text-sm text-destructive/80 mb-3">{t("inspections.details.repairNeededDescription")}</p>
                      <Button size="sm" variant="destructive" onClick={handleScheduleRepair}>
                         <Wrench className="mr-2 h-4 w-4" /> {t("inspections.actions.scheduleRepair")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="passed" className="mt-4">
              <InspectionItemsDisplayList 
                items={passedItems}
                listTitle={t("inspections.details.passedItemsTitle", { count: passedCount })}
                itemStatusFilter="pass"
              />
            </TabsContent>
            <TabsContent value="photos" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    {t('inspections.details.photosTitle', { count: photosCount })}
                  </CardTitle>
                  <CardDescription>{t('inspections.details.photosTabDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {photosCount > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {itemsWithTemplates.map(item => (
                        item.inspection_photos?.map(photo => (
                          <button
                            key={photo.id}
                            onClick={() => handlePhotoClick(photo.photo_url)}
                            className="group relative aspect-square rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label={t('inspections.details.viewPhotoAria', { itemName: item.template?.name_translations?.[locale] || item.template?.name_translations?.['en'] || t('common.untitled') })}
                          >
                            <Image
                              src={photo.photo_url}
                              alt={t('inspections.details.photoItemAlt', { itemName: item.template?.name_translations?.[locale] || item.template?.name_translations?.['en'] || t('common.untitled') })}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Expand className="h-6 w-6 text-white" />
                            </div>
                          </button>
                        ))
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t('inspections.details.noPhotosMessage')}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {t("inspections.details.summaryTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overview Section */}
              <div className="space-y-3">
                <div>
                  <Label>{t("inspections.fields.status")}</Label>
                  <InspectionStatusBadge status={inspection.status || 'unknown'} />
                </div>
                <div>
                  <Label>{t("inspections.fields.type")}</Label>
                  <TextValue>
                    {inspection.templateDisplayName 
                      ? inspection.templateDisplayName 
                      : (inspection.type 
                          ? t(`inspections.typeValues.${inspection.type.replace(/ /g, '_').toLowerCase()}`, { defaultValue: inspection.type }) 
                          : t("common.notAvailable"))}
                  </TextValue>
                </div>
                <div>
                  <Label>{t("inspections.fields.date")}</Label>
                  <TextValue>{inspection.date ? formatDate(inspection.date) : t("common.notAvailable")}</TextValue>
                </div>
                <div>
                  <Label>{t("inspections.fields.inspector")}</Label>
                  <TextValue>{inspection.inspector?.name || t("common.notAssigned")}</TextValue>
                </div>
                {inspection?.booking_id && (
                  <div>
                    <Label>{t("bookings.title")}</Label>
                    <Link href={`/bookings/${inspection.booking_id}`} className="text-sm text-primary hover:underline">
                      {t("bookings.actions.viewDetails")}
                    </Link>
                  </div>
                )}
              </div>

              {/* Summary Statistics */}
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">{t("inspections.details.summaryTitle")}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-700 dark:text-green-400">{passedCount}</span>
                    </div>
                    <span className="text-xs text-green-600 dark:text-green-400 text-center">{t("inspections.details.summaryPassed")}</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-2xl font-bold text-red-700 dark:text-red-400">{failedCount}</span>
                    </div>
                    <span className="text-xs text-red-600 dark:text-red-400 text-center">{t("inspections.details.summaryFailed")}</span>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-3 pt-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clipboard className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-muted-foreground">{t("inspections.details.summaryNotes")}</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{notesCount}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-2">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-muted-foreground">{t("inspections.details.summaryPhotos")}</span>
                    </div>
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{photosCount}</span>
                  </div>
                </div>

                {/* Pass Rate Indicator */}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{t("inspections.details.passRate")}</span>
                    <span className="text-sm font-semibold">{Math.round((passedCount / (passedCount + failedCount)) * 100) || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.round((passedCount / (passedCount + failedCount)) * 100) || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Status Summary */}
                {failedCount > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800 mt-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-300">{t("inspections.details.attentionRequired")}</p>
                      <p className="text-amber-700 dark:text-amber-400">{t("inspections.details.itemsNeedAttention", { count: failedCount })}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Actions */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-3">{t("common.actions.default")}</p>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportPDF}
                    disabled={isExporting}
                    className="justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? t('common.exporting') : t('inspections.actions.exportPdf')}
                  </Button>
                </div>
              </div>

              {/* Resume / Start button */}
              {['scheduled', 'in_progress'].includes(inspection.status || '') && (
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  asChild
                >
                  <Link href={`/inspections/${inspection.id}/perform`}>
                    <Play className="mr-2 h-4 w-4" />
                    {inspection.status === 'in_progress'
                      ? t('inspections.actions.continueInspection')
                      : t('inspections.actions.startInspection')}
                  </Link>
                </Button>
              )}
              
              {['completed', 'failed'].includes(inspection.status || '') && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2 w-full"
                  asChild
                >
                  <Link href={`/inspections/${inspection.id}/perform?resume=true`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('inspections.actions.continueEditing')}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Overall Notes Card */}
          {inspection.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("inspections.notes.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inspection.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Floating Action Button for Mobile Export */}
      <div className="fixed bottom-6 right-6 lg:hidden print-hide">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="lg" 
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              disabled={isExporting}
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <Download className="h-6 w-6" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={exportCSV} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? t('common.exporting') : t('common.exportCSV')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportPDF} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? t('common.exporting') : t('inspections.actions.exportPdf')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Updated PhotoViewerModal invocation */}
      {selectedPhotoIndex !== null && allInspectionPhotos.length > 0 && (
          <PhotoViewerModal 
            images={allInspectionPhotos}
            startIndex={selectedPhotoIndex}
            isOpen={selectedPhotoIndex !== null}
            onOpenChange={(open) => { if (!open) setSelectedPhotoIndex(null); }}
          />
      )}
    </div>
  );
} 

function getStatusVariant(status: string) {
  switch (status) {
    case 'pass':
      return "default"
    case 'fail':
      return "destructive"
    default:
      return "outline"
  }
} 