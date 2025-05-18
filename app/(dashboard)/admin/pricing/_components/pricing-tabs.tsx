import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/context";
import PricingCategoriesTab from './pricing-categories-tab';
import PricingItemsTab from './pricing-items-tab';
import TimeBasedPricingTab from './time-based-pricing-tab';

export default function PricingTabs() {
  const { t } = useI18n();

  return (
    <Tabs defaultValue="categories" className="space-y-6">
      <TabsList className="bg-background">
        <TabsTrigger value="categories">{t("pricing.categories.title")}</TabsTrigger>
        <TabsTrigger value="items">{t("pricing.items.title")}</TabsTrigger>
        <TabsTrigger value="time-based">{t("pricing.items.timeBasedPricing.title")}</TabsTrigger>
      </TabsList>
      <TabsContent value="categories">
        <PricingCategoriesTab />
      </TabsContent>
      <TabsContent value="items">
        <PricingItemsTab />
      </TabsContent>
      <TabsContent value="time-based">
        <TimeBasedPricingTab />
      </TabsContent>
    </Tabs>
  );
} 