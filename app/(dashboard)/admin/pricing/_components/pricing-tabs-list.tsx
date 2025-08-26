'use client';

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/context";
import { 
  Layers, 
  Package, 
  Tag, 
  Clock, 
  Percent, 
  ShoppingCart 
} from "lucide-react";

export function PricingTabsList() {
  const { t } = useI18n();
  
  return (
    <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <TabsList className="flex flex-wrap h-auto min-h-12 items-center justify-start rounded-none border-0 bg-transparent p-0 text-muted-foreground">
        <TabsTrigger 
          value="categories" 
          className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
        >
          <Layers className="w-4 h-4 mr-2" />
          {t('pricing.tabs.categories')}
        </TabsTrigger>
        <TabsTrigger 
          value="items" 
          className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
        >
          <Tag className="w-4 h-4 mr-2" />
          {t('pricing.tabs.items')}
        </TabsTrigger>
        <TabsTrigger 
          value="serviceTypes" 
          className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
        >
          <Package className="w-4 h-4 mr-2" />
          {t('pricing.tabs.serviceTypes')}
        </TabsTrigger>
        <TabsTrigger 
          value="timeBasedPricing" 
          className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
        >
          <Clock className="w-4 h-4 mr-2" />
          {t('pricing.tabs.timeBasedPricing')}
        </TabsTrigger>
        <TabsTrigger 
          value="promotions" 
          className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
        >
          <Percent className="w-4 h-4 mr-2" />
          {t('pricing.tabs.promotions')}
        </TabsTrigger>
        <TabsTrigger 
          value="packages" 
          className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {t('pricing.tabs.packages')}
        </TabsTrigger>
      </TabsList>
    </div>
  );
} 