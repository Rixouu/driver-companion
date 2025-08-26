import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Metadata } from "next";
import PricingCategoriesTab from "./_components/pricing-categories-tab";
import PricingItemsTab from "./_components/pricing-items-tab";
import PricingPromotionsTab from "./_components/pricing-promotions-tab";
import PricingPackagesTab from "./_components/pricing-packages-tab";
import PricingServiceTypesTab from "./_components/pricing-service-types-tab";
import TimeBasedPricingTab from "./_components/time-based-pricing-tab";
import { PricingTabsList } from "./_components/pricing-tabs-list";

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pricing Management",
  description: "Manage service pricing, promotions, and packages",
};

export default function PricingManagementPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-border/40 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Pricing Management</h1>
            <p className="text-muted-foreground text-base mt-1">
              Manage your pricing categories, individual items, promotions, and packages.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <PricingTabsList />
        
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