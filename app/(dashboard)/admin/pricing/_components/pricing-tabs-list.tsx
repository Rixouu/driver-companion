'use client';

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/context";

export function PricingTabsList() {
  const { t } = useI18n();
  
  return (
    <TabsList className="flex flex-wrap h-auto min-h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
      <TabsTrigger value="categories">{t('pricing.tabs.categories')}</TabsTrigger>
      <TabsTrigger value="items">{t('pricing.tabs.items')}</TabsTrigger>
      <TabsTrigger value="serviceTypes">{t('pricing.tabs.serviceTypes')}</TabsTrigger>
      <TabsTrigger value="timeBasedPricing">{t('pricing.tabs.timeBasedPricing')}</TabsTrigger>
      <TabsTrigger value="promotions">{t('pricing.tabs.promotions')}</TabsTrigger>
      <TabsTrigger value="packages">{t('pricing.tabs.packages')}</TabsTrigger>
    </TabsList>
  );
} 