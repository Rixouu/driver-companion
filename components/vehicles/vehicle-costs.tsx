"use client"

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DbVehicle } from "@/types";
import { useI18n } from "@/lib/i18n/context";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, TrendingUp, Droplet, Wrench } from "lucide-react";

interface VehicleCostSummary {
  vehicle_id: string;
  total_fuel_cost: number;
  total_maintenance_cost: number;
  total_other_cost: number;
  grand_total_cost: number;
  currency: string; // e.g., JPY, USD
  last_calculated_at: string;
}

interface VehicleCostsProps {
  vehicle: DbVehicle;
}

// Placeholder: Replace with actual Supabase query/aggregation
async function fetchVehicleCostSummary(supabase: any, vehicleId: string): Promise<VehicleCostSummary | null> {
  // This would typically involve aggregating data from fuel logs, maintenance records, etc.
  // console.log(`Fetching cost summary for vehicle ${vehicleId}`);
  // const { data, error } = await supabase.rpc('calculate_vehicle_cost_summary', { p_vehicle_id: vehicleId });
  // if (error) throw error;
  // return data;
  await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate delay
  
  // Example: Return null to test empty state
  // return null;
  // Example: Simulate error
  // throw new Error("Simulated cost fetch error");

  return {
    vehicle_id: vehicleId,
    total_fuel_cost: Math.random() * 50000 + 10000, // Random data for now
    total_maintenance_cost: Math.random() * 20000 + 5000,
    total_other_cost: Math.random() * 5000,
    grand_total_cost: 0, // This will be calculated in the return
    currency: "JPY",
    last_calculated_at: new Date().toISOString(),
  };
}

export function VehicleCosts({ vehicle }: VehicleCostsProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [costSummary, setCostSummary] = useState<VehicleCostSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabase();

  useEffect(() => {
    if (!vehicle.id) {
      setIsLoading(false);
      setError(t('vehicles.costs.errors.missingVehicleId'));
      return;
    }
    async function loadCosts() {
      setIsLoading(true);
      setError(null);
      try {
        let data = await fetchVehicleCostSummary(supabase, vehicle.id);
        if (data) {
          // Calculate grand total if not already done by backend
          data.grand_total_cost = data.total_fuel_cost + data.total_maintenance_cost + data.total_other_cost;
        }
        setCostSummary(data);
      } catch (err) {
        console.error(err);
        setError(t('vehicles.costs.errors.loadFailed'));
        toast({ title: t('common.error'), description: t('vehicles.costs.errors.loadFailed'), variant: "destructive" });
      }
      setIsLoading(false);
    }
    loadCosts();
  }, [vehicle.id, supabase, t, toast]);

  // Basic currency formatting, replace with a proper utility
  const formatCurrency = (amount: number, currencyCode: string = "JPY") => {
    // This is a simplified placeholder. 
    // In a real app, use Intl.NumberFormat or a robust library.
    return `${currencyCode} ${amount.toFixed(0)}`; // JPY usually has no decimals
  };

  if (isLoading) {
    return <VehicleCostsSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('vehicles.costs.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-semibold text-red-600">{t('common.errorOccurred')}</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}
        {!error && !isLoading && !costSummary && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('vehicles.costs.noData')}
          </p>
        )}
        {!error && costSummary && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
              <div className="flex items-center">
                <Droplet className="h-5 w-5 mr-3 text-blue-500" />
                <span className="text-sm font-medium">{t('vehicles.costs.fuel')}</span>
              </div>
              <span className="text-sm font-semibold">{formatCurrency(costSummary.total_fuel_cost, costSummary.currency)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
              <div className="flex items-center">
                <Wrench className="h-5 w-5 mr-3 text-orange-500" />
                <span className="text-sm font-medium">{t('vehicles.costs.maintenance')}</span>
              </div>
              <span className="text-sm font-semibold">{formatCurrency(costSummary.total_maintenance_cost, costSummary.currency)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-3 text-purple-500" /> {/* Or other icon for 'other' */}
                <span className="text-sm font-medium">{t('vehicles.costs.other')}</span>
              </div>
              <span className="text-sm font-semibold">{formatCurrency(costSummary.total_other_cost, costSummary.currency)}</span>
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between font-bold text-lg">
              <span>{t('vehicles.costs.grandTotal')}</span>
              <span>{formatCurrency(costSummary.grand_total_cost, costSummary.currency)}</span>
            </div>
             <p className="text-xs text-muted-foreground text-right pt-1">
              {t('vehicles.costs.lastCalculated')}: {new Date(costSummary.last_calculated_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VehicleCostsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-md">
            <div className="flex items-center w-1/3">
              <Skeleton className="h-5 w-5 mr-3 rounded-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-6 w-1/4" />
        </div>
        <Skeleton className="h-3 w-1/2 ml-auto mt-1" />
      </CardContent>
    </Card>
  );
} 