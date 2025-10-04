"use client";

import { useState, useMemo, useEffect } from "react";
import { useIsMobile } from "@/lib/hooks/use-mobile";

interface Vehicle {
  id: string;
  name: string;
  plate_number: string;
  brand?: string;
  model?: string;
  image_url?: string | null;
  year?: string;
  group_id?: string;
  group?: {
    id: string;
    name: string;
  };
}

interface UseVehicleFilteringProps {
  vehicles: Vehicle[];
}

export function useVehicleFiltering({ vehicles }: UseVehicleFilteringProps) {
  const isMobile = useIsMobile();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearchFiltersExpanded, setIsSearchFiltersExpanded] = useState(false);
  
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
  const modelOptions = useMemo(() => {
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

  // Get unique groups
  const groupOptions = useMemo(() => {
    const uniqueGroups = new Set<string>();
    vehicles.forEach(vehicle => {
      if (vehicle.group?.name) {
        uniqueGroups.add(vehicle.group.name);
      }
    });
    return Array.from(uniqueGroups).sort();
  }, [vehicles]);

  // Filter vehicles based on search and filters
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Search query filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          vehicle.name.toLowerCase().includes(searchLower) ||
          vehicle.plate_number.toLowerCase().includes(searchLower) ||
          vehicle.brand?.toLowerCase().includes(searchLower) ||
          vehicle.model?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Brand filter
      if (brandFilter !== "all") {
        if (normalizeBrand(vehicle.brand) !== brandFilter) return false;
      }

      // Model filter
      if (modelFilter !== "all") {
        if (vehicle.model !== modelFilter) return false;
      }

      // Group filter
      if (groupFilter !== "all") {
        if (vehicle.group?.name !== groupFilter) return false;
      }

      return true;
    });
  }, [vehicles, searchQuery, brandFilter, modelFilter, groupFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * vehiclesPerPage;
    return filteredVehicles.slice(startIndex, startIndex + vehiclesPerPage);
  }, [filteredVehicles, currentPage, vehiclesPerPage]);

  // Reset pagination when filters change
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
    isSearchFiltersExpanded,
    setIsSearchFiltersExpanded,
    
    // Computed values
    brandOptions,
    modelOptions,
    groupOptions,
    filteredVehicles,
    paginatedVehicles,
    totalPages,
    vehiclesPerPage,
  };
}
