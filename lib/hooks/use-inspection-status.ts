"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import type { ExtendedInspection } from "@/components/inspections/inspection-details";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Props for the useInspectionStatus hook.
 */
interface UseInspectionStatusProps {
  /** The current inspection object. */
  inspection: ExtendedInspection;
  /** The current authenticated user. */
  user: User | null | undefined;
  /** The Supabase client instance. */
  supabase: SupabaseClient;
  /** The Next.js App Router instance. */
  router: AppRouterInstance;
  /** The translation function. */
  t: (key: string) => string;
}

/**
 * Defines the shape of the object returned by the `useInspectionStatus` hook.
 */
interface UseInspectionStatusReturn {
  /** Boolean indicating if an inspection status update is currently in progress. */
  isUpdating: boolean;
  /** Asynchronous function to handle the process of starting an inspection. */
  handleStartInspection: () => Promise<void>;
}

/**
 * Custom hook to manage inspection status updates, specifically for starting an inspection.
 *
 * @param props - The properties needed by the hook.
 * @returns An object containing `isUpdating` state and `handleStartInspection` function.
 */
export function useInspectionStatus({
  inspection,
  user,
  supabase,
  router,
  t,
}: UseInspectionStatusProps): UseInspectionStatusReturn {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleStartInspection() {
    if (!inspection || !inspection?.inspection_items) return;
    try {
      setIsUpdating(true);

      const { data, error } = await supabase
        .from("inspection_statuses" as any) // Cast as any if not in your DB types
        .insert({
          inspection_id: inspection.id,
          status: "in_progress",
          started_at: new Date().toISOString(),
          inspector_id: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      const { error: updateError } = await supabase
        .from("inspections")
        .update({
          inspector_id: user?.id,
          status: "in_progress",
        })
        .eq("id", inspection.id);

      if (updateError) throw updateError;

      toast({
        title: t("inspections.messages.updateSuccess"),
      });

      router.push(`/inspections/${inspection.id}/perform`);
      router.refresh();
    } catch (error) {
      console.error("Error starting inspection:", error);
      toast({
        title: t("inspections.messages.error"),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return {
    isUpdating,
    handleStartInspection,
  };
} 