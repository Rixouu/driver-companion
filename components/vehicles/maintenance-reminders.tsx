"use client"

import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/lib/i18n/context";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Skeleton } from "@/components/ui/skeleton";

interface MaintenanceReminderSettings {
  enabled: boolean;
  notification_type: "email" | "sms" | "both" | "none";
  days_before_reminder: number;
}

interface MaintenanceRemindersProps {
  vehicleId: string;
}

const defaultSettings: MaintenanceReminderSettings = {
  enabled: true,
  notification_type: "both",
  days_before_reminder: 7,
};

// Placeholder: Replace with actual Supabase query
async function fetchReminderSettings(supabase: any, vehicleId: string): Promise<MaintenanceReminderSettings | null> {
  // console.log(`Fetching reminder settings for vehicle ${vehicleId}`);
  // const { data, error } = await supabase
  //   .from('vehicle_maintenance_reminder_settings')
  //   .select('*')
  //   .eq('vehicle_id', vehicleId)
  //   .single();
  // if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
  //   console.error("Error fetching reminder settings:", error);
  //   throw error;
  // }
  // return data;
  await new Promise(resolve => setTimeout(resolve, 750)); // Simulate delay
  // return defaultSettings; // Simulate returning existing settings
  return null; // Simulate no settings found, use defaults
}

// Placeholder: Replace with actual Supabase upsert
async function saveReminderSettings(supabase: any, vehicleId: string, settings: MaintenanceReminderSettings): Promise<void> {
  // console.log(`Saving reminder settings for vehicle ${vehicleId}:`, settings);
  // const { error } = await supabase
  //   .from('vehicle_maintenance_reminder_settings')
  //   .upsert({ vehicle_id: vehicleId, ...settings }, { onConflict: 'vehicle_id' });
  // if (error) {
  //   console.error("Error saving reminder settings:", error);
  //   throw error;
  // }
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
}

export function MaintenanceReminders({ vehicleId }: MaintenanceRemindersProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [settings, setSettings] = useState<MaintenanceReminderSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [isSaving, setIsSaving] = useState(false);
  // Error state can be added if specific error messages for fetch/save are needed beyond toasts

  const supabase = useSupabase();

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const fetchedSettings = await fetchReminderSettings(supabase, vehicleId);
        if (fetchedSettings) {
          setSettings(fetchedSettings);
        } else {
          setSettings(defaultSettings); // Use defaults if no settings found
        }
      } catch (error) {
        console.error(error);
        toast({
          title: t("common.error"),
          description: t("vehicles.maintenance.reminders.errors.loadFailed"),
          variant: "destructive",
        });
        // Set settings to default on error to ensure form is usable
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    }
    if (vehicleId) loadSettings();
    else setIsLoading(false); // No vehicleId, no loading
  }, [vehicleId, supabase, t, toast]);

  const handleInputChange = (field: keyof MaintenanceReminderSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    handleInputChange('enabled', checked);
  };

  const handleSelectChange = (value: MaintenanceReminderSettings['notification_type']) => {
    handleInputChange('notification_type', value);
  };

  const handleDaysInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    handleInputChange('days_before_reminder', isNaN(value) || value < 0 ? 0 : value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveReminderSettings(supabase, vehicleId, settings);
      toast({
        title: t("common.success"),
        description: t("vehicles.maintenance.reminders.savedMessage"),
      });
    } catch (error) {
      console.error(error);
      toast({
        title: t("common.error"),
        description: t("vehicles.maintenance.reminders.errors.saveFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-8 w-12" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("vehicles.maintenance.reminders.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <fieldset disabled={isSaving} className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="reminder-enabled">{t("vehicles.maintenance.reminders.enableLabel")}</Label>
            <Switch 
              id="reminder-enabled"
              checked={settings.enabled}
              onCheckedChange={handleSwitchChange}
            />
          </div>
          <div>
            <Label htmlFor="notification-type">{t("vehicles.maintenance.reminders.notificationTypeLabel")}</Label>
            <Select 
              value={settings.notification_type}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger id="notification-type">
                <SelectValue placeholder={t("vehicles.maintenance.reminders.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("vehicles.maintenance.reminders.notificationTypes.none")}</SelectItem>
                <SelectItem value="email">{t("vehicles.maintenance.reminders.notificationTypes.email")}</SelectItem>
                <SelectItem value="sms">{t("vehicles.maintenance.reminders.notificationTypes.sms")}</SelectItem>
                <SelectItem value="both">{t("vehicles.maintenance.reminders.notificationTypes.both")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="days-before">{t("vehicles.maintenance.reminders.daysBeforeLabel")}</Label>
            <div className="flex items-center">
              <Input 
                id="days-before"
                type="number" 
                value={settings.days_before_reminder}
                onChange={handleDaysInputChange}
                className="w-24"
                min={0}
              />
              <span className="ml-2 text-sm text-muted-foreground">{t("vehicles.maintenance.reminders.daysUnit")}</span>
            </div>
          </div>
        </fieldset>

        <Button onClick={handleSave} disabled={isSaving || isLoading} className="w-full">
          {isSaving ? t("common.saving") : t("common.saveChanges")}
        </Button>
      </CardContent>
    </Card>
  );
} 