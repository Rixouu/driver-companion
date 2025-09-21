"use client";

import { useState, useEffect, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Car, ArrowUp, ArrowDown, Check, X, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';

// Import types
import { 
  ServiceItemInput,
  ServiceTypeInfo,
  PricingCategory,
  PricingItem,
} from '@/types/quotations';

interface VehiclesStepProps {
  form: UseFormReturn<any>;
  serviceItems: ServiceItemInput[];
  setServiceItems: (items: ServiceItemInput[]) => void;
  allServiceTypes: ServiceTypeInfo[];
  pricingCategories: PricingCategory[];
  pricingItems: PricingItem[];
  formData: any;
  calculateQuotationAmount: (params: any) => Promise<any>;
}

export function VehiclesStep({
  form,
  serviceItems,
  setServiceItems,
  allServiceTypes,
  pricingCategories,
  pricingItems,
  formData,
  calculateQuotationAmount
}: VehiclesStepProps) {
  const { t } = useI18n();
  const [isCalculating, setIsCalculating] = useState(false);
  const [vehicleUpgrades, setVehicleUpgrades] = useState<{ [key: number]: any }>({});

  // Get available vehicles for each service
  const getAvailableVehicles = useCallback((serviceItem: ServiceItemInput) => {
    if (!formData?.vehiclesByCategory || !serviceItem.vehicle_category) {
      return [];
    }
    
    const categoryData = formData.vehiclesByCategory[serviceItem.vehicle_category];
    if (categoryData && categoryData.vehicles && Array.isArray(categoryData.vehicles)) {
      return categoryData.vehicles;
    }
    
    return [];
  }, [formData]);

  // Get vehicle categories for upgrade/downgrade
  const getVehicleCategories = useCallback(() => {
    if (formData?.pricingCategories && formData.pricingCategories.length > 0) {
      return formData.pricingCategories.map((category: any) => ({
        id: category.id,
        name: category.name
      }));
    }
    
    return pricingCategories.map(category => ({
      id: category.id,
      name: category.name
    }));
  }, [formData, pricingCategories]);

  // Handle vehicle upgrade/downgrade
  const handleVehicleChange = async (serviceIndex: number, newVehicle: any, newCategory: any) => {
    if (isCalculating) return;
    
    setIsCalculating(true);
    
    try {
      const serviceItem = serviceItems[serviceIndex];
      if (!serviceItem) return;

      // Calculate new pricing
      const pricingResult = await calculateQuotationAmount(
        serviceItem.service_type_id,
        newVehicle,
        serviceItem.duration_hours || 1,
        serviceItem.discount_percentage || 0,
        serviceItem.tax_percentage || 0,
        serviceItem.service_days || 1,
        serviceItem.hours_per_day || 1,
        serviceItem.pickup_date,
        newCategory.id
      );

      // Update the service item
      const updatedServiceItems = [...serviceItems];
      updatedServiceItems[serviceIndex] = {
        ...serviceItem,
        vehicle_category: newCategory.id,
        vehicle_type: newVehicle.id,
        vehicle_display_name: `${newVehicle.brand} ${newVehicle.model}`,
        vehicle_plate_number: newVehicle.name,
        unit_price: pricingResult.baseAmount,
        total_price: pricingResult.totalAmount,
        currency: pricingResult.currency
      };

      setServiceItems(updatedServiceItems);
      
      // Update vehicle upgrades state
      setVehicleUpgrades(prev => ({
        ...prev,
        [serviceIndex]: {
          from: serviceItem.vehicle_display_name,
          to: `${newVehicle.brand} ${newVehicle.model}`,
          priceChange: pricingResult.totalAmount - (serviceItem.total_price || 0)
        }
      }));

      toast({
        title: t('quotations.form.vehicles.vehicleUpdated'),
        description: `${serviceItem.service_type_name} - ${newVehicle.brand} ${newVehicle.model}`,
      });

    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        title: t('quotations.form.vehicles.updateError'),
        description: t('quotations.form.vehicles.updateErrorDescription'),
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Clear vehicle upgrade notification
  const clearVehicleUpgrade = (serviceIndex: number) => {
    setVehicleUpgrades(prev => {
      const newState = { ...prev };
      delete newState[serviceIndex];
      return newState;
    });
  };

  if (serviceItems.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {t('quotations.form.vehicles.noServices')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('quotations.form.vehicles.addServicesFirst')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Car className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold">{t('quotations.form.vehicles.title')}</h2>
      </div>

      <div className="space-y-6">
        {serviceItems.map((serviceItem, index) => {
          const availableVehicles = getAvailableVehicles(serviceItem);
          const vehicleCategories = getVehicleCategories();
          const currentUpgrade = vehicleUpgrades[index];

          return (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{serviceItem.service_type_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {serviceItem.vehicle_display_name} • {serviceItem.vehicle_plate_number}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {serviceItem.is_service_item ? 'Service' : 'Package'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Vehicle Upgrade Notification */}
                {currentUpgrade && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <div className="flex items-center justify-between">
                        <span>
                          Upgraded from {currentUpgrade.from} to {currentUpgrade.to}
                          {currentUpgrade.priceChange !== 0 && (
                            <span className={cn(
                              "ml-2 font-medium",
                              currentUpgrade.priceChange > 0 ? "text-red-600" : "text-green-600"
                            )}>
                              ({currentUpgrade.priceChange > 0 ? '+' : ''}{new Intl.NumberFormat('ja-JP', {
                                style: 'currency',
                                currency: 'JPY',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(currentUpgrade.priceChange)})
                            </span>
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearVehicleUpgrade(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Current Vehicle Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t('quotations.form.vehicles.currentVehicle')}
                    </h4>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="font-medium">{serviceItem.vehicle_display_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {serviceItem.vehicle_plate_number}
                      </div>
                      <div className="text-sm font-medium text-green-600 mt-1">
                        {new Intl.NumberFormat('ja-JP', {
                          style: 'currency',
                          currency: 'JPY',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(serviceItem.unit_price || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t('quotations.form.vehicles.availableVehicles')}
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableVehicles.length > 0 ? (
                        availableVehicles.map((vehicle) => (
                          <div
                            key={vehicle.id}
                            className={cn(
                              "p-2 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                              serviceItem.vehicle_type === vehicle.id 
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                                : "border-muted"
                            )}
                            onClick={() => {
                              const currentCategory = vehicleCategories.find(cat => 
                                cat.id === serviceItem.vehicle_category
                              );
                              if (currentCategory) {
                                handleVehicleChange(index, vehicle, currentCategory);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">
                                  {vehicle.brand} {vehicle.model}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {vehicle.name}
                                </div>
                              </div>
                              {serviceItem.vehicle_type === vehicle.id && (
                                <Check className="h-4 w-4 text-blue-600" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          {t('quotations.form.vehicles.noVehiclesAvailable')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upgrade/Downgrade Options */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('quotations.form.vehicles.upgradeDowngrade')}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vehicleCategories.map((category) => {
                      if (category.id === serviceItem.vehicle_category) return null;
                      
                      const categoryVehicles = formData?.vehiclesByCategory?.[category.id]?.vehicles || [];
                      const firstVehicle = categoryVehicles[0];
                      
                      if (!firstVehicle) return null;

                      return (
                        <Button
                          key={category.id}
                          variant="outline"
                          className="h-auto p-3 justify-start"
                          onClick={() => handleVehicleChange(index, firstVehicle, category)}
                          disabled={isCalculating}
                        >
                          <div className="flex items-center gap-2">
                            {category.name.toLowerCase().includes('elite') || category.name.toLowerCase().includes('premium') ? (
                              <ArrowUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDown className="h-4 w-4 text-orange-600" />
                            )}
                            <div className="text-left">
                              <div className="font-medium text-sm">{category.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {firstVehicle.brand} {firstVehicle.model}
                              </div>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
