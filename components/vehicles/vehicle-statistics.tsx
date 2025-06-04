"use client"

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useI18n } from "@/lib/i18n/context";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, Info } from "lucide-react";

// Interfaces for individual data points
interface FuelEfficiencyDataPoint {
  date: string; // ISO date string
  value: number; // km/L or mi/gal
}

interface MaintenanceCostDataPoint {
  month: string; // e.g., "Jan 2023"
  value: number; // cost amount
}

interface UtilizationRateDataPoint {
  month: string; // e.g., "Jan 2023"
  value: number; // rate (0.0 to 1.0)
}

// Main statistics data structure
interface VehicleStatisticsData {
  fuelEfficiency: FuelEfficiencyDataPoint[];
  maintenanceCosts: MaintenanceCostDataPoint[];
  utilizationRate: UtilizationRateDataPoint[];
  currency: string; // e.g., JPY, USD
  distanceUnit: string; // e.g., km, mi
  volumeUnit: string; // e.g., L, gal
}

interface VehicleStatisticsProps {
  vehicleId: string;
}

// Placeholder: Replace with actual Supabase query/RPC
async function fetchVehicleStatistics(supabase: any, vehicleId: string): Promise<VehicleStatisticsData | null> {
  // console.log(`Fetching statistics for vehicle ${vehicleId}`);
  // const { data, error } = await supabase.rpc('get_vehicle_statistics', { p_vehicle_id: vehicleId });
  // if (error) throw error;
  // return data;
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Example: Simulate error
  // throw new Error("Simulated statistics fetch error");
  // Example: Return null to test empty state
  // return null;

  const generateRandomData = (numPoints: number, valMultiplier: number, dateBased: boolean = false) => {
    return Array.from({ length: numPoints }, (_, i) => {
      const d = new Date();
      if (dateBased) d.setDate(d.getDate() - (numPoints - 1 - i) * 7); // weekly data for a few weeks
      else d.setMonth(d.getMonth() - (numPoints - 1 - i)); // monthly data
      return {
        date: dateBased ? d.toISOString().split('T')[0] : d.toLocaleString('default', { month: 'short', year: '2-digit' }).replace(' ', ' '),
        month: dateBased ? undefined : d.toLocaleString('default', { month: 'short', year: '2-digit' }).replace(' ', ' '),
        value: Math.random() * valMultiplier + (valMultiplier / 5),
      };
    }).map(item => ({ ...item, date: item.date || item.month })) as any;
  };

  return {
    fuelEfficiency: generateRandomData(8, 15, true),
    maintenanceCosts: generateRandomData(6, 15000),
    utilizationRate: generateRandomData(6, 0.8),
    currency: "JPY",
    distanceUnit: "km",
    volumeUnit: "L",
  };
}

export function VehicleStatistics({ vehicleId }: VehicleStatisticsProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [stats, setStats] = useState<VehicleStatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabase();

  useEffect(() => {
    if (!vehicleId) {
      setIsLoading(false);
      setError(t('vehicles.statistics.errors.missingVehicleId'));
      return;
    }
    async function loadStats() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchVehicleStatistics(supabase, vehicleId);
        setStats(data);
      } catch (err) {
        console.error(err);
        setError(t('vehicles.statistics.errors.loadFailed'));
        toast({ title: t('common.error'), description: t('vehicles.statistics.errors.loadFailed'), variant: "destructive" });
      }
      setIsLoading(false);
    }
    loadStats();
  }, [vehicleId, supabase, t, toast]);

  // Basic currency formatting, replace with a proper utility
  const formatDisplayCurrency = (amount: number, currencyCode: string = "JPY") => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  if (isLoading) {
    return <VehicleStatisticsSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('vehicles.statistics.title')}</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg font-semibold text-red-600">{t('common.errorOccurred')}</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats || Object.values(stats).every(arr => Array.isArray(arr) && arr.length === 0)) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('vehicles.statistics.title')}</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Info className="h-12 w-12 text-blue-500 mb-4" />
          <p className="text-lg font-semibold">{t('vehicles.statistics.noData.title')}</p>
          <p className="text-sm text-muted-foreground">{t('vehicles.statistics.noData.description')}</p>
        </CardContent>
      </Card>
    );
  }

  const renderChart = (data: any[] | undefined, dataKey: string, name: string, unit: string, chartType: 'line' | 'bar', valueFormatter?: (value: number) => string) => {
    if (!data || data.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-10">{t('vehicles.statistics.noDataForChart', { chartName: name })}</p>;
    }
    const ChartComponent = chartType === 'line' ? LineChart : BarChart;

    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={data[0]?.date ? "date" : "month"} tickFormatter={(val) => val} />
            <YAxis tickFormatter={valueFormatter ? (v) => valueFormatter(v).split(' ')[0] : undefined} />
            <Tooltip 
              formatter={(value: number, nameKey: string, props: any) => {
                 const formattedVal = valueFormatter ? valueFormatter(value) : `${value.toFixed(2)} ${unit}`;
                 return [formattedVal, t(`vehicles.statistics.tooltip.${nameKey.toLowerCase()}` as any, {defaultValue: nameKey})];
              }}
            />
            <Legend />
            {chartType === 'line' && (
              <Line 
                type="monotone" 
                dataKey="value" 
                name={name} 
                stroke="#2563eb"
                strokeWidth={2} 
              />
            )}
            {chartType === 'bar' && (
              <Bar 
                dataKey="value" 
                name={name} 
                fill="#2563eb" 
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('vehicles.statistics.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fuelEfficiency" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4">
            <TabsTrigger value="fuelEfficiency">{t('vehicles.statistics.tabs.fuelEfficiency')}</TabsTrigger>
            <TabsTrigger value="maintenanceCosts">{t('vehicles.statistics.tabs.maintenanceCosts')}</TabsTrigger>
            <TabsTrigger value="utilizationRate">{t('vehicles.statistics.tabs.utilizationRate')}</TabsTrigger>
          </TabsList>

          <TabsContent value="fuelEfficiency">
            {renderChart(
              stats.fuelEfficiency,
              "value",
              t('vehicles.statistics.chartNames.fuelEfficiency'),
              `${stats.distanceUnit}/${stats.volumeUnit}`,
              'line',
              (val) => `${val.toFixed(1)} ${stats.distanceUnit}/${stats.volumeUnit}`
            )}
          </TabsContent>
          <TabsContent value="maintenanceCosts">
            {renderChart(
              stats.maintenanceCosts,
              "value",
              t('vehicles.statistics.chartNames.maintenanceCosts'),
              stats.currency,
              'bar',
              (val) => formatDisplayCurrency(val, stats.currency)
            )}
          </TabsContent>
          <TabsContent value="utilizationRate">
            {renderChart(
              stats.utilizationRate,
              "value",
              t('vehicles.statistics.chartNames.utilizationRate'),
              "%",
              'line',
              (val) => `${(val * 100).toFixed(1)}%`
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function VehicleStatisticsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3 mb-2" />
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-1/3" />
          <Skeleton className="h-9 w-1/3" />
          <Skeleton className="h-9 w-1/3" />
        </div>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </CardContent>
    </Card>
  );
} 