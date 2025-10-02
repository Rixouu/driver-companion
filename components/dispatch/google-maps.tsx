"use client";

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { DispatchEntryWithRelations } from '@/types/dispatch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPinIcon, CarIcon, UserIcon, ClockIcon } from 'lucide-react';
import { cn, getDispatchStatusBadgeClasses, getDispatchStatusDotColor } from '@/lib/utils/styles';
import { format } from 'date-fns';
import { useTheme } from 'next-themes';

interface GoogleMapsProps {
  assignments: DispatchEntryWithRelations[];
  selectedAssignment?: DispatchEntryWithRelations | null;
  onAssignmentSelect?: (assignment: DispatchEntryWithRelations) => void;
  onVehicleSelect?: (vehicleId: string) => void;
  className?: string;
}

export default function GoogleMaps({ 
  assignments, 
  selectedAssignment, 
  onAssignmentSelect,
  onVehicleSelect,
  className 
}: GoogleMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Map control states
  const [showTraffic, setShowTraffic] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true); // Enable routes by default
  const [autoCenter, setAutoCenter] = useState(false);
  const [mapType, setMapType] = useState('road');

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('Google Maps API key not found');
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        const google = await loader.load();

        if (!mapRef.current) return;

        // Get theme-appropriate map styles
        const isDark = theme === 'dark';
        const mapStyles = isDark ? [
          { elementType: "geometry", stylers: [{ color: "#212121" }] },
          { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
          {
            featureType: "administrative",
            elementType: "geometry",
            stylers: [{ color: "#757575" }]
          },
          {
            featureType: "administrative.country",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }]
          },
          {
            featureType: "administrative.land_parcel",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#bdbdbd" }]
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }]
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#181818" }]
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#616161" }]
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#1b1b1b" }]
          },
          {
            featureType: "road",
            elementType: "geometry.fill",
            stylers: [{ color: "#2c2c2c" }]
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#8a8a8a" }]
          },
          {
            featureType: "road.arterial",
            elementType: "geometry",
            stylers: [{ color: "#373737" }]
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#3c3c3c" }]
          },
          {
            featureType: "road.highway.controlled_access",
            elementType: "geometry",
            stylers: [{ color: "#4e4e4e" }]
          },
          {
            featureType: "road.local",
            elementType: "labels.text.fill",
            stylers: [{ color: "#616161" }]
          },
          {
            featureType: "transit",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#000000" }]
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#3d3d3d" }]
          }
        ] : [
          { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
          { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
          {
            featureType: "administrative.land_parcel",
            elementType: "labels.text.fill",
            stylers: [{ color: "#bdbdbd" }]
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#eeeeee" }]
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }]
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#e5e5e5" }]
          },
          {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }]
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "road.arterial",
            elementType: "labels.text.fill",
            stylers: [{ color: "#757575" }]
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#dadada" }]
          },
          {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#616161" }]
          },
          {
            featureType: "road.local",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }]
          },
          {
            featureType: "transit.line",
            elementType: "geometry",
            stylers: [{ color: "#e5e5e5" }]
          },
          {
            featureType: "transit.station",
            elementType: "geometry",
            stylers: [{ color: "#eeeeee" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#c9c9c9" }]
          },
          {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9e9e9e" }]
          }
        ];

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 35.5494, lng: 139.7798 }, // Haneda Airport coordinates
          zoom: 13, // Wider view - less zoom
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: mapStyles,
          disableDefaultUI: true, // Disable ALL default controls
          zoomControl: false,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          keyboardShortcuts: false,
          gestureHandling: 'cooperative',
          clickableIcons: false // Disable clickable icons that might overlap
        });

        setMap(mapInstance);
        
        // Initialize directions renderer
        const directionsService = new google.maps.DirectionsService();
        const directionsRendererInstance = new google.maps.DirectionsRenderer({
          draggable: false,
          suppressMarkers: true, // We'll use our custom markers
          polylineOptions: {
            strokeColor: '#3b82f6',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });
        directionsRendererInstance.setMap(mapInstance);
        setDirectionsRenderer(directionsRendererInstance);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load map. Please check your API key.');
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  // Geocode addresses to get coordinates
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address });
      
      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        console.log('Geocoded address:', address, 'to coordinates:', location.lat(), location.lng());
        return {
          lat: location.lat(),
          lng: location.lng()
        };
      }
    } catch (error) {
      console.error('Geocoding failed for address:', address, error);
    }
    
    // Return null if geocoding fails - no mock data
    console.warn('Geocoding failed for address:', address, '- skipping marker');
    return null;
  };

  // Display route for selected assignment
  const displayRoute = async (assignment: DispatchEntryWithRelations) => {
    if (!map || !directionsRenderer || !assignment.booking) return;

    const pickupLocation = assignment.booking.pickup_location;
    const dropoffLocation = assignment.booking.dropoff_location;

    // Always clear existing route first
    directionsRenderer.setDirections({ routes: [] } as any);

    // Don't show routes if toggle is off
    if (!showRoutes) {
      return;
    }

    if (!pickupLocation || !dropoffLocation) {
      console.warn('Missing pickup or dropoff location for route display');
      return;
    }

    try {
      const directionsService = new google.maps.DirectionsService();
      const result = await directionsService.route({
        origin: pickupLocation,
        destination: dropoffLocation,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      });

      directionsRenderer.setDirections(result);
      console.log('Route displayed successfully for:', pickupLocation, 'to', dropoffLocation);
    } catch (error) {
      console.error('Failed to display route:', error);
    }
  };

  // Create markers for assignments
  useEffect(() => {
    if (!map || !assignments.length) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Process assignments and create markers
    const processAssignments = async () => {
      for (const assignment of assignments) {
        if (!assignment.booking?.pickup_location) {
          console.warn('No pickup location for assignment:', assignment.id);
          continue;
        }

        // Geocode the pickup location
        const coordinates = await geocodeAddress(assignment.booking.pickup_location);
        if (!coordinates) {
          console.warn('Failed to geocode pickup location for assignment:', assignment.id);
          continue;
        }

        const marker = new google.maps.Marker({
          position: coordinates,
          map,
          title: `#${assignment.booking?.wp_id || assignment.booking?.id?.substring(0, 8)}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: getDispatchStatusDotColor(assignment.status),
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            strokeOpacity: 1
          },
          animation: google.maps.Animation.DROP,
          zIndex: 1000
        });

        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: createInfoWindowContent(assignment)
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          if (onAssignmentSelect) {
            onAssignmentSelect(assignment);
          }
          // Display route for this assignment
          console.log('Marker clicked, displaying route for assignment:', assignment.id);
          displayRoute(assignment);
        });

        newMarkers.push(marker);
      }

      setMarkers(newMarkers);

      // Only fit bounds if there are multiple markers, otherwise keep current zoom
      if (newMarkers.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        newMarkers.forEach(marker => {
          const position = marker.getPosition();
          if (position) bounds.extend(position);
        });
        map.fitBounds(bounds);
      }
    };

    processAssignments();
  }, [map, assignments, onAssignmentSelect]);

  // Handle selected assignment changes (from sidebar clicks)
  useEffect(() => {
    if (selectedAssignment && map && directionsRenderer) {
      console.log('Selected assignment changed, displaying route for:', selectedAssignment.booking?.pickup_location, 'to', selectedAssignment.booking?.dropoff_location);
      displayRoute(selectedAssignment);
    }
  }, [selectedAssignment, map, directionsRenderer]);

  // Handle traffic layer toggle
  useEffect(() => {
    if (!map) return;
    
    const trafficLayer = new google.maps.TrafficLayer();
    if (showTraffic) {
      trafficLayer.setMap(map);
    } else {
      trafficLayer.setMap(null);
    }
    
    return () => {
      trafficLayer.setMap(null);
    };
  }, [map, showTraffic]);

  // Handle map type changes
  useEffect(() => {
    if (!map) return;
    
    const mapTypeId = mapType === 'satellite' ? google.maps.MapTypeId.SATELLITE : 
                     mapType === 'terrain' ? google.maps.MapTypeId.TERRAIN : 
                     google.maps.MapTypeId.ROADMAP;
    
    map.setMapTypeId(mapTypeId);
  }, [map, mapType]);


  // Handle routes visibility
  useEffect(() => {
    if (!directionsRenderer) return;
    
    if (showRoutes) {
      // Routes are already displayed when selectedAssignment changes
      if (selectedAssignment) {
        displayRoute(selectedAssignment);
      }
    } else {
      // Clear routes when toggle is off
      directionsRenderer.setDirections({ routes: [] } as any);
    }
  }, [showRoutes, directionsRenderer, selectedAssignment]);

  // Handle auto center functionality
  useEffect(() => {
    if (!map || !autoCenter) return;
    
    if (selectedAssignment && selectedAssignment.booking?.pickup_location) {
      // Center map on selected assignment
      geocodeAddress(selectedAssignment.booking.pickup_location).then(coordinates => {
        if (coordinates) {
          map.setCenter(coordinates);
          map.setZoom(8);
        }
      });
    }
  }, [autoCenter, selectedAssignment, map]);

  // Update map styles when theme changes
  useEffect(() => {
    if (!map) return;
    
    const isDark = theme === 'dark';
    const mapStyles = isDark ? [
      { elementType: "geometry", stylers: [{ color: "#212121" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
      {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [{ color: "#757575" }]
      },
      {
        featureType: "administrative.country",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }]
      },
      {
        featureType: "administrative.land_parcel",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#bdbdbd" }]
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#757575" }]
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#181818" }]
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#616161" }]
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#1b1b1b" }]
      },
      {
        featureType: "road",
        elementType: "geometry.fill",
        stylers: [{ color: "#2c2c2c" }]
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#8a8a8a" }]
      },
      {
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [{ color: "#373737" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#3c3c3c" }]
      },
      {
        featureType: "road.highway.controlled_access",
        elementType: "geometry",
        stylers: [{ color: "#4e4e4e" }]
      },
      {
        featureType: "road.local",
        elementType: "labels.text.fill",
        stylers: [{ color: "#616161" }]
      },
      {
        featureType: "transit",
        elementType: "labels.text.fill",
        stylers: [{ color: "#757575" }]
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#000000" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#3d3d3d" }]
      }
    ] : [
      { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
      {
        featureType: "administrative.land_parcel",
        elementType: "labels.text.fill",
        stylers: [{ color: "#bdbdbd" }]
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#eeeeee" }]
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#757575" }]
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#e5e5e5" }]
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }]
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#ffffff" }]
      },
      {
        featureType: "road.arterial",
        elementType: "labels.text.fill",
        stylers: [{ color: "#757575" }]
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#dadada" }]
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#616161" }]
      },
      {
        featureType: "road.local",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }]
      },
      {
        featureType: "transit.line",
        elementType: "geometry",
        stylers: [{ color: "#e5e5e5" }]
      },
      {
        featureType: "transit.station",
        elementType: "geometry",
        stylers: [{ color: "#eeeeee" }]
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#c9c9c9" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9e9e9e" }]
      }
    ];
    
    map.setOptions({ styles: mapStyles });
  }, [map, theme]);


  const createInfoWindowContent = (assignment: DispatchEntryWithRelations): string => {
    const booking = assignment.booking;
    if (!booking) return '';

    // Get status color for the card border
    const statusColor = getDispatchStatusDotColor(assignment.status);
    
    return `
      <div class="p-4 min-w-[240px] bg-background border border-border rounded-lg shadow-xl" style="border-left: 4px solid ${statusColor};">
        <div class="flex items-center justify-between mb-3">
          <div class="font-semibold text-sm text-foreground">
            #${booking.wp_id || booking.id?.substring(0, 8)}
          </div>
          <div class="px-2 py-1 rounded-full text-xs font-medium ${getDispatchStatusBadgeClasses(assignment.status)}">
            ${assignment.status.replace('_', ' ')}
          </div>
        </div>
        <div class="text-sm text-foreground mb-1 font-medium">
          ${booking.customer_name || 'Unknown Customer'}
        </div>
        <div class="text-xs text-muted-foreground mb-3">
          ${booking.service_name || 'Service'}
        </div>
        ${booking.pickup_location ? `
          <div class="text-xs text-muted-foreground flex items-start gap-2 mb-3">
            <svg class="w-3 h-3 mt-0.5 flex-shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
            <span>${booking.pickup_location}</span>
          </div>
        ` : ''}
        <div class="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          ${assignment.driver_id ? `
            <span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40">
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Driver
            </span>
          ` : ''}
          ${assignment.vehicle_id ? `
            <span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-500/10 text-green-700 border border-green-500/20 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40">
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              </svg>
              Vehicle
            </span>
          ` : ''}
        </div>
      </div>
    `;
  };


  if (error) {
    return (
      <div className={cn("relative bg-muted/20 border rounded-lg overflow-hidden", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <MapPinIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative bg-muted/20 border rounded-lg overflow-hidden", className)}>
      {/* Map Header - Match reference exactly */}
      <div className="absolute top-4 left-4 z-50 pointer-events-none">
        <div className="bg-black dark:bg-black bg-white rounded-lg px-3 py-2 shadow-lg pointer-events-auto">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white text-black">Dispatch Map</h3>
          <p className="text-xs text-gray-600 dark:text-white/80 text-black">{assignments.length} active assignments</p>
        </div>
      </div>

      {/* Map Controls - EXACTLY like the reference */}
      <div className="absolute top-4 right-4 z-30 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Live Tracking Indicator */}
          <div className="bg-white dark:bg-black rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Live Tracking</span>
              <span className="text-xs text-gray-600 dark:text-white/80">0 vehicles</span>
            </div>
          </div>

          {/* Map Type Control */}
          <div className="bg-white dark:bg-black rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 text-gray-600 dark:text-white/80">✈️</div>
              <select 
                className="text-sm bg-transparent border-none outline-none text-gray-900 dark:text-white"
                value={mapType}
                onChange={(e) => setMapType(e.target.value)}
                title="Map Type"
                aria-label="Map Type"
              >
                <option value="road">Road</option>
                <option value="satellite">Satellite</option>
              </select>
            </div>
          </div>

          {/* Toggle Controls */}
          <div className="bg-white dark:bg-black rounded-lg p-3 shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-white/80">Traffic</span>
                <div 
                  className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${
                    showTraffic ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={() => setShowTraffic(!showTraffic)}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
                    showTraffic ? 'translate-x-4' : 'translate-x-0.5'
                  }`}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-white/80">Vehicles</span>
                <div 
                  className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${
                    showVehicles ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={() => setShowVehicles(!showVehicles)}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
                    showVehicles ? 'translate-x-4' : 'translate-x-0.5'
                  }`}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-white/80">Routes</span>
                <div 
                  className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${
                    showRoutes ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={() => {
                    console.log('Routes toggle clicked, current:', showRoutes);
                    setShowRoutes(!showRoutes);
                  }}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
                    showRoutes ? 'translate-x-4' : 'translate-x-0.5'
                  }`}></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-white/80">Auto Center</span>
                <div 
                  className={`w-8 h-4 rounded-full relative cursor-pointer transition-colors ${
                    autoCenter ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={() => {
                    console.log('Auto Center toggle clicked, current:', autoCenter);
                    setAutoCenter(!autoCenter);
                  }}
                >
                  <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
                    autoCenter ? 'translate-x-4' : 'translate-x-0.5'
                  }`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-screen"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Legend - Match reference exactly */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-black rounded-lg p-3 shadow-lg pointer-events-auto z-20">
        <div className="text-xs font-semibold mb-2 text-gray-900 dark:text-white">Status Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-700 dark:text-white/80">Pending</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-700 dark:text-white/80">Assigned</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-700 dark:text-white/80">Confirmed</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-700 dark:text-white/80">En Route</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-gray-700 dark:text-white/80">Completed</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-700 dark:text-white/80">Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
