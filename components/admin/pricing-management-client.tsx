"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import PricingCategoriesTab from "./_components/pricing-categories-tab";
import PricingItemsTab from "./_components/pricing-items-tab";
import PricingPromotionsTab from "./_components/pricing-promotions-tab";
import PricingPackagesTab from "./_components/pricing-packages-tab";
import PricingServiceTypesTab from "./_components/pricing-service-types-tab";
import TimeBasedPricingTab from "./_components/time-based-pricing-tab";
import { PricingTabsList } from "./_components/pricing-tabs-list";

export function PricingManagementClient() {
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Pricing Management</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              Manage your pricing categories, individual items, promotions, and packages.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <PricingTabsList value={activeTab} onValueChange={setActiveTab} />
        
        <div className="mt-8">
          <TabsContent value="categories">
            <PricingCategoriesTab />
          </TabsContent>
          
          <TabsContent value="items">
            <PricingItemsTab />
          </TabsContent>
          
          <TabsContent value="serviceTypes">
            <PricingServiceTypesTab />
          </TabsContent>
          
          <TabsContent value="timeBasedPricing">
            <TimeBasedPricingTab />
          </TabsContent>
          
          <TabsContent value="promotions">
            <PricingPromotionsTab />
          </TabsContent>
          
          <TabsContent value="packages">
            <PricingPackagesTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
