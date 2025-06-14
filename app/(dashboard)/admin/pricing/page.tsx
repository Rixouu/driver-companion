import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Metadata } from "next";
import PricingCategoriesTab from "./_components/pricing-categories-tab";
import PricingItemsTab from "./_components/pricing-items-tab";
import PricingPromotionsTab from "./_components/pricing-promotions-tab";
import PricingPackagesTab from "./_components/pricing-packages-tab";
import PricingServiceTypesTab from "./_components/pricing-service-types-tab";
import TimeBasedPricingTab from "./_components/time-based-pricing-tab";

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pricing Management",
  description: "Manage service pricing, promotions, and packages",
};

export default function PricingManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pricing Management</h1>
        <p className="text-muted-foreground">
          Manage your pricing categories, individual items, promotions, and packages.
        </p>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="categories">Pricing Categories</TabsTrigger>
            <TabsTrigger value="items">Pricing Items</TabsTrigger>
            <TabsTrigger value="serviceTypes">Service Types</TabsTrigger>
            <TabsTrigger value="timeBasedPricing">Time-based Pricing</TabsTrigger>
            <TabsTrigger value="promotions">Promotions Codes</TabsTrigger>
            <TabsTrigger value="packages">Packages Deals</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="mt-4">
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