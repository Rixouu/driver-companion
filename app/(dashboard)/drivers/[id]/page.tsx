import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/server";
import { getDriverById, getDriverInspections } from "@/lib/services/drivers";
import { getDriverAvailability } from "@/lib/services/driver-availability";
import { DriverDetailsContent } from "@/components/drivers/driver-details-content";
import type { Driver, DriverAvailability } from "@/types/drivers";
import type { DbInspection as Inspection } from "@/types/inspections"; // Or a more specific type for the details page if needed
import { Skeleton } from "@/components/ui/skeleton"; // For server-side initial loading state
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, ArrowLeft } from "lucide-react";
import { format as formatDate, parseISO } from "date-fns"; // For processing availability on server

interface DriverDetailsPageProps {
  params: { id: string };
}

// Helper function to process availability, can be co-located or imported
function processAvailabilityForDisplay(driver: Driver | null, availabilityRecords: DriverAvailability[]) {
  if (!driver) return { currentAvailabilityStatus: 'unknown', processedDriver: driver };

  const today = formatDate(new Date(), "yyyy-MM-dd");
  const now = new Date();
  let currentStatus = driver.status || 'available'; // Default to driver record status or available
  let isBooking = false;
  let bookingNotes: string | undefined = undefined;

  // Reverted to original logic for checking if on a booking, relying on notes
  const currentBookingAvailability = availabilityRecords.find(record => {
    if (!record.start_date || !record.end_date) return false;
    const startDate = parseISO(record.start_date);
    const endDate = parseISO(record.end_date);
    const isNowBetweenDates = now >= startDate && now <= endDate;
    // Original logic relied on notes for booking identification
    const isBookingRelatedNote = record.notes?.toLowerCase().includes('assigned to booking') || record.notes?.toLowerCase().includes('on booking');
    return isNowBetweenDates && isBookingRelatedNote;
  });

  if (currentBookingAvailability) {
    currentStatus = currentBookingAvailability.status; // Keep status from the record if found
    isBooking = true;
    bookingNotes = currentBookingAvailability.notes;
  } else {
    // Check for general availability if not on a specific booking now
    const generalCurrentRecord = availabilityRecords.find(
      record => record.start_date <= today && record.end_date >= today
    );
    if (generalCurrentRecord) {
      currentStatus = generalCurrentRecord.status;
    }
  }
  // Augment driver object, ensure not to mutate original if it's from a cache
  const processedDriver = {
     ...driver, 
     isBooking, 
     bookingNotes, 
     // Ensure currentAvailabilityStatus in the driver object reflects the most accurate status for display consistency
     // This might be redundant if the client component re-evaluates, but good for initial prop consistency
     status: currentStatus 
    };

  return { currentAvailabilityStatus: currentStatus, processedDriver };
}

export default async function DriverDetailsPageServer({ params }: DriverDetailsPageProps) {
  // Ensure getDictionary is awaited before accessing params
  const dict = await getDictionary();
  const awaitedParams = await params; // Explicitly await params
  const id = awaitedParams?.id;

  if (!id || typeof id !== 'string') {
    console.error(dict.t("drivers.errors.consoleDriverIdError"));
    notFound();
  }

  try {
    // Fetch all data in parallel if possible, or sequentially if dependent
    // Note: Adjust service functions if they need to be more specific for server usage or return types
    const driverData = await getDriverById(id);

    if (!driverData) {
      notFound();
    }

    // Fetch availability and inspections
    const availabilityRecordsRaw = await getDriverAvailability(id);
    const inspectionsData = await getDriverInspections(id);
    
    // Process availability to determine current status and augment driver data for initial display
    const { processedDriver, currentAvailabilityStatus } = processAvailabilityForDisplay(driverData, availabilityRecordsRaw);

    return (
      <DriverDetailsContent
        initialDriver={processedDriver} // Pass the processed driver
        initialAvailability={availabilityRecordsRaw} // Pass raw for client to re-process if needed, or pass processed
        initialInspections={inspectionsData as any} // Still casting, as data structure for inspections is complex
        driverId={id}
        // currentAvailabilityStatus is now part of initialDriver or can be derived by client from initialAvailability
      />
    );
  } catch (error) {
    console.error(dict.t("drivers.errors.consoleLoadError", { driverId: id }), error);
    // Render a user-friendly error message
    // This could be a more sophisticated error component
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/drivers">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {dict.t("common.backTo")} {dict.t("drivers.title")}
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            {dict.t("drivers.errors.loadFailed.title")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {dict.t("drivers.errors.loadFailed.description", { driverId: id })}
          </p>
          <Link href="/drivers">
            <Button variant="outline">{dict.t("common.actions.tryAgain")}</Button>
          </Link>
        </div>
      </div>
    );
  }
}

// Note: The Skeleton for loading state previously in the client component might not be directly applicable 
// if the server component handles the initial load fully. Next.js Suspense with a loading.tsx file 
// in the route segment would be the standard way to handle initial loading UI for server components.
// For client-side transitions (e.g. in DriverDetailsContent's refreshData), its own Skeleton is fine. 