'use client';

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/context";
import { 
  Layers, 
  Package, 
  Tag, 
  Clock, 
  Percent, 
  ShoppingCart
} from "lucide-react";
import { useState, useEffect } from "react";

interface PricingTabsListProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function PricingTabsList({ value, onValueChange }: PricingTabsListProps) {
  const { t } = useI18n();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const tabs = [
    { value: "categories", label: t('pricing.tabs.categories'), icon: Layers },
    { value: "items", label: t('pricing.tabs.items'), icon: Tag },
    { value: "serviceTypes", label: t('pricing.tabs.serviceTypes'), icon: Package },
    { value: "timeBasedPricing", label: t('pricing.tabs.timeBasedPricing'), icon: Clock },
    { value: "promotions", label: t('pricing.tabs.promotions'), icon: Percent },
    { value: "packages", label: t('pricing.tabs.packages'), icon: ShoppingCart },
  ];

  const currentTab = tabs.find(tab => tab.value === value);
  
  if (isMobile) {
    return (
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-full h-12 bg-background border-border justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {currentTab && (
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    <currentTab.icon className="w-5 h-5 text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium truncate text-left">
                  {currentTab ? currentTab.label : "Select a tab"}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="min-w-[200px]">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <SelectItem key={tab.value} value={tab.value}>
                    <div className="flex items-center gap-4 w-full">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {tab.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <TabsList className="flex flex-wrap h-auto min-h-12 items-center justify-start rounded-none border-0 bg-transparent p-0 text-muted-foreground">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger 
              key={tab.value}
              value={tab.value} 
              className="relative h-12 px-6 rounded-none border-b-2 border-transparent bg-transparent text-sm font-medium transition-all hover:text-foreground hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:shadow-sm"
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </div>
  );
} 