"use client"

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/context";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/supabase"; // Assuming you have this type
import { format } from "date-fns";
import { PlusCircle, Edit, Trash2 } from "lucide-react"; // Icons for actions
import { Badge } from "@/components/ui/badge";

interface InspectionScheduleItem {
  id: string;
  inspection_date: string; // ISO date string
  inspection_time?: string | null; // e.g., "10:00"
  status: "scheduled" | "completed" | "cancelled" | "pending";
  type?: string | null; // e.g., "Annual Check", "Safety Inspection"
  // Add other relevant fields like inspector_name, notes etc.
}

interface InspectionScheduleProps {
  vehicleId: string;
  // Future prop: onScheduleNew?: () => void;
  // Future prop: onReschedule?: (inspectionId: string) => void;
  // Future prop: onCancel?: (inspectionId: string) => void;
}

// Placeholder function for fetching - replace with actual Supabase query
async function fetchInspectionSchedule(
  supabase: ReturnType<typeof createBrowserClient<Database>>,
  vehicleId: string
): Promise<InspectionScheduleItem[]> {
  console.log(`[InspectionSchedule] Fetching for vehicleId: ${vehicleId}`);
  // const { data, error } = await supabase
  //   .from('vehicle_inspections') // Replace with your actual table
  //   .select('id, inspection_date, inspection_time, status, type')
  //   .eq('vehicle_id', vehicleId)
  //   .order('inspection_date', { ascending: false });

  // if (error) {
  //   console.error("[InspectionSchedule] Error fetching inspections:", error);
  //   return [];
  // }
  // return data as InspectionScheduleItem[];

  // Mock data until backend is ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (vehicleId === "error") return [];
  return [
    {
      id: "1",
      inspection_date: new Date("2024-08-15").toISOString(),
      inspection_time: "10:00",
      status: "scheduled",
      type: "Annual Check",
    },
    {
      id: "2",
      inspection_date: new Date("2024-03-01").toISOString(),
      inspection_time: "14:30",
      status: "completed",
      type: "Safety Inspection",
    },
  ];
}

export function InspectionSchedule({ vehicleId }: InspectionScheduleProps) {
  const { t } = useI18n();
  const [inspections, setInspections] = useState<InspectionScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(
    () =>
      createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  useEffect(() => {
    if (!vehicleId) {
      setIsLoading(false);
      setError(t("errors.missingVehicleId"));
      return;
    }
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchInspectionSchedule(supabase, vehicleId);
        setInspections(data);
      } catch (err) {
        console.error("[InspectionSchedule] Exception fetching data:", err);
        setError(t("errors.failedToLoadData"));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [vehicleId, supabase, t]);

  const getStatusBadgeVariant = (
    status: InspectionScheduleItem["status"]
  ): "default" | "outline" | "secondary" | "destructive" | "success" | "warning" => {
    switch (status) {
      case "scheduled": return "default";
      case "completed": return "success";
      case "cancelled": return "destructive";
      case "pending": return "warning";
      default: return "outline";
    }
  };

  if (isLoading) {
    return <InspectionScheduleSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("vehicles.inspections.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-center py-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("vehicles.inspections.title")}</CardTitle>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t("vehicles.inspections.scheduleNew")}
        </Button>
      </CardHeader>
      <CardContent>
        {inspections.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("vehicles.inspections.noInspections")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("vehicles.inspections.date")}</TableHead>
                <TableHead>{t("vehicles.inspections.time")}</TableHead>
                <TableHead>{t("vehicles.inspections.type")}</TableHead>
                <TableHead>{t("vehicles.inspections.status")}</TableHead>
                <TableHead className="text-right">{t("vehicles.inspections.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{format(new Date(item.inspection_date), "PPP")}</TableCell>
                  <TableCell>{item.inspection_time || t("common.notSet")}</TableCell>
                  <TableCell>{item.type || t("common.notSet")}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {t(`vehicles.inspections.statusValue.${item.status}`, { defaultValue: item.status })}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" title={t("vehicles.inspections.reschedule")}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title={t("vehicles.inspections.cancel")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function InspectionScheduleSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-32" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {[...Array(5)].map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-5 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(5)].map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 