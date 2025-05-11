import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";
import PricingCategoriesTab from "./_components/pricing-categories-tab";
import PricingItemsTab from "./_components/pricing-items-tab";
import PricingPromotionsTab from "./_components/pricing-promotions-tab";
import PricingPackagesTab from "./_components/pricing-packages-tab";
import PricingServiceTypesTab from "./_components/pricing-service-types-tab";

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pricing Management",
  description: "Manage service pricing, promotions, and packages",
};

export default function PricingManagementPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pricing Management</h1>
        <p className="text-muted-foreground">
          Manage your pricing categories, individual items, promotions, and packages
        </p>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid grid-cols-5 w-full md:w-[750px]">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="items">Pricing Items</TabsTrigger>
          <TabsTrigger value="serviceTypes">Service Types</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
        </TabsList>
        
        <div className="mt-4">
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Categories</CardTitle>
                <CardDescription>
                  Manage the service categories and which service types they apply to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingCategoriesTab />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Items</CardTitle>
                <CardDescription>
                  Manage individual pricing items for each service type, vehicle type, and duration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingItemsTab />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="serviceTypes">
            <Card>
              <CardHeader>
                <CardTitle>Service Types</CardTitle>
                <CardDescription>
                  Manage the different types of services offered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingServiceTypesTab />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="promotions">
            <Card>
              <CardHeader>
                <CardTitle>Promotions</CardTitle>
                <CardDescription>
                  Manage promotional codes and discounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingPromotionsTab />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="packages">
            <Card>
              <CardHeader>
                <CardTitle>Packages</CardTitle>
                <CardDescription>
                  Manage package deals and bundles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingPackagesTab />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 