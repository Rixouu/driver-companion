"use client"

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/context";
import { useToast } from "@/components/ui/use-toast";
import { useSupabase } from "@/components/providers/supabase-provider";
import { formatDate } from "@/lib/utils/date-utils"; // Assuming you have this utility
import { AlertTriangle, Construction, CheckCircle2 } from "lucide-react";

interface MaintenanceHistoryItem {
  id: string;
  vehicle_id: string;
  service_type: string; // e.g., 'Oil Change', 'Tire Rotation', 'Brake Inspection'
  service_date: string;
  cost: number | null;
  service_provider: string | null; // e.g., 'Service Center A', 'DIY'
  notes?: string | null;
  status: 'completed' | 'in_progress' | 'scheduled'; // Added more relevant statuses
  created_at: string;
}

interface MaintenanceHistoryProps {
  vehicleId: string;
}

// Placeholder: Replace with actual Supabase query once schema is defined
async function fetchMaintenanceHistory(supabase: any, vehicleId: string): Promise<MaintenanceHistoryItem[]> {
  // const { data, error } = await supabase
  //   .from('vehicle_maintenance_history') // Assuming table name
  //   .select('*')
  //   .eq('vehicle_id', vehicleId)
  //   .eq('status', 'completed') // Typically history means completed tasks
  //   .order('service_date', { ascending: false });

  // if (error) {
  //   console.error("Error fetching maintenance history:", error);
  //   throw error;
  // }
  // return data || [];

  // Mock data for now
  await new Promise(resolve => setTimeout(resolve, 1000));
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 5);

  // Example: Return empty array to test no history state
  // return [];

  // Example: Simulate error
  // throw new Error("Simulated fetch error for history");

  return [
    { id: 'hist1', vehicle_id: vehicleId, service_type: 'Oil Change', service_date: lastMonth.toISOString(), cost: 75.50, service_provider: 'Quick Lube King', status: 'completed', created_at: new Date().toISOString(), notes: 'Full synthetic 5W-30' },
    { id: 'hist2', vehicle_id: vehicleId, service_type: 'Tire Rotation', service_date: threeMonthsAgo.toISOString(), cost: 30.00, service_provider: 'DIY', status: 'completed', created_at: new Date().toISOString() },
    { id: 'hist3', vehicle_id: vehicleId, service_type: 'Annual Inspection', service_date: new Date(today.getFullYear() -1, today.getMonth(), 10).toISOString(), cost: 120.00, service_provider: 'City Auto Repair', status: 'completed', created_at: new Date().toISOString(), notes: 'Passed all checks.' },
  ];
}

export function MaintenanceHistory({ vehicleId }: MaintenanceHistoryProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [historyItems, setHistoryItems] = useState<MaintenanceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabase();

  useEffect(() => {
    if (!vehicleId) {
      setIsLoading(false);
      setError(t('vehicles.maintenance.history.errors.missingVehicleId'));
      return;
    }

    async function loadHistory() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchMaintenanceHistory(supabase, vehicleId);
        setHistoryItems(data);
      } catch (err) {
        console.error(err);
        const errorMessage = (err instanceof Error && !err.message.includes('Simulated fetch error')) 
          ? err.message
          : t('vehicles.maintenance.history.errors.loadFailed');
        setError(errorMessage);
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [vehicleId, supabase, t, toast]);

  const getStatusBadgeVariant = (status: MaintenanceHistoryItem['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'in_progress': return 'bg-blue-500 hover:bg-blue-600';
      case 'scheduled': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

   const getStatusIcon = (status: MaintenanceHistoryItem['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-3 w-3" />;
      case 'in_progress': return <Construction className="h-3 w-3" />;
      case 'scheduled': return <AlertTriangle className="h-3 w-3" />;
      default: return <Construction className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return <MaintenanceHistorySkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('vehicles.maintenance.history.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-semibold text-red-600">{t('common.errorOccurred')}</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            {/* Add retry button if needed */}
          </div>
        )}

        {!error && !isLoading && historyItems.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('vehicles.maintenance.history.noHistory')}
          </p>
        )}

        {!error && historyItems.length > 0 && (
          <div className="space-y-4">
            {historyItems.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg bg-muted/30 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-md capitalize">
                      {item.service_type.split('_').join(' ')} {/* Simple formatting for service_type */}
                    </h4>
                    {item.service_provider && (
                      <p className="text-xs text-muted-foreground">
                        {t('vehicles.maintenance.history.serviceProvider')}: {item.service_provider}
                      </p>
                    )}
                  </div>
                  <Badge className={`text-xs text-white ${getStatusBadgeVariant(item.status)}`}>
                    <span className="mr-1.5">{getStatusIcon(item.status)}</span>
                    {t(`vehicles.maintenance.status.${item.status}`)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-2 space-y-0.5">
                  <p>{t('vehicles.maintenance.history.serviceDate')}: {formatDate(item.service_date)}</p>
                  {item.cost !== null && typeof item.cost === 'number' && (
                    // Display cost directly as a number, currency formatting removed
                    <p>{t('vehicles.maintenance.history.cost')}: {item.cost.toFixed(2)}</p>
                  )}
                  {item.notes && (
                     <p className="pt-1 text-gray-700 dark:text-gray-300">{t('vehicles.maintenance.history.notes')}: {item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MaintenanceHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 