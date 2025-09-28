"use client";

import { useState } from 'react';
import { DispatchEntryWithRelations } from '@/types/dispatch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPinIcon, CarIcon, UserIcon, ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils/styles';

interface FallbackMapProps {
  assignments: DispatchEntryWithRelations[];
  selectedAssignment?: DispatchEntryWithRelations | null;
  onAssignmentSelect?: (assignment: DispatchEntryWithRelations) => void;
  onVehicleSelect?: (vehicleId: string) => void;
  className?: string;
}

export default function FallbackMap({ 
  assignments, 
  selectedAssignment, 
  onAssignmentSelect,
  onVehicleSelect,
  className 
}: FallbackMapProps) {
  const [mapCenter, setMapCenter] = useState({ lat: 35.6762, lng: 139.6503 }); // Tokyo coordinates

  const handleAssignmentClick = (assignment: DispatchEntryWithRelations) => {
    if (onAssignmentSelect) {
      onAssignmentSelect(assignment);
    }
  };

  return (
    <div className={cn("relative bg-muted/20 border rounded-lg overflow-hidden", className)}>
      {/* Map Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <h3 className="font-semibold text-sm">Dispatch Map</h3>
          <p className="text-xs text-muted-foreground">{assignments.length} active assignments</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="bg-background/90 backdrop-blur-sm">
            <MapPinIcon className="h-4 w-4 mr-1" />
            Center
          </Button>
        </div>
      </div>

      {/* Fallback Map Area */}
      <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 relative">
        {/* Grid pattern to simulate map */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-grid-pattern" />
        </div>

        {/* Assignment Markers */}
        {assignments.map((assignment, index) => {
          if (!assignment.booking?.pickup_location) return null;
          
          // Generate consistent coordinates based on address hash for better positioning
          const addressHash = assignment.booking.pickup_location.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);
          
          // Use hash to create more consistent positioning
          const lat = mapCenter.lat + (Math.sin(addressHash) * 0.05);
          const lng = mapCenter.lng + (Math.cos(addressHash) * 0.05);
          
          return (
            <div
              key={assignment.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              onClick={() => handleAssignmentClick(assignment)}
            >
              {/* Marker */}
              <div className={cn(
                "w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110",
                assignment.status === 'pending' && "bg-yellow-500",
                assignment.status === 'assigned' && "bg-blue-500", 
                assignment.status === 'confirmed' && "bg-green-500",
                assignment.status === 'completed' && "bg-gray-500",
                assignment.status === 'cancelled' && "bg-red-500",
                selectedAssignment?.id === assignment.id && "ring-4 ring-primary/30"
              )}>
                <span className="text-white text-xs font-bold">
                  {assignment.booking?.wp_id?.charAt(0) || '#'}
                </span>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <Card className="p-2 shadow-lg min-w-[200px]">
                  <CardContent className="p-0">
                    <div className="space-y-1">
                      <div className="font-semibold text-xs">
                        #{assignment.booking?.wp_id || assignment.booking?.id?.substring(0, 8)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {assignment.booking?.customer_name || "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {assignment.booking?.service_name || "Service"}
                      </div>
                      {assignment.booking?.pickup_location && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" />
                          {assignment.booking.pickup_location}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        {assignment.driver_id && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            <UserIcon className="h-3 w-3 mr-1" />
                            Driver
                          </Badge>
                        )}
                        {assignment.vehicle_id && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            <CarIcon className="h-3 w-3 mr-1" />
                            Vehicle
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
          <div className="text-xs font-semibold mb-2">Status Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Assigned</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Confirmed</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Cancelled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
