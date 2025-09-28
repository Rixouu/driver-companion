"use client";

import { useState, useEffect } from "react";
import { DispatchEntryWithRelations } from "@/types/dispatch";
import { cn } from "@/lib/utils/styles";
import GoogleMaps from "./google-maps";
import FallbackMap from "./fallback-map";

interface DispatchMapProps {
  assignments: DispatchEntryWithRelations[];
  selectedAssignment?: DispatchEntryWithRelations | null;
  onAssignmentSelect?: (assignment: DispatchEntryWithRelations) => void;
  onVehicleSelect?: (vehicleId: string) => void;
  className?: string;
}

export default function DispatchMap({ 
  assignments, 
  selectedAssignment, 
  onAssignmentSelect,
  onVehicleSelect,
  className 
}: DispatchMapProps) {
  const [hasGoogleMapsKey, setHasGoogleMapsKey] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check if we have Google Maps API key and we're on client side
  useEffect(() => {
    setIsClient(true);
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    setHasGoogleMapsKey(!!apiKey);
  }, []);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className={cn("relative bg-muted/20 border rounded-lg overflow-hidden", className)}>
        <div className="w-full h-full min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }

  // Use Google Maps if API key is available, otherwise fallback to mock map
  if (hasGoogleMapsKey) {
    return (
      <GoogleMaps
        assignments={assignments}
        selectedAssignment={selectedAssignment}
        onAssignmentSelect={onAssignmentSelect}
        onVehicleSelect={onVehicleSelect}
        className={className}
      />
    );
  }

  // Fallback to mock map when Google Maps API key is not available
  return (
    <FallbackMap
      assignments={assignments}
      selectedAssignment={selectedAssignment}
      onAssignmentSelect={onAssignmentSelect}
      onVehicleSelect={onVehicleSelect}
      className={className}
    />
  );
}
