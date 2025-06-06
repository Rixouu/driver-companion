"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import { VehicleLocation, VehicleTracking, TrackingDevice } from '@/types/dispatch';
import { toast } from '@/components/ui/use-toast';

interface UseRealTimeTrackingOptions {
  refreshInterval?: number; // in seconds
  enableNotifications?: boolean;
  autoStart?: boolean;
}

export function useRealTimeTracking(options: UseRealTimeTrackingOptions = {}) {
  const {
    refreshInterval = 30,
    enableNotifications = true,
    autoStart = true
  } = options;

  const [vehicleLocations, setVehicleLocations] = useState<Map<string, VehicleLocation>>(new Map());
  const [trackingDevices, setTrackingDevices] = useState<Map<string, TrackingDevice>>(new Map());
  const [onlineVehicles, setOnlineVehicles] = useState<Set<string>>(new Set());
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const intervalRef = useRef<NodeJS.Timeout>();
  const subscriptionRef = useRef<any>();

  // Fetch initial tracking data
  const fetchTrackingData = async () => {
    try {
      setError(null);

      // For now, we'll use empty arrays since the tables are newly created
      // In production, these would be populated by the OwnTracks webhook
      const devicesData: TrackingDevice[] = [];
      const locationsData: VehicleLocation[] = [];

      // Process devices
      const devicesMap = new Map<string, TrackingDevice>();
      const onlineVehicleIds = new Set<string>();

      devicesData?.forEach(device => {
        devicesMap.set(device.device_id, device);
        
        // Check if device is online (last seen within the last 5 minutes)
        const lastSeen = device.last_seen ? new Date(device.last_seen) : null;
        const now = new Date();
        const isOnline = lastSeen && (now.getTime() - lastSeen.getTime()) < 5 * 60 * 1000;
        
        if (isOnline && device.vehicle_id) {
          onlineVehicleIds.add(device.vehicle_id);
        }
      });

      // Process locations - keep only the latest for each vehicle
      const locationsMap = new Map<string, VehicleLocation>();
      locationsData?.forEach(location => {
        if (location.vehicle_id && !locationsMap.has(location.vehicle_id)) {
          locationsMap.set(location.vehicle_id, location);
        }
      });

      setTrackingDevices(devicesMap);
      setVehicleLocations(locationsMap);
      setOnlineVehicles(onlineVehicleIds);
      setLastUpdate(new Date());

    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tracking data');
      
      if (enableNotifications) {
        toast({
          title: "Tracking Error",
          description: "Failed to fetch vehicle tracking data",
          variant: "destructive",
        });
      }
    }
  };

  // Start real-time tracking
  const startTracking = async () => {
    if (isTracking) return;

    setIsTracking(true);
    await fetchTrackingData();

    // Set up real-time subscription for vehicle locations
    subscriptionRef.current = supabase
      .channel('vehicle_locations_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_locations'
        },
        (payload) => {
          console.log('Real-time location update:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newLocation = payload.new as VehicleLocation;
            if (newLocation.vehicle_id) {
              setVehicleLocations(prev => {
                const updated = new Map(prev);
                updated.set(newLocation.vehicle_id!, newLocation);
                return updated;
              });
              
              // Update online status
              setOnlineVehicles(prev => {
                const updated = new Set(prev);
                updated.add(newLocation.vehicle_id!);
                return updated;
              });
              
              setLastUpdate(new Date());
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracking_devices'
        },
        (payload) => {
          console.log('Real-time device update:', payload);
          
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedDevice = payload.new as TrackingDevice;
            setTrackingDevices(prev => {
              const updated = new Map(prev);
              updated.set(updatedDevice.device_id, updatedDevice);
              return updated;
            });
          }
        }
      )
      .subscribe();

    // Set up periodic refresh
    intervalRef.current = setInterval(fetchTrackingData, refreshInterval * 1000);
  };

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  };

  // Get vehicle tracking info
  const getVehicleTracking = (vehicleId: string): VehicleTracking | null => {
    const location = vehicleLocations.get(vehicleId);
    const isOnline = onlineVehicles.has(vehicleId);
    
    if (!location) return null;

    // Find the tracking device for this vehicle
    const device = Array.from(trackingDevices.values()).find(d => d.vehicle_id === vehicleId);
    
    return {
      vehicle_id: vehicleId,
      device_id: device?.device_id,
      current_location: location,
      last_update: location.timestamp,
      is_online: isOnline,
      battery_level: location.battery_level,
      speed: location.speed,
      heading: location.bearing,
      is_moving: location.is_moving
    };
  };

  // Get all tracked vehicles
  const getAllTrackedVehicles = (): VehicleTracking[] => {
    return Array.from(vehicleLocations.keys()).map(vehicleId => {
      return getVehicleTracking(vehicleId);
    }).filter((tracking): tracking is VehicleTracking => tracking !== null);
  };

  // Force refresh
  const refreshTracking = async () => {
    await fetchTrackingData();
  };

  // Auto-start tracking
  useEffect(() => {
    if (autoStart) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [autoStart]);

  return {
    vehicleLocations: Array.from(vehicleLocations.values()),
    trackingDevices: Array.from(trackingDevices.values()),
    onlineVehicles: Array.from(onlineVehicles),
    isTracking,
    lastUpdate,
    error,
    startTracking,
    stopTracking,
    refreshTracking,
    getVehicleTracking,
    getAllTrackedVehicles
  };
} 