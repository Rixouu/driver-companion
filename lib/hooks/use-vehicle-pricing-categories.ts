import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

interface PricingCategory {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

interface UseVehiclePricingCategoriesReturn {
  categories: PricingCategory[];
  isLoading: boolean;
  error: string | null;
  updateCategories: (categoryIds: string[]) => Promise<boolean>;
  refreshCategories: () => Promise<void>;
}

export function useVehiclePricingCategories(vehicleId: string): UseVehiclePricingCategoriesReturn {
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    if (!vehicleId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/pricing-categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch pricing categories');
      }
      
      const data = await response.json();
      // Filter to show only categories that are actually linked to this vehicle
      const linkedCategories = data.categories?.filter((cat: any) => cat.isSelected) || [];
      setCategories(linkedCategories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pricing categories';
      setError(errorMessage);
      console.error('Error fetching vehicle pricing categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategories = async (categoryIds: string[]): Promise<boolean> => {
    if (!vehicleId) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/pricing-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryIds }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update pricing categories');
      }
      
      const data = await response.json();
      
      // Refresh the categories after update
      await fetchCategories();
      
      toast({
        title: 'Success',
        description: data.message || 'Pricing categories updated successfully',
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pricing categories';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCategories = async () => {
    await fetchCategories();
  };

  useEffect(() => {
    fetchCategories();
  }, [vehicleId]);

  return {
    categories,
    isLoading,
    error,
    updateCategories,
    refreshCategories,
  };
}
