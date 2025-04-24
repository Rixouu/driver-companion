"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Printer, Download, Expand, X, Pencil, Play, CheckCircle, XCircle, Clock, Camera, FileText, AlertTriangle, Wrench, Car, Clipboard, Tag, Hash, Truck } from "lucide-react"
import { formatDate } from "@/lib/utils/formatting"
import { format as dateFormat } from "date-fns"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InspectionStatusBadge } from "./inspection-status-badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { DbInspection, DbVehicle } from "@/types"
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { saveAs } from "file-saver"
import { useRealtimeRecord, useRealtimeCollection } from "@/hooks/use-realtime"
import { idFilter } from "@/lib/services/realtime"
import { useAuth } from "@/hooks/use-auth"

// Add extended inspection type with inspection_items
interface ExtendedInspection extends DbInspection {
  inspection_items?: InspectionItem[];
  vehicle?: DbVehicle;
  inspector?: {
    id: string;
    name: string;
    email?: string;
  };
  notes?: string;
  created_by?: string;
}

interface InspectionPhoto {
  id: string;
  photo_url: string;
}

interface InspectionItemTemplate {
  id: string;
  name_translations: any; // This will handle the JSON type from the database
  description_translations?: any;
  category_id?: string | null;
  order_number?: number | null;
  requires_notes?: boolean | null;
  requires_photo?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
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
  const [itemsWithTemplates, setItemsWithTemplates] = useState<InspectionItem[]>(
    // Initialize with items that already have templates (from server)
    initialInspection.inspection_items || []
  )
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  // Use a stable reference for the inspection ID
  const inspectionIdRef = useRef<string>(initialInspection.id)
  const [templateMap, setTemplateMap] = useState<Record<string, InspectionItemTemplate>>({})
  const { user } = useAuth()
  // Add a ref to track whether we've attempted to fetch the user
  const userFetchAttemptedRef = useRef<boolean>(false)
  // Use a ref to store the latest inspection data to avoid rendering loops
  const latestInspectionRef = useRef<ExtendedInspection>(initialInspection)
  
  // Memoize the data change callback to prevent re-renders
  const handleInspectionDataChange = useCallback((data: DbInspection) => {
    try {
      if (Array.isArray(data) && data.length > 0) {
        // Store the latest data in ref without triggering re-render
        latestInspectionRef.current = {
          ...latestInspectionRef.current,
          ...data[0]
        };
        
        // Schedule a single update to reduce render cycles
        setInspection(prevInspection => ({
          ...prevInspection,
          ...data[0]
        }));
      }
    } catch (error) {
      console.error("Error handling inspection data change:", error);
    }
  }, []);
  
  // Create a stable config object that won't change between renders
  const realtimeConfig = useMemo(() => ({
    table: "inspections" as const,
    filter: `id=eq.${inspectionIdRef.current}`
  }), []);
  
  // Use the realtime collection hook with memoized config and callback
  const { items: realtimeInspections } = useRealtimeCollection<DbInspection>({
    config: realtimeConfig,
    initialFetch: true,
    onDataChange: handleInspectionDataChange,
  });
  
  // Use a batched effect to handle inspection data updates
  useEffect(() => {
    // If we have realtime data, update the inspection once
    if (realtimeInspections && realtimeInspections.length > 0) {
      // Only update if really changed to avoid render loops
      const updatedData = realtimeInspections[0];
      setInspection(prevInspection => {
        // Skip update if data is identical
        if (JSON.stringify(prevInspection) === JSON.stringify({ ...prevInspection, ...updatedData })) {
          return prevInspection;
        }
        return { ...prevInspection, ...updatedData };
      });
    }
  // This dependency is stable since realtimeInspections is the result of the hook
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeInspections]);

  // Handle inspector data separately to avoid infinite loops
  useEffect(() => {
    // Skip if we've already attempted to fetch user info or there's no created_by
    if (userFetchAttemptedRef.current || !inspection.created_by || !user) return;
    
    userFetchAttemptedRef.current = true;
    
    const isCurrentUserInspector = user.id === inspection.created_by;
    
    if (isCurrentUserInspector) {
      // Current user is the inspector, use their details
      setInspection(prev => ({
        ...prev,
        inspector: {
          id: user.id || inspection.created_by || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || t('common.notAssigned'),
          email: user.email
        }
      }));
    } else {
      // Use a placeholder for the inspector
      setInspection(prev => ({
        ...prev,
        inspector: {
          id: inspection.created_by || '',
          name: t('common.notAssigned'),
          email: ''
        }
      }));
    }
  }, [inspection.created_by, user, t]);
  
  // Handle vehicle data updates only when needed
  useEffect(() => {
    // Only fetch additional vehicle data if it's incomplete
    if (!inspection.vehicle?.brand || !inspection.vehicle?.model) return;
    
    let isMounted = true;
    
    async function loadVehicleDetails() {
      try {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', inspection.vehicle!.id)
          .single();
          
        if (vehicleError) {
          if (vehicleError.code === 'PGRST116') {
            console.error('Vehicle not found:', vehicleError);
          } else if (vehicleError.code === '401' || vehicleError.message?.includes('JWT')) {
            console.error('Authentication error when loading vehicle:', vehicleError);
          } else {
            throw vehicleError;
          }
          return;
        }
        
        if (isMounted && vehicleData) {
          setInspection(prev => ({
            ...prev,
            vehicle: vehicleData as DbVehicle
          }));
        }
      } catch (error) {
        console.error('Error loading vehicle details:', error);
      }
    }
    
    loadVehicleDetails();
    
    return () => {
      isMounted = false;
    };
  }, [inspection.vehicle?.id]);
  
  // Only load templates and photos if they weren't provided by the server
  useEffect(() => {
    // Skip if we already have templates or there are no items
    if (
      !inspection?.inspection_items || 
      inspection.inspection_items.length === 0 || 
      itemsWithTemplates.length > 0
    ) return;
    
    let isMounted = true;
    setIsLoadingTemplates(true);
    
    async function loadTemplatesAndPhotos() {
      try {
        // Get template IDs from items
        const templateIds = inspection?.inspection_items
          ?.map(item => item.template_id)
          .filter(Boolean);
        
        if (!templateIds || templateIds.length === 0) {
          if (isMounted) setIsLoadingTemplates(false);
          return;
        }
        
        // Fetch templates
        const { data: templates, error } = await supabase
          .from('inspection_item_templates')
          .select('*')
          .in('id', templateIds);
          
        if (error) {
          if (error.code === '401' || error.message?.includes('JWT')) {
            console.error('Authentication error when loading templates:', error);
            if (isMounted) setIsLoadingTemplates(false);
            return;
          }
          throw error;
        }
        
        // Fetch photos
        const itemIds = inspection?.inspection_items
          ?.map(item => item.id)
          .filter(Boolean);
          
        let photos: any[] = [];
        if (itemIds && itemIds.length > 0) {
          const { data: photosData, error: photosError } = await supabase
            .from('inspection_photos')
            .select('*')
            .in('inspection_item_id', itemIds);
            
          if (photosError) {
            console.error('Error fetching photos:', photosError);
          } else {
            photos = photosData || [];
          }
        }
        
        // Update items with templates and photos
        if (isMounted && inspection?.inspection_items) {
          const updatedItems = inspection.inspection_items.map(item => ({
            ...item,
            template: templates?.find(t => t.id === item.template_id) as InspectionItemTemplate | undefined,
            inspection_photos: photos?.filter(photo => photo.inspection_item_id === item.id) || []
          }));
          
          setItemsWithTemplates(updatedItems);
        }
      } catch (error) {
        console.error('Error loading templates and photos:', error);
      } finally {
        if (isMounted) setIsLoadingTemplates(false);
      }
    }
    
    loadTemplatesAndPhotos();
    
    return () => {
      isMounted = false;
    };
  }, [inspection?.inspection_items]);

  async function handleStartInspection() {
    if (!inspection || !inspection?.inspection_items) return;
    try {
      setIsUpdating(true);
      
      // Create a new inspection status - using string type 'inspection_statuses' as it doesn't exist in the database schema typing
      const { data, error } = await supabase
        .from('inspection_statuses' as any)
        .insert({
          inspection_id: inspection.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          inspector_id: user?.id || null
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update the inspection with the inspector ID
      const { error: updateError } = await supabase
        .from('inspections')
        .update({
          inspector_id: user?.id,
          status: 'in_progress' // Changed from inspection_status to status to match schema
        })
        .eq('id', inspection.id);
        
      if (updateError) throw updateError;

      toast({
        title: t('inspections.messages.updateSuccess'),
      });

      // Redirect to the inspection form
      router.push(`/inspections/${inspection.id}/perform`);
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t('inspections.messages.error'),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  // Helper function to get template name
  function getTemplateName(template?: InspectionItemTemplate): string {
    if (!template?.name_translations) return '';
    
    // Try to get the English name first
    const translations = template.name_translations;
    return translations.en || translations.ja || Object.values(translations)[0] || '';
  }

  // Helper function to get template description
  function getTemplateDescription(template?: InspectionItemTemplate): string {
    if (!template?.description_translations) return '';
    
    // Try to get the English description first
    const translations = template.description_translations;
    return translations.en || translations.ja || Object.values(translations)[0] || '';
  }

  // Update the helper function to map template names to correct section and item keys
  function getTranslationKeys(template?: InspectionItemTemplate): { section: string; item: string } {
    if (!template) return { section: '', item: '' }
    
    // Get the template name
    const templateName = getTemplateName(template)
    
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
      title = `Repair ${getTemplateName(failedItems[0].template)}`;
    } else if (failedItems.length <= 3) {
      // If 2-3 items failed, list them all
      title = `Repair ${failedItems.map(item => getTemplateName(item.template)).join(', ')}`;
    } else {
      // If more than 3 items failed, list the first two and indicate there are more
      title = `Repair ${getTemplateName(failedItems[0].template)}, ${getTemplateName(failedItems[1].template)} and ${failedItems.length - 2} more items`;
    }
    
    // Create a detailed description from the failed items
    let description = `Repairs needed based on inspection from ${dateFormat(new Date(inspection.date), 'PPP')}:\n\n`;
    
    failedItems.forEach((item, index) => {
      const itemName = getTemplateName(item.template) || 'Unknown item';
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
      inspection_id: inspection.id,
      create_immediate_task: 'true' // Set to create an immediate task by default
    });
    
    // Navigate to the maintenance schedule form with prefilled data
    router.push(`/maintenance/schedule?${params.toString()}`);
  };

  // Function to handle printing the report
  const handlePrintReport = () => {
    // Use browser's print functionality
    window.print();
    
    toast({
      title: t('inspections.messages.printStarted'),
    });
  };

  // Function to handle exporting the report as CSV
  const handleExportReport = () => {
    try {
      setIsExporting(true);
      
      // Format date for filename
      const formattedDate = inspection.date ? 
        new Date(inspection.date).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0];
      
      // Create a more descriptive filename with vehicle name and date
      const vehicleName = inspection.vehicle?.name || 'vehicle';
      const sanitizedVehicleName = vehicleName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const filename = `${sanitizedVehicleName}-inspection-${formattedDate}.csv`;
      
      // Add vehicle information to CSV
      const vehicleInfo = [
        ['Vehicle Information', ''],
        ['Name', inspection.vehicle?.name || 'N/A'],
        ['Plate Number', inspection.vehicle?.plate_number || 'N/A'],
        ['Brand', inspection.vehicle?.brand || 'N/A'],
        ['Model', inspection.vehicle?.model || 'N/A'],
        ['', '']  // Empty row as separator
      ];
      
      // Add inspection information with inspector details
      const inspectionInfo = [
        ['Inspection Information', ''],
        ['Date', formatDate(inspection.date)],
        ['Type', inspection.type || 'N/A'],
        ['Status', inspection.status || 'N/A'],
        ['Inspector Name', inspection.inspector?.name || 'N/A'],
        ['Inspector Email', inspection.inspector?.email || 'N/A'],
        ['', '']  // Empty row as separator
      ];
      
      // Add inspection items
      const headers = ['Item', 'Status', 'Notes'];
      const rows = itemsWithTemplates.map(item => {
        const templateName = getTemplateName(item.template) || 'Unknown';
        const status = item.status || 'pending';
        const notes = item.notes || '';
        return `"${templateName}","${status}","${notes}"`;
      });
      
      // Combine all sections
      const csvContent = [
        ...vehicleInfo.map(row => row.map(cell => `"${cell}"`).join(',')),
        ...inspectionInfo.map(row => row.map(cell => `"${cell}"`).join(',')),
        headers.join(','),
        ...rows
      ].join('\n');
      
      // Create a blob and download it
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, filename);
      
      toast({
        title: t('inspections.messages.exportSuccess'),
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: t('inspections.messages.exportError'),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Function to navigate to a specific tab
  const navigateToTab = (tabValue: string) => {
    // Find the tab element and click it
    const tabElement = document.querySelector(`[role="tab"][value="${tabValue}"]`) as HTMLElement;
    if (tabElement) {
      tabElement.click();
    }
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
      <Card className="shadow-sm print-hide">
        <CardHeader className="space-y-0 p-4 sm:p-6">
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
                <div className="flex gap-2">
            <Button
                    variant="outline" 
                    size="sm" 
                    className="gap-2 hidden sm:flex"
                    onClick={handlePrintReport}
                    disabled={isExporting}
                  >
                    <Printer className="h-4 w-4" />
                    {t('inspections.details.actions.print')}
            </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 hidden sm:flex"
                    onClick={handleExportReport}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4" />
                    {t('inspections.details.actions.export')}
                  </Button>
                </div>
          )}
        </div>
          </div>
        </CardHeader>
      </Card>

      {/* Floating Action Button for Mobile */}
      {inspection.status === 'completed' && (
        <div className="fixed right-4 bottom-20 z-50 flex flex-col gap-2 md:hidden print-hide">
          <Button
            size="icon"
            className="rounded-full shadow-lg"
            onClick={handlePrintReport}
            disabled={isExporting}
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="rounded-full shadow-lg"
            onClick={handleExportReport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print:mb-6">
        <h1 className="text-2xl font-bold mb-2">{t('inspections.details.printTitle')}</h1>
        <div className="flex justify-between">
              <div>
            <p className="font-medium">{inspection.vehicle?.name || 'Vehicle'}</p>
            <p>{inspection.vehicle?.plate_number || ''}</p>
              </div>
          <div className="text-right">
            <p>{formatDate(inspection.date)}</p>
            <InspectionStatusBadge status={inspection.status} />
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="details" className="w-full">
        {/* Desktop Tabs */}
        <div className="hidden md:block print-hide">
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

        {/* Mobile Bottom Navigation - Fixed height and better spacing */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden h-16 print-hide">
          <TabsList className="w-full grid grid-cols-3 gap-0 h-full">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center justify-center py-1 px-2 gap-1 h-full"
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-xs font-medium text-center truncate w-full">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content with Mobile Padding */}
        <div className="mt-4 pb-20 md:pb-0 print-content">
          <TabsContent value="details" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-6 print:grid-cols-2">
              {/* Vehicle Info Card */}
              <Card className="shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    <CardTitle className="text-2xl">{t('vehicles.vehicleInformation')}</CardTitle>
            </div>
        </CardHeader>
                <CardContent className="p-0">
                  <div className="relative aspect-video w-full">
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
                  <div className="grid grid-cols-2 gap-6 p-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <h3 className="font-medium text-sm">
                          {t('vehicles.fields.name')}
                </h3>
          </div>
                      <p className="font-medium">{inspection.vehicle?.name || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <h3 className="font-medium text-sm">
                          {t('vehicles.fields.plateNumber')}
                </h3>
                      </div>
                      <p className="font-medium">{inspection.vehicle?.plate_number || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Truck className="h-4 w-4" />
                        <h3 className="font-medium text-sm">
                          {t('vehicles.fields.brand')}
                        </h3>
                      </div>
                <p>{inspection.vehicle?.brand || 'N/A'}</p>
          </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Car className="h-4 w-4" />
                        <h3 className="font-medium text-sm">
                          {t('vehicles.fields.model')}
                        </h3>
                      </div>
                      <p>{inspection.vehicle?.model || 'N/A'}</p>
                    </div>
          </div>
        </CardContent>
      </Card>

              {/* Inspection Details Card */}
              <Card className="shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Clipboard className="h-5 w-5 text-primary" />
                    <CardTitle className="text-2xl">{t('inspections.details.inspectionDetails')}</CardTitle>
                  </div>
          </CardHeader>
                <CardContent className="p-6 sm:p-6 space-y-4">
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
                        <div 
                          className="bg-muted/30 rounded-lg p-3 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigateToTab('passed')}
                        >
                    <p className="text-sm text-muted-foreground">{t("inspections.details.results.passCount", { count: String(passedItems) })}</p>
                    <p className="text-xl font-semibold mt-1 text-green-600 dark:text-green-400">{passedItems}</p>
                  </div>
                        <div 
                          className="bg-muted/30 rounded-lg p-3 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigateToTab('failed')}
                        >
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
                        <div className="mt-6">
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

            {inspection.inspector && (
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">{t("inspections.fields.inspector") || "Inspector"}</h3>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{inspection.inspector.name}</p>
                  {inspection.inspector.email && (
                    <p className="text-sm text-muted-foreground">{inspection.inspector.email}</p>
                  )}
                </div>
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
                                      const keys = getTranslationKeys(item.template)
                                      const translatedTitle = keys.section && keys.item
                                        ? t(`inspections.sections.${keys.section}.items.${keys.item}.title`) 
                                        : getTemplateName(item.template)
                                      return translatedTitle || t('common.noResults')
                                    })()}
                                  </CardTitle>
                                  {item.template?.description_translations && (
                                    <CardDescription className="text-red-700/80 dark:text-red-400/80">
                                      {(() => {
                                        const keys = getTranslationKeys(item.template)
                                        const translatedDescription = keys.section && keys.item
                                          ? t(`inspections.sections.${keys.section}.items.${keys.item}.description`) 
                                          : getTemplateDescription(item.template)
                                        return translatedDescription || ''
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
                                  const keys = getTranslationKeys(item.template)
                                      const translatedTitle = keys.section && keys.item
                                        ? t(`inspections.sections.${keys.section}.items.${keys.item}.title`)
                                        : getTemplateName(item.template)
                                      return translatedTitle || t('common.noResults')
                                })()}
                              </CardTitle>
                              {item.template?.description_translations && (
                                <CardDescription className="text-green-700/80 dark:text-green-400/80">
                                  {(() => {
                                    const keys = getTranslationKeys(item.template)
                                        const translatedDescription = keys.section && keys.item
                                          ? t(`inspections.sections.${keys.section}.items.${keys.item}.description`)
                                          : getTemplateDescription(item.template)
                                        return translatedDescription || ''
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