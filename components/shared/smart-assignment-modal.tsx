"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LoadingModal from '@/components/ui/loading-modal';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, UserIcon, CarIcon, Car, SearchIcon, SortAscIcon, SortDescIcon, UserX } from 'lucide-react';
import { cn } from '@/lib/utils/styles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_image_url?: string;
  status?: string;
  is_available?: boolean;
}

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand: string;
  model: string;
  year?: number;
  image_url?: string;
  status?: string;
  is_available?: boolean;
  category_name?: string;
  pricing_category_vehicles?: Array<{
    pricing_categories: {
      id: string;
      name: string;
      sort_order: number;
    };
  }>;
}

interface Booking {
  id: string;
  wp_id?: string;
  service_name?: string;
  date?: string;
  time?: string;
  customer_name?: string;
  driver_id?: string;
  vehicle_id?: string;
  driver?: Driver;
  vehicle?: Vehicle;
}

interface SmartAssignmentModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (driverId: string, vehicleId: string) => void;
  onUnassignDriver?: () => void;
  onUnassignVehicle?: () => void;
  onUnassignAll?: () => void;
  drivers: Driver[];
  vehicles: Vehicle[];
  title?: string;
  subtitle?: string;
}

export default function SmartAssignmentModal({
  booking,
  isOpen,
  onClose,
  onAssign,
  onUnassignDriver,
  onUnassignVehicle,
  onUnassignAll,
  drivers,
  vehicles,
  title,
  subtitle
}: SmartAssignmentModalProps) {
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  
  // Search and sort state
  const [driverSearch, setDriverSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [driverSortBy, setDriverSortBy] = useState<"name" | "availability">("name");
  const [vehicleSortBy, setVehicleSortBy] = useState<"name" | "match" | "plate">("match");
  const [driverSortOrder, setDriverSortOrder] = useState<"asc" | "desc">("asc");
  const [vehicleSortOrder, setVehicleSortOrder] = useState<"asc" | "desc">("desc");

  // Assignment type and pricing state
  const [assignmentType, setAssignmentType] = useState<'update' | 'upgrade' | 'downgrade'>('update');
  const [priceDifference, setPriceDifference] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    driver: any;
    vehicle: any;
    assignmentType: 'update' | 'upgrade' | 'downgrade';
    priceDifference: number;
    paymentAmount?: number;
    couponCode?: string;
    refundAmount?: number;
  } | null>(null);
  const [skipPayment, setSkipPayment] = useState(false);
  const [bccEmail, setBccEmail] = useState('');
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressTitle, setProgressTitle] = useState('');
  const [progressVariant, setProgressVariant] = useState<'default' | 'success' | 'error' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice'>('default');
  const [progressValue, setProgressValue] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [progressSteps, setProgressSteps] = useState<Array<{ label: string; value: number; completed: boolean }>>([]);

  // Reset selections when modal opens/closes or booking changes
  useEffect(() => {
    if (isOpen && booking) {
      // Pre-select current assignments if they exist
      if (booking.driver_id) {
        setSelectedDriver(booking.driver_id);
      } else if (booking.driver?.id) {
        setSelectedDriver(booking.driver.id);
      } else {
        setSelectedDriver("");
      }

      if (booking.vehicle_id) {
        setSelectedVehicle(booking.vehicle_id);
      } else if (booking.vehicle?.id) {
        setSelectedVehicle(booking.vehicle.id);
      } else {
        setSelectedVehicle("");
      }
    } else {
      setSelectedDriver("");
      setSelectedVehicle("");
      setDriverSearch("");
      setVehicleSearch("");
      setAssignmentType('update');
      setPriceDifference(0);
    }
  }, [isOpen, booking]);

  // Calculate assignment type and price difference when vehicle changes
  useEffect(() => {
    if (selectedVehicle && booking?.vehicle_id && selectedVehicle !== booking.vehicle_id) {
      const currentVehicle = vehicles.find(v => v.id === booking.vehicle_id);
      const newVehicle = vehicles.find(v => v.id === selectedVehicle);
      
      console.log('Current vehicle:', currentVehicle);
      console.log('New vehicle:', newVehicle);
      
      if (currentVehicle && newVehicle) {
        const currentCategory = currentVehicle.pricing_category_vehicles?.[0]?.pricing_categories;
        const newCategory = newVehicle.pricing_category_vehicles?.[0]?.pricing_categories;
        
        console.log('Current category:', currentCategory);
        console.log('New category:', newCategory);
        
        if (currentCategory && newCategory) {
          if (newCategory.sort_order < currentCategory.sort_order) {
            setAssignmentType('upgrade');
            console.log('UPGRADE detected');
          } else if (newCategory.sort_order > currentCategory.sort_order) {
            setAssignmentType('downgrade');
            console.log('DOWNGRADE detected');
          } else {
            setAssignmentType('update');
            console.log('UPDATE detected');
          }
          
          // Calculate price difference based on category difference
          const priceDiff = (newCategory.sort_order - currentCategory.sort_order) * 10000;
          setPriceDifference(priceDiff);
          console.log('Price difference:', priceDiff);
        } else {
          console.log('Missing category data');
          setAssignmentType('update');
          setPriceDifference(0);
        }
      }
    } else {
      setAssignmentType('update');
      setPriceDifference(0);
    }
  }, [selectedVehicle, booking?.vehicle_id, vehicles]);

  // Enhanced vehicle matching logic based on service name and pricing categories
  const getVehicleMatches = () => {
    // Use a default service name if none provided
    const serviceName = (booking?.service_name || 'airport transfer').toLowerCase();
    console.log('Service name for matching:', serviceName);
    
    return vehicles.map(vehicle => {
      let matchPercentage = 30; // base score
      
      // Get vehicle details
      const vehicleCategory = vehicle.pricing_category_vehicles?.[0]?.pricing_categories?.name?.toLowerCase() || '';
      const vehicleModel = vehicle.model?.toLowerCase() || '';
      const vehicleBrand = vehicle.brand?.toLowerCase() || '';
      
      console.log(`Vehicle: ${vehicleBrand} ${vehicleModel} (${vehicleCategory})`);
      
      // Current vehicle gets highest priority
      if (vehicle.id === booking?.vehicle_id) {
        matchPercentage = 100;
        console.log('Current vehicle - 100%');
      }
      // Perfect model matches
      else if (serviceName.includes('alphard executive lounge') && vehicleModel.includes('alphard executive lounge')) {
        matchPercentage = 100;
        console.log('Perfect Alphard Executive Lounge match - 100%');
      } else if (serviceName.includes('alphard z') && vehicleModel.includes('alphard z')) {
          matchPercentage = 100;
        console.log('Perfect Alphard Z match - 100%');
      } else if (serviceName.includes('v-class black suite') && vehicleModel.includes('v-class black suite')) {
        matchPercentage = 100;
        console.log('Perfect V-class Black Suite match - 100%');
      } else if (serviceName.includes('v-class extra long') && vehicleModel.includes('v-class extra long')) {
        matchPercentage = 100;
        console.log('Perfect V-class Extra Long match - 100%');
      } else if (serviceName.includes('s580') && vehicleModel.includes('s580')) {
        matchPercentage = 100;
        console.log('Perfect S580 match - 100%');
      } else if (serviceName.includes('maybach') && vehicleModel.includes('maybach')) {
        matchPercentage = 100;
        console.log('Perfect Maybach match - 100%');
      } else if (serviceName.includes('hi-ace') && vehicleModel.includes('hi-ace')) {
        matchPercentage = 100;
        console.log('Perfect Hi-Ace match - 100%');
      }
      // Partial model matches
      else if (serviceName.includes('v-class') && vehicleModel.includes('v-class')) {
          matchPercentage = 90;
        console.log('Partial V-class match - 90%');
      } else if (serviceName.includes('alphard') && vehicleModel.includes('alphard')) {
        matchPercentage = 90;
        console.log('Partial Alphard match - 90%');
      } else if (serviceName.includes('mercedes') && vehicleBrand.includes('mercedes')) {
        matchPercentage = 80;
        console.log('Mercedes brand match - 80%');
      } else if (serviceName.includes('toyota') && vehicleBrand.includes('toyota')) {
        matchPercentage = 80;
        console.log('Toyota brand match - 80%');
      }
      
      // Base scoring based on vehicle category tier
      if (vehicleCategory === 'elite') {
        matchPercentage = Math.max(matchPercentage, 85);
        console.log('Elite category base score - 85%');
      } else if (vehicleCategory === 'platinum') {
        matchPercentage = Math.max(matchPercentage, 75);
        console.log('Platinum category base score - 75%');
      } else if (vehicleCategory === 'luxury') {
        matchPercentage = Math.max(matchPercentage, 65);
        console.log('Luxury category base score - 65%');
      } else if (vehicleCategory === 'premium') {
        matchPercentage = Math.max(matchPercentage, 55);
        console.log('Premium category base score - 55%');
      }
      
      // Category-based scoring
      if (serviceName.includes('elite') && vehicleCategory.includes('elite')) {
        matchPercentage = Math.max(matchPercentage, 85);
        console.log('Elite category match - 85%');
      } else if (serviceName.includes('platinum') && vehicleCategory.includes('platinum')) {
        matchPercentage = Math.max(matchPercentage, 85);
        console.log('Platinum category match - 85%');
      } else if (serviceName.includes('luxury') && vehicleCategory.includes('luxury')) {
        matchPercentage = Math.max(matchPercentage, 85);
        console.log('Luxury category match - 85%');
      } else if (serviceName.includes('premium') && vehicleCategory.includes('premium')) {
        matchPercentage = Math.max(matchPercentage, 85);
        console.log('Premium category match - 85%');
      }
      
      // Ensure minimum score
      matchPercentage = Math.max(matchPercentage, 30);
      
      console.log(`Final match percentage: ${matchPercentage}%`);
      
      return { vehicle, matchPercentage };
    });
  };

  // Filtered and sorted drivers
  const filteredAndSortedDrivers = useMemo(() => {
    let filtered = drivers.filter(driver => {
      if (!driverSearch) return true;
      const searchTerm = driverSearch.toLowerCase();
      return (
        driver.first_name.toLowerCase().includes(searchTerm) ||
        driver.last_name.toLowerCase().includes(searchTerm) ||
        `${driver.first_name} ${driver.last_name}`.toLowerCase().includes(searchTerm)
      );
    });

    // Sort drivers
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (driverSortBy === "name") {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (driverSortBy === "availability") {
        // Available drivers first
        comparison = (b.is_available ? 1 : 0) - (a.is_available ? 1 : 0);
      }
      
      return driverSortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [drivers, driverSearch, driverSortBy, driverSortOrder]);

  // Filtered and sorted vehicles with matches
  const filteredAndSortedVehicles = useMemo(() => {
    const vehicleMatches = getVehicleMatches();
    
    let filtered = vehicleMatches.filter(({ vehicle }) => {
      if (!vehicleSearch) return true;
      const searchTerm = vehicleSearch.toLowerCase();
      return (
        vehicle.plate_number.toLowerCase().includes(searchTerm) ||
        vehicle.brand.toLowerCase().includes(searchTerm) ||
        vehicle.model.toLowerCase().includes(searchTerm) ||
        `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(searchTerm)
      );
    });

    // Sort vehicles
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (vehicleSortBy === "match") {
        comparison = b.matchPercentage - a.matchPercentage; // Always highest first for match
      } else if (vehicleSortBy === "name") {
        const nameA = `${a.vehicle.brand} ${a.vehicle.model}`.toLowerCase();
        const nameB = `${b.vehicle.brand} ${b.vehicle.model}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (vehicleSortBy === "plate") {
        comparison = a.vehicle.plate_number.localeCompare(b.vehicle.plate_number);
      }
      
      // For match sorting, always show highest first regardless of sort order
      if (vehicleSortBy === "match") {
        return comparison; // b - a already gives highest first
      }
      
      return vehicleSortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [vehicles, vehicleSearch, vehicleSortBy, vehicleSortOrder, booking?.service_name]);

  const handleAssign = async () => {
    if (!selectedDriver || !selectedVehicle || !booking) return;

    // Get selected driver and vehicle data
    const selectedDriverData = drivers.find(d => d.id === selectedDriver);
    const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

    console.log('Selected driver data:', selectedDriverData);
    console.log('Selected vehicle data:', selectedVehicleData);

    if (!selectedDriverData || !selectedVehicleData) {
      console.error('Missing driver or vehicle data:', { selectedDriverData, selectedVehicleData });
      return;
    }

    // Fetch pricing data for both current and new vehicles
    try {
      const pricingResponse = await fetch(`/api/bookings/${booking.id}/get-vehicle-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentVehicleId: booking.vehicle_id,
          newVehicleId: selectedVehicle,
          serviceType: booking.service_name
        })
      });

      const pricingData = await pricingResponse.json();
      console.log('Pricing data:', pricingData);

      // Calculate actual price difference from API data
      const actualPriceDifference = (pricingData.newPrice || 0) - (pricingData.currentPrice || 0);
      
      // Determine assignment type based on actual price difference
      let actualAssignmentType: 'update' | 'upgrade' | 'downgrade' = 'update';
      if (actualPriceDifference > 0) {
        actualAssignmentType = 'upgrade';
      } else if (actualPriceDifference < 0) {
        actualAssignmentType = 'downgrade';
      }

      // Prepare confirmation data with pricing
      const confirmation = {
        driver: selectedDriverData,
        vehicle: {
          ...selectedVehicleData,
          currentPrice: pricingData.currentPrice || 0,
          newPrice: pricingData.newPrice || 0,
        },
        assignmentType: actualAssignmentType,
        priceDifference: Math.abs(actualPriceDifference),
        paymentAmount: actualAssignmentType === 'upgrade' ? Math.abs(actualPriceDifference) : undefined,
        refundAmount: actualAssignmentType === 'downgrade' ? Math.abs(actualPriceDifference) : undefined,
        couponCode: actualAssignmentType === 'downgrade' ? `REFUND-${Math.random().toString(36).substr(2, 8).toUpperCase()}` : undefined,
      };

      setConfirmationData(confirmation);
      setShowConfirmationModal(true);
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      // Fallback without pricing data
      const confirmation = {
        driver: selectedDriverData,
        vehicle: {
          ...selectedVehicleData,
          currentPrice: 0,
          newPrice: 0,
        },
        assignmentType,
        priceDifference,
        paymentAmount: assignmentType === 'upgrade' ? Math.abs(priceDifference) : undefined,
        refundAmount: assignmentType === 'downgrade' ? Math.abs(priceDifference) : undefined,
        couponCode: assignmentType === 'downgrade' ? `REFUND-${Math.random().toString(36).substr(2, 8).toUpperCase()}` : undefined,
      };

      setConfirmationData(confirmation);
      setShowConfirmationModal(true);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!confirmationData || !booking) return;

    setIsProcessing(true);
    setProgressOpen(true);
    setProgressTitle('Processing assignment...');
    setProgressVariant('default');
    setProgressValue(0);

    try {
        // Step 1: Assign vehicle and driver
        setProgressValue(20);
        setProgressTitle('Assigning vehicle and driver...');
        setProgressLabel('Updating assignment...');
        
        // Set different steps based on assignment type
        if (confirmationData.assignmentType === 'update') {
          setProgressSteps([
            { label: 'Assigning vehicle and driver', value: 20, completed: false },
            { label: 'Recording assignment details', value: 40, completed: false },
            { label: 'Completing assignment', value: 100, completed: false }
          ]);
        } else if (confirmationData.assignmentType === 'upgrade') {
          setProgressSteps([
            { label: 'Assigning vehicle and driver', value: 20, completed: false },
            { label: 'Recording assignment details', value: 40, completed: false },
            { label: 'Generating payment link', value: 60, completed: false },
            { label: 'Sending email notification', value: 80, completed: false },
            { label: 'Completing upgrade', value: 100, completed: false }
          ]);
        } else if (confirmationData.assignmentType === 'downgrade') {
          setProgressSteps([
            { label: 'Assigning vehicle and driver', value: 20, completed: false },
            { label: 'Recording assignment details', value: 40, completed: false },
            { label: 'Generating coupon code', value: 60, completed: false },
            { label: 'Sending email notification', value: 80, completed: false },
            { label: 'Completing downgrade', value: 100, completed: false }
          ]);
        }
      
      const response = await fetch(`/api/bookings/${booking.id}/assign-vehicle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: confirmationData.vehicle.id,
          driverId: confirmationData.driver.id,
          assignmentType: confirmationData.assignmentType,
          priceDifference: confirmationData.priceDifference,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Step 2: Store assignment operation
        setProgressValue(40);
        setProgressTitle('Recording assignment details...');
        setProgressLabel('Saving assignment...');
        
        // Mark first step as completed
        setProgressSteps(prev => prev.map((step, index) => 
          index === 0 ? { ...step, completed: true } : step
        ));
        
        let operationId = null;
        try {
          const operationResponse = await fetch(`/api/bookings/${booking.id}/store-assignment-operation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operationType: confirmationData.assignmentType,
              previousVehicleId: booking.vehicle_id,
              newVehicleId: confirmationData.vehicle.id,
              driverId: confirmationData.driver.id,
              priceDifference: confirmationData.priceDifference,
              paymentAmount: confirmationData.paymentAmount,
              couponCode: confirmationData.couponCode,
              refundAmount: confirmationData.refundAmount,
              customerEmail: (booking as any).customer_email,
              bccEmail: bccEmail || undefined
            })
          });
          
          if (operationResponse.ok) {
            const operationResult = await operationResponse.json();
            operationId = operationResult.operationId;
            console.log('Assignment operation stored successfully:', operationId);
            
            // Mark second step as completed
            setProgressSteps(prev => prev.map((step, index) => 
              index === 1 ? { ...step, completed: true } : step
            ));
          }
        } catch (error) {
          console.error('Error storing assignment operation:', error);
        }

        // Step 3: Handle different assignment types
        if (confirmationData.assignmentType === 'upgrade' && confirmationData.paymentAmount && !skipPayment) {
          setProgressValue(60);
          setProgressTitle('Generating payment link and sending email...');
          setProgressLabel('Creating payment link...');
          
          // Mark third step as completed
          setProgressSteps(prev => prev.map((step, index) => 
            index === 2 ? { ...step, completed: true } : step
          ));
          
          try {
            const paymentResponse = await fetch(`/api/bookings/${booking.id}/generate-upgrade-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: confirmationData.paymentAmount,
                description: `Vehicle upgrade from ${result.previousVehicleCategory} to ${result.newVehicleCategory}`,
                bccEmail: bccEmail || undefined,
                operationId: operationId
              })
            });
            
            const paymentResult = await paymentResponse.json();
            
            if (paymentResult.success) {
              setProgressValue(100);
              setProgressTitle('Upgrade completed successfully!');
              setProgressVariant('success');
              setProgressLabel('Upgrade completed!');
              
              // Mark all remaining steps as completed
              setProgressSteps(prev => prev.map(step => ({ ...step, completed: true })));
              
              setTimeout(() => {
                setProgressOpen(false);
                setShowConfirmationModal(false);
                onAssign(confirmationData.driver.id, confirmationData.vehicle.id);
      onClose();
              }, 1500);
            } else {
              throw new Error(paymentResult.error || 'Payment link generation failed');
            }
          } catch (error) {
            console.error('Error generating payment link:', error);
            throw error;
          }
        } else if (confirmationData.assignmentType === 'downgrade' && confirmationData.refundAmount && confirmationData.couponCode && !skipPayment) {
          setProgressValue(60);
          setProgressTitle('Generating coupon and sending email...');
          setProgressLabel('Creating coupon...');
          
          // Mark third step as completed
          setProgressSteps(prev => prev.map((step, index) => 
            index === 2 ? { ...step, completed: true } : step
          ));
          
          try {
            const couponResponse = await fetch(`/api/bookings/${booking.id}/send-downgrade-coupon`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                couponCode: confirmationData.couponCode,
                refundAmount: confirmationData.refundAmount,
                previousCategory: result.previousVehicleCategory,
                newCategory: result.newVehicleCategory,
                bccEmail: bccEmail || undefined,
                operationId: operationId
              })
            });
            
            const couponResult = await couponResponse.json();
            
            if (couponResult.success) {
              setProgressValue(100);
              setProgressTitle('Downgrade completed successfully!');
              setProgressVariant('success');
              setProgressLabel('Downgrade completed!');
              
              // Mark all remaining steps as completed
              setProgressSteps(prev => prev.map(step => ({ ...step, completed: true })));
              
              setTimeout(() => {
                setProgressOpen(false);
                setShowConfirmationModal(false);
                onAssign(confirmationData.driver.id, confirmationData.vehicle.id);
                onClose();
              }, 1500);
            } else {
              throw new Error(couponResult.error || 'Coupon email failed');
            }
          } catch (error) {
            console.error('Error sending coupon email:', error);
            throw error;
          }
        } else { // Update
          setProgressValue(100);
          setProgressTitle('Assignment completed successfully!');
          setProgressVariant('success');
          setProgressLabel('Assignment completed!');
          
          // Mark all steps as completed for update
          setProgressSteps(prev => prev.map(step => ({ ...step, completed: true })));
          
          setTimeout(() => {
            setProgressOpen(false);
            setShowConfirmationModal(false);
            onAssign(confirmationData.driver.id, confirmationData.vehicle.id);
            onClose();
          }, 1500);
        }
      } else {
        throw new Error(result.error || 'Failed to assign vehicle and driver');
      }
    } catch (error) {
      console.error('Error confirming assignment:', error);
      setProgressValue(100);
      setProgressTitle('Assignment failed');
      setProgressVariant('error');
      
      setTimeout(() => {
        setProgressOpen(false);
        alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to complete assignment. Please try again.'}`);
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {title || `Smart Assignment for #${booking.wp_id || booking.id}`}
          </DialogTitle>
          <DialogDescription>
            {subtitle || "Select a driver and vehicle for this booking. The system will suggest the best matches based on the service type."}
          </DialogDescription>
        </DialogHeader>

        {/* Current Assignment Status */}
        {(booking.driver_id || booking.vehicle_id) && (
          <div className="mb-6 p-4 bg-muted/30 border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <CheckIcon className={`h-4 w-4 ${booking.driver_id && booking.vehicle_id ? 'text-green-600' : 'text-muted-foreground'}`} />
              <h4 className="font-semibold text-foreground">Current Assignment</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Driver */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Current Driver</span>
                    </div>
                  {booking.driver_id && onUnassignDriver && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onUnassignDriver}
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground h-7 px-2"
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        Unassign
                      </Button>
                    )}
                  </div>
                
                {booking.driver_id ? (
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          {(() => {
                            if (booking.driver_id) {
                              const driver = drivers.find(d => d.id === booking.driver_id);
                              if (driver && driver.first_name && driver.last_name) {
                                return `${driver.first_name} ${driver.last_name}`;
                              }
                            }
                            if (booking.driver && typeof booking.driver === 'object') {
                              if (booking.driver.first_name && booking.driver.last_name) {
                                return `${booking.driver.first_name} ${booking.driver.last_name}`;
                              }
                              return `Driver assigned (ID: ${booking.driver.id || 'Unknown'})`;
                            }
                            if (booking.driver_id) {
                              return 'Loading driver details...';
                            }
                            return 'No driver assigned';
                          })()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(() => {
                            if (booking.driver_id) {
                              const driver = drivers.find(d => d.id === booking.driver_id);
                              return driver?.email || 'No email';
                            }
                            return booking.driver?.email || 'No email';
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            if (booking.driver_id) {
                              const driver = drivers.find(d => d.id === booking.driver_id);
                              return driver?.phone || 'No phone';
                            }
                            return booking.driver?.phone || 'No phone';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-background rounded-lg border min-h-[80px] flex items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        No driver assigned
                    </div>
                  </div>
                </div>
              )}
              </div>
              {/* Current Vehicle */}
              {booking.vehicle_id && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Current Vehicle</span>
                    </div>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <CarIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {(() => {
                            if (booking.vehicle_id) {
                              const vehicle = vehicles.find(v => v.id === booking.vehicle_id);
                              if (vehicle && vehicle.brand && vehicle.model) {
                                return `${vehicle.brand} ${vehicle.model}`;
                              }
                            }
                            if (booking.vehicle && typeof booking.vehicle === 'object') {
                              if (booking.vehicle?.brand && booking.vehicle?.model) {
                                return `${booking.vehicle?.brand} ${booking.vehicle?.model}`;
                              }
                              if (booking.vehicle?.id) {
                                const vehicle = vehicles.find(v => v.id === booking.vehicle?.id);
                                if (vehicle && vehicle.brand && vehicle.model) {
                                  return `${vehicle.brand} ${vehicle.model}`;
                                }
                              }
                              return `Vehicle assigned (ID: ${booking.vehicle?.id || 'Unknown'})`;
                            }
                            if (booking.vehicle_id) {
                              return 'Loading vehicle details...';
                            }
                            return 'No vehicle assigned';
                          })()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(() => {
                            if (booking.vehicle_id) {
                              const vehicle = vehicles.find(v => v.id === booking.vehicle_id);
                              return vehicle?.plate_number || 'No plate';
                            }
                            return booking.vehicle?.plate_number || 'No plate';
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            if (booking.vehicle_id) {
                              const vehicle = vehicles.find(v => v.id === booking.vehicle_id);
                              return vehicle?.category_name || vehicle?.pricing_category_vehicles?.[0]?.pricing_categories?.name || 'Not specified';
                            }
                            return booking.vehicle?.category_name || booking.vehicle?.pricing_category_vehicles?.[0]?.pricing_categories?.name || 'Not specified';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          {/* Available Drivers */}
          <div className="space-y-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Available Drivers ({filteredAndSortedDrivers.length})
              </h3>
              
              {/* Driver Sort Controls */}
              <div className="flex items-center gap-2">
                <Select value={driverSortBy} onValueChange={(value: "name" | "availability") => setDriverSortBy(value)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="availability">Availability</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDriverSortOrder(order => order === "asc" ? "desc" : "asc")}
                  className="h-8 w-8 p-0"
                >
                  {driverSortOrder === "asc" ? <SortAscIcon className="h-4 w-4" /> : <SortDescIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Driver Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {filteredAndSortedDrivers.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{driverSearch ? 'No drivers match your search' : 'No drivers available'}</p>
              </div>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {filteredAndSortedDrivers.map((driver) => (
                  <div 
                    key={driver.id}
                    className={cn(
                      "cursor-pointer transition-all border rounded-md p-4",
                      selectedDriver === driver.id 
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                        : "border-border hover:bg-accent/50"
                    )}
                    onClick={() => setSelectedDriver(driver.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={driver.profile_image_url || ""} />
                        <AvatarFallback>
                          {driver.first_name?.[0]}{driver.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {driver.first_name} {driver.last_name}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Available</p>
                      </div>
                      
                      {selectedDriver === driver.id && (
                        <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                          <CheckIcon className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Vehicles with Smart Matching */}
          <div className="space-y-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg flex items-center gap-2">
                <CarIcon className="h-5 w-5" />
                Vehicle Recommendations ({filteredAndSortedVehicles.length})
              </h3>
              
              {/* Vehicle Sort Controls */}
              <div className="flex items-center gap-2">
                <Select value={vehicleSortBy} onValueChange={(value: "name" | "match" | "plate") => setVehicleSortBy(value)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Match %</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="plate">Plate</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVehicleSortOrder(order => order === "asc" ? "desc" : "asc")}
                  className="h-8 w-8 p-0"
                >
                  {vehicleSortOrder === "asc" ? <SortAscIcon className="h-4 w-4" /> : <SortDescIcon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Vehicle Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {filteredAndSortedVehicles.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <CarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{vehicleSearch ? 'No vehicles match your search' : 'No vehicles available'}</p>
              </div>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {filteredAndSortedVehicles.map(({ vehicle, matchPercentage }) => (
                  <div 
                    key={vehicle.id}
                    className={cn(
                      "cursor-pointer transition-all border rounded-md p-4",
                      selectedVehicle === vehicle.id 
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                        : "border-border hover:bg-accent/50"
                    )}
                    onClick={() => setSelectedVehicle(vehicle.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                        {vehicle.image_url ? (
                          <img src={vehicle.image_url} alt="" className="h-8 w-8 object-cover rounded" />
                        ) : (
                          <CarIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">
                            {vehicle.plate_number}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              matchPercentage >= 90 ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" :
                              matchPercentage >= 70 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" :
                              matchPercentage >= 50 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300" :
                              "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
                            )}>
                              {matchPercentage}% match
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.category_name || vehicle.pricing_category_vehicles?.[0]?.pricing_categories?.name || 'Not specified'}
                          {vehicle.pricing_category_vehicles?.[0]?.pricing_categories?.sort_order && 
                            ` (Order: ${vehicle.pricing_category_vehicles[0].pricing_categories.sort_order})`
                          }
                        </p>
                        
                        {/* Assignment type display - show for all vehicles except current */}
                        {vehicle.id !== booking?.vehicle_id && (
                          <div className="mt-2">
                            {(() => {
                              const currentVehicle = vehicles.find(v => v.id === booking?.vehicle_id);
                              if (!currentVehicle) return null;
                              
                              const currentCategory = currentVehicle.pricing_category_vehicles?.[0]?.pricing_categories;
                              const newCategory = vehicle.pricing_category_vehicles?.[0]?.pricing_categories;
                              
                              if (!currentCategory || !newCategory) return null;
                              
                              if (newCategory.sort_order < currentCategory.sort_order) {
                                return (
                                  <div className="flex items-center gap-1 text-xs">
                                    <div className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full font-medium">
                                      ↑ UPGRADE
                                    </div>
                                  </div>
                                );
                              } else if (newCategory.sort_order > currentCategory.sort_order) {
                                return (
                                  <div className="flex items-center gap-1 text-xs">
                                    <div className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full font-medium">
                                      ↓ DOWNGRADE
                                    </div>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center gap-1 text-xs">
                                    <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                      ↔ UPDATE
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                      </div>
                      
                      {selectedVehicle === vehicle.id && (
                        <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full">
                          <CheckIcon className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          {/* Assignment type info */}
          {selectedVehicle && selectedVehicle !== booking?.vehicle_id && confirmationData && (
            <div className="text-sm text-muted-foreground">
              {confirmationData.assignmentType === 'upgrade' && (
                <span className="text-orange-600 dark:text-orange-400">
                  ↑ Upgrade: +¥{confirmationData.priceDifference.toLocaleString()} additional payment required
                </span>
              )}
              {confirmationData.assignmentType === 'downgrade' && (
                <span className="text-green-600 dark:text-green-400">
                  ↓ Downgrade: ¥{confirmationData.priceDifference.toLocaleString()} refund coupon will be generated
                </span>
              )}
              {confirmationData.assignmentType === 'update' && (
                <span className="text-blue-600 dark:text-blue-400">
                  ↔ Update: Same pricing category, no payment changes
                </span>
              )}
            </div>
          )}
          
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
              disabled={!selectedDriver || !selectedVehicle || isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
            <CheckIcon className="h-4 w-4 mr-2" />
                  {assignmentType === 'upgrade' ? 'Upgrade & Pay' : 
                   assignmentType === 'downgrade' ? 'Downgrade & Refund' : 
                   'Assign'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <DialogContent className="max-w-2xl relative fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-lg font-medium">Processing your request...</span>
                </div>
              </div>
            </div>
          )}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmationData?.assignmentType === 'upgrade' && (
                <>
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 dark:text-orange-400 text-lg">↑</span>
                  </div>
                  Vehicle Upgrade Confirmation
                </>
              )}
              {confirmationData?.assignmentType === 'downgrade' && (
                <>
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-lg">↓</span>
                  </div>
                  Vehicle Downgrade Confirmation
                </>
              )}
              {confirmationData?.assignmentType === 'update' && (
                <>
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-lg">↔</span>
                  </div>
                  Vehicle Update Confirmation
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Please review the assignment details and confirm your action.
            </DialogDescription>
          </DialogHeader>

          {confirmationData && (
            <div className="space-y-6">
              {/* Assignment Summary */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Driver</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {confirmationData.driver.first_name && confirmationData.driver.last_name 
                            ? `${confirmationData.driver.first_name} ${confirmationData.driver.last_name}`
                            : confirmationData.driver.name || 'Unknown Driver'
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {confirmationData.driver.email || 'Available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Vehicle</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <CarIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{confirmationData.vehicle.model}</p>
                        <p className="text-sm text-muted-foreground">
                          {confirmationData.vehicle.plate_number}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              {confirmationData.assignmentType !== 'update' && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">Pricing Breakdown</h4>
                  
                  {confirmationData.assignmentType === 'upgrade' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Current Vehicle Price</span>
                        <span className="text-sm">¥{confirmationData.vehicle.currentPrice?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">New Vehicle Price</span>
                        <span className="text-sm">¥{confirmationData.vehicle.newPrice?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-orange-600 dark:text-orange-400">Additional Payment Required</span>
                          <span className="font-medium text-orange-600 dark:text-orange-400">
                            +¥{confirmationData.paymentAmount?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {confirmationData.assignmentType === 'downgrade' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Current Vehicle Price</span>
                        <span className="text-sm">¥{confirmationData.vehicle.currentPrice?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">New Vehicle Price</span>
                        <span className="text-sm">¥{confirmationData.vehicle.newPrice?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-green-600 dark:text-green-400">Refund Amount</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            -¥{Math.abs((confirmationData.vehicle.newPrice || 0) - (confirmationData.vehicle.currentPrice || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Coupon Code</span>
                          <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {confirmationData.couponCode}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Skip Payment Option */}
              {(confirmationData.assignmentType === 'upgrade' || confirmationData.assignmentType === 'downgrade') && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="skipPayment"
                      checked={skipPayment}
                      onChange={(e) => setSkipPayment(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="skipPayment" className="text-sm font-medium">
                      Skip payment/coupon generation (assign only)
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check this to assign the vehicle without sending payment links or coupons
                  </p>
                </div>
              )}

              {/* BCC Email Option */}
              <div className="bg-muted/30 rounded-lg p-4">
                <label htmlFor="bccEmail" className="text-sm font-medium text-muted-foreground mb-2 block">
                  BCC Email (optional)
                </label>
                <input
                  type="email"
                  id="bccEmail"
                  value={bccEmail}
                  onChange={(e) => setBccEmail(e.target.value)}
                  placeholder="Enter email to BCC on notifications"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This email will receive copies of all notifications sent to the customer
                </p>
              </div>

              {/* Action Description */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">What happens next?</h4>
                {confirmationData.assignmentType === 'upgrade' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Vehicle and driver will be assigned immediately</li>
                    {!skipPayment && (
                      <>
                        <li>• Customer will receive a payment link for the additional amount</li>
                        <li>• Payment confirmation email will be sent to customer</li>
                        {bccEmail && <li>• BCC copy will be sent to {bccEmail}</li>}
                      </>
                    )}
                    <li>• Booking will be updated with new vehicle details</li>
                  </ul>
                )}
                {confirmationData.assignmentType === 'downgrade' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Vehicle and driver will be assigned immediately</li>
                    {!skipPayment && (
                      <>
                        <li>• Refund coupon will be generated and sent to customer</li>
                        <li>• Coupon can be used for future bookings</li>
                        {bccEmail && <li>• BCC copy will be sent to {bccEmail}</li>}
                      </>
                    )}
                    <li>• Booking will be updated with new vehicle details</li>
                  </ul>
                )}
                {confirmationData.assignmentType === 'update' && (
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Vehicle and driver will be assigned immediately</li>
                    <li>• No payment changes required</li>
                    <li>• Booking will be updated with new vehicle details</li>
                  </ul>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmationModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAssignment}
              disabled={isProcessing}
              className={
                confirmationData?.assignmentType === 'upgrade' ? 'bg-orange-600 hover:bg-orange-700' :
                confirmationData?.assignmentType === 'downgrade' ? 'bg-green-600 hover:bg-green-700' :
                'bg-blue-600 hover:bg-blue-700'
              }
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  {confirmationData?.assignmentType === 'upgrade' && 'Upgrade & Send Payment Link'}
                  {confirmationData?.assignmentType === 'downgrade' && 'Downgrade & Send Coupon'}
                  {confirmationData?.assignmentType === 'update' && 'Confirm Assignment'}
                </>
              )}
          </Button>
        </div>
      </DialogContent>
      </Dialog>

      {/* Progress Modal */}
      <LoadingModal
        open={progressOpen}
        onOpenChange={setProgressOpen}
        title={progressTitle}
        variant={progressVariant as 'default' | 'email' | 'approval' | 'rejection' | 'reminder' | 'invoice'}
        value={progressValue}
        label={progressLabel}
        steps={progressSteps}
        showSteps={true}
      />
    </Dialog>
  );
}
