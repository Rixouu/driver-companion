"use client"

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DbVehicle } from "@/types";
import { Plus, AlertTriangle, CalendarClock, CheckCircle2, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils/date-utils"; // Assuming you have this utility

interface VehicleReminderItem {
  id: string;
  vehicle_id: string;
  title: string;
  due_date: string;
  status: 'pending' | 'upcoming' | 'overdue' | 'completed';
  notes?: string | null;
  created_at: string;
}

interface VehicleRemindersProps {
  vehicle: DbVehicle;
}

// Placeholder: Replace with actual Supabase query once schema is defined
async function fetchVehicleReminders(supabase: any, vehicleId: string): Promise<VehicleReminderItem[]> {
  // const { data, error } = await supabase
  //   .from('vehicle_reminders') // Assuming table name
  //   .select('*')
  //   .eq('vehicle_id', vehicleId)
  //   .order('due_date', { ascending: true });

  // if (error) {
  //   console.error("Error fetching vehicle reminders:", error);
  //   throw error;
  // }
  // return data || [];

  // Mock data for now
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);


  // Example: Return empty array to test no reminders state
  // return [];

  // Example: Simulate error
  // throw new Error("Simulated fetch error");

  return [
    { id: '1', vehicle_id: vehicleId, title: 'Oil Change', due_date: tomorrow.toISOString(), status: 'pending', created_at: new Date().toISOString(), notes: 'Use synthetic oil' },
    { id: '2', vehicle_id: vehicleId, title: 'Tire Rotation', due_date: nextWeek.toISOString(), status: 'upcoming', created_at: new Date().toISOString() },
    { id: '3', vehicle_id: vehicleId, title: 'Brake Inspection', due_date: yesterday.toISOString(), status: 'overdue', created_at: new Date().toISOString(), notes: 'Check front pads especially' },
    { id: '4', vehicle_id: vehicleId, title: 'Annual Inspection', due_date: new Date(today.getFullYear(), today.getMonth() -1, 15).toISOString(), status: 'completed', created_at: new Date().toISOString() },
  ];
}


export function VehicleReminders({ vehicle }: VehicleRemindersProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<VehicleReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabase();

  useEffect(() => {
    if (!vehicle.id) {
      setIsLoading(false);
      setError(t('vehicles.reminders.errors.missingVehicleId'));
      return;
    }

    async function loadReminders() {
      setIsLoading(true);
      setError(null);
      try {
        // For now, using placeholder fetchVehicleReminders.
        // Replace with actual Supabase call when backend is ready.
        const data = await fetchVehicleReminders(supabase, vehicle.id);
        setReminders(data);
      } catch (err) {
        console.error(err);
        const errorMessage = (err instanceof Error && err.message !== 'Simulated fetch error') 
          ? err.message
          : t('vehicles.reminders.errors.loadFailed');
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

    loadReminders();
  }, [vehicle.id, supabase, t, toast]);

  const getStatusBadgeVariant = (status: VehicleReminderItem['status']) => {
    switch (status) {
      case 'pending': return 'bg-blue-500 hover:bg-blue-600';
      case 'upcoming': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'overdue': return 'bg-red-500 hover:bg-red-600';
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = (status: VehicleReminderItem['status']) => {
    switch (status) {
      case 'pending': return <CalendarClock className="h-4 w-4" />;
      case 'upcoming': return <AlertCircle className="h-4 w-4" />; // Or a different icon for upcoming
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      default: return <CalendarClock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <VehicleRemindersSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('vehicles.tabs.reminders')}</CardTitle>
          <Button size="sm" onClick={() => toast({ title: t('common.notImplemented'), description: t('vehicles.reminders.addReminderNotImplemented')})}>
            <Plus className="mr-2 h-4 w-4" />
            {t('vehicles.tabs.addReminder')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-semibold text-red-600">{t('common.errorOccurred')}</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { /* Add retry logic here if desired */ }}>
              {t('common.retry')}
            </Button>
          </div>
        )}

        {!error && !isLoading && reminders.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('vehicles.tabs.noReminders')}
          </p>
        )}

        {!error && reminders.length > 0 && (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="p-4 border rounded-lg bg-muted/30 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-md">{reminder.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t('vehicles.reminders.dueDate')}: {formatDate(reminder.due_date)}
                    </p>
                  </div>
                  <Badge className={`text-xs text-white ${getStatusBadgeVariant(reminder.status)}`}>
                     <span className="mr-1.5">{getStatusIcon(reminder.status)}</span>
                    {t(`vehicles.reminders.status.${reminder.status}`)}
                  </Badge>
                </div>
                {reminder.notes && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 border-l-2 border-primary pl-2">
                    {reminder.notes}
                  </p>
                )}
                {/* Placeholder for actions like 'Mark as complete', 'Edit', 'Delete' */}
                {/* <div className="mt-3 flex space-x-2 justify-end">
                  {reminder.status !== 'completed' && <Button variant="outline" size="xs">{t('vehicles.reminders.markComplete')}</Button>}
                  <Button variant="ghost" size="xs">{t('common.edit')}</Button>
                  <Button variant="ghost" size="xs" className="text-red-500 hover:text-red-600">{t('common.delete')}</Button>
                </div> */}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VehicleRemindersSkeleton() {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-8 w-28" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 