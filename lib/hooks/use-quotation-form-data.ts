import { useState, useEffect } from 'react';

export interface FormVehicle {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  year?: number | string;
  category: string;
}

export interface FormPricingItem {
  id: string;
  duration_hours: number;
  price: number;
  currency: string;
  category_id?: string;
}

export interface FormPricingCategory {
  id: string;
  name: string;
  description?: string | null;
  service_type_ids: string[] | null;
  sort_order: number;
  is_active: boolean;
}

export interface QuotationFormData {
  pricingCategories: FormPricingCategory[];
  vehicles: FormVehicle[];
  vehiclesByCategory: Record<string, FormVehicle[]>;
  pricingItems: FormPricingItem[];
  pricingByServiceAndVehicle: Record<string, FormPricingItem[]>;
}

export function useQuotationFormData() {
  const [data, setData] = useState<QuotationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/quotations/form-data');
        if (!response.ok) {
          throw new Error('Failed to fetch form data');
        }
        
        const formData = await response.json();
        setData(formData);
      } catch (err) {
        console.error('Error fetching quotation form data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to get vehicles for a specific category
  const getVehiclesForCategory = (category: string): FormVehicle[] => {
    if (!data) return [];
    return data.vehiclesByCategory[category] || [];
  };

  // Helper function to get pricing for a specific service and vehicle
  const getPricingForServiceAndVehicle = (serviceTypeId: string, vehicleType: string): FormPricingItem[] => {
    if (!data) return [];
    const key = `${serviceTypeId}_${vehicleType}`;
    return data.pricingByServiceAndVehicle[key] || [];
  };

  // Helper function to get base price for a specific duration
  const getBasePrice = (serviceTypeId: string, vehicleType: string, durationHours: number): number => {
    const pricing = getPricingForServiceAndVehicle(serviceTypeId, vehicleType);
    const item = pricing.find(p => p.duration_hours === durationHours);
    return item?.price || 0;
  };

  // Helper function to get all available durations for a service-vehicle combination
  const getAvailableDurations = (serviceTypeId: string, vehicleType: string): number[] => {
    const pricing = getPricingForServiceAndVehicle(serviceTypeId, vehicleType);
    return pricing.map(p => p.duration_hours).sort((a, b) => a - b);
  };

  return {
    data,
    loading,
    error,
    getVehiclesForCategory,
    getPricingForServiceAndVehicle,
    getBasePrice,
    getAvailableDurations,
    refetch: () => {
      setLoading(true);
      setError(null);
      fetch('/api/quotations/form-data')
        .then(res => res.json())
        .then(setData)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  };
}
