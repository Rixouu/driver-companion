"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, UserIcon, CarIcon, SearchIcon, SortAscIcon, SortDescIcon } from 'lucide-react';
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
    }
  }, [isOpen, booking]);

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

  const handleAssign = () => {
    if (selectedDriver && selectedVehicle) {
      onAssign(selectedDriver, selectedVehicle);
      onClose();
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
          <div className="mb-6 p-4 bg-muted/50 border rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <CheckIcon className="h-4 w-4" />
              Current Assignment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Driver */}
              <div className="flex items-center gap-3 p-3 bg-background rounded-md border">
                <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Current Driver</p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      // First try to get driver from the drivers array if we have driver_id
                      if (booking.driver_id) {
                        const driver = drivers.find(d => d.id === booking.driver_id);
                        if (driver && driver.first_name && driver.last_name) {
                          return `${driver.first_name} ${driver.last_name}`;
                        }
                      }
                      
                      // Fallback to booking.driver object
                      if (booking.driver && typeof booking.driver === 'object') {
                        if (booking.driver.first_name && booking.driver.last_name) {
                          return `${booking.driver.first_name} ${booking.driver.last_name}`;
                        }
                        return `Driver assigned (ID: ${booking.driver.id || 'Unknown'})`;
                      }
                      
                      // Final fallback
                      if (booking.driver_id) {
                        return 'Loading driver details...';
                      }
                      
                      return 'No driver assigned';
                    })()}
                  </p>
                </div>
              </div>
              {/* Current Vehicle */}
              <div className="flex items-center gap-3 p-3 bg-background rounded-md border">
                <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                  <CarIcon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Current Vehicle</p>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      // First try to get vehicle from the vehicles array if we have vehicle_id
                      if (booking.vehicle_id) {
                        const vehicle = vehicles.find(v => v.id === booking.vehicle_id);
                        if (vehicle && vehicle.brand && vehicle.model) {
                          return `${vehicle.brand} ${vehicle.model} (${vehicle.plate_number})`;
                        }
                      }
                      
                      // Fallback to booking.vehicle object
                      if (booking.vehicle && typeof booking.vehicle === 'object') {
                        if (booking.vehicle?.brand && booking.vehicle?.model) {
                          const plate = booking.vehicle.plate_number ? ` (${booking.vehicle.plate_number})` : '';
                          return `${booking.vehicle?.brand} ${booking.vehicle?.model}${plate}`;
                        }
                        // If we have an ID but no brand/model, try to find it in vehicles array
                        if (booking.vehicle?.id) {
                          const vehicle = vehicles.find(v => v.id === booking.vehicle?.id);
                          if (vehicle && vehicle.brand && vehicle.model) {
                            return `${vehicle.brand} ${vehicle.model} (${vehicle.plate_number})`;
                          }
                        }
                        return `Vehicle assigned (ID: ${booking.vehicle?.id || 'Unknown'})`;
                      }
                      
                      // Final fallback
                      if (booking.vehicle_id) {
                        return 'Loading vehicle details...';
                      }
                      
                      return 'No vehicle assigned';
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Drivers */}
          <div className="space-y-4">
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
              <div className="space-y-2 max-h-60 overflow-y-auto">
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
          <div className="space-y-4">
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
              <div className="space-y-2 max-h-60 overflow-y-auto">
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

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedDriver || !selectedVehicle}
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            Assign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
