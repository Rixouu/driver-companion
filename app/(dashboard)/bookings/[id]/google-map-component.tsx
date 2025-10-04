"use client";

import { GoogleMapsProvider } from '@/components/providers/google-maps-provider';

interface GoogleMapProps {
  pickupLocation: string;
  dropoffLocation: string;
}

export default function GoogleMap({ pickupLocation, dropoffLocation }: GoogleMapProps) {
  return (
    <GoogleMapsProvider>
      <div className="h-48 w-full rounded-lg border bg-muted/50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Map View</p>
          <p className="text-xs text-muted-foreground">
            {pickupLocation} → {dropoffLocation}
          </p>
        </div>
      </div>
    </GoogleMapsProvider>
  );
}
