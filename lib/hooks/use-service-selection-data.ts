import { useMemo } from 'react';
import { ServiceTypeInfo, PricingCategory } from '@/types/quotations';

interface UseServiceSelectionDataReturn {
  getAvailableServiceTypes: () => ServiceTypeInfo[];
  getVehicleCategories: () => { id: string; name: string }[];
  getVehicleTypesForCategory: (categoryId?: string) => any[];
  getDurationsForServiceAndVehicle: () => number[];
}

export function useServiceSelectionData(
  formData: any,
  allServiceTypes: ServiceTypeInfo[],
  pricingCategories: PricingCategory[],
  serviceType: string | null,
  vehicleType: any,
  vehicleCategory: string | null
): UseServiceSelectionDataReturn {
  // Get available service types - use dynamic data when available
  const getAvailableServiceTypes = (): ServiceTypeInfo[] => {
    if (formData?.serviceTypes && formData.serviceTypes.length > 0) {
      return formData.serviceTypes.map((st: any) => ({
        id: st.id,
        name: st.name
      }));
    }
    
    // Fallback to existing data
    return allServiceTypes.length > 0 ? allServiceTypes : [
      { id: '212ea0ed-0012-4d87-8722-b1145495a561', name: 'Charter Services' },
      { id: 'a2538c63-bad1-4523-a234-a708b03744b4', name: 'Airport Transfer Haneda' },
      { id: '296804ed-3879-4cfc-b7dd-e57d18df57a2', name: 'Airport Transfer Narita' }
    ];
  };

  // Get vehicle categories
  const getVehicleCategories = () => {
    if (formData?.pricingCategories && formData.pricingCategories.length > 0) {
      return formData.pricingCategories.map((category: any) => ({
        id: category.id,
        name: category.name
      }));
    }
    
    // Fallback to existing data - use actual database UUIDs
    return [
      { id: '611107df-a656-4812-b0c1-d54b8e67e7f1', name: 'Elite' },
      { id: 'eeb5632d-d028-4272-92c0-8c0d22abb06a', name: 'Platinum' },
      { id: 'ad9eb0c4-4e33-4c2a-a466-18a05086b854', name: 'Luxury' },
      { id: '57fb7a7e-1e7c-4f46-b00a-55246030d691', name: 'Premium' }
    ];
  };

  // Get vehicle types for a category
  const getVehicleTypesForCategory = (categoryId?: string) => {
    const targetCategory = categoryId || vehicleCategory;
    if (!targetCategory) return [];
    
    // Use dynamic data if available
    if (formData?.vehiclesByCategory && targetCategory) {
      const categoryData = formData.vehiclesByCategory[targetCategory];
      if (categoryData && categoryData.vehicles && Array.isArray(categoryData.vehicles)) {
        return categoryData.vehicles;
      }
    }
    
    // Fallback to existing data - use actual database UUIDs
    switch (targetCategory) {
      case '611107df-a656-4812-b0c1-d54b8e67e7f1': // Elite
        return [
          { id: 'elite-1', brand: 'Mercedes', model: 'S580 Long', name: '品川 300 い 4182' },
          { id: 'elite-2', brand: 'Mercedes', model: 'Maybach', name: '品川 300い 4181' }
        ];
      case 'eeb5632d-d028-4272-92c0-8c0d22abb06a': // Platinum
        return [
          { id: 'platinum-1', brand: 'Mercedes Benz', model: 'V Class - Black Suite', name: '品川 300 い 4058' },
          { id: 'platinum-2', brand: 'Toyota', model: 'Alphard Executive Lounge', name: '品川 300い 4077' }
        ];
      case 'ad9eb0c4-4e33-4c2a-a466-18a05086b854': // Luxury
        return [
          { id: 'luxury-1', brand: 'Mercedes Benz', model: 'V class - Extra Long', name: '品川 300 い 4059' },
          { id: 'luxury-2', brand: 'Toyota', model: 'Alphard Z class', name: '品川 300 い 4073' }
        ];
      case '57fb7a7e-1e7c-4f46-b00a-55246030d691': // Premium
        return [
          { id: 'premium-1', brand: 'Toyota', model: 'Hi-Ace', name: '品川 300い 4252' }
        ];
      default:
        return [];
    }
  };

  // Get available durations for service and vehicle
  const getDurationsForServiceAndVehicle = () => {
    if (!serviceType || !vehicleType) return [];
    
    // Use dynamic data if available
    if (formData) {
      const availableDurations = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      if (availableDurations.length > 0) {
        return availableDurations;
      }
    }
    
    // Fallback logic
    if (serviceType.includes('airportTransfer')) {
      return [1];
    }
    
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  };

  return {
    getAvailableServiceTypes,
    getVehicleCategories,
    getVehicleTypesForCategory,
    getDurationsForServiceAndVehicle
  };
}

