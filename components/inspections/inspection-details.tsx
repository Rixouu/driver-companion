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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

// Add a function to check if code is running in browser environment
function isBrowser() {
  return typeof window !== 'undefined';
}

export function InspectionDetails({ inspection: initialInspection }: InspectionDetailsProps) {
  const { t, locale } = useI18n()
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
  
  const processedInspectorIds = useRef(new Set<string>());
  const fetchingInspectorIds = useRef(new Set<string>());
  
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
  
  // Effect to fetch inspector details
  useEffect(() => {
    const currentInspectorId = inspection.created_by;
    // console.log(`[InspectorDebug] Main useEffect triggered. Inspector ID: ${currentInspectorId}, Inspection ID: ${inspection.id}, Initial Inspection ID: ${initialInspection.id}`);

    if (!currentInspectorId) {
      // console.log("[InspectorDebug] No currentInspectorId. Handling default/N/A state.");
      if (!processedInspectorIds.current.has('N/A')) {
        // console.log("[InspectorDebug] 'N/A' not processed yet. Setting inspector to default.");
        setInspection(prev => {
          if (prev.inspector?.name !== t('common.notAssigned')) {
            return {
              ...prev,
              inspector: { id: '', name: t('common.notAssigned'), email: '' }
            };
          }
          return prev;
        });
        processedInspectorIds.current.add('N/A');
        // console.log("[InspectorDebug] Marked 'N/A' as processed.");
      } else {
        // console.log("[InspectorDebug] 'N/A' already processed. Skipping redundant default set.");
      }
      // Clean up any specific (non-'N/A') inspector ID from processed/fetching sets if we are now N/A
      // This is important if an inspector was assigned and then unassigned.
      fetchingInspectorIds.current.forEach(id => fetchingInspectorIds.current.delete(id));
      processedInspectorIds.current.forEach(id => { if (id !== 'N/A') processedInspectorIds.current.delete(id); });
      return;
    }

    // If currentInspectorId is valid, ensure 'N/A' is removed from processed set
    // so that if it was previously 'N/A', it can be re-evaluated.
    if (processedInspectorIds.current.has('N/A')) {
      // console.log("[InspectorDebug] Valid inspector ID found, removing 'N/A' from processed set.");
      processedInspectorIds.current.delete('N/A');
    }

    // console.log(`[InspectorDebug] Checking inspector ID: ${currentInspectorId}. Processed: ${processedInspectorIds.current.has(currentInspectorId)}, Fetching: ${fetchingInspectorIds.current.has(currentInspectorId)}`);

    if (processedInspectorIds.current.has(currentInspectorId) || fetchingInspectorIds.current.has(currentInspectorId)) {
      // console.log(`[InspectorDebug] Already processed or fetching ID: ${currentInspectorId}. Skipping.`);
      return;
    }

    // console.log(`[InspectorDebug] Adding ID: ${currentInspectorId} to fetchingInspectorIds.`);
    fetchingInspectorIds.current.add(currentInspectorId);

    const fetchInspectorDetails = async (id: string) => {
      // console.log(`[InspectorDebug] fetchInspectorDetails called for ID: ${id}`);
      try {
        // console.log(`[InspectorDebug] Querying 'profiles' table for id: ${id}`);
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', id)
          .single();

        // Corrected console.log:
        // console.log(`[InspectorDebug] Supabase query result for ID ${id} - Data:`, data, "Error:", error);

        if (error && error.code !== 'PGRST116') {
          // Corrected console.error:
          console.error(`[InspectorDebug] Supabase error fetching profile for ID ${id}:`, error);
          setInspection(prev => ({
            ...prev,
            inspector: { id: id, name: t('common.notAssigned'), email: '' }
          }));
        } else if (data) {
          // Corrected console.log:
          // console.log(`[InspectorDebug] Successfully fetched data for ID ${id}. Setting inspector.`);
          setInspection(prev => ({
            ...prev,
            inspector: { 
              id: id, 
              name: data.full_name || t('common.notAssigned'),
              email: data.email || ''
            }
          }));
        } else {
          // Corrected console.log:
          // console.log(`[InspectorDebug] No data for inspector ID ${id} (PGRST116 or other). Setting to default.`);
          setInspection(prev => ({
            ...prev,
            inspector: { id: id, name: t('common.notAssigned'), email: '' }
          }));
        }
      } catch (e) {
        // Corrected console.error:
        console.error(`[InspectorDebug] Error in fetchInspectorDetails catch block for ID ${id}:`, e);
        setInspection(prev => ({ 
          ...prev,
          inspector: { id: id, name: t('common.notAssigned'), email: '' }
        }));
      } finally {
        // console.log(`[InspectorDebug] Finalizing fetch for ID: ${id}. Removing from fetching, adding to processed.`);
        fetchingInspectorIds.current.delete(id);
        processedInspectorIds.current.add(id);
        // console.log(`[InspectorDebug] After fetch cleanup for ID ${id} - Fetching:`, Array.from(fetchingInspectorIds.current), "Processed:", Array.from(processedInspectorIds.current));
      }
    };
    
    fetchInspectorDetails(currentInspectorId);

  }, [inspection.created_by, t, initialInspection.id]); // Dependencies: refetch if created_by, t, or initial ID changes.

  // Effect to load templates and photos for inspection items
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
    if (!template?.name_translations) return t('common.noResults');
    
    // Try to get the translated name using current locale first
    const translations = template.name_translations;
    
    if (locale && translations[locale]) {
      return translations[locale];
    }
    
    // Fallback to English or Japanese if available
    return translations.en || translations.ja || Object.values(translations)[0] || t('common.noResults');
  }

  // Helper function to get template description
  function getTemplateDescription(template?: InspectionItemTemplate): string {
    if (!template?.description_translations) return '';
    
    // Try to get the translated description using current locale first
    const translations = template.description_translations;
    
    if (locale && translations[locale]) {
      return translations[locale];
    }
    
    // Fallback to English or Japanese if available
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
      'emissions test': { section: 'diagnostics', item: 'emissions_test' },
      // NEW MAPPINGS FOR REPORTED MISSING TRANSLATIONS
      'back light': { section: 'lighting', item: 'back_light' },
      'dirt and damage': { section: 'exterior', item: 'dirt_and_damage' },
      'cracks and damage': { section: 'exterior', item: 'cracks_and_damage' },
      'engine oil': { section: 'engine', item: 'engine_oil' },
      'radiator coolant': { section: 'engine', item: 'radiator_coolant' },
      'engine starting condition': { section: 'engine', item: 'engine_starting_condition' },
      'brake oil': { section: 'brake_system', item: 'brake_oil' },
      'braking condition': { section: 'brake_system', item: 'braking_condition' },
      'brake light': { section: 'lighting', item: 'brake_light' },
      'headlight': { section: 'lighting', item: 'headlight' }, // Singular form
      'blinker': { section: 'lighting', item: 'blinker' },
      'hazard light': { section: 'lighting', item: 'hazard_light' }
    }

    const result = mappings[name];
    
    // If not found in the mappings, log it for debugging
    if (!result && name && name !== t('common.noResults').toLowerCase()) {
      console.log(`Translation mapping not found for: "${name}"`);
    }
    
    return result || { section: '', item: '' }
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
      const filename = `inspection-report-${formattedDate}-${sanitizedVehicleName}.csv`;
      
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

  // Function to handle exporting the report as PDF
  const handleExportPDF = async () => { // Make the function async
    if (!isBrowser()) return; // Only run in browser environment
    
    setIsExporting(true);
    
    try {
      // Dynamically import html2pdf.js
      const html2pdf = (await import('html2pdf.js')).default;

      // Calculate counts for the PDF
      const passedItemsCount = itemsWithTemplates.filter(item => item.status === 'pass').length;
      const failedItemsCount = itemsWithTemplates.filter(item => item.status === 'fail').length;
      const notesItemsCount = itemsWithTemplates.filter(item => item.notes).length;
      const photosItemsCount = itemsWithTemplates.reduce((count, item) => count + (item.inspection_photos?.length || 0), 0);
      
      // Current language for formatting
      const currentLanguage = locale || 'en';
      
      const pdfContainer = document.createElement('div');
      pdfContainer.className = 'pdf-export-container';
      
      // Add language class to apply language-specific styling
      pdfContainer.classList.add(`lang-${currentLanguage}`);
      
      // Add main container styles - clean white background
      pdfContainer.style.fontFamily = 'Work Sans, sans-serif';
      pdfContainer.style.margin = '0';
      pdfContainer.style.padding = '0';
      pdfContainer.style.color = '#333';
      pdfContainer.style.backgroundColor = '#fff';
      pdfContainer.style.width = '190mm'; // A4 width
      pdfContainer.style.boxSizing = 'border-box';
      pdfContainer.style.position = 'relative';
      pdfContainer.style.borderTop = '2px solid #FF2600'; // Add red/orange border at top
      
      // Add font link to ensure proper font loading
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(fontLink);
      
      // Add company logo - matching the mockup
      const logoContainer = document.createElement('div');
      logoContainer.style.textAlign = 'left';
      logoContainer.style.marginBottom = '20px';
      logoContainer.style.marginTop = '30px';
      logoContainer.style.paddingLeft = '20px';
      
      const logo = document.createElement('img');
      logo.src = '/img/driver-header-logo.png'; // Ensure this path matches what's used in quotation PDF
      logo.alt = 'Driver Logo';
      logo.style.height = '50px';
      logo.crossOrigin = 'anonymous'; // Add this to handle CORS
      
      // Add a fallback mechanism if the logo fails to load
      logo.onerror = () => {
        console.warn('Failed to load logo, using fallback text');
        const fallbackText = document.createElement('h2');
        fallbackText.textContent = 'DRIVER';
        fallbackText.style.fontSize = '24px';
        fallbackText.style.color = '#FF2600';
        fallbackText.style.fontWeight = 'bold';
        fallbackText.style.margin = '0';
        logoContainer.innerHTML = '';
        logoContainer.appendChild(fallbackText);
      };
      
      logoContainer.appendChild(logo);
      pdfContainer.appendChild(logoContainer);
      
      // Create report header - no background
      const reportHeader = document.createElement('div');
      reportHeader.style.padding = '0 20px';
      
      const reportTitle = document.createElement('h1');
      reportTitle.textContent = t('inspections.details.printTitle');
      reportTitle.style.fontSize = '28px';
      reportTitle.style.fontWeight = 'bold';
      reportTitle.style.margin = '0 0 5px 0';
      reportTitle.style.color = '#333';
      
      // Format date properly based on the current language
      const formattedDate = formatDate ? 
        formatDate(inspection.date) : 
        new Date(inspection.date).toLocaleDateString(currentLanguage === 'ja' ? 'ja-JP' : 'en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
      // Also format time for the inspection
      const formattedTime = new Date(inspection.date).toLocaleTimeString(currentLanguage === 'ja' ? 'ja-JP' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
        
      const reportDate = document.createElement('p');
      reportDate.textContent = `${t('inspections.dateLabel')}: ${formattedDate} ${formattedTime}`;
      reportDate.style.fontSize = '16px';
      reportDate.style.margin = '0 0 20px 0';
      reportDate.style.color = '#666';
      
      reportHeader.appendChild(reportTitle);
      reportHeader.appendChild(reportDate);
      pdfContainer.appendChild(reportHeader);
      
      // Add separator line
      const separator = document.createElement('hr');
      separator.style.border = 'none';
      separator.style.borderBottom = '1px solid #e0e0e0';
      separator.style.margin = '0 0 20px 0';
      pdfContainer.appendChild(separator);
      
      // ================ FIRST PAGE CONTENT ==================
      // Create first page content wrapper for proper page break
      const firstPageContent = document.createElement('div');
      // Remove the automatic page break after to prevent extra blank pages
      // firstPageContent.style.pageBreakAfter = 'always';
      
      // Vehicle Information Section - only title has background
      const vehicleSection = document.createElement('div');
      vehicleSection.style.margin = '0 20px 20px';
      vehicleSection.style.padding = '0';
      vehicleSection.style.border = '1px solid #e0e0e0';
      vehicleSection.style.borderRadius = '4px';
      
      const vehicleTitleContainer = document.createElement('div');
      vehicleTitleContainer.style.backgroundColor = '#f9f9f9';
      vehicleTitleContainer.style.padding = '10px 20px';
      vehicleTitleContainer.style.borderBottom = '1px solid #e0e0e0';
      
      const vehicleTitle = document.createElement('h2');
      vehicleTitle.textContent = t('inspections.details.vehicleInfo.title');
      vehicleTitle.style.fontSize = '18px';
      vehicleTitle.style.fontWeight = 'bold';
      vehicleTitle.style.margin = '0';
      vehicleTitle.style.color = '#333';
      
      vehicleTitleContainer.appendChild(vehicleTitle);
      vehicleSection.appendChild(vehicleTitleContainer);
      
      // Create vehicle details grid - 2x2 layout as in mockup
      const vehicleDetailsContainer = document.createElement('div');
      vehicleDetailsContainer.style.padding = '15px 20px';
      vehicleDetailsContainer.style.backgroundColor = '#fff';
      
      const vehicleGrid = document.createElement('div');
      vehicleGrid.style.display = 'grid';
      vehicleGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      vehicleGrid.style.gap = '10px 30px';
      
      // Vehicle Name
      const vehicleNameLabel = document.createElement('div');
      vehicleNameLabel.textContent = t('vehicles.fields.name');
      vehicleNameLabel.style.color = '#666';
      vehicleNameLabel.style.fontSize = '14px';
      
      const vehicleNameValue = document.createElement('div');
      vehicleNameValue.textContent = inspection.vehicle?.name || t('common.notAvailable');
      vehicleNameValue.style.fontSize = '16px';
      vehicleNameValue.style.fontWeight = 'normal';
      vehicleNameValue.style.marginBottom = '10px';
      
      // Manufacturer
      const manufacturerLabel = document.createElement('div');
      manufacturerLabel.textContent = t('vehicles.fields.brand');
      manufacturerLabel.style.color = '#666';
      manufacturerLabel.style.fontSize = '14px';
      
      const manufacturerValue = document.createElement('div');
      manufacturerValue.textContent = inspection.vehicle?.brand || t('common.notAvailable');
      manufacturerValue.style.fontSize = '16px';
      manufacturerValue.style.fontWeight = 'normal';
      manufacturerValue.style.marginBottom = '10px';
      
      // License Plate
      const licensePlateLabel = document.createElement('div');
      licensePlateLabel.textContent = t('vehicles.fields.plateNumber');
      licensePlateLabel.style.color = '#666';
      licensePlateLabel.style.fontSize = '14px';
      
      const licensePlateValue = document.createElement('div');
      licensePlateValue.textContent = inspection.vehicle?.plate_number || t('common.notAvailable');
      licensePlateValue.style.fontSize = '16px';
      licensePlateValue.style.fontWeight = 'normal';
      licensePlateValue.style.marginBottom = '10px';
      
      // Model
      const modelLabel = document.createElement('div');
      modelLabel.textContent = t('vehicles.fields.model');
      modelLabel.style.color = '#666';
      modelLabel.style.fontSize = '14px';
      
      const modelValue = document.createElement('div');
      modelValue.textContent = inspection.vehicle?.model || t('common.notAvailable');
      modelValue.style.fontSize = '16px';
      modelValue.style.fontWeight = 'normal';
      modelValue.style.marginBottom = '10px';
      
      // Add all vehicle details
      const vehicleNameSection = document.createElement('div');
      vehicleNameSection.appendChild(vehicleNameLabel);
      vehicleNameSection.appendChild(vehicleNameValue);
      
      const manufacturerSection = document.createElement('div');
      manufacturerSection.appendChild(manufacturerLabel);
      manufacturerSection.appendChild(manufacturerValue);
      
      const licensePlateSection = document.createElement('div');
      licensePlateSection.appendChild(licensePlateLabel);
      licensePlateSection.appendChild(licensePlateValue);
      
      const modelSection = document.createElement('div');
      modelSection.appendChild(modelLabel);
      modelSection.appendChild(modelValue);
      
      vehicleGrid.appendChild(vehicleNameSection);
      vehicleGrid.appendChild(manufacturerSection);
      vehicleGrid.appendChild(licensePlateSection);
      vehicleGrid.appendChild(modelSection);
      
      vehicleDetailsContainer.appendChild(vehicleGrid);
      vehicleSection.appendChild(vehicleDetailsContainer);
      firstPageContent.appendChild(vehicleSection);
      
      // Inspection Details Section - only title has background
      const inspectionSection = document.createElement('div');
      inspectionSection.style.margin = '0 20px 20px';
      inspectionSection.style.padding = '0';
      inspectionSection.style.border = '1px solid #e0e0e0';
      inspectionSection.style.borderRadius = '4px';
      
      const inspectionTitleContainer = document.createElement('div');
      inspectionTitleContainer.style.backgroundColor = '#f9f9f9';
      inspectionTitleContainer.style.padding = '10px 20px';
      inspectionTitleContainer.style.borderBottom = '1px solid #e0e0e0';
      
      const inspectionTitle = document.createElement('h2');
      inspectionTitle.textContent = t('inspections.details.inspectionDetails');
      inspectionTitle.style.fontSize = '18px';
      inspectionTitle.style.fontWeight = 'bold';
      inspectionTitle.style.margin = '0';
      inspectionTitle.style.color = '#333';
      
      inspectionTitleContainer.appendChild(inspectionTitle);
      inspectionSection.appendChild(inspectionTitleContainer);
      
      // Inspection details content - white background
      const inspectionDetailsContainer = document.createElement('div');
      inspectionDetailsContainer.style.padding = '15px 20px';
      inspectionDetailsContainer.style.backgroundColor = '#fff';
      
      // Create inspection details grid - 2x2 layout
      const inspectionGrid = document.createElement('div');
      inspectionGrid.style.display = 'grid';
      inspectionGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      inspectionGrid.style.gap = '10px 30px';
      
      // Type
      createDetailItem(inspectionGrid, t('inspections.fields.type'), t(`inspections.type.${inspection.type || 'routine'}`));
      
      // Status
      createDetailItem(inspectionGrid, t('inspections.fields.status'), t(`inspections.status.${inspection.status}`));
      
      // Date
      createDetailItem(inspectionGrid, t('inspections.fields.date'), formattedDate);
      
      // Inspector
      const inspectorName = inspection.inspector?.name || t('common.notAvailable');
      const inspectorEmail = inspection.inspector?.email || t('common.notAvailable');
      createDetailItem(inspectionGrid, t('inspections.fields.inspector'), inspectorName);
      
      // Add inspector email
      createDetailItem(inspectionGrid, t('inspections.fields.inspectorEmail'), inspectorEmail);
      
      // Notes (if any)
      if (inspection.notes) {
        createDetailItem(inspectionGrid, t('inspections.fields.notes'), inspection.notes);
      }
      
      inspectionDetailsContainer.appendChild(inspectionGrid);
      inspectionSection.appendChild(inspectionDetailsContainer);
      firstPageContent.appendChild(inspectionSection);
      
      // Results Summary Section - only title has background
      const resultsSection = document.createElement('div');
      resultsSection.style.margin = '0 20px 20px';
      resultsSection.style.padding = '0';
      resultsSection.style.border = '1px solid #e0e0e0';
      resultsSection.style.borderRadius = '4px';
      
      const resultsTitleContainer = document.createElement('div');
      resultsTitleContainer.style.backgroundColor = '#f9f9f9';
      resultsTitleContainer.style.padding = '10px 20px';
      resultsTitleContainer.style.borderBottom = '1px solid #e0e0e0';
      
      const resultsTitle = document.createElement('h2');
      resultsTitle.textContent = t('inspections.details.results.title');
      resultsTitle.style.fontSize = '18px';
      resultsTitle.style.fontWeight = 'bold';
      resultsTitle.style.margin = '0';
      resultsTitle.style.color = '#333';
      
      resultsTitleContainer.appendChild(resultsTitle);
      resultsSection.appendChild(resultsTitleContainer);
      
      // Results content - white background
      const resultsContentContainer = document.createElement('div');
      resultsContentContainer.style.padding = '15px 20px';
      resultsContentContainer.style.backgroundColor = '#fff';
      
      // Create results details grid - 2x2 layout
      const resultsGrid = document.createElement('div');
      resultsGrid.style.display = 'grid';
      resultsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      resultsGrid.style.gap = '10px 30px';
      
      // Passed Items Count
      createDetailItem(
        resultsGrid, 
        t('inspections.details.results.passedLabel'), 
        t('inspections.details.results.passCount', { count: passedItemsCount.toString() })
      );
      
      // Failed Items Count
      createDetailItem(
        resultsGrid, 
        t('inspections.details.results.failedLabel'), 
        t('inspections.details.results.failCount', { count: failedItemsCount.toString() })
      );
      
      // Photos Count
      createDetailItem(
        resultsGrid, 
        t('inspections.details.results.photosLabel'), 
        t('inspections.details.results.photoCount', { count: photosItemsCount.toString() })
      );
      
      // Notes Count
      createDetailItem(
        resultsGrid, 
        t('inspections.details.results.notesLabel'), 
        t('inspections.details.results.notesCount', { count: notesItemsCount.toString() })
      );
      
      resultsContentContainer.appendChild(resultsGrid);
      
      // Completion Message - Add to results section
      const completionMessage = document.createElement('div');
      completionMessage.style.margin = '15px 0 0 0';
      completionMessage.style.padding = '10px';
      completionMessage.style.borderRadius = '4px';
      
      if (failedItemsCount === 0 && passedItemsCount > 0) {
        // All items passed message
        completionMessage.style.backgroundColor = '#e6f4ea';
        completionMessage.style.color = '#137333';
        
        const allPassedTitle = document.createElement('h3');
        allPassedTitle.textContent = t('inspections.details.results.allPassed');
        allPassedTitle.style.margin = '0 0 5px 0';
        allPassedTitle.style.fontSize = '16px';
        allPassedTitle.style.fontWeight = 'bold';
        
        const allPassedMsg = document.createElement('p');
        allPassedMsg.textContent = t('inspections.details.results.noFailedItems');
        allPassedMsg.style.margin = '0';
        allPassedMsg.style.fontSize = '14px';
        
        completionMessage.appendChild(allPassedTitle);
        completionMessage.appendChild(allPassedMsg);
      } else if (failedItemsCount > 0) {
        // Failed items message
        completionMessage.style.backgroundColor = '#fce8e6';
        completionMessage.style.color = '#c5221f';
        
        const failedItemsTitle = document.createElement('h3');
        failedItemsTitle.textContent = `${failedItemsCount} ${t('inspections.details.results.failedLabel')}`;
        failedItemsTitle.style.margin = '0 0 5px 0';
        failedItemsTitle.style.fontSize = '16px';
        failedItemsTitle.style.fontWeight = 'bold';
        
        const failedItemsMsg = document.createElement('p');
        failedItemsMsg.textContent = t('inspections.details.results.failedItemsDescription');
        failedItemsMsg.style.margin = '0';
        failedItemsMsg.style.fontSize = '14px';
        
        completionMessage.appendChild(failedItemsTitle);
        completionMessage.appendChild(failedItemsMsg);
      }
      
      resultsContentContainer.appendChild(completionMessage);
      resultsSection.appendChild(resultsContentContainer);
      firstPageContent.appendChild(resultsSection);
      
      // Add first page content to main container
      pdfContainer.appendChild(firstPageContent);
      
      // ================ SECOND PAGE CONTENT ==================
      // Create second page content wrapper
      const secondPageContent = document.createElement('div');
      
      // Inspection Items Section
      const itemsSection = document.createElement('div');
      itemsSection.style.margin = '0 20px 20px';
      itemsSection.style.padding = '0';
      itemsSection.style.border = '1px solid #e0e0e0';
      itemsSection.style.borderRadius = '4px';
      
      const itemsTitleContainer = document.createElement('div');
      itemsTitleContainer.style.backgroundColor = '#f9f9f9';
      itemsTitleContainer.style.padding = '10px 20px';
      itemsTitleContainer.style.borderBottom = '1px solid #e0e0e0';
      
      const itemsTitle = document.createElement('h2');
      itemsTitle.textContent = t('inspections.details.inspectionItems');
      itemsTitle.style.fontSize = '24px';
      itemsTitle.style.fontWeight = 'bold';
      itemsTitle.style.margin = '0';
      itemsTitle.style.color = '#333';
      
      itemsTitleContainer.appendChild(itemsTitle);
      itemsSection.appendChild(itemsTitleContainer);
      
      // Items content - white background
      const itemsContentContainer = document.createElement('div');
      itemsContentContainer.style.padding = '15px 20px';
      itemsContentContainer.style.backgroundColor = '#fff';
      
      // Create table for inspection items - important for visibility in PDF
      const itemsTable = document.createElement('table');
      itemsTable.style.width = '100%';
      itemsTable.style.borderCollapse = 'collapse';
      itemsTable.style.marginTop = '0';
      itemsTable.style.border = '1px solid #ddd';
      
      // Table header row
      const tableHeader = document.createElement('thead');
      const headerRow = document.createElement('tr');
      headerRow.style.backgroundColor = '#ddd';
      
      // Item name header
      const itemHeader = document.createElement('th');
      itemHeader.textContent = t('inspections.templates.itemNameLabel');
      itemHeader.style.padding = '10px 8px';
      itemHeader.style.textAlign = 'left';
      itemHeader.style.width = '50%';
      itemHeader.style.border = '1px solid #ccc';
      
      // Status header
      const statusHeader = document.createElement('th');
      statusHeader.textContent = t('inspections.fields.status');
      statusHeader.style.padding = '10px 8px';
      statusHeader.style.textAlign = 'center';
      statusHeader.style.width = '20%';
      statusHeader.style.border = '1px solid #ccc';
      
      // Notes header
      const notesHeader = document.createElement('th');
      notesHeader.textContent = t('inspections.fields.notes');
      notesHeader.style.padding = '10px 8px';
      notesHeader.style.textAlign = 'left';
      notesHeader.style.width = '30%';
      notesHeader.style.border = '1px solid #ccc';
      
      // Add headers to header row
      headerRow.appendChild(itemHeader);
      headerRow.appendChild(statusHeader);
      headerRow.appendChild(notesHeader);
      tableHeader.appendChild(headerRow);
      itemsTable.appendChild(tableHeader);
      
      // Create table body
      const tableBody = document.createElement('tbody');
      
      // Group items by section for better organization
      const itemsBySection = itemsWithTemplates.reduce<Record<string, InspectionItem[]>>((acc, item) => {
        const keys = getTranslationKeys(item.template);
        const section = keys.section || 'other';
        
        if (!acc[section]) {
          acc[section] = [];
        }
        
        acc[section].push(item);
        return acc;
      }, {});
      
      // Add each section and its items to the table
      Object.entries(itemsBySection).forEach(([section, sectionItems]) => {
        // Add section header row
        const sectionRow = document.createElement('tr');
        sectionRow.style.backgroundColor = '#f2f2f2';
        
        const sectionCell = document.createElement('td');
        sectionCell.colSpan = 3;
        sectionCell.style.padding = '10px 8px';
        sectionCell.style.fontWeight = 'bold';
        sectionCell.style.border = '1px solid #ccc';
        
        // Get translated section name
        let sectionTitle;
        if (section !== 'other') {
          sectionTitle = t(`inspections.sections.${section}.title`, { 
            defaultValue: formatSectionName(section) 
          });
        } else {
          sectionTitle = t('inspections.sections.other.title', { defaultValue: 'Other' });
        }
        
        sectionCell.textContent = sectionTitle;
        sectionRow.appendChild(sectionCell);
        tableBody.appendChild(sectionRow);
        
        // Add individual item rows for this section
        sectionItems.forEach((item, index) => {
          const itemRow = document.createElement('tr');
          itemRow.style.backgroundColor = index % 2 === 0 ? '#fff' : '#fafafa';
          
          // Item name cell
          const itemCell = document.createElement('td');
          itemCell.style.padding = '8px';
          itemCell.style.borderBottom = '1px solid #ddd';
          itemCell.style.borderLeft = '1px solid #ddd';
          itemCell.style.borderRight = '1px solid #ddd';
          
          // Get translated item name
          const keys = getTranslationKeys(item.template);
          const itemName = keys.section && keys.item ? 
            t(`inspections.sections.${keys.section}.items.${keys.item}.title`, { defaultValue: getTemplateName(item.template) }) : 
            getTemplateName(item.template) || t('common.noResults');
          
          itemCell.textContent = itemName;
          itemRow.appendChild(itemCell);
          
          // Status cell with Pass/Fail badge
          const statusCell = document.createElement('td');
          statusCell.style.padding = '8px';
          statusCell.style.textAlign = 'center';
          statusCell.style.borderBottom = '1px solid #ddd';
          statusCell.style.borderRight = '1px solid #ddd';
          
          const statusBadge = document.createElement('span');
          if (item.status === 'pass') {
            statusBadge.textContent = t('inspections.actions.pass');
            statusBadge.style.backgroundColor = '#e6f4ea';
            statusBadge.style.color = '#137333';
          } else {
            statusBadge.textContent = t('inspections.actions.fail');
            statusBadge.style.backgroundColor = '#fce8e6';
            statusBadge.style.color = '#c5221f';
          }
          
          statusBadge.style.padding = '4px 8px';
          statusBadge.style.borderRadius = '4px';
          statusBadge.style.fontSize = '12px';
          statusBadge.style.fontWeight = 'bold';
          statusBadge.style.display = 'inline-block';
          
          statusCell.appendChild(statusBadge);
          itemRow.appendChild(statusCell);
          
          // Notes cell
          const notesCell = document.createElement('td');
          notesCell.style.padding = '8px';
          notesCell.style.borderBottom = '1px solid #ddd';
          notesCell.style.borderRight = '1px solid #ddd';
          notesCell.textContent = item.notes || '-';
          
          itemRow.appendChild(notesCell);
          tableBody.appendChild(itemRow);
        });
      });
      
      // Add table body to table
      itemsTable.appendChild(tableBody);
      
      // Add the table to the inspection items section
      itemsContentContainer.appendChild(itemsTable);
      
      // Add content container to the section
      itemsSection.appendChild(itemsContentContainer);
      
      // Add the section to the second page content
      secondPageContent.appendChild(itemsSection);
      
      // Add second page content to main container
      pdfContainer.appendChild(secondPageContent);
      
      // Add to document body
      document.body.appendChild(pdfContainer);
      
      // Helper function to format section names
      function formatSectionName(name) {
        return name.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
      
      // Wait for images to load
      setTimeout(async () => {
        try {
          // Options for html2pdf
          const opt = {
            margin: [10, 10, 10, 10], // top, left, bottom, right margins in mm
            filename: `inspection-report-${formatDate ? formatDate(inspection.date).replace(/\s/g, '-').replace(/,/g, '') : dateFormat(new Date(inspection.date), 'yyyy-MM-dd')}-${inspection.vehicle?.name?.replace(/\s/g, '-').toLowerCase() || 'vehicle'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
              scale: 2, 
              useCORS: true,
              letterRendering: true,
              allowTaint: true
              // REMOVED: height: pdfContainer.offsetHeight + 1000, 
              // REMOVED: windowHeight: pdfContainer.offsetHeight + 1000
            },
            jsPDF: { 
              unit: 'mm', 
              format: 'a4', 
              orientation: 'portrait',
              compress: true
            },
            pagebreak: {
              mode: ['avoid-all', 'css', 'legacy']
            }
          };
          
          // Generate PDF
          await html2pdf().from(pdfContainer).set(opt).save();
          
          toast({
            title: t('inspections.messages.exportSuccess'),
          });
        } catch (error) {
          console.error('Error generating PDF:', error);
          toast({
            title: t('inspections.messages.exportError'),
            variant: "destructive",
          });
        } finally {
          // Clean up
          document.body.removeChild(pdfContainer);
          if (document.head.contains(fontLink)) {
            document.head.removeChild(fontLink);
          }
          setIsExporting(false);
        }
      }, 500); // Wait for 500ms to ensure everything is rendered properly
      
    } catch (error) {
      console.error('Error setting up PDF export:', error);
      toast({
        title: t('inspections.messages.exportError'),
        variant: "destructive",
      });
      setIsExporting(false);
    }
  };
  
  // Helper function to create detail items for the PDF
  function createDetailItem(container: HTMLElement, label: string, value: string) {
    const item = document.createElement('div');
    item.style.marginBottom = '5px';
    
    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    labelEl.style.fontSize = '12px';
    labelEl.style.color = '#666';
    item.appendChild(labelEl);
    
    const valueEl = document.createElement('div');
    valueEl.textContent = value;
    valueEl.style.fontSize = '14px';
    valueEl.style.fontWeight = 'bold';
    item.appendChild(valueEl);
    
    container.appendChild(item);
  }
  
  // Helper function to create item cards for the PDF
  function createItemCard(item: InspectionItem) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.padding = '15px';
    card.style.border = '1px solid #ddd';
    card.style.borderRadius = '5px';
    card.style.backgroundColor = '#fff';
    
    const title = document.createElement('h3');
    title.textContent = getTemplateName(item.template);
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '16px';
    title.style.fontWeight = 'bold';
    card.appendChild(title);
    
    const description = getTemplateDescription(item.template);
    if (description) {
      const desc = document.createElement('p');
      desc.textContent = description;
      desc.style.margin = '0 0 10px 0';
      desc.style.fontSize = '14px';
      card.appendChild(desc);
    }
    
    if (item.notes) {
      const notesTitle = document.createElement('div');
      notesTitle.textContent = t('inspections.fields.notes');
      notesTitle.style.fontWeight = 'bold';
      notesTitle.style.fontSize = '14px';
      notesTitle.style.marginTop = '10px';
      card.appendChild(notesTitle);
      
      const notesContent = document.createElement('p');
      notesContent.textContent = item.notes;
      notesContent.style.margin = '5px 0 0 0';
      notesContent.style.fontSize = '14px';
      card.appendChild(notesContent);
    }
    
    return card;
  }

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
                <Link href={`/inspections`} ><span className="flex items-center gap-2">
                  <div className="flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common.backTo')}
                  </div>
                </span></Link>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 hidden sm:flex"
                        disabled={isExporting}
                      >
                        <FileText className="h-4 w-4 text-foreground" />
                        {t('inspections.details.actions.exportResult')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportPDF}>
                        <FileText className="h-4 w-4 mr-2 text-foreground" />
                        PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportReport}>
                        <Download className="h-4 w-4 mr-2 text-foreground" />
                        CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
          )}
        </div>
          </div>
        </CardHeader>
      </Card>
      {/* Floating Action Button for Mobile */}
      {inspection.status === 'completed' && (
        <div className="fixed right-4 bottom-20 z-50 flex flex-col gap-2 md:hidden print-hide">
          <div className="relative group">
            {/* Main Export Button */}
            <Button
              size="icon"
              className="rounded-full shadow-lg bg-primary hover:bg-primary/90 h-12 w-12"
              disabled={isExporting}
              onClick={() => {
                const buttonElement = document.getElementById('mobile-export-actions');
                if (buttonElement) {
                  buttonElement.classList.toggle('scale-100');
                  buttonElement.classList.toggle('opacity-100');
                }
              }}
            >
              {isExporting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <FileText className="h-5 w-5 text-primary-foreground" />
              )}
            </Button>
            
            {/* Action buttons that pop up */}
            <div 
              id="mobile-export-actions"
              className="absolute bottom-16 right-0 flex flex-col gap-2 scale-0 opacity-0 transition-all duration-200 origin-bottom-right"
            >
              {/* PDF Export */}
              <Button
                size="icon"
                className="rounded-full shadow-md bg-white border border-gray-200 hover:bg-gray-100 h-10 w-10 relative group"
                onClick={handleExportPDF}
              >
                <FileText className="h-4 w-4 text-gray-700" />
                <span className="absolute right-12 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  PDF
                </span>
              </Button>
              
              {/* CSV Export */}
              <Button
                size="icon"
                className="rounded-full shadow-md bg-white border border-gray-200 hover:bg-gray-100 h-10 w-10 relative group"
                onClick={handleExportReport}
              >
                <Download className="h-4 w-4 text-gray-700" />
                <span className="absolute right-12 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  CSV
                </span>
              </Button>
            </div>
          </div>
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
                <h3 className="font-medium mb-2">{t("inspections.details.inspector.title")}</h3>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground mr-1">{t("inspections.details.inspector.name")}:</span>
                    {inspection.inspector.name}
                  </p>
                  {/* Always show email field, with fallbacks */}
                  <p className="text-sm text-muted-foreground">
                    <span className="mr-1">{t("inspections.details.inspector.email")}:</span>
                    {inspection.inspector.email || t("common.notAssigned")}
                  </p>
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
  );
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