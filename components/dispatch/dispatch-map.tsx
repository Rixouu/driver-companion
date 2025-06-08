"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CarIcon,
  UserIcon,
  NavigationIcon,
  RefreshCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MapPinIcon,
  RouteIcon,
  EyeIcon,
  EyeOffIcon
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils/styles';
import { 
  DispatchEntryWithRelations, 
  VehicleTracking, 
  MapViewport, 
  MapSettings,
  DispatchStatus 
} from '@/types/dispatch';
import { useRealTimeTracking } from '@/lib/hooks/use-real-time-tracking';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

// Default map center (Tokyo)
const defaultCenter = {
  lat: 35.6762,
  lng: 139.6503
};

// Google Maps libraries to load
const libraries: Array<"places" | "geometry" | "drawing"> = ["places", "geometry"];

interface DispatchMapProps {
  assignments: DispatchEntryWithRelations[];
  selectedAssignment?: DispatchEntryWithRelations | null;
  onAssignmentSelect: (assignment: DispatchEntryWithRelations) => void;
  onVehicleSelect: (vehicleId: string) => void;
  className?: string;
}

interface MarkerData {
  id: string;
  position: google.maps.LatLngLiteral;
  type: 'vehicle' | 'pickup' | 'dropoff';
  data: any;
  status?: DispatchStatus;
}

export default function DispatchMap({ 
  assignments,
  selectedAssignment,
  onAssignmentSelect, 
  onVehicleSelect,
  className 
}: DispatchMapProps) {
  const { t } = useI18n();
  
  // Map state
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [viewport, setViewport] = useState<MapViewport>({
    latitude: defaultCenter.lat,
    longitude: defaultCenter.lng,
    zoom: 11
  });
  
  // Settings state
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    map_type: 'roadmap',
    show_traffic: true,
    show_vehicle_icons: true,
    show_routes: true,
    auto_center: true,
    refresh_interval: 30
  });
  
  // UI state
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<google.maps.DirectionsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref to track current route request to prevent race conditions
  const currentRouteRequest = useRef<string | null>(null);
  
  // Real-time tracking
  const { 
    vehicleLocations, 
    isTracking, 
    startTracking, 
    stopTracking,
    getVehicleTracking 
  } = useRealTimeTracking();

  // Create markers for vehicles, pickups, and dropoffs
  const markers = useMemo(() => {
    const markerData: MarkerData[] = [];

    // Add vehicle markers
    if (mapSettings.show_vehicle_icons) {
      vehicleLocations.forEach(location => {
        if (location.vehicle_id && location.latitude && location.longitude) {
          markerData.push({
            id: `vehicle-${location.vehicle_id}`,
            position: { lat: location.latitude, lng: location.longitude },
            type: 'vehicle',
            data: location
          });
        }
      });
    }

    // Location markers are disabled because `pickup_location` and `dropoff_location` 
    // are string addresses and require geocoding to be displayed on the map.
    // The previous implementation incorrectly assumed lat/lng objects were available.
    
    // assignments.forEach(assignment => {
    //   if (assignment.pickup_location) {
    //     markerData.push({
    //       id: `pickup-${assignment.id}`,
    //       position: { 
    //         lat: assignment.pickup_location.lat, 
    //         lng: assignment.pickup_location.lng 
    //       },
    //       type: 'pickup',
    //       data: assignment,
    //       status: assignment.status
    //     });
    //   }

    //   if (assignment.dropoff_location) {
    //     markerData.push({
    //       id: `dropoff-${assignment.id}`,
    //       position: { 
    //         lat: assignment.dropoff_location.lat, 
    //         lng: assignment.dropoff_location.lng 
    //       },
    //       type: 'dropoff',
    //       data: assignment,
    //       status: assignment.status
    //     });
    //   }
    // });

    return markerData;
  }, [vehicleLocations, assignments, mapSettings.show_vehicle_icons]);

  // Get marker icon based on type and status
  const getMarkerIcon = (marker: MarkerData): google.maps.Icon | string => {
    const baseUrl = '/img/map-markers/';
    
    switch (marker.type) {
      case 'vehicle':
        return {
          url: `${baseUrl}vehicle-marker.png`,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        };
      case 'pickup':
        const pickupColor = marker.status === 'completed' ? 'green' : 
                           marker.status === 'en_route' ? 'blue' : 'orange';
        return {
          url: `${baseUrl}pickup-${pickupColor}.png`,
          scaledSize: new google.maps.Size(28, 28),
          anchor: new google.maps.Point(14, 28)
        };
      case 'dropoff':
        const dropoffColor = marker.status === 'completed' ? 'green' : 
                             marker.status === 'en_route' ? 'blue' : 'red';
        return {
          url: `${baseUrl}dropoff-${dropoffColor}.png`,
          scaledSize: new google.maps.Size(28, 28),
          anchor: new google.maps.Point(14, 28)
        };
      default:
        return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    }
  };

  // Handle marker click
  const handleMarkerClick = (marker: MarkerData) => {
    setSelectedMarker(marker);
    
    if (marker.type === 'vehicle' && marker.data.vehicle_id) {
      onVehicleSelect(marker.data.vehicle_id);
    } else if ((marker.type === 'pickup' || marker.type === 'dropoff') && marker.data) {
      // Show route for this assignment instead of navigating
      showRoute(marker.data);
    }
  };

  // This will be moved after showRoute definition

  // Show route between pickup and dropoff with smooth animation
  const showRoute = useCallback(async (assignment: DispatchEntryWithRelations) => {
    if (!map || !assignment.booking?.pickup_location || !assignment.booking?.dropoff_location) return;

    // Create unique request ID to prevent race conditions
    const requestId = assignment.id;
    currentRouteRequest.current = requestId;

    setIsLoading(true);
    
    // Clear any existing route immediately to prevent flickering
    setSelectedRoute(null);
    
    try {
      const directionsService = new google.maps.DirectionsService();
      
      const result = await directionsService.route({
        origin: assignment.booking.pickup_location,
        destination: assignment.booking.dropoff_location,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false,
        optimizeWaypoints: true
      });

      // Only set the route if this is still the current request
      if (currentRouteRequest.current === requestId) {
        setSelectedRoute(result);
        
        // Small delay before fitting bounds to ensure route is rendered
        requestAnimationFrame(() => {
          if (currentRouteRequest.current === requestId && result.routes[0]?.bounds) {
            map.fitBounds(result.routes[0].bounds, {
              top: 50,
              right: 50,
              bottom: 50,
              left: 50
            });
          }
        });
        
        // Show success message
        toast({
          title: "Route Displayed",
          description: `Route from ${assignment.booking.pickup_location} to ${assignment.booking.dropoff_location}`,
        });
      }

    } catch (error) {
      console.error('Error calculating route:', error);
      if (currentRouteRequest.current === requestId) {
        toast({
          title: "Route Error",
          description: "Unable to calculate route between the specified locations",
          variant: "destructive",
        });
      }
    } finally {
      if (currentRouteRequest.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [map]);

  // Handle assignment selection from sidebar
  useEffect(() => {
    if (selectedAssignment && selectedAssignment.booking?.pickup_location && selectedAssignment.booking?.dropoff_location) {
      // Show route for the selected assignment
      showRoute(selectedAssignment);
    } else if (selectedAssignment && (!selectedAssignment.booking?.pickup_location || !selectedAssignment.booking?.dropoff_location)) {
      // Clear route if assignment doesn't have valid locations
      setSelectedRoute(null);
      toast({
        title: "Route Unavailable", 
        description: "This booking doesn't have pickup and dropoff locations specified",
        variant: "destructive",
      });
    } else if (!selectedAssignment) {
      // Clear route when no assignment is selected
      setSelectedRoute(null);
    }
  }, [selectedAssignment, showRoute]);

  // Auto-center map to show all markers
  const centerMapToMarkers = useCallback(() => {
    if (!map || markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => {
      bounds.extend(marker.position);
    });

    map.fitBounds(bounds);
  }, [map, markers]);

  // Handle map load
  const onMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  // Start/stop tracking
  useEffect(() => {
    if (mapSettings.auto_center) {
      startTracking();
    } else {
      stopTracking();
    }
  }, [mapSettings.auto_center, startTracking, stopTracking]);

  // Auto-center when markers change
  useEffect(() => {
    if (mapSettings.auto_center) {
      centerMapToMarkers();
    }
  }, [markers, mapSettings.auto_center, centerMapToMarkers]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/10">
        <div className="text-center">
          <MapPinIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Google Maps API Key Required</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Please add your Google Maps API key to the environment variables to enable map functionality.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/10">
        <div className="text-center text-red-500">
          <MapPinIcon className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Map</h3>
          <p className="text-sm">Could not load Google Maps scripts.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div>Loading Map...</div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full", className)}>
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="border-2 border-primary/20 rounded-lg p-2 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={centerMapToMarkers}
              disabled={markers.length === 0}
              className="bg-background/90 backdrop-blur-sm border-primary/30"
            >
              <NavigationIcon className="h-4 w-4" />
            </Button>
            
            <Select
              value={mapSettings.map_type}
              onValueChange={(value) => 
                setMapSettings(prev => ({ ...prev, map_type: value as any }))
              }
            >
              <SelectTrigger className="w-24 bg-background/90 backdrop-blur-sm border-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roadmap">Road</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-2 border-primary/20 rounded-lg p-3 backdrop-blur-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="traffic" className="text-sm font-medium text-foreground dark:text-foreground">{t('dispatch.mapView.traffic')}</Label>
              <Switch
                id="traffic"
                checked={mapSettings.show_traffic}
                onCheckedChange={(checked) =>
                  setMapSettings(prev => ({ ...prev, show_traffic: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="vehicles" className="text-sm font-medium text-foreground dark:text-foreground">{t('dispatch.mapView.vehicles')}</Label>
              <Switch
                id="vehicles"
                checked={mapSettings.show_vehicle_icons}
                onCheckedChange={(checked) =>
                  setMapSettings(prev => ({ ...prev, show_vehicle_icons: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="routes" className="text-sm font-medium text-foreground dark:text-foreground">{t('dispatch.mapView.routes')}</Label>
              <Switch
                id="routes"
                checked={mapSettings.show_routes}
                onCheckedChange={(checked) =>
                  setMapSettings(prev => ({ ...prev, show_routes: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-center" className="text-sm font-medium text-foreground dark:text-foreground">{t('dispatch.mapView.autoCenter')}</Label>
              <Switch
                id="auto-center"
                checked={mapSettings.auto_center}
                onCheckedChange={(checked) =>
                  setMapSettings(prev => ({ ...prev, auto_center: checked }))
                }
              />
            </div>
          </div>
        </div>

        {/* Route Controls */}
        {selectedRoute && (
          <div className="border-2 border-primary/20 rounded-lg p-2 backdrop-blur-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                currentRouteRequest.current = null;
                setSelectedRoute(null);
                toast({
                  title: "Route Cleared",
                  description: "Route has been removed from the map",
                });
              }}
              className="bg-background/90 backdrop-blur-sm border-primary/30 text-foreground"
            >
              <EyeOffIcon className="h-4 w-4 mr-1" />
              Clear Route
            </Button>
          </div>
        )}
      </div>

      {/* Map Status */}
      <div className="absolute top-4 right-4 z-10">
        <div className="border-2 border-primary/20 rounded-lg p-2 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isTracking ? "bg-green-500" : "bg-gray-400"
            )} />
            <span>{isTracking ? t('dispatch.mapView.liveTracking') : t('dispatch.mapView.offline')}</span>
            <Badge variant="outline" className="bg-background/90 backdrop-blur-sm border-primary/30">
              {markers.filter(m => m.type === 'vehicle').length} vehicles
            </Badge>
          </div>
        </div>
      </div>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={{ lat: viewport.latitude, lng: viewport.longitude }}
        zoom={viewport.zoom}
        mapTypeId={mapSettings.map_type}
        onLoad={onMapLoad}
        options={{
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          disableDefaultUI: false
        }}
      >
        {/* Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={getMarkerIcon(marker)}
            onClick={() => handleMarkerClick(marker)}
          />
        ))}

        {/* Info Window */}
        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 min-w-[200px]">
              {selectedMarker.type === 'vehicle' ? (
                <div>
                  <h3 className="font-medium">Vehicle</h3>
                  <p className="text-sm text-gray-600">
                    Last update: {new Date(selectedMarker.data.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-sm">
                    Speed: {selectedMarker.data.speed || 0} km/h
                  </p>
                  {selectedMarker.data.battery_level && (
                    <p className="text-sm">
                      Battery: {selectedMarker.data.battery_level}%
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="font-medium">
                    {selectedMarker.type === 'pickup' ? 'Pickup' : 'Dropoff'}
                  </h3>
                  <p className="text-sm">
                    {selectedMarker.data.booking?.customer_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedMarker.data.booking?.date} {selectedMarker.data.booking?.time}
                  </p>
                  <Badge className="mt-1" variant="outline">
                    {selectedMarker.status}
                  </Badge>
                  {mapSettings.show_routes && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => showRoute(selectedMarker.data)}
                      disabled={isLoading}
                    >
                      <RouteIcon className="h-3 w-3 mr-1" />
                      {isLoading ? 'Loading...' : 'Show Route'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </InfoWindow>
        )}

        {/* Route Display */}
        {selectedRoute && mapSettings.show_routes && (
          <DirectionsRenderer
            directions={selectedRoute}
            options={{
              suppressMarkers: false,
              suppressInfoWindows: false,
              draggable: false,
              polylineOptions: {
                strokeColor: '#3b82f6',
                strokeWeight: 5,
                strokeOpacity: 0.8,
                geodesic: true
              },
              markerOptions: {
                draggable: false,
                clickable: true
              }
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
} 