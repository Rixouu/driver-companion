import { useState, useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { 
  ServiceItemInput, 
  PricingPackage, 
  PricingPromotion, 
  Quotation, 
  QuotationItem,
  PricingCategory,
  PricingItem,
  ServiceTypeInfo
} from '@/types/quotations';

interface UseQuotationFormStateProps {
  form: UseFormReturn<any>;
  initialData?: Quotation & { quotation_items?: QuotationItem[] };
  initialServiceTypes: ServiceTypeInfo[];
  initialPricingCategories: PricingCategory[];
  initialPricingItems: PricingItem[];
  getPricingPackages: () => Promise<PricingPackage[]>;
  getPricingPromotions: () => Promise<PricingPromotion[]>;
}

export function useQuotationFormState({
  form,
  initialData,
  initialServiceTypes,
  initialPricingCategories,
  initialPricingItems,
  getPricingPackages,
  getPricingPromotions
}: UseQuotationFormStateProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  
  // Service items and pricing
  const [serviceItems, setServiceItems] = useState<ServiceItemInput[]>([]);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [promotions, setPromotions] = useState<PricingPromotion[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PricingPackage | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<PricingPromotion | null>(null);
  
  // Data state
  const [pricingCategories, setPricingCategories] = useState<PricingCategory[]>(initialPricingCategories || []);
  const [pricingItems, setPricingItems] = useState<PricingItem[]>(initialPricingItems || []);
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceTypeInfo[]>(initialServiceTypes || []);
  
  // Team selection
  const [currentTeam, setCurrentTeam] = useState<'japan' | 'thailand'>(
    initialData?.team_location || 'thailand'
  );

  const initializedRef = useRef(false);

  // Load packages and promotions
  useEffect(() => {
    const loadPricingData = async () => {
      try {
        const [packagesData, promotionsData] = await Promise.all([
          getPricingPackages(),
          getPricingPromotions()
        ]);
        
        setPackages(packagesData);
        setPromotions(promotionsData);
        
        // Initialize selectedPackage and selectedPromotion if editing existing quotation (only once)
        if (initialData && !initializedRef.current) {
          // Initialize selected package
          const packageId = (initialData as any).selected_package_id;
          if (packageId) {
            const foundPackage = packagesData.find(pkg => pkg.id === packageId);
            if (foundPackage) {
              setSelectedPackage(foundPackage);
            }
          }
          
          // Initialize selected promotion
          const promotionCode = (initialData as any).selected_promotion_code;
          if (promotionCode) {
            const foundPromotion = promotionsData.find(promo => promo.code === promotionCode);
            if (foundPromotion) {
              setSelectedPromotion(foundPromotion);
            }
          } else if ((initialData as any).selected_promotion_name) {
            // Create a temporary promotion object from stored data
            setSelectedPromotion({
              id: (initialData as any).selected_promotion_id || 'stored-promotion',
              name: (initialData as any).selected_promotion_name,
              code: (initialData as any).selected_promotion_code || 'APPLIED',
              description: (initialData as any).selected_promotion_description || '',
              discount_type: 'percentage',
              discount_value: (initialData as any).promotion_discount || 0,
              is_active: true,
              created_at: '',
              updated_at: ''
            } as any);
          }
          
          initializedRef.current = true; // Mark as initialized
        }
      } catch (error) {
        console.error('Error loading pricing data:', error);
      }
    };
    
    loadPricingData();
  }, [getPricingPackages, getPricingPromotions, initialData]);

  // Initialize serviceItems if initialData has quotation_items
  useEffect(() => {
    if (initialData?.quotation_items && initialData.quotation_items.length > 0) {
      const items = initialData.quotation_items.map(item => ({
        description: item.description,
        service_type_id: item.service_type_id || '',
        service_type_name: item.service_type_name || '',
        vehicle_category: item.vehicle_category || '',
        vehicle_type: item.vehicle_type || '',
        duration_hours: item.duration_hours || undefined,
        service_days: item.service_days || undefined,
        hours_per_day: item.hours_per_day || undefined,
        unit_price: item.unit_price,
        total_price: item.total_price,
        quantity: item.quantity,
        sort_order: item.sort_order,
        is_service_item: item.is_service_item ?? true,
        pickup_date: item.pickup_date || undefined,
        pickup_time: item.pickup_time || undefined,
        pickup_location: (item as any).pickup_location || '',
        dropoff_location: (item as any).dropoff_location || '',
        number_of_passengers: (item as any).number_of_passengers || null,
        number_of_bags: (item as any).number_of_bags || null,
        flight_number: (item as any).flight_number || '',
        time_based_adjustment: (item as any).time_based_adjustment || undefined,
        time_based_rule_name: (item as any).time_based_rule_name || undefined,
      }));
      setServiceItems(items);
    }
  }, [initialData]);

  // Step navigation functions
  const nextStep = () => {
    if (currentStep < 3) { // 4 steps total (0-3)
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step <= 3) {
      setCurrentStep(step);
    }
  };

  return {
    // Step management
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    goToStep,
    
    // Service items and pricing
    serviceItems,
    setServiceItems,
    packages,
    setPackages,
    promotions,
    setPromotions,
    selectedPackage,
    setSelectedPackage,
    selectedPromotion,
    setSelectedPromotion,
    
    // Data state
    pricingCategories,
    setPricingCategories,
    pricingItems,
    setPricingItems,
    allServiceTypes,
    setAllServiceTypes,
    
    // Team selection
    currentTeam,
    setCurrentTeam
  };
}
