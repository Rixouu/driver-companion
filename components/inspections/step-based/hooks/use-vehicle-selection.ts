"use client"

import { useState, useEffect, useMemo } from "react"
import { useIsMobile } from "@/lib/hooks/use-mobile"

// Define the vehicle and group types
interface VehicleGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  vehicle_count?: number;
}

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand?: string;
  model?: string;
  image_url?: string | null;
  year?: string;
  vehicle_group_id?: string;
  vehicle_group?: VehicleGroup;
}

interface UseVehicleSelectionProps {
  vehicles: Vehicle[];
  isSearchFiltersExpanded: boolean;
  setIsSearchFiltersExpanded: (expanded: boolean) => void;
}

interface FilterOption {
  value: string;
  label: string;
}

export function useVehicleSelection({
  vehicles,
  isSearchFiltersExpanded,
  setIsSearchFiltersExpanded
}: UseVehicleSelectionProps) {
  const isMobile = useIsMobile();
  
  // Vehicle selection filtering and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const vehiclesPerPage = 10;

  // Auto-expand search filters on mobile when filters become active
  useEffect(() => {
    const hasActiveFilters = searchQuery || brandFilter !== "all" || modelFilter !== "all" || groupFilter !== "all";
    if (hasActiveFilters && isMobile && !isSearchFiltersExpanded) {
      setIsSearchFiltersExpanded(true);
    }
  }, [searchQuery, brandFilter, modelFilter, groupFilter, isMobile, isSearchFiltersExpanded]);
  
  // Helpers for brand normalization (avoid duplicates like 'Toyota' vs 'toyota')
  const normalizeBrand = (b?: string | null) => (b || '').trim().toLowerCase();

  // Extract unique brands from vehicles and produce canonical options
  const brandOptions = useMemo(() => {
    const groups = new Map<string, string>();
    vehicles.forEach(v => {
      if (!v.brand) return;
      const key = normalizeBrand(v.brand);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, v.brand.trim());
    });
    return Array.from(groups.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [vehicles]);
  
  // Get unique models based on selected brand
  const models = useMemo(() => {
    const uniqueModels = new Set<string>();
    const key = brandFilter === 'all' ? null : brandFilter;
    vehicles.forEach(vehicle => {
      if (vehicle.model) {
        if (!key || normalizeBrand(vehicle.brand) === key) {
          uniqueModels.add(vehicle.model);
        }
      }
    });
    return Array.from(uniqueModels).sort();
  }, [vehicles, brandFilter]);

  // Model options for dropdown
  const modelOptions = useMemo(() => {
    return models.map(model => ({ value: model, label: model }));
  }, [models]);

  // Get unique vehicle groups
  const vehicleGroups = useMemo(() => {
    const uniqueGroups = new Set<VehicleGroup>();
    vehicles.forEach(vehicle => {
      if (vehicle.vehicle_group) {
        uniqueGroups.add(vehicle.vehicle_group);
      }
    });
    return Array.from(uniqueGroups).sort((a, b) => a.name.localeCompare(b.name));
  }, [vehicles]);

  // Group options for dropdown
  const groupOptions = useMemo(() => {
    return vehicleGroups.map(group => ({ value: group.id, label: group.name }));
  }, [vehicleGroups]);
  
  // Filter Vehicle selection
  const filteredVehicles = useMemo(() => {
    // If no filters and no search query, return all vehicles
    if (brandFilter === 'all' && modelFilter === 'all' && groupFilter === 'all' && !searchQuery) {
      return vehicles;
    }
    
    return vehicles.filter((vehicle) => {
      const matchesBrand = brandFilter === 'all' || normalizeBrand(vehicle.brand) === brandFilter;
      const matchesModel = modelFilter === 'all' || vehicle.model === modelFilter;
      const matchesGroup = groupFilter === 'all' || vehicle.vehicle_group?.id === groupFilter;
      
      // Search query match against name, model, brand, plate number, or group name
      const matchesSearch = !searchQuery || (
        (vehicle.name && vehicle.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vehicle.brand && vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vehicle.plate_number && vehicle.plate_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (vehicle.vehicle_group?.name && vehicle.vehicle_group.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      return matchesBrand && matchesModel && matchesGroup && matchesSearch;
    });
  }, [vehicles, brandFilter, modelFilter, groupFilter, searchQuery]);
  
  // Pagination for vehicle selection
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * vehiclesPerPage;
    return filteredVehicles.slice(startIndex, startIndex + vehiclesPerPage);
  }, [filteredVehicles, currentPage, vehiclesPerPage]);
  
  // Reset filters function
  const resetFilters = () => {
    setSearchQuery('');
    setBrandFilter('all');
    setModelFilter('all');
    setGroupFilter('all');
    setCurrentPage(1);
  };
  
  // Update current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, brandFilter, modelFilter, groupFilter]);

  return {
    // State
    searchQuery,
    setSearchQuery,
    brandFilter,
    setBrandFilter,
    modelFilter,
    setModelFilter,
    groupFilter,
    setGroupFilter,
    currentPage,
    setCurrentPage,
    vehiclesPerPage,
    
    // Computed values
    brandOptions,
    modelOptions,
    groupOptions,
    vehicleGroups,
    filteredVehicles,
    paginatedVehicles,
    
    // Actions
    resetFilters
  };
}
