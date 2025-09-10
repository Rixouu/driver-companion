"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
      
      if (currentVehicle && newVehicle) {
        const currentCategory = currentVehicle.pricing_category_vehicles?.[0]?.pricing_categories;
        const newCategory = newVehicle.pricing_category_vehicles?.[0]?.pricing_categories;
        
        if (currentCategory && newCategory) {
          if (newCategory.sort_order < currentCategory.sort_order) {
            setAssignmentType('upgrade');
          } else if (newCategory.sort_order > currentCategory.sort_order) {
            setAssignmentType('downgrade');
          } else {
            setAssignmentType('update');
          }
          
          // For now, we'll set a placeholder price difference
          // In a real implementation, you'd calculate this based on actual pricing
          const priceDiff = (newCategory.sort_order - currentCategory.sort_order) * 10000;
          setPriceDifference(priceDiff);
        }
      }
    } else {
      setAssignmentType('update');
      setPriceDifference(0);
    }
  }, [selectedVehicle, booking?.vehicle_id, vehicles]);

  // Enhanced vehicle matching logic based on service name and pricing categories
  const getVehicleMatches = () => {
    if (!booking?.service_name) {
      return vehicles.map(v => ({ vehicle: v, matchPercentage: 50 }));
    }
    
    const serviceName = booking.service_name.toLowerCase();
    
    return vehicles.map(vehicle => {
      let matchPercentage = 30; // base score
      
      // Perfect matches based on real data
      if (serviceName.includes('alphard executive lounge') && vehicle.model?.toLowerCase().includes('alphard executive lounge')) {
        matchPercentage = 100;
      } else if (serviceName.includes('alphard z') && vehicle.model?.toLowerCase().includes('alphard z')) {
        matchPercentage = 100;
      } else if (serviceName.includes('mercedes benz v class') && vehicle.model?.toLowerCase().includes('v-class')) {
        // Check if it's specifically Black Suite (perfect match)
        if (vehicle.model?.toLowerCase().includes('black suite')) {
          matchPercentage = 100;
        } else if (vehicle.model?.toLowerCase().includes('extra long')) {
          // V-class Extra Long is similar but not perfect - should be 95%
          matchPercentage = 95;
        } else {
          // Other V-class variants
          matchPercentage = 90;
        }
      } else if (serviceName.includes('v class') && vehicle.model?.toLowerCase().includes('v-class')) {
        if (vehicle.model?.toLowerCase().includes('black suite')) {
          matchPercentage = 95;
        } else if (vehicle.model?.toLowerCase().includes('extra long')) {
          matchPercentage = 90;
        } else {
          matchPercentage = 85;
        }
      } else if (serviceName.includes('black suite') && vehicle.model?.toLowerCase().includes('black suite')) {
        matchPercentage = 100;
      } else if (serviceName.includes('alphard') && vehicle.model?.toLowerCase().includes('alphard')) {
        matchPercentage = 90;
      } else if (serviceName.includes('mercedes') && vehicle.brand?.toLowerCase().includes('mercedes')) {
        matchPercentage = 85;
      } else if (serviceName.includes('toyota') && vehicle.brand?.toLowerCase().includes('toyota')) {
        matchPercentage = 85;
      }
      
      // Luxury service matching
      if (serviceName.includes('luxury') || serviceName.includes('premium') || serviceName.includes('executive')) {
        if (vehicle.model?.toLowerCase().includes('executive') || 
            vehicle.model?.toLowerCase().includes('v-class') ||
            vehicle.model?.toLowerCase().includes('black suite')) {
          matchPercentage = Math.max(matchPercentage, 90);
        }
      }
      
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
    if (selectedDriver && selectedVehicle) {
      setIsProcessing(true);
      try {
        // Call the new assignment API
        const response = await fetch(`/api/bookings/${booking?.id}/assign-vehicle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicleId: selectedVehicle,
            driverId: selectedDriver
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Handle different assignment types
          if (result.assignmentType === 'upgrade' && result.paymentRequired) {
            // Show upgrade payment dialog
            alert(`Vehicle upgraded! Additional payment of ¥${result.paymentAmount?.toLocaleString()} required. Payment link will be generated.`);
          } else if (result.assignmentType === 'downgrade' && result.couponGenerated) {
            // Show downgrade coupon dialog
            alert(`Vehicle downgraded! Coupon code ${result.couponCode} generated for ¥${result.refundAmount?.toLocaleString()} refund. Email sent to customer.`);
          } else {
            // Regular update
            alert('Vehicle assigned successfully!');
          }
          
          onAssign(selectedDriver, selectedVehicle);
          onClose();
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error assigning vehicle:', error);
        alert('Error assigning vehicle. Please try again.');
      } finally {
        setIsProcessing(false);
      }
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
              {booking.driver_id && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Current Driver</span>
                    </div>
                    {onUnassignDriver && (
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
                </div>
              )}
              {/* Current Vehicle */}
              {booking.vehicle_id && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Current Vehicle</span>
                    </div>
                    {onUnassignVehicle && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onUnassignVehicle}
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground h-7 px-2"
                      >
                        <Car className="h-3 w-3 mr-1" />
                        Unassign
                      </Button>
                    )}
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
              <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
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
              <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
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
                        </p>
                        
                        {/* Assignment type and pricing info */}
                        {selectedVehicle === vehicle.id && selectedVehicle !== booking?.vehicle_id && (
                          <div className="mt-2">
                            {assignmentType === 'upgrade' && (
                              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                                <span className="font-medium">↑ Upgrade</span>
                                {priceDifference > 0 && (
                                  <span>+¥{priceDifference.toLocaleString()}</span>
                                )}
                              </div>
                            )}
                            {assignmentType === 'downgrade' && (
                              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <span className="font-medium">↓ Downgrade</span>
                                {priceDifference < 0 && (
                                  <span>¥{Math.abs(priceDifference).toLocaleString()} refund</span>
                                )}
                              </div>
                            )}
                            {assignmentType === 'update' && (
                              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                <span className="font-medium">↔ Update</span>
                                <span>Same category</span>
                              </div>
                            )}
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
          {selectedVehicle && selectedVehicle !== booking?.vehicle_id && (
            <div className="text-sm text-muted-foreground">
              {assignmentType === 'upgrade' && (
                <span className="text-orange-600 dark:text-orange-400">
                  ↑ Upgrade: +¥{priceDifference.toLocaleString()} additional payment required
                </span>
              )}
              {assignmentType === 'downgrade' && (
                <span className="text-green-600 dark:text-green-400">
                  ↓ Downgrade: ¥{Math.abs(priceDifference).toLocaleString()} refund coupon will be generated
                </span>
              )}
              {assignmentType === 'update' && (
                <span className="text-blue-600 dark:text-blue-400">
                  ↔ Update: Same pricing category, no payment changes
                </span>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
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
    </Dialog>
  );
}
