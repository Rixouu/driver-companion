// "use client" // Removed to make it a Server Component

import React from "react"; // Removed unnecessary client-side hooks
import Link from "next/link";
import { Plus } from "lucide-react";
import { getDictionary } from "@/lib/i18n/server"; // Use server version of getDictionary
import { Button } from "@/components/ui/button";
import { getDrivers } from "@/lib/services/drivers";
import { DriverClientPage } from "@/components/drivers/driver-client-page"; // Import the new client component
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb";
import type { Driver } from "@/types/drivers"; // Ensure consistent Driver type
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drivers",
  description: "Manage drivers and driver information"
};

// export const dynamic = "force-dynamic"; // Commented out to test loop C_L_FIX_LOOP
// const ITEMS_PER_PAGE = 6; // Moved to client component

// searchParams are passed by Next.js to Server Components
interface DriversPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function DriversPage({ searchParams }: DriversPageProps) {
  const { t } = await getDictionary();
  let initialDrivers: Driver[] = [];
  let errorLoadingDrivers: string | null = null;

  try {
    initialDrivers = await getDrivers();
  } catch (error) {
    console.error("Error loading drivers in Server Component:", error);
    errorLoadingDrivers = error instanceof Error ? error.message : "Unknown error loading drivers";
    // Optionally, you could re-throw or handle this to show a global error page
  }

  // All client-side logic, including state based on searchParams, is now in DriverClientPage.
  // We pass the server-fetched initialDrivers and the t function.
  // searchParams will be read by DriverClientPage using useSearchParams hook.

  if (errorLoadingDrivers) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            {t("errors.failedToLoadData", { entity: t("drivers.title") })}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t("errors.pleaseTryAgainLater")}
          </p>
          {/* Provide a way to retry or go back if appropriate */}
          <Link href="/">
            <Button variant="outline">{t("common.actions.goHome")}</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <DriverClientPage initialDrivers={initialDrivers} />
  );
} 